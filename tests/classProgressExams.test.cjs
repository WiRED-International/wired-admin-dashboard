const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, imports = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, { exports, setTimeout() {}, require: id => id in imports ? imports[id] : require(id) });
  return exports;
}
const utils = load('src/utils/classProgressExams.ts');
const session = (id, submitted_at, score = 80, attempt_number = 1) => ({ id, user_id: 1, submitted_at, score, attempt_number });
const exam = (type, sessions = []) => ({ id: 1, exam_template: type === null ? null : { exam_type: type }, exam_sessions: sessions });
function nodes(node) {
  if (!node || typeof node !== 'object') return [];
  return Array.isArray(node) ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)];
}
function text(node) {
  if (node == null || typeof node === 'boolean') return '';
  return typeof node !== 'object' ? String(node) : Array.isArray(node) ? node.map(text).join('') : text(node.props?.children);
}
function ui(file, state, imports) {
  let cursor = 0;
  const component = load(file, { react: { useEffect() {}, useState(initial) {
    const index = cursor++;
    if (!(index in state)) state[index] = initial;
    return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
  } }, ...imports }).default;
  return { render() { cursor = 0; return component(); },
    click(label) { return nodes(this.render()).find(n => n.type === 'button' && text(n).trim() === label).props.onClick(); } };
}

test('latest completed score uses timestamps across exams, ignores unfinished/unscored attempts and other students', () => {
  const exams = [exam('practice', [session(1, '2026-01-01T00:00:00Z', 95, 9)]),
    exam('practice', [session(2, '2026-02-01T00:00:00Z', 0), session(3, null, null, 10),
      session(4, '2026-03-01T00:00:00Z', null), session(5, 'invalid'),
      { ...session(6, '2026-04-01T00:00:00Z'), user_id: 2 }]),
    exam('act_final', [session(7, '2026-05-01T00:00:00Z')])];
  assert.equal(utils.latestCompletedExam(exams, 1, 'practice').id, 2);
  assert.equal(utils.latestCompletedExam(exams, 1, 'final').id, 7);
  assert.equal(utils.latestCompletedExam(exams, 2, 'other'), undefined);
});
test('timestamp ties use descending session ID regardless of response order', () => {
  const exams = [exam('practice', [session(1, '2026-01-01T00:00:00Z'), session(2, '2026-01-01T00:00:00Z')])];
  assert.equal(utils.latestCompletedExam(exams, 1, 'practice').id, 2);
  exams[0].exam_sessions.reverse();
  assert.equal(utils.latestCompletedExam(exams, 1, 'practice').id, 2);
});
test('classification preserves every final type and keeps general/unclassified separate', () => {
  for (const type of ['basic_qualifying', 'act_final', 'specialization_final']) assert.equal(utils.examCategory(exam(type)), 'final');
  for (const type of ['general', null]) assert.equal(utils.examCategory(exam(type)), 'other');
  assert.equal(utils.examCategory(exam('practice')), 'practice');
  assert.equal(utils.examColumns([exam('practice')]).map(c => c.label).join(), 'Practice Exam');
  assert.equal(utils.examColumns([]).length, 1);
});
for (const role of ['superAdmin', 'instructor', 'admin']) {
  test(`Class Progress categories and historical controls retain ${role} visibility`, () => {
    const progress = { class: { id: 1, program: { training_type: 'basic' } }, modules: [], quizScores: [],
      students: [{ id: 1 }], exams: [exam('practice'), exam('basic_qualifying'), exam('general')] };
    const page = ui('src/pages/ClassProgressPage.tsx', [progress, false, null, [], null, false, null], {
      'react-router-dom': { useParams: () => ({ classId: '1' }), useNavigate: () => () => {} },
      '../api/classAPI': {}, '../api/examsAPI': {}, '../utils/classProgressExams': utils,
      '../utils/auth': { __esModule: true, default: { isSuperAdmin: () => role === 'superAdmin', isInstructor: () => role === 'instructor' } },
    });
    const tree = page.render();
    const headers = nodes(tree).filter(n => n.type === 'th').map(text);
    for (const label of ['Practice Exam', 'Final Exam', 'General / Unclassified Exam']) assert.equal(headers.includes(label), role !== 'admin');
    assert.equal(nodes(tree).filter(n => n.type === 'button' && text(n) === 'Historical Exam').length, role === 'superAdmin' ? 1 : 0);
    const statuses = nodes(tree).filter(n => typeof n.type === 'function' && n.props.category);
    for (const node of statuses) assert.equal(text(node.type(node.props)), '\u2014');
  });
}

const template = { id: 42, title: 'Existing', description: '', program: 'ACT', exam_type: 'general', exam_template_questions: [] };
const wrappers = Object.fromEntries(['PageContainer', 'PageHeader', 'Panel'].map(name => [`@/components/ui/${name}`, { __esModule: true, default: name }]));
const router = { useParams: () => ({ templateId: '42' }), useLocation: () => ({}), useNavigate: () => () => {} };
test('existing template can be reclassified as practice via update and displays its label', async () => {
  let saved;
  const page = ui('src/pages/ExamTemplateDetailsPage.tsx', [template, true, 'Existing', '', 'ACT', 'general', false], {
    ...wrappers, 'react-router-dom': router,
    '@/api/examTemplatesAPI': { updateExamTemplate: async (id, payload) => { saved = { id, ...payload }; return { template: { ...template, ...payload } }; } },
  });
  const select = nodes(page.render()).find(n => n.type === 'select' && n.props.value === 'general');
  assert.ok(nodes(select).some(n => n.type === 'option' && n.props.value === 'practice' && text(n) === 'Practice Exam'));
  select.props.onChange({ target: { value: 'practice' } });
  await page.click('Save Changes');
  assert.equal(saved.id, 42);
  assert.equal(saved.exam_type, 'practice');
  assert.equal(saved.program, 'ACT');
  assert.ok(text(page.render()).includes('Practice Exam'));
});
test('create template submits practice while retaining the selected program', async () => {
  let saved;
  const page = ui('src/pages/ExamTemplatesPage.tsx', [[], false, true, 'Practice', '', 'ACT', false], {
    ...wrappers, 'react-router-dom': router, './ExamTemplatesPage.css': {},
    '@/api/examTemplatesAPI': { createExamTemplate: async payload => { saved = payload; return { template: { id: 43 } }; } },
  });
  const select = nodes(page.render()).find(n => n.type === 'select' && n.props.value === '');
  assert.ok(nodes(select).some(n => n.type === 'option' && n.props.value === 'practice'));
  select.props.onChange({ target: { value: 'practice' } });
  await page.click('Create and Open');
  assert.equal(saved.exam_type, 'practice');
  assert.equal(saved.program, 'ACT');
});
test('import offers practice without forcing a final-exam program mapping', () => {
  const draft = load('src/utils/examTemplateImportDraft.ts');
  assert.equal(draft.IMPORT_EXAM_TYPES.find(t => t.value === 'practice').label, 'Practice Exam');
  assert.equal(draft.changeImportExamType({ program: 'ACT' }, 'practice').program, 'ACT');
});
