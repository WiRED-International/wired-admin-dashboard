const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, imports = {}, globals = {}) {
  const output = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const exports = {};
  vm.runInNewContext(output, { exports, require: id => Object.hasOwn(imports, id) ? imports[id] : require(id), ...globals });
  return exports;
}
const utils = load('src/utils/examTemplateImport.ts');
const draftUtils = load('src/utils/examTemplateImportDraft.ts');
const saveUtils = load('src/utils/examTemplateImportSave.ts', {
  '@/utils/examTemplateImportDraft': draftUtils, '@/utils/examTemplateImport': utils,
});
const editor = load('src/components/Exams/ImportQuestionEditor.tsx', {
  '@/utils/examTemplateImportDraft': draftUtils,
}, { crypto: require('node:crypto').webcrypto });
const question = index => ({ question_text: `Question text ${index}`, question_type: 'multiple',
  options: { a: 'Yes', b: 'No', e: 'Other' }, correct_answers: ['a', 'e'], order: index,
  source: { table: 1, row: index + 1 }, errors: [], warnings: [] });
const preview = count => ({ title: 'Imported exam', questions: Array.from({ length: count }, (_, i) => question(i + 1)),
  errors: [], warnings: [{ code: 'EXPLANATION_IGNORED', message: 'Explanation omitted' }], valid: true });

test('document validation enforces extension, empty-file and exact 10 MiB boundary', () => {
  assert.equal(utils.validateExamDocument({ name: 'exam.DOCX', size: 10 * 1024 * 1024 }), null);
  assert.match(utils.validateExamDocument({ name: 'exam.docx', size: 10 * 1024 * 1024 + 1 }), /10 MiB/);
  assert.match(utils.validateExamDocument({ name: 'exam.docx.zip', size: 20 }), /extension/);
  assert.match(utils.validateExamDocument({ name: 'exam.docx', size: 0 }), /empty/);
});

test('warnings do not block, but document and question errors and valid=false do', () => {
  const data = preview(1);
  assert.equal(utils.hasImportErrors(data), false);
  data.questions[0].errors.push({ code: 'MISSING_ANSWER' });
  assert.equal(utils.hasImportErrors(data), true);
  data.questions[0].errors = [];
  data.errors.push('Invalid document');
  assert.equal(utils.hasImportErrors(data), true);
  data.errors = [];
  data.valid = false;
  assert.equal(utils.hasImportErrors(data), true);
  assert.match(utils.formatImportDiagnostic({ code: 'EXPLANATION_IGNORED', row: 2 }), /EXPLANATION_IGNORED.*2/);
});

test('preview API sends exactly one file and bearer token, leaves multipart boundary to browser, retains response', async () => {
  const data = preview(2);
  data.additionalMetadata = { keep: true };
  const calls = [];
  class Form { entries = []; append(...entry) { this.entries.push(entry); } }
  const api = load('src/api/examTemplatesAPI.ts', {
    axios: { __esModule: true, default: { post: async (...args) => { calls.push(args); return { data }; } } },
    '@/utils/auth': { __esModule: true, default: { getToken: () => 'token' } },
    '@/utils/globalVariables': { apiPrefix: '/apiv2/' },
    '@/utils/examTemplateImport': utils,
  }, { FormData: Form });
  const file = { name: 'exam.docx', size: 30 };
  assert.equal(await api.previewExamTemplateImport(file), data);
  assert.equal(calls[0][0], '/apiv2/api/admin/exams/templates/import/preview');
  assert.deepEqual(calls[0][1].entries, [['file', file]]);
  assert.equal(calls[0][2].headers.Authorization, 'Bearer token');
  assert.equal(calls[0][2].headers['Content-Type'], undefined);
});

function harness(implementation, superAdmin = true, options = {}) {
  const state = [];
  let cursor = 0;
  let cleanup;
  const calls = [];
  const saveCalls = [];
  const navigations = [];
  const storage = options.storage ?? new Map();
  const sessionStorage = options.sessionStorage ?? {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key),
  };
  const confirmations = [];
  let confirmResult = true;
  const Button = 'button';
  const page = load('src/pages/ExamTemplateImportPage.tsx', {
    react: {
      useState: initial => { const i = cursor++; if (!(i in state)) state[i] = typeof initial === 'function' ? initial() : initial;
        return [state[i], next => { state[i] = typeof next === 'function' ? next(state[i]) : next; }]; },
      useRef: initial => { const i = cursor++; return state[i] ??= { current: initial }; },
      useEffect: callback => { if (!cleanup) cleanup = callback(); },
    },
    axios: { __esModule: true, default: { isAxiosError: error => !!error.isAxiosError } },
    'react-router-dom': { Link: 'a', Navigate: 'redirect', useNavigate: () => (...args) => navigations.push(args) },
    '@/components/ui/PageContainer': { __esModule: true, default: 'main' },
    '@/components/ui/PageHeader': { __esModule: true, default: 'header' },
    '@/components/ui/Panel': { __esModule: true, default: 'section' },
    '@/components/ui/Button': { __esModule: true, default: Button },
    '@/utils/auth': { __esModule: true, default: { isSuperAdmin: () => superAdmin, getProfile: () => options.profile ?? { sub: 'admin-1', roleId: 3 } } },
    '@/api/examTemplatesAPI': {
      previewExamTemplateImport: async (...args) => { calls.push(args); return implementation(...args); },
      saveExamTemplateImport: async body => { saveCalls.push(body); return options.save ? options.save(body) : savedResult(JSON.parse(body)); },
    },
    '@/utils/examTemplateImport': utils,
    '@/utils/examTemplateImportDraft': draftUtils,
    '@/utils/examTemplateImportSave': saveUtils,
    '@/components/Exams/ImportQuestionEditor': { __esModule: true, default: editor.default },
    './ExamTemplateImportPage.css': {},
  }, { AbortController, crypto: require('node:crypto').webcrypto,
    window: { sessionStorage, setTimeout: callback => callback(), confirm: message => { confirmations.push(message); return confirmResult; }, addEventListener() {}, removeEventListener() {} },
    document: { getElementById: () => null },
  });
  function render() { cursor = 0; return page.default(); }
  function nodes(node) {
    if (!node || typeof node !== 'object') return [];
    if (Array.isArray(node)) return node.flatMap(nodes);
    if (typeof node.type === 'function') return nodes(node.type(node.props));
    return [node, ...nodes(node.props?.children)];
  }
  function text(node) {
    if (node == null || typeof node === 'boolean') return '';
    if (typeof node !== 'object') return String(node);
    if (Array.isArray(node)) return node.map(text).join('');
    if (typeof node.type === 'function') return text(node.type(node.props));
    return text(node.props?.children);
  }
  const find = predicate => { const result = nodes(render()).find(predicate); assert.ok(result); return result; };
  return {
    calls, saveCalls, navigations, storage, state, render, find, confirmations, setConfirm: result => { confirmResult = result; }, text: () => text(render()), nodes: () => nodes(render()),
    select: file => find(node => node.type === 'input').props.onChange({ target: { files: [file], value: '' } }),
    field: (label, index = 0) => {
      const parent = nodes(render()).filter(node => node.type === 'label' && text(node).startsWith(label))[index];
      assert.ok(parent, `Expected label ${label}`);
      return nodes(parent).find(node => ['input', 'select', 'textarea'].includes(node.type));
    },
    click: label => { const button = find(node => node.type === Button && text(node) === label);
      assert.ok(!button.props.disabled); return button.props.onClick(); },
    cleanup: () => cleanup?.(),
  };
}
const file = { name: 'exam.docx', size: 100 };

test('large preview paginates without mutating, filtering or changing answers and renders diagnostics', async () => {
  const data = preview(151);
  data.questions[0].errors = ['MISSING_TEXT'];
  data.questions[0].warnings = [{ code: 'CHECK_TABLE' }];
  data.errors = ['DOCUMENT_ERROR'];
  const original = JSON.stringify(data);
  const ui = harness(async () => data);
  ui.select(file);
  await ui.click('Preview document');
  assert.equal(ui.state[1], data);
  assert.match(ui.text(), /Imported exam.*151 questions/s);
  assert.match(ui.text(), /Document · Original parser errors.*DOCUMENT_ERROR/s);
  assert.match(ui.text(), /Question · Original parser errors.*MISSING_TEXT/s);
  assert.ok(!ui.text().includes('EXPLANATION_IGNORED'));
  assert.match(ui.text(), /Selected answer IDs: a, e/);
  assert.equal(ui.nodes().filter(node => node.type === 'details').length, 15);
  for (let i = 0; i < 10; i++) await ui.click('Next');
  assert.equal(ui.nodes().filter(node => node.type === 'details').length, 1);
  assert.match(ui.text(), /Question 151/);
  assert.equal(JSON.stringify(data), original);
  assert.equal(ui.find(node => node.type === 'button' && node.props.children === 'Save Template').props.disabled, true);
  ui.select({ name: 'replacement.docx', size: 50 });
  assert.equal(ui.state[1], null);
});

test('replacing a file aborts an in-flight preview and suppresses stale results', async () => {
  let resolve;
  const ui = harness(() => new Promise(done => { resolve = done; }));
  ui.select(file);
  const pending = ui.click('Preview document');
  assert.match(ui.text(), /Generating preview/);
  ui.select({ name: 'next.docx', size: 50 });
  assert.equal(ui.calls[0][1].aborted, true);
  resolve(preview(1));
  await pending;
  assert.equal(ui.state[1], null);
  assert.match(ui.text(), /next.docx/);
});

test('an in-flight request cannot be duplicated by a stale click handler', async () => {
  let resolve;
  const ui = harness(() => new Promise(done => { resolve = done; }));
  ui.select(file);
  const staleButton = ui.nodes().find(node => node.type === 'button');
  const pending = staleButton.props.onClick();
  await staleButton.props.onClick();
  assert.equal(ui.calls.length, 1);
  resolve(preview(1));
  await pending;
});

test('invalid selection cannot upload, and non-super-admin renders only redirect', () => {
  const ui = harness(async () => preview(1));
  ui.select({ name: 'exam.pdf', size: 50 });
  assert.match(ui.text(), /\.docx extension/);
  assert.equal(ui.nodes().find(node => node.type === 'button').props.disabled, true);
  assert.equal(ui.calls.length, 0);
  const denied = harness(async () => preview(1), false);
  assert.equal(denied.render().type, 'redirect');
  assert.equal(denied.calls.length, 0);
});

test('request failures handle authorization, size, invalid documents and network errors', async () => {
  for (const [status, message] of [[401, /session has expired/], [403, /Super-admin access/],
    [413, /too large/], [422, /valid, supported/], [undefined, /connection/]]) {
    const ui = harness(async () => { throw { isAxiosError: true, response: status ? { status } : undefined }; });
    ui.select(file);
    await ui.click('Preview document');
    assert.match(ui.text(), message);
    assert.equal(ui.state[1], null);
    assert.equal(ui.state[3], false);
  }
});

test('422 full preview retains invalid questions and their diagnostics', async () => {
  const data = preview(1);
  data.valid = false;
  data.questions[0].errors = ['NO_ANSWER'];
  const ui = harness(async () => { throw { isAxiosError: true, response: { status: 422, data } }; });
  ui.select(file);
  await ui.click('Preview document');
  assert.equal(ui.state[1], data);
  assert.match(ui.text(), /NO_ANSWER/);
});

async function review(data = preview(2), options = {}) {
  const ui = harness(async () => data, true, options);
  ui.select(file);
  await ui.click('Preview document');
  return ui;
}
function fill(ui, label, value, index = 0) {
  ui.field(label, index).props.onChange({ target: { value } });
}

test('metadata uses the manual workflow values, locks mapped programs and permits general program selection', async () => {
  const ui = await review();
  fill(ui, 'Template Title', 'Reviewed exam');
  fill(ui, 'Description', 'Review description');
  for (const [type, program] of [['basic_qualifying', 'Basic Training'], ['act_final', 'ACT'], ['specialization_final', 'Specialization']]) {
    fill(ui, 'Exam Type', type);
    assert.equal(ui.field('Program').props.value, program);
    assert.equal(ui.field('Program').props.disabled, true);
  }
  fill(ui, 'Exam Type', 'general');
  assert.equal(ui.field('Program').props.disabled, false);
  fill(ui, 'Program', 'ACT');
  assert.equal(ui.state[7].program, 'ACT');
  assert.equal(ui.state[7].title, 'Reviewed exam');
  assert.equal(ui.state[7].description, 'Review description');
  assert.equal(draftUtils.validateImportDraft(ui.state[7]).valid, true);
  assert.equal(ui.calls.length, 1, 'Edits never make backend writes');
});

test('question text, choice IDs and text are editable without mutating original preview', async () => {
  const data = preview(1);
  const original = JSON.stringify(data);
  const ui = await review(data);
  fill(ui, 'Question text', 'Corrected question');
  fill(ui, 'Choice text', 'Corrected answer');
  fill(ui, 'Choice ID', 'yes');
  assert.equal(ui.state[7].questions[0].question_text, 'Corrected question');
  assert.equal(ui.state[7].questions[0].options[0].text, 'Corrected answer');
  assert.equal(ui.state[7].questions[0].correct_answers[0], 'yes');
  assert.equal(JSON.stringify(data), original);
  assert.equal(ui.state[1], data);
  assert.equal(ui.calls.length, 1);
});

test('single answers use radios and multiple answers use independent checkboxes', async () => {
  const ui = await review(preview(1));
  fill(ui, 'Question type', 'single');
  assert.equal(ui.state[7].questions[0].correct_answers.length, 2, 'Type change must not choose an answer silently');
  assert.match(ui.text(), /Select exactly one correct answer/);
  assert.equal(ui.field('Correct answer', 1).props.type, 'radio');
  ui.field('Correct answer', 1).props.onChange({ target: { checked: true } });
  assert.equal(ui.state[7].questions[0].correct_answers.join(','), 'b');
  fill(ui, 'Question type', 'multiple');
  assert.equal(ui.field('Correct answer').props.type, 'checkbox');
  ui.field('Correct answer', 2).props.onChange({ target: { checked: true } });
  assert.equal(ui.state[7].questions[0].correct_answers.join(','), 'b,e');
  ui.field('Correct answer', 1).props.onChange({ target: { checked: false } });
  assert.equal(ui.state[7].questions[0].correct_answers.join(','), 'e');
  assert.match(ui.text(), /Select at least two correct answers/);
});

test('imported true/false answers and keys survive initialization and type changes', async () => {
  const data = preview(1);
  Object.assign(data.questions[0], { question_type: 'true_false', options: { T: 'True', F: 'False' }, correct_answers: ['F'] });
  const ui = await review(data);
  assert.equal(ui.field('Correct answer', 1).props.checked, true);
  assert.equal(ui.state[7].questions[0].correct_answers.join(','), 'F');
  fill(ui, 'Question type', 'single');
  fill(ui, 'Question type', 'true_false');
  assert.equal(ui.field('Correct answer', 1).props.checked, true);
  assert.equal(ui.field('Choice text', 1).props.value, 'False');
  ui.field('Correct answer').props.onChange({ target: { checked: true } });
  assert.equal(ui.state[7].questions[0].correct_answers.join(','), 'T');
});

test('removal renumbers contiguously, preserves identities and source diagnostics, and clamps last page', async () => {
  const ui = await review(preview(16));
  const originalIds = ui.state[7].questions.map(question => question.localId);
  await ui.click('Next');
  await ui.click('Remove question 16');
  assert.equal(ui.state[4], 0);
  assert.equal(ui.state[7].questions.length, 15);
  await ui.click('Remove question 1');
  assert.equal(ui.state[7].questions[0].localId, originalIds[1]);
  assert.equal(ui.state[7].questions[0].sourceIndex, 1);
  assert.equal(ui.state[7].questions.map(question => question.order).join(','), Array.from({ length: 14 }, (_, i) => i + 1).join(','));
  assert.equal(ui.state[1].questions.length, 16);
});

test('edits and answer selections persist across the 15-question pagination boundary', async () => {
  const ui = await review(preview(16));
  fill(ui, 'Question text', 'First page edit');
  const localId = ui.state[7].questions[0].localId;
  await ui.click('Next');
  fill(ui, 'Question text', 'Second page edit');
  ui.field('Correct answer', 1).props.onChange({ target: { checked: true } });
  await ui.click('Previous');
  assert.equal(ui.field('Question text').props.value, 'First page edit');
  assert.equal(ui.state[7].questions[0].localId, localId);
  await ui.click('Next');
  assert.equal(ui.field('Question text').props.value, 'Second page edit');
  assert.equal(ui.state[7].questions[15].correct_answers.join(','), 'a,e,b');
});

test('document replacement and repeat preview require confirmation; cancel preserves edits and original response', async () => {
  const ui = await review();
  fill(ui, 'Template Title', 'Do not discard');
  const draft = ui.state[7];
  const original = ui.state[1];
  ui.setConfirm(false);
  ui.select({ name: 'replace.docx', size: 200 });
  assert.equal(ui.state[7], draft);
  assert.equal(ui.state[1], original);
  assert.equal(ui.state[0], file);
  await ui.click('Preview document');
  assert.equal(ui.calls.length, 1);
  assert.equal(ui.state[7], draft);
  assert.equal(ui.confirmations.length, 2);
  ui.setConfirm(true);
  ui.select({ name: 'bad.pdf', size: 100 });
  assert.equal(ui.state[7], draft, 'Invalid replacement must not destroy draft');
  ui.select({ name: 'replace.docx', size: 200 });
  assert.equal(ui.state[7], null);
  assert.equal(ui.state[1], null);
  assert.equal(ui.state[8], false);
});

test('draft validation checks metadata, question content, IDs and cardinality; parser errors do not block corrected drafts', async () => {
  const data = preview(1);
  Object.assign(data.questions[0], { question_text: '', question_type: 'unsupported', options: { a: '' }, correct_answers: ['missing', 'missing'], errors: ['ORIGINAL_PARSE_ERROR'] });
  data.valid = false;
  const ui = await review(data);
  assert.match(ui.text(), /Enter question text/);
  assert.match(ui.text(), /Choose a supported question type/);
  assert.match(ui.text(), /Enter text for choice a/);
  assert.match(ui.text(), /Select each correct answer only once/);
  assert.match(ui.text(), /do not match an existing choice/);
  fill(ui, 'Template Title', '');
  assert.match(ui.text(), /Enter a template title/);
  fill(ui, 'Template Title', 'Fixed title');
  fill(ui, 'Exam Type', 'general');
  fill(ui, 'Question text', 'Fixed question');
  fill(ui, 'Question type', 'single');
  fill(ui, 'Choice text', 'Fixed choice');
  ui.field('Correct answer').props.onChange({ target: { checked: true } });
  assert.equal(draftUtils.validateImportDraft(ui.state[7]).valid, true);
  assert.match(ui.text(), /Draft passes validation/);
  assert.match(ui.text(), /ORIGINAL_PARSE_ERROR/);
  assert.ok(!ui.text().includes('EXPLANATION_IGNORED'));
  const badProgram = { ...ui.state[7], exam_type: 'act_final', program: 'Basic Training' };
  assert.equal(draftUtils.validateImportDraft(badProgram).valid, false);
  assert.equal(draftUtils.validateImportDraft({ ...ui.state[7], program: 'Unknown' }).valid, false);
  assert.equal(draftUtils.validateImportDraft({ ...ui.state[7], questions: [] }).valid, false);
});

test('duplicate and empty option IDs are visible and fixable without overwriting choices', async () => {
  const ui = await review(preview(1));
  fill(ui, 'Choice ID', 'a', 1);
  assert.match(ui.text(), /Answer choice IDs must be unique/);
  assert.equal(ui.state[7].questions[0].options.length, 3);
  fill(ui, 'Choice ID', '', 1);
  assert.match(ui.text(), /nonempty ID/);
  fill(ui, 'Choice ID', 'b', 1);
  assert.equal(draftUtils.validateImportQuestion(ui.state[7].questions[0]).length, 0);
});

test('add/remove choices and clear answers allow repair of empty or orphaned answer sets', async () => {
  const ui = await review(preview(1));
  await ui.click('Add answer choice');
  assert.equal(ui.state[7].questions[0].options.length, 4);
  fill(ui, 'Choice text', 'Added choice', 3);
  await ui.click('Remove choice');
  assert.equal(ui.state[7].questions[0].options.length, 3);
  assert.equal(ui.state[7].questions[0].correct_answers.includes('a'), false);
  await ui.click('Clear answer selection');
  assert.equal(ui.state[7].questions[0].correct_answers.length, 0);
});

test('eventual save payload is an explicit allowlist, uses string program, stable key and current array order', () => {
  const data = preview(3);
  let draft = draftUtils.changeImportExamType(draftUtils.createImportDraft(data, 'stable-key'), 'act_final');
  draft = draftUtils.removeImportQuestion(draft, draft.questions[1].localId);
  draft.questions[0].explanation = 'Never send';
  const payload = draftUtils.buildImportSavePayload(draft);
  assert.equal(Object.keys(payload).sort().join(','), 'description,exam_type,idempotency_key,program,questions,title');
  assert.equal(payload.program, 'ACT');
  assert.equal(payload.idempotency_key, 'stable-key');
  assert.equal(payload.questions.map(question => question.question_text).join(','), 'Question text 1,Question text 3');
  for (const question of payload.questions) {
    assert.equal(Object.keys(question).sort().join(','), 'correct_answers,options,question_text,question_type');
    assert.equal(question.correct_answers.join(','), 'a,e');
    assert.equal(question.options.e, 'Other');
  }
  payload.questions[0].correct_answers.push('b');
  assert.equal(draft.questions[0].correct_answers.join(','), 'a,e');
  assert.throws(() => draftUtils.buildImportSavePayload({ ...draft, title: '' }), /validation/);
});

function savedResult(payload, replayed = false) {
  return { template: { id: 123, title: payload.title, description: payload.description,
    program: payload.program, exam_type: payload.exam_type }, question_count: payload.questions.length, replayed };
}
function rejection(status, data = { message: 'Backend explanation' }) {
  return { isAxiosError: true, response: { status, data } };
}
async function saveReview(options = {}, data = preview(2)) {
  const ui = await review(data, options);
  fill(ui, 'Exam Type', 'general');
  return ui;
}
function apiForSave(post) {
  return load('src/api/examTemplatesAPI.ts', {
    axios: { __esModule: true, default: { post } },
    '@/utils/auth': { __esModule: true, default: { getToken: () => 'token' } },
    '@/utils/globalVariables': { apiPrefix: '/apiv2/' }, '@/utils/examTemplateImport': utils,
  });
}

test('save API sends the allowlisted JSON with authentication and accepts 201 and 200 replay', async () => {
  for (const status of [201, 200]) {
    const payload = draftUtils.buildImportSavePayload(draftUtils.changeImportExamType(draftUtils.createImportDraft(preview(2), 'key'), 'general'));
    const body = JSON.stringify(payload);
    const calls = [];
    const api = apiForSave(async (...args) => { calls.push(args); return { status, data: savedResult(payload, status === 200) }; });
    const result = await api.saveExamTemplateImport(body);
    assert.equal(result.template.id, 123);
    assert.equal(result.replayed, status === 200);
    assert.equal(calls[0][0], '/apiv2/api/admin/exams/templates/import/save');
    assert.equal(calls[0][1], body);
    assert.equal(calls[0][2].headers.Authorization, 'Bearer token');
    assert.equal(calls[0][2].headers['Content-Type'], 'application/json');
    assert.ok(calls[0][2].timeout > 0);
  }
});

test('malformed success responses, wrong counts and unexpected status are uncertain', async () => {
  const payload = draftUtils.buildImportSavePayload(draftUtils.changeImportExamType(draftUtils.createImportDraft(preview(1), 'key'), 'general'));
  for (const response of [
    { status: 201, data: { template: { id: '123' } } },
    { status: 201, data: { ...savedResult(payload), question_count: 2 } },
    { status: 201, data: { ...savedResult(payload), replayed: undefined } },
    { status: 202, data: savedResult(payload) },
  ]) {
    await assert.rejects(apiForSave(async () => response).saveExamTemplateImport(JSON.stringify(payload)), /unconfirmed/);
  }
});

test('save validates the complete draft, including questions outside the visible page, and links to corrections', async () => {
  const data = preview(16);
  data.questions[15].question_text = '';
  const ui = await saveReview({}, data);
  const button = ui.find(node => node.type === 'button' && node.props.children === 'Save Template');
  assert.equal(button.props.disabled, true);
  await button.props.onClick();
  assert.equal(ui.saveCalls.length, 0);
  ui.find(node => node.type === 'a' && node.props.href?.startsWith('#')).props.onClick();
  assert.equal(ui.state[4], 1);
  fill(ui, 'Question text', 'Corrected final page');
  assert.equal(ui.find(node => node.type === 'button' && node.props.children === 'Save Template').props.disabled, false);
  await ui.click('Save Template');
  assert.equal(JSON.parse(ui.saveCalls[0]).questions.length, 16);
});

test('successful save clears pending state and dirty flag and navigates to template details', async () => {
  for (const replayed of [false, true]) {
    const ui = await saveReview({ save: async body => savedResult(JSON.parse(body), replayed) });
    const staleBack = ui.find(node => node.type === 'a' && node.props.className === 'exam-import-back');
    await ui.click('Save Template');
    assert.equal(ui.saveCalls.length, 1);
    const payload = JSON.parse(ui.saveCalls[0]);
    assert.equal(Object.keys(payload).sort().join(','), 'description,exam_type,idempotency_key,program,questions,title');
    assert.match(payload.idempotency_key, /^[0-9a-f-]{36}$/);
    assert.equal(ui.state[8], false);
    assert.equal(ui.storage.size, 0);
    assert.equal(ui.navigations[0][0], '/exams/templates/123');
    assert.equal(ui.navigations[0][1].replace, true);
    assert.match(ui.navigations[0][1].state.successMessage, /successfully/);
    let prevented = false;
    ui.find(node => node.type === 'a' && node.props.className === 'exam-import-back').props.onClick({ preventDefault: () => { prevented = true; } });
    assert.equal(prevented, false);
    staleBack.props.onClick({ preventDefault: () => { prevented = true; } });
    assert.equal(prevented, false);
    assert.equal(ui.confirmations.length, 0);
  }
});

test('single in-flight guard blocks stale double clicks, editing and replacement', async () => {
  let resolve;
  const ui = await saveReview({ save: () => new Promise(done => { resolve = done; }) });
  const button = ui.find(node => node.type === 'button' && node.props.children === 'Save Template');
  const pending = button.props.onClick();
  await button.props.onClick();
  const draft = ui.state[7];
  fill(ui, 'Template Title', 'Ignored while saving');
  ui.select({ name: 'replace.docx', size: 100 });
  assert.equal(ui.state[7], draft);
  assert.equal(ui.state[0], file);
  assert.equal(ui.saveCalls.length, 1);
  assert.equal(ui.find(node => node.type === 'input' && node.props.type === 'file').props.disabled, true);
  resolve(savedResult(JSON.parse(ui.saveCalls[0])));
  await pending;
});

test('lost-response retry preserves the exact payload and UUID even after draft edits', async () => {
  let attempts = 0;
  const ui = await saveReview({ save: async body => {
    if (++attempts === 1) throw { isAxiosError: true, code: 'ECONNABORTED' };
    return savedResult(JSON.parse(body), true);
  } });
  await ui.click('Save Template');
  const originalBody = ui.saveCalls[0];
  const originalDraft = ui.state[7];
  assert.match(ui.text(), /outcome is uncertain/);
  fill(ui, 'Template Title', 'Changed after uncertain save');
  fill(ui, 'Question text', 'Edited question after timeout');
  assert.notEqual(ui.state[7], originalDraft);
  const blocked = ui.find(node => node.type === 'button' && node.props.children === 'Save Template');
  assert.equal(blocked.props.disabled, true);
  await blocked.props.onClick();
  ui.select({ name: 'replace.docx', size: 50 });
  assert.equal(ui.state[0], file);
  assert.equal(ui.saveCalls.length, 1);
  await ui.click('Retry Save');
  assert.equal(ui.saveCalls[1], originalBody);
  assert.equal(JSON.parse(ui.saveCalls[1]).title, 'Imported exam');
  assert.equal(ui.navigations[0][0], '/exams/templates/123');
});

test('400, 413, 401 and 403 are definite rejections and retain draft for correction with a new attempt', async () => {
  for (const status of [400, 413, 401, 403]) {
    let attempts = 0;
    const ui = await saveReview({ save: async body => {
      if (++attempts === 1) throw rejection(status, { message: '<script>validation details</script>', errors: [{ question: 2, message: 'Check answer' }] });
      return savedResult(JSON.parse(body));
    } });
    const draft = ui.state[7];
    await ui.click('Save Template');
    assert.equal(ui.state[7], draft);
    assert.equal(ui.storage.size, 0);
    assert.equal(ui.navigations.length, 0);
    assert.match(ui.text(), /validation details/);
    assert.equal(ui.nodes().some(node => node.props?.dangerouslySetInnerHTML), false);
    if (status === 401) assert.match(ui.text(), /session has expired/);
    if (status === 403) assert.match(ui.text(), /Super-admin authorization/);
    fill(ui, 'Template Title', 'Corrected title');
    await ui.click('Save Template');
    assert.notEqual(JSON.parse(ui.saveCalls[0]).idempotency_key, JSON.parse(ui.saveCalls[1]).idempotency_key);
  }
});

test('network failures, HTTP 500 and malformed successes retain recovery state without automatic retries', async () => {
  for (const failure of [{ isAxiosError: true }, rejection(500), new Error('Unexpected response')]) {
    const ui = await saveReview({ save: async () => { throw failure; } });
    const draft = ui.state[7];
    await ui.click('Save Template');
    assert.equal(ui.state[7], draft);
    assert.equal(ui.storage.size, 1);
    assert.equal(ui.saveCalls.length, 1);
    assert.equal(ui.navigations.length, 0);
    await ui.click('Retry Save');
    assert.equal(ui.saveCalls[0], ui.saveCalls[1]);
  }
});

test('409 conflict retains the request and key and only explicit resolution permits a changed import', async () => {
  const ui = await saveReview({ save: async () => { throw rejection(409); } });
  await ui.click('Save Template');
  assert.match(ui.text(), /Idempotency-key conflict/);
  assert.equal(ui.saveCalls.length, 1);
  fill(ui, 'Template Title', 'Changed title');
  ui.setConfirm(false);
  await ui.click('I verified the outcome — resolve attempt');
  assert.equal(ui.storage.size, 1);
  ui.setConfirm(true);
  await ui.click('I verified the outcome — resolve attempt');
  assert.equal(ui.storage.size, 0);
  await ui.click('Save Template');
  assert.notEqual(JSON.parse(ui.saveCalls[0]).idempotency_key, JSON.parse(ui.saveCalls[1]).idempotency_key);
  assert.equal(JSON.parse(ui.saveCalls[1]).title, 'Changed title');
});

test('recovery after reload retries the same body, is account-bound, and excludes non-super-admin users', async () => {
  const storage = new Map();
  const first = await saveReview({ storage, save: async () => { throw rejection(500); } });
  await first.click('Save Template');
  const body = first.saveCalls[0];
  const otherAccount = harness(async () => preview(1), true, { storage, profile: { sub: 'other-admin', roleId: 3 } });
  assert.match(otherAccount.text(), /Sign in as the super admin who submitted/);
  assert.equal(otherAccount.saveCalls.length, 0);
  const nonAdmin = harness(async () => preview(1), false, { storage });
  assert.equal(nonAdmin.render().type, 'redirect');
  const recovered = harness(async () => preview(1), true, { storage });
  assert.match(recovered.text(), /Resolve the pending save/);
  await recovered.click('Retry Save');
  assert.equal(recovered.saveCalls[0], body);
  assert.equal(storage.size, 0);
  assert.equal(recovered.navigations[0][0], '/exams/templates/123');
});

test('storage failure prevents any save and corrupted pending data is never submitted', async () => {
  const brokenStorage = { getItem: () => null, setItem: () => { throw new Error('Quota exceeded'); }, removeItem() {} };
  const ui = await saveReview({ sessionStorage: brokenStorage });
  await ui.click('Save Template');
  assert.equal(ui.saveCalls.length, 0);
  assert.match(ui.text(), /No save was sent/);
  const corrupt = harness(async () => preview(1), true, { storage: new Map([[saveUtils.IMPORT_SAVE_STORAGE_KEY, '{bad JSON']]) });
  assert.match(corrupt.text(), /recovery is unavailable/);
  assert.equal(corrupt.saveCalls.length, 0);
});

test('unmount during save retains recoverable request without navigating from an abandoned page', async () => {
  let resolve;
  const ui = await saveReview({ save: () => new Promise(done => { resolve = done; }) });
  const submission = ui.click('Save Template');
  ui.cleanup();
  resolve(savedResult(JSON.parse(ui.saveCalls[0])));
  await submission;
  assert.equal(ui.navigations.length, 0);
  assert.equal(ui.storage.size, 1);
});

test('account recovery identity survives token refresh without storing a bearer token', () => {
  assert.equal(saveUtils.importSaveOwner({ sub: 'admin', roleId: 3, iat: 1, exp: 2, jti: 'old' }),
    saveUtils.importSaveOwner({ exp: 40, iat: 20, jti: 'new', roleId: 3, sub: 'admin' }));
  assert.notEqual(saveUtils.importSaveOwner({ sub: 'admin' }), saveUtils.importSaveOwner({ sub: 'other' }));
});

test('recovery rejects extra payload fields and invalid content rather than forwarding stored diagnostics', () => {
  const draft = draftUtils.changeImportExamType(draftUtils.createImportDraft(preview(1), require('node:crypto').randomUUID()), 'general');
  const payload = draftUtils.buildImportSavePayload(draft);
  for (const altered of [
    { ...payload, source: { table: 1 } },
    { ...payload, questions: [{ ...payload.questions[0], explanation: 'Unsupported' }] },
    { ...payload, questions: [{ ...payload.questions[0], correct_answers: ['missing'] }] },
  ]) {
    const storage = { getItem: () => JSON.stringify({ owner: 'admin', body: JSON.stringify(altered) }) };
    assert.throws(() => saveUtils.readImportSave(storage), /Invalid pending save/);
  }
});

test('a rejected retry cannot release the key of an earlier uncertain save', async () => {
  for (const status of [400, 413, 401, 403]) {
    let attempts = 0;
    const ui = await saveReview({ save: async () => {
      if (++attempts === 1) throw { isAxiosError: true };
      throw rejection(status);
    } });
    await ui.click('Save Template');
    await ui.click('Retry Save');
    assert.equal(ui.saveCalls[0], ui.saveCalls[1]);
    assert.equal(ui.storage.size, 1);
    assert.match(ui.text(), /original save is still unresolved/);
    assert.equal(ui.find(node => node.type === 'button' && node.props.children === 'Save Template').props.disabled, true);
  }
});

test('explanation-only diagnostics are hidden with no warning indicators while the original preview stays complete', async () => {
  const data = preview(2);
  data.questions[0].warnings = [{ code: 'EXPLANATION_IGNORED', message: 'Intentionally omitted' }];
  data.questions[1].warnings = ['EXPLANATION_IGNORED', 'EXPLANATION_IGNORED: explanation text omitted'];
  const original = JSON.stringify(data);
  const ui = await review(data);
  assert.ok(!ui.text().includes('EXPLANATION_IGNORED'));
  assert.ok(!ui.text().includes('original parser warnings'));
  assert.equal(ui.nodes().filter(node => node.props?.className === 'exam-import-warning-text').length, 0);
  assert.equal(ui.state[1], data);
  assert.equal(JSON.stringify(data), original);
  assert.equal(ui.state[7].questions[0].correct_answers.join(','), 'a,e');
});

test('visible warning counts exclude only ignored explanations and preserve meaningful warnings and errors', async () => {
  const data = preview(1);
  data.warnings.push({ code: 'DOCUMENT_CHECK', message: 'Review document title' });
  data.questions[0].warnings = [
    { code: 'EXPLANATION_IGNORED', message: 'Omitted' },
    { code: 'CHECK_TABLE', message: 'Check merged cells' },
    'EXPLANATION_IGNORED: omitted explanation',
    'EXPLANATION_IGNORED_EXTRA',
  ];
  data.questions[0].errors = [{ code: 'MISSING_TEXT', message: 'Review question text' }];
  const ui = await review(data);
  assert.match(ui.text(), /Document · Original parser warnings — informational \(1\)/);
  assert.match(ui.text(), /Question · Original parser warnings — informational \(2\)/);
  assert.match(ui.text(), /2 original parser warnings/);
  assert.match(ui.text(), /CHECK_TABLE.*Check merged cells/);
  assert.match(ui.text(), /DOCUMENT_CHECK.*Review document title/);
  assert.match(ui.text(), /MISSING_TEXT.*Review question text/);
  assert.match(ui.text(), /EXPLANATION_IGNORED_EXTRA/);
  assert.ok(!ui.text().includes('EXPLANATION_IGNORED: omitted explanation'));
  assert.equal(data.questions[0].warnings.length, 4);
});

test('compact choice rows retain accessible IDs and correct-answer controls without changing payload construction', async () => {
  const ui = await saveReview();
  const payload = JSON.stringify(draftUtils.buildImportSavePayload(ui.state[7]));
  assert.equal(ui.field('Choice ID').props.value, 'a');
  assert.equal(ui.field('Correct answer').props.type, 'checkbox');
  assert.equal(ui.field('Correct answer').props['aria-label'], 'Correct answer for choice a');
  assert.equal(ui.nodes().filter(node => node.props?.className?.includes('exam-import-option-editor')).length, 6);
  assert.equal(JSON.stringify(draftUtils.buildImportSavePayload(ui.state[7])), payload);
  assert.ok(ui.find(node => node.props?.['aria-label'] === 'Save reviewed template'));
});

function drop(ui, files) {
  let prevented = false;
  ui.find(node => node.props?.onDrop).props.onDrop({
    preventDefault() { prevented = true; }, dataTransfer: { files },
  });
  assert.ok(prevented, 'Zone drops prevent browser navigation');
}

test('picker resets for repeated selection; drop shares selection and explicit preview without saving', async () => {
  const ui = harness(async () => preview(1));
  const target = { files: [file], value: 'exam.docx' };
  ui.find(node => node.props.type === 'file').props.onChange({ target });
  assert.equal(target.value, '');
  assert.equal(ui.state[0], file);
  const replacement = { name: 'dropped.DOCX', size: 10 * 1024 * 1024 };
  drop(ui, [replacement]);
  assert.equal(ui.state[0], replacement);
  assert.equal(ui.calls.length, 0);
  assert.equal(ui.saveCalls.length, 0);
  await ui.click('Preview document');
  assert.equal(ui.calls[0][0], replacement);
  assert.equal(ui.saveCalls.length, 0);
  assert.ok(ui.state[7]);
});

test('drop rejects multiple, unsupported, oversized and empty files without replacing selection', () => {
  const ui = harness(async () => preview(1));
  ui.select(file);
  for (const [files, message] of [
    [[file, file], /exactly one/],
    [[{ name: 'bad.pdf', size: 10 }], /extension/],
    [[{ name: 'large.docx', size: 10 * 1024 * 1024 + 1 }], /10 MiB/],
    [[{ name: 'empty.docx', size: 0 }], /empty/],
  ]) {
    drop(ui, files);
    assert.match(ui.text(), message);
    assert.equal(ui.state[0], file);
  }
  assert.equal(ui.calls.length, 0);
  assert.equal(ui.saveCalls.length, 0);
});

test('drop replacement confirms unsaved edits and respects cancellation', async () => {
  const ui = await saveReview();
  fill(ui, 'Template Title', 'Unsaved changes');
  const draft = ui.state[7];
  const replacement = { name: 'replacement.docx', size: 100 };
  ui.setConfirm(false);
  drop(ui, [replacement]);
  assert.equal(ui.state[7], draft);
  assert.equal(ui.state[0], file);
  assert.match(ui.confirmations.at(-1), /Discard your unsaved/);
  ui.setConfirm(true);
  drop(ui, [replacement]);
  assert.equal(ui.state[7], null);
  assert.equal(ui.state[0], replacement);
  assert.equal(ui.saveCalls.length, 0);
});

test('drop and stale drop handler cannot replace a document during save', async () => {
  let resolve;
  const ui = await saveReview({ save: () => new Promise(done => { resolve = done; }) });
  const staleDrop = ui.find(node => node.props?.onDrop).props.onDrop;
  const draft = ui.state[7];
  const pending = ui.click('Save Template');
  staleDrop({ preventDefault() {}, dataTransfer: { files: [{ name: 'replacement.docx', size: 10 }] } });
  assert.equal(ui.state[7], draft);
  assert.equal(ui.state[0], file);
  assert.equal(ui.saveCalls.length, 1);
  assert.match(ui.text(), /replacement is unavailable/);
  resolve(savedResult(JSON.parse(ui.saveCalls[0])));
  await pending;
});

test('drag feedback stays scoped to file drags and clears on leave and drop', () => {
  const ui = harness(async () => preview(1));
  let prevented = 0;
  const event = { preventDefault() { prevented++; }, dataTransfer: { types: ['Files'], items: [{ kind: 'file', type: '' }] } };
  ui.find(node => node.props?.onDragOver).props.onDragOver(event);
  assert.equal(prevented, 1);
  assert.equal(event.dataTransfer.dropEffect, 'copy');
  assert.match(ui.find(node => node.props?.onDrop).props.className, /is-dragging/);
  ui.find(node => node.props?.onDragLeave).props.onDragLeave({ currentTarget: { contains: () => false }, relatedTarget: null });
  assert.doesNotMatch(ui.find(node => node.props?.onDrop).props.className, /is-dragging/);
  event.dataTransfer.types = ['text/plain'];
  ui.find(node => node.props?.onDragOver).props.onDragOver(event);
  assert.equal(prevented, 1);
  const input = ui.find(node => node.props.type === 'file');
  assert.equal(input.props.id, 'exam-document');
  assert.equal(input.props['aria-describedby'], 'exam-document-help');
  assert.ok(ui.find(node => node.type === 'label' && node.props.htmlFor === input.props.id));
});

test('template actions use matched primary and outlined secondary styling and preserve navigation', () => {
  let cursor = 0;
  const navigations = [];
  const page = load('src/pages/ExamTemplatesPage.tsx', {
    react: { __esModule: true, default: {}, useRef: value => ({ current: value }), useEffect() {}, useState: initial => [cursor++ === 1 ? false : initial, () => {}] },
    'react-router-dom': { useNavigate: () => path => navigations.push(path) },
    '@/components/ui/PageContainer': { default: 'main', __esModule: true },
    '@/components/ui/PageHeader': { default: 'header', __esModule: true },
    '@/components/ui/Panel': { default: 'section', __esModule: true },
    '@/api/examTemplatesAPI': {}, './ExamTemplatesPage.css': {},
  });
  function nodes(node) {
    if (!node || typeof node !== 'object') return [];
    if (Array.isArray(node)) return node.flatMap(nodes);
    return [node, ...nodes(node.props?.children)];
  }
  const actions = nodes(page.default()).filter(node => node.type === 'button' && node.props.className?.includes('exam-template-button') && node.props['aria-pressed'] === undefined);
  assert.equal(actions.length, 2);
  assert.match(actions[0].props.className, /primary/);
  assert.match(actions[1].props.className, /secondary/);
  assert.equal(actions[1].props.type, 'button');
  actions[1].props.onClick();
  assert.deepEqual(navigations, ['/exams/templates/import']);
  const css = fs.readFileSync(path.resolve(__dirname, '../src/pages/ExamTemplatesPage.css'), 'utf8');
  assert.match(css, /secondary[^}]*background: #fff; color: #2563eb/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /flex-wrap: wrap/);
});
