const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8');
const nodes = n => !n || typeof n !== 'object' ? [] : Array.isArray(n) ? n.flatMap(nodes) : [n, ...nodes(n.props?.children)];
function harness({ confirm = true, fail = false } = {}) {
  const state = [], refs = [], effects = [], deps = [];
  let cursor, refCursor, effectCursor, calls = [], resolveAction;
  const records = [{ id: 1, title: 'Active exam', is_archived: false }, { id: 2, title: 'Old exam', is_archived: true }];
  const api = {
    getExamTemplates: async query => { calls.push(['list', query]); return records.filter(t => query.status === 'all' || t.is_archived === (query.status === 'archived')); },
    archiveExamTemplate: async id => { calls.push(['archive', id]); if (fail) throw Error('failure'); await new Promise(r => { resolveAction = r; }); records[0].is_archived = true; },
    restoreExamTemplate: async id => { calls.push(['restore', id]); if (fail) throw Error('failure'); records[1].is_archived = false; },
  };
  const react = {
    useState: initial => { const i = cursor++; if (!(i in state)) state[i] = initial; return [state[i], next => { state[i] = typeof next === 'function' ? next(state[i]) : next; }]; },
    useRef: initial => { const i = refCursor++; return refs[i] ??= { current: initial }; },
    useEffect: (fn, next) => { const i = effectCursor++; if (!deps[i] || next.some((d, j) => d !== deps[i][j])) { deps[i] = next; effects.push(fn); } },
  };
  const exports = {};
  const code = ts.transpileModule(read('pages/ExamTemplatesPage.tsx'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, { exports, console, window: { confirm: () => { calls.push(['confirm']); return confirm; } }, require: id => {
    if (id === 'react') return react;
    if (id === 'react/jsx-runtime') return require(id);
    if (id === 'axios') return { default: { isAxiosError: () => false } };
    if (id === '@/api/examTemplatesAPI') return api;
    if (id === 'react-router-dom') return { useNavigate: () => () => {} };
    return { default: "div", Upload: "svg" };
  }});
  const render = () => { cursor = refCursor = effectCursor = 0; return nodes(exports.default()); };
  const flush = async () => { render(); while (effects.length) effects.shift()(); await new Promise(setImmediate); return render(); };
  const click = label => { const button = render().find(n => n.type === 'button' && n.props.children === label); assert.ok(button, label); return button.props.onClick(); };
  return { flush, click, calls, render, finish: () => resolveAction() };
}
test('defaults to Active, switches Archived and All with badges and empty states', async () => {
  const h = harness(); await h.flush(); assert.equal(h.calls[0][1].status, 'active');
  assert.ok(h.render().some(n => n.props?.children === 'Archive'));
  h.click('Archived'); await h.flush(); assert.equal(h.calls.at(-1)[1].status, 'archived');
  assert.ok(h.render().some(n => n.props?.children === 'Restore'));
  h.click('All'); await h.flush(); assert.equal(h.calls.at(-1)[1].status, 'all');
  assert.ok(h.render().some(n => n.props?.className === 'exam-template-archived'));
});
test('archive confirms, prevents duplicates, refreshes and reports success', async () => {
  const h = harness(); await h.flush(); const staleClick = h.render().find(n => n.props?.children === 'Archive').props.onClick; const request = staleClick(); await staleClick();
  assert.equal(h.calls.filter(c => c[0] === 'confirm').length, 1);
  assert.ok(h.render().find(n => n.props?.children === 'Updating...').props.disabled);
  h.finish(); await request;
  assert.equal(h.calls.filter(c => c[0] === 'archive').length, 1);
  assert.equal(h.calls.filter(c => c[0] === 'list').length, 2);
  assert.ok(h.render().some(n => n.props?.role === 'status'));
});
test('canceling archive makes no mutation request', async () => {
  const h = harness({ confirm: false }); await h.flush(); await h.click('Archive');
  assert.equal(h.calls.filter(c => c[0] === 'archive').length, 0);
});
test('restores archived templates and refreshes the current view', async () => {
  const h = harness(); await h.flush(); h.click('Archived'); await h.flush(); await h.click('Restore');
  assert.ok(h.calls.some(c => c[0] === 'restore')); assert.equal(h.calls.at(-1)[1].status, 'archived');
});
test('failed action reports an error and releases pending state', async () => {
  const h = harness({ fail: true }); await h.flush(); await h.click('Archive');
  assert.ok(h.render().some(n => n.props?.role === 'alert'));
  assert.equal(h.render().find(n => n.props?.children === 'Archive').props.disabled, false);
});
test('list client preserves optional search, program and pagination parameters', async () => {
  const calls = []; const exports = {};
  const axios = { get: async (...args) => { calls.push(args); return { data: [] }; }, isAxiosError: e => !!e.response };
  vm.runInNewContext(ts.transpileModule(read('api/examTemplatesAPI.ts'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports, require: id => id === 'axios' ? { default: axios } : id.includes('/auth') ? { default: { getToken: () => 'token' } } : id.includes('globalVariables') ? { apiPrefix: '' } : {} });
  await exports.getExamTemplates(); assert.equal(calls[0][1].params.status, 'active');
  await exports.getExamTemplates({ status: 'all', search: 'math', program: 'ACT', page: 3, limit: 20 });
  assert.deepEqual(JSON.parse(JSON.stringify(calls[1][1].params)), { status: 'all', search: 'math', program: 'ACT', page: 3, limit: 20 });
  assert.equal(exports.isArchivedTemplateConflict({ response: { status: 409, data: { code: 'EXAM_TEMPLATE_ARCHIVED' } } }), true);
  assert.equal(exports.isArchivedTemplateConflict({ response: { status: 500, data: { code: 'OTHER' } } }), false);
});
test('creation and editing explicitly load active choices and preserve archived references', () => {
  for (const page of ['ScheduleExamPage', 'ExamDetailsPage']) {
    const source = read(`pages/${page}.tsx`);
    assert.match(source, /getExamTemplates\(\{ status: "active" \}\)/);
    assert.match(source, /filter\(template => !template.is_archived\)/);
    assert.match(source, /isArchivedTemplateConflict\(err\)/);
  }
  const editing = read('pages/ExamDetailsPage.tsx');
  assert.match(editing, /option value=\{exam.exam_template_id\}/);
  assert.match(editing, /exam_template_id: data.exam_template_id/);
  assert.match(editing, /current template is archived/);
  assert.match(editing, /exam_template_id: exam.exam_template_id/);
});
const textContent = n => n == null || typeof n === 'boolean' ? '' : typeof n !== 'object' ? String(n) : Array.isArray(n) ? n.map(textContent).join('') : textContent(n.props?.children);
function editArchivedExam(conflict = false) {
  const exam = { id: 9, title: 'Exam', exam_template_id: 2, exam_template: { id: 2, title: 'Old exam', is_archived: true }, classes: [], exam_user_access: [], available_from: '2026-01-01', available_until: '2026-01-02', time_zone: 'UTC' };
  const form = { title: 'Updated title', description: 'Keep changes', exam_template_id: 2, localStart: 'start', localEnd: 'end', time_zone: 'UTC', duration_minutes: 45 };
  const state = [exam, [{ id: 1, title: 'Active exam' }], false, true, '', false, form];
  let cursor = 0; const writes = [], alerts = [];
  const react = { useEffect() {}, useState: initial => { const i = cursor++; if (!(i in state)) state[i] = initial; return [state[i], next => { state[i] = typeof next === 'function' ? next(state[i]) : next; }]; } };
  const api = { updateExam: async (id, payload) => { writes.push(payload); if (conflict) throw { archived: true }; }, getExamDetails: async () => ({ ...exam, title: form.title }), isArchivedTemplateConflict: e => e.archived === true };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(read('pages/ExamDetailsPage.tsx'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, { exports, console: { error() {} }, alert: message => alerts.push(message), setTimeout() {}, require: id => {
    if (id === 'react') return react;
    if (id === 'react/jsx-runtime') return require(id);
    if (id === '@/api/examsAPI') return api;
    if (id === 'react-router-dom') return { useParams: () => ({ id: 9 }), useNavigate: () => () => {} };
    if (id.includes('examDateTime')) return { examScheduleValue: x => x, requireExamTimeZone: x => x, examDateTimeInput: x => x, formatExamDateTime: x => x, examDisplayTimeZone: () => 'UTC' };
    return { default: 'div' };
  }});
  const render = () => { cursor = 0; return nodes(exports.default()); };
  return { render, state, writes, alerts, save: () => render().find(n => n.type === 'button' && textContent(n).trim() === 'Save Changes').props.onClick() };
}
test('existing exam displays its archived reference and saves unrelated fields with that reference', async () => {
  const h = editArchivedExam();
  assert.ok(h.render().some(n => n.type === 'option' && n.props.value === 2 && textContent(n).includes('Archived')));
  await h.save(); assert.equal(h.writes[0].exam_template_id, 2); assert.equal(h.writes[0].title, 'Updated title');
  assert.equal(h.state[3], false);
});
test('conflicting replacement is removed while current archived reference and unrelated edits are preserved', async () => {
  const h = editArchivedExam(true); h.state[6].exam_template_id = 1;
  await h.save(); assert.equal(h.state[6].exam_template_id, 2); assert.equal(h.state[6].title, 'Updated title');
  assert.equal(h.state[1].length, 0); assert.equal(h.state[3], true); assert.match(h.alerts[0], /archived/);
});
