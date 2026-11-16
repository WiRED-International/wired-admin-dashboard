const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, imports, globals = {}) {
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

// Render the real page and run its deletion handler against the actual API
// client, with mocked transport. Seed only the pre-existing class-loading state.
function details({ role = 3, status = 'draft', confirmed = true, transport } = {}) {
  const requests = [], confirmations = [], navigations = [];
  const record = {
    id: 7, name: 'Development Test', status, program: { name: 'Basic CHW' },
    start_date: '2026-11-20', end_date: '2026-12-20', enrollment_deadline: null,
  };
  const state = [record, false, null, [], false];
  const refs = [];
  let cursor, refCursor;
  const auth = { __esModule: true, default: {
    getToken: () => 'test-token', isSuperAdmin: () => role === 3,
    isAdmin: () => role === 2 || role === 3, isInstructor: () => role === 4,
  } };
  const api = load('src/api/classAPI.ts', {
    '../utils/auth': auth, '../utils/globalVariables': { apiPrefix: '/apiv2/' },
  }, {
    fetch: async (url, options) => {
      requests.push({ url, options });
      return transport ? transport() : { ok: true, status: 200, json: async () => ({ message: 'Deleted' }) };
    },
  });
  function Child() {}
  const page = load('src/pages/ClassDetailsPage.tsx', {
    react: {
      useState: initial => {
        const index = cursor++;
        if (!(index in state)) state[index] = initial;
        return [state[index], next => { state[index] = typeof next === 'function' ? next(state[index]) : next; }];
      },
      useRef: initial => {
        const index = refCursor++;
        refs[index] ??= { current: initial };
        return refs[index];
      },
      useEffect: () => {},
    },
    'react-router-dom': {
      useParams: () => ({ classId: '7' }),
      useNavigate: () => (...args) => navigations.push(args),
    },
    '../api/classAPI': api, '../utils/auth': auth,
    '../components/Classes/ClassRoster': { __esModule: true, default: Child },
    '../components/Classes/EnrollStudent': { __esModule: true, default: Child },
  }, {
    window: { confirm: message => { confirmations.push(message); return confirmed; } },
  });
  function render() { cursor = 0; refCursor = 0; return page.default(); }
  return {
    requests, confirmations, navigations, api,
    button: () => nodes(render()).find(n => n.type === 'button' && /^(Delete Class|Deleting\.\.\.)$/.test(text(n))),
    text: () => text(render()),
    alert: () => nodes(render()).find(n => n.props?.role === 'alert'),
  };
}

test('only a Super Admin viewing a draft class sees Delete Class', () => {
  for (const role of [1, 2, 3, 4]) {
    for (const status of ['draft', 'active', 'completed', 'archived']) {
      assert.equal(!!details({ role, status }).button(), role === 3 && status === 'draft');
    }
  }
});

test('confirmation identifies the class and permanence; cancelling sends no request', async () => {
  const form = details({ confirmed: false });
  await form.button().props.onClick();
  assert.equal(form.requests.length, 0);
  assert.equal(form.navigations.length, 0);
  assert.match(form.confirmations[0], /Development Test/);
  assert.match(form.confirmations[0], /#7/);
  assert.match(form.confirmations[0], /permanent.*cannot be undone/);
});

test('confirmed deletion uses authenticated DELETE and navigates with a success message', async () => {
  const form = details();
  await form.button().props.onClick();
  assert.equal(form.requests.length, 1);
  assert.equal(form.requests[0].url, '/apiv2/api/admin/classes/7');
  assert.equal(form.requests[0].options.method, 'DELETE');
  assert.equal(form.requests[0].options.headers.Authorization, 'Bearer test-token');
  assert.equal(form.navigations[0][0], '/classes');
  const message = form.navigations[0][1].state.successMessage;
  assert.match(message, /Development Test.*#7.*permanently deleted/);

  // Verify the destination actually displays the supplied navigation message.
  const classes = load('src/pages/ClassesPage.tsx', {
    react: { useState: initial => [initial, () => {}], useEffect: () => {} },
    'react-router-dom': { useNavigate: () => () => {}, useLocation: () => ({ state: { successMessage: message } }) },
    '../api/classAPI': {}, '../api/organizationsAPI': {},
    '../components/Classes/ClassesTable': { __esModule: true, default: () => null },
    '../components/ui/Select': { __esModule: true, default: () => null },
  });
  const banner = nodes(classes.default()).find(n => n.props?.role === 'status');
  assert.equal(text(banner), message);
});

test('409 displays the backend dependency explanation and keeps class details visible', async () => {
  const message = 'Class cannot be deleted because it has exam sessions.';
  const form = details({ transport: async () => ({ ok: false, status: 409, json: async () => ({ message }) }) });
  await form.button().props.onClick();
  assert.equal(text(form.alert()), message);
  assert.match(form.text(), /Class Details/);
  assert.match(form.text(), /Edit Class/);
  assert.match(form.text(), /View Progress/);
  assert.equal(form.navigations.length, 0);
  assert.equal(form.button().props.disabled, false);
});

test('404 and authorization errors remain on the page and display server explanations', async () => {
  for (const [status, message] of [[404, 'Class no longer exists.'], [403, 'Permission denied.'], [401, 'Session expired.']]) {
    const form = details({ transport: async () => ({ ok: false, status, json: async () => ({ message }) }) });
    await form.button().props.onClick();
    assert.equal(text(form.alert()), message);
    assert.equal(form.navigations.length, 0);
  }
});

test('network and non-JSON server failures display errors and allow retry', async () => {
  for (const transport of [
    async () => { throw new Error('Network unavailable'); },
    async () => ({ ok: false, status: 500, json: async () => { throw new Error('HTML response'); } }),
  ]) {
    const form = details({ transport });
    await form.button().props.onClick();
    assert.ok(text(form.alert()));
    assert.equal(form.navigations.length, 0);
    await form.button().props.onClick();
    assert.equal(form.requests.length, 2);
  }
});

test('pending deletion disables the button and prevents duplicate requests, including stale clicks', async () => {
  let resolve;
  const response = new Promise(done => { resolve = done; });
  const form = details({ transport: () => response });
  const onClick = form.button().props.onClick;
  const first = onClick();
  await onClick();
  assert.equal(form.requests.length, 1);
  assert.equal(form.confirmations.length, 1);
  assert.equal(form.button().props.disabled, true);
  resolve({ ok: true, status: 200, json: async () => ({ message: 'Deleted' }) });
  await first;
  assert.equal(form.navigations.length, 1);
});
