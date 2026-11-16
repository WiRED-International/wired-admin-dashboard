const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, imports = {}, globals = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../', file), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, Error,
    require: id => Object.hasOwn(imports, id) ? imports[id] : require(id), ...globals });
  return exports;
}
function nodes(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(nodes);
  return [node, ...nodes(node.props?.children)];
}
function text(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node !== 'object') return String(node);
  return Array.isArray(node) ? node.map(text).join('') : text(node.props?.children);
}
const response = (data, status = 200) => ({
  ok: status < 400, status, headers: { get: () => 'application/json' }, json: async () => data,
});

// Exercise actual initialization, submission, and API serialization with mocked
// transports. Effect dependencies and hook state persist across rerenders.
async function editForm({ role = 3, save = async () => response({}), classStatus = 'draft' } = {}) {
  const record = {
    id: 7, organization_id: 1, program_id: 5, location_id: 8,
    name: 'Development Class', description: 'Original', status: classStatus,
    start_date: '2026-11-20', end_date: '2026-12-20', enrollment_deadline: null,
  };
  const organizations = [{ id: 1, name: 'test' }, { id: 2, name: 'Global Training' }, { id: 3, name: 'Another Organization' }];
  const locations = [
    { id: 8, name: 'Los Angeles', country_id: 2, time_zone: 'America/Los_Angeles' },
    { id: 9, name: 'Nairobi', country_id: 1, time_zone: 'Africa/Nairobi' },
  ];
  const writes = [], organizationReads = [], navigations = [], confirmations = [];
  const auth = { __esModule: true, default: {
    getToken: () => 'test-token', isSuperAdmin: () => role === 3,
    isAdmin: () => role === 2 || role === 3, isInstructor: () => role === 4,
  } };
  const quietConsole = { log() {}, error() {} };
  const api = load('src/api/classAPI.ts', {
    '../utils/auth': auth, '../utils/globalVariables': { apiPrefix: '' },
  }, {
    console: quietConsole,
    fetch: async (url, options = {}) => {
      if (options.method === 'PUT') {
        const payload = JSON.parse(options.body);
        writes.push({ url, payload, headers: options.headers });
        return save(payload);
      }
      if (url.endsWith('/options/programs')) return response({ programs: [{ id: 5, name: 'Basic CHW' }] });
      if (url.endsWith('/locations')) return response(locations);
      return response({ class: record });
    },
  });
  const organizationApi = load('src/api/examsAPI.ts', {
    '@/utils/auth': auth, '@/utils/globalVariables': { apiPrefix: '' },
    axios: { get: async url => { organizationReads.push(url); return { data: { organizations } }; } },
  }, { console: quietConsole });
  const hooks = [], effects = [];
  let cursor = 0, dirty = true, tree;
  function Select() {}
  function Input() {}
  function Button() {}
  const page = load('src/pages/EditClassPage.tsx', {
    react: {
      useState: initial => {
        const index = cursor++;
        hooks[index] ??= { value: initial };
        return [hooks[index].value, next => {
          const value = typeof next === 'function' ? next(hooks[index].value) : next;
          if (!Object.is(value, hooks[index].value)) { hooks[index].value = value; dirty = true; }
        }];
      },
      useRef: initial => { const index = cursor++; return hooks[index] ??= { current: initial }; },
      useEffect: (callback, deps) => {
        const index = cursor++;
        const old = hooks[index];
        if (!old || deps.some((value, i) => !Object.is(value, old.deps[i]))) {
          effects.push(() => { old?.cleanup?.(); hooks[index] = { deps, cleanup: callback() }; });
        }
      },
    },
    'react-router-dom': { useParams: () => ({ classId: '7' }), useNavigate: () => (...args) => navigations.push(args) },
    '../utils/auth': auth, '../api/classAPI': api, '../api/examsAPI': organizationApi,
    '../components/ui/Select': { __esModule: true, default: Select },
    '../components/ui/Input': { __esModule: true, default: Input },
    '../components/ui/Button': { __esModule: true, default: Button },
  }, {
    console: quietConsole, window: { confirm: message => { confirmations.push(message); return true; } },
  });
  async function flush() {
    for (let i = 0; i < 20; i++) {
      if (dirty) {
        dirty = false; cursor = 0; tree = page.default();
        while (effects.length) effects.shift()();
      }
      await new Promise(setImmediate);
      if (!dirty) return;
    }
    assert.fail('Edit page did not settle');
  }
  const select = placeholder => nodes(tree).find(n => n.type === Select && n.props.options[0].label === placeholder);
  async function change(node, value) { assert.ok(node); node.props.onChange({ target: { value } }); await flush(); }
  await flush();
  return {
    writes, organizationReads, navigations, confirmations, flush,
    organization: () => select('Select an organization'),
    chooseOrganization: value => change(select('Select an organization'), String(value)),
    location: () => select('Select a location'),
    setName: value => change(nodes(tree).find(n => n.type === Input && n.props.type === 'text'), value),
    name: () => nodes(tree).find(n => n.type === Input && n.props.type === 'text').props.value,
    setDate: (index, value) => change(nodes(tree).filter(n => n.type === Input && n.props.type === 'date')[index], value),
    setStatus: value => change(select('Draft'), value),
    submitHandler: () => nodes(tree).find(n => n.type === 'form').props.onSubmit,
    submit: async () => {
      await nodes(tree).find(n => n.type === 'form').props.onSubmit({ preventDefault() {} });
      await flush();
    },
    saving: () => nodes(tree).find(n => n.type === Button && n.props.type === 'submit').props.disabled,
    error: () => text(nodes(tree).find(n => n.props?.role === 'alert')),
  };
}

test('Super Admin sees all create-class organization names with the current organization preselected', async () => {
  const form = await editForm();
  assert.deepEqual(form.organizationReads, ['/api/admin/organizations/accessible']);
  assert.equal(form.organization().props.value, 1);
  assert.deepEqual(Array.from(form.organization().props.options, o => o.label),
    ['Select an organization', 'test', 'Global Training', 'Another Organization']);
});

test('successful reassignment sends organization_id and preserves cross-country location and other fields', async () => {
  const form = await editForm();
  await form.chooseOrganization(2);
  assert.deepEqual(Array.from(form.location().props.options, o => o.label), ['Select a location', 'Los Angeles', 'Nairobi']);
  assert.equal(form.location().props.value, 8);
  await form.submit();
  assert.equal(form.writes[0].payload.organization_id, 2);
  assert.equal(form.writes[0].payload.location_id, 8);
  assert.equal(form.writes[0].payload.program_id, 5);
  assert.equal(form.writes[0].payload.start_date, '2026-11-20');
  assert.equal(form.writes[0].payload.end_date, '2026-12-20');
  assert.equal(form.writes[0].headers.Authorization, 'Bearer test-token');
  assert.equal(form.navigations[0][0], '/classes/7');
});

test('unrelated edits and reselecting the original organization omit organization_id', async () => {
  for (const changeBack of [false, true]) {
    const form = await editForm();
    if (changeBack) { await form.chooseOrganization(2); await form.chooseOrganization(1); }
    await form.setName('Renamed Class');
    await form.submit();
    assert.equal(Object.hasOwn(form.writes[0].payload, 'organization_id'), false);
    assert.equal(form.writes[0].payload.name, 'Renamed Class');
  }
});

test('Admins and Instructors retain editing without an organization selector, list request, or reassignment payload', async () => {
  for (const role of [2, 4]) {
    const form = await editForm({ role });
    assert.equal(form.organization(), undefined);
    assert.equal(form.organizationReads.length, 0);
    await form.setName('Edited by staff');
    await form.submit();
    assert.equal(Object.hasOwn(form.writes[0].payload, 'organization_id'), false);
    assert.equal(form.navigations[0][0], '/classes/7');
  }
});

test('409 preserves unsaved organization and class fields and permits retry', async () => {
  let blocked = true;
  const message = 'Class organization cannot be changed because it has exam sessions.';
  const form = await editForm({ save: async () => blocked ? response({ message }, 409) : response({}) });
  await form.chooseOrganization(2);
  await form.setName('Unsaved name');
  await form.submit();
  assert.equal(form.error(), message);
  assert.equal(form.organization().props.value, 2);
  assert.equal(form.name(), 'Unsaved name');
  assert.equal(form.navigations.length, 0);
  assert.equal(form.saving(), false);
  blocked = false;
  await form.submit();
  assert.equal(form.writes[1].payload.organization_id, 2);
  assert.equal(form.navigations[0][0], '/classes/7');
});

test('403, 404, server and network failures retain the editing form and display an explanation', async () => {
  for (const save of [
    async () => response({ message: 'Reassignment forbidden.' }, 403),
    async () => response({ message: 'Class not found.' }, 404),
    async () => response({ message: 'Server unavailable.' }, 500),
    async () => { throw new Error('Network unavailable.'); },
  ]) {
    const form = await editForm({ save });
    await form.chooseOrganization(2);
    await form.submit();
    assert.ok(form.error());
    assert.equal(form.organization().props.value, 2);
    assert.equal(form.navigations.length, 0);
  }
});

test('duplicate submissions are blocked even before the saving state rerenders', async () => {
  let resolve;
  const pending = new Promise(done => { resolve = done; });
  const form = await editForm({ save: () => pending });
  await form.chooseOrganization(2);
  const handler = form.submitHandler();
  const first = handler({ preventDefault() {} });
  await handler({ preventDefault() {} });
  await form.flush();
  assert.equal(form.writes.length, 1);
  assert.equal(form.saving(), true);
  resolve(response({}));
  await first;
  assert.equal(form.navigations.length, 1);
});

test('existing date validation still blocks unsafe ranges before any update request', async () => {
  const form = await editForm();
  await form.setDate(1, '2026-11-01');
  await form.submit();
  assert.match(form.error(), /End date cannot be before/);
  assert.equal(form.writes.length, 0);
  await form.setDate(1, '2026-12-20');
  await form.setDate(2, '2026-12-21');
  await form.submit();
  assert.match(form.error(), /Enrollment deadline cannot be after/);
  assert.equal(form.writes.length, 0);
});

test('existing instructor archive confirmation remains in place', async () => {
  const form = await editForm({ role: 4 });
  await form.setStatus('archived');
  await form.submit();
  assert.equal(form.confirmations.length, 1);
  assert.match(form.confirmations[0], /Archive this class/);
  assert.equal(form.writes[0].payload.status, 'archived');
  assert.equal(Object.hasOwn(form.writes[0].payload, 'organization_id'), false);
});
