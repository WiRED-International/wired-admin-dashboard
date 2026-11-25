const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, imports, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { exports, Error, console: { error() {} }, require: id => id in imports ? imports[id] : require(id), ...globals });
  return exports;
}
function nodes(node) {
  if (!node || typeof node !== 'object') return [];
  return Array.isArray(node) ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)];
}
function text(node) {
  if (node == null || typeof node === 'boolean') return '';
  return typeof node !== 'object' ? String(node) : Array.isArray(node) ? node.map(text).join('') : text(node.props?.children);
}
const user = { id: 7, first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com',
  role_id: 1, organization_id: 10, country_id: 20, city_id: 30, role: { id: 1, name: 'User' } };
function page(role = 3, target = user, update = async (_, payload) => ({ user: { ...target, ...payload } }), profile = { organization_id: 10, country_id: 20, city_id: 30 }) {
  const state = [false, target, [], '', '', '', [], null, null, null, false, null, null, null, [], [], []];
  let cursor = 0;
  const calls = [];
  const imports = {
    react: { useEffect() {}, useState(initial) { const i = cursor++; if (!(i in state)) state[i] = initial;
      return [state[i], value => { state[i] = typeof value === 'function' ? value(state[i]) : value; }]; } },
    'react-router-dom': { useParams: () => ({ userId: '7' }), useNavigate: () => () => {} },
    '../utils/auth': { default: { isSuperAdmin: () => role === 3, getRoleId: () => role, getProfile: () => profile } },
    '../api/usersAPI': { updateUserById: async (...args) => { calls.push(args); return update(...args); } },
  };
  for (const file of ['../components/ui/PageContainer', '../components/ui/Panel', '../components/LoadingSpinner/LoadingSpinner',
    '../components/users/LearningProgressCard', '../components/users/StudentCredentialsCard', '../components/Common/SearchableOrganizationPicker']) imports[file] = { default: file };
  for (const file of ['transcriptAPI', 'credentialsAPI', 'organizationsAPI', 'countriesAPI', 'rolesAPI']) imports[`../api/${file}`] = {};
  const component = load('src/pages/UserDetailsPage.tsx', imports).default;
  return { calls, render() { cursor = 0; return component(); },
    click(label) { return nodes(this.render()).find(n => n.type === 'button' && text(n).trim() === label).props.onClick(); },
    change(id, value) { nodes(this.render()).find(n => n.props?.id === id).props.onChange({ target: { value } }); } };
}
for (const role of [2, 3]) {
  test(`role ${role} edits prepopulated identity fields, trims payload and displays saved data`, async () => {
    const ui = page(role);
    ui.click('Edit User');
    for (const [id, value] of [['edit-first-name', 'Jane'], ['edit-last-name', 'Doe'], ['edit-email', 'jane@example.com']])
      assert.equal(nodes(ui.render()).find(n => n.props?.id === id).props.value, value);
    assert.ok(text(ui.render()).includes("HealthMAP login email"));
    ui.change('edit-first-name', '  New First  ');
    ui.change('edit-last-name', ' New Last ');
    ui.change('edit-email', ' new@example.com ');
    await ui.click('Save Changes');
    const payload = ui.calls[0][1];
    assert.equal(payload.first_name, 'New First');
    assert.equal(payload.last_name, 'New Last');
    assert.equal(payload.email, 'new@example.com');
    assert.equal('role_id' in payload, role === 3);
    assert.equal('organization_id' in payload, role === 3);
    assert.equal('country_id' in payload, role === 3);
    assert.ok(text(ui.render()).includes('New First New Last'));
    assert.ok(text(ui.render()).includes('new@example.com'));
  });
}
test('Admins remain restricted by target role, country, organization and city; instructors cannot edit', () => {
  for (const target of [{ ...user, role_id: 2 }, { ...user, role_id: 3 }, { ...user, country_id: 21 },
    { ...user, organization_id: 11 }, { ...user, city_id: 31 }]) {
    assert.ok(!text(page(2, target).render()).includes('Edit User'));
  }
  assert.ok(!text(page(4).render()).includes('Edit User'));
  assert.ok(text(page(2, user, undefined, { organization_id: 10, country_id: 20, city_id: null }).render()).includes('Edit User'));
});
test('blank, oversized and invalid email values block submission', async () => {
  for (const [id, value] of [['edit-first-name', ' '], ['edit-last-name', ' '], ['edit-email', ' '],
    ['edit-first-name', 'a'.repeat(256)], ['edit-email', 'invalid@']]) {
    const ui = page(); ui.click('Edit User'); ui.change(id, value); await ui.click('Save Changes');
    assert.equal(ui.calls.length, 0);
    assert.ok(nodes(ui.render()).some(n => n.props?.role === 'alert'));
  }
});
test('backend errors preserve entered values and editing; retry succeeds', async () => {
  let fail = true;
  const ui = page(2, user, async (_, payload) => {
    if (fail) throw new Error('Email address is already in use.');
    return { user: { ...user, ...payload } };
  });
  ui.click('Edit User'); ui.change('edit-email', 'taken@example.com'); await ui.click('Save Changes');
  assert.equal(text(nodes(ui.render()).find(n => n.props?.role === 'alert')), 'Email address is already in use.');
  assert.equal(nodes(ui.render()).find(n => n.props?.id === 'edit-email').props.value, 'taken@example.com');
  fail = false; ui.change('edit-email', 'available@example.com'); await ui.click('Save Changes');
  assert.ok(text(ui.render()).includes('available@example.com'));
});
test('cancel discards edits and reopening uses saved identity', () => {
  const ui = page(); ui.click('Edit User'); ui.change('edit-first-name', 'Unsaved'); ui.click('Cancel'); ui.click('Edit User');
  assert.equal(nodes(ui.render()).find(n => n.props?.id === 'edit-first-name').props.value, 'Jane');
});
test('user update API preserves authentication and exposes backend field errors and duplicate emails', async () => {
  for (const data of [{ message: 'Invalid user details.', errors: { first_name: 'First name is required.' } },
    { message: 'Email address is already in use.', errors: { email: 'Email address is already in use.' } }]) {
    let request;
    const api = load('src/api/usersAPI.ts', {
      '../utils/auth': { default: { getToken: () => 'token' } }, '../utils/globalVariables': { apiPrefix: '/api' },
    }, { fetch: async (url, options) => { request = { url, ...options }; return { ok: false, json: async () => data }; } });
    await assert.rejects(api.updateUserById(7, { email: 'new@example.com' }), error => Object.values(data.errors).every(value => error.message.includes(value)));
    assert.equal(request.method, 'PUT');
    assert.equal(request.url, '/api/users/7');
    assert.equal(request.headers.Authorization, 'Bearer token');
    assert.equal(JSON.parse(request.body).email, 'new@example.com');
  }
});
