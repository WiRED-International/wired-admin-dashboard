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
  vm.runInNewContext(code, { exports, Error, URLSearchParams, FormData, structuredClone, console, ...globals,
    require: id => id in imports ? imports[id] : require(id) });
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
const metadata = { module_id: '1558', module_title: 'Psychological First Aid' };
const file = { name: 'compiler.zip', size: 100, type: 'application/zip' };
const record = { id: 5, module_id: '1558', name: metadata.module_title, downloadLink: 'https://test/old.zip',
  has_quiz: true, credit_type: 'cme', cme_credits: 5, type: 'module',
  letters: [], subCategories: [], keywords: [], programs: [], specializations: [] };
const settle = () => new Promise(setImmediate);
function harness(edit = false, api = {}, compiler = false) {
  const state = [], refs = [];
  if (edit) { state[0] = structuredClone(record); state[1] = structuredClone(record); state[9] = false;
    state[18] = compiler ? metadata : null; state[20] = true; }
  let cursor, refCursor;
  const calls = [], navigations = [], confirmations = [];
  const defaults = {
    inspectModulePackage: async (...args) => { calls.push(['inspect', ...args]); return metadata; },
    checkModuleIdAvailable: async id => { calls.push(['availability', id]); },
    createModuleUploadUrl: async () => { calls.push(['presign']); return { uploadUrl: 'signed', downloadLink: 'download', uploadId: 'new-id' }; },
    createReplacementModuleUploadUrl: async () => { calls.push(['presign']); return { uploadUrl: 'signed', uploadId: 'replace-id', key: 'new-key' }; },
    uploadModuleZipToS3: async (...args) => { calls.push(['s3', ...args]); },
    confirmModuleReplacement: async (...args) => { calls.push(['confirm', ...args]); },
    fetchModuleById: async () => { calls.push(['refresh']); return structuredClone(record); },
    createModule: async payload => { calls.push(['create', payload]); },
    ...api,
  };
  const component = load(`src/pages/${edit ? 'Edit' : 'Add'}ModulePage.tsx`, {
    react: { useEffect() {}, useRef(initial) { const i = refCursor++; return refs[i] ??= { current: initial }; },
      useState(initial) { const i = cursor++; if (!(i in state)) state[i] = initial;
        return [state[i], value => { state[i] = typeof value === 'function' ? value(state[i]) : value; }]; } },
    'react-router-dom': { useNavigate: () => (...args) => navigations.push(args), useParams: () => ({ moduleId: '5' }) },
    '../api/moduleApi': defaults,
  }, { window: { confirm: message => { confirmations.push(message); return true; } } }).default;
  return { calls, state, navigations, confirmations,
    render() { cursor = 0; refCursor = 0; return component(); },
    find(predicate) { const node = nodes(this.render()).find(predicate); assert.ok(node, 'Expected UI node'); return node; },
    field(label) { const field = this.find(n => n.type === 'label' && text(n).trim() === label);
      return nodes(field).find(n => n.type === 'input'); },
    async select(selected = file) { this.find(n => n.type === 'input' && n.props.type === 'file').props.onChange({ target: { files: selected ? [selected] : [], value: '' } }); await settle(); },
    button(label) { return this.find(n => n.type === 'button' && text(n).trim() === label); },
  };
}
test('compiler selection automatically populates and locks identity before upload, preserves settings and submits metadata', async () => {
  const ui = harness(); await ui.select();
  assert.equal(ui.field('Module ID').props.value, '1558'); assert.equal(ui.field('Module ID').props.readOnly, true);
  assert.equal(ui.field('Name').props.value, metadata.module_title); assert.equal(ui.field('Name').props.readOnly, true);
  assert.deepEqual(ui.calls.map(c => c[0]), ['inspect']);
  await ui.button('Upload ZIP').props.onClick();
  assert.deepEqual(ui.calls.map(c => c[0]), ['inspect', 'availability', 'presign', 's3']);
  assert.equal(ui.calls.find(c => c[0] === 's3')[3], 'new-id');
  await ui.button('Create Module').props.onClick();
  const payload = ui.calls.find(c => c[0] === 'create')[1];
  assert.equal(payload.module_id, '1558'); assert.equal(payload.name, metadata.module_title);
  assert.equal(payload.has_quiz, true); assert.equal(payload.credit_type, 'cme'); assert.equal(payload.cme_credits, 5);
  assert.equal(ui.navigations.length, 1);
});
test('legacy Storyline ZIP preserves manual ID/name entry and original upload sequence', async () => {
  const ui = harness(false, { inspectModulePackage: async () => null }); await ui.select();
  assert.equal(ui.field('Module ID').props.readOnly, false); assert.equal(ui.field('Name').props.readOnly, false);
  ui.field('Module ID').props.onChange({ target: { value: 'old-id' } }); ui.field('Name').props.onChange({ target: { value: 'Legacy title' } });
  await ui.button('Upload ZIP').props.onClick(); await ui.button('Create Module').props.onClick();
  assert.equal(ui.calls.find(c => c[0] === 'create')[1].module_id, 'old-id');
});
test('invalid manifest and duplicate compiler ID errors prevent S3 upload', async () => {
  for (const message of ['Invalid compiler module.json', 'A module with this external Module ID already exists.']) {
    const ui = harness(false, { inspectModulePackage: async () => { throw new Error(message); } });
    await ui.select(); assert.ok(text(ui.render()).includes(message)); assert.equal(ui.button('Upload ZIP').props.disabled, true);
    assert.ok(!ui.calls.some(c => c[0] === 's3'));
  }
});
test('manual duplicate ID check prevents presigning and upload', async () => {
  const ui = harness(false, { inspectModulePackage: async () => null,
    checkModuleIdAvailable: async () => { throw new Error('Duplicate Module ID'); } });
  await ui.select(); await ui.button('Upload ZIP').props.onClick();
  assert.ok(text(ui.render()).includes('Duplicate Module ID')); assert.ok(!ui.calls.some(c => c[0] === 'presign'));
});
test('stale file inspection cannot overwrite a newer selection or reenable upload', async () => {
  let resolve;
  const ui = harness(false, { inspectModulePackage: () => new Promise(done => { resolve = done; }) });
  await ui.select(); assert.equal(ui.button('Inspecting ZIP...').props.disabled, true);
  await ui.select({ ...file, name: 'bad.txt' }); resolve(metadata); await settle();
  assert.equal(ui.field('Module ID').props.value, ''); assert.equal(ui.button('Upload ZIP').props.disabled, true);
});
test('switching from compiler to legacy clears generated identity and restores manual entry', async () => {
  let compiler = true;
  const ui = harness(false, { inspectModulePackage: async () => compiler ? metadata : null });
  await ui.select(); compiler = false; await ui.select({ ...file, name: 'legacy.zip' });
  assert.equal(ui.field('Module ID').props.value, ''); assert.equal(ui.field('Name').props.value, '');
  assert.equal(ui.field('Name').props.readOnly, false);
});
test('existing compiler package locks ID and title without disabling other module settings', () => {
  const ui = harness(true, {}, true);
  const inputs = nodes(ui.render()).filter(n => n.type === 'input');
  assert.equal(inputs.find(n => n.props.value === '1558').props.readOnly, true);
  assert.equal(inputs.find(n => n.props.value === metadata.module_title).props.readOnly, true);
  assert.ok(!ui.button('Save Changes').props.disabled);
});
test('replacement validates against saved identity and rejects different IDs or titles before S3', async () => {
  for (const changed of [{ ...metadata, module_id: 'wrong' }, { ...metadata, module_title: 'wrong' }]) {
    const ui = harness(true, { inspectModulePackage: async () => changed }); await ui.select();
    assert.equal(ui.button('Replace ZIP').props.disabled, true);
    assert.ok(text(ui.render()).includes('must match')); assert.ok(!ui.calls.some(c => c[0] === 's3'));
    assert.equal(ui.state[0].module_id, '1558'); assert.equal(ui.state[0].name, metadata.module_title);
  }
});
test('replacement inspection blocks saving until identity validation finishes', async () => {
  let resolve;
  const ui = harness(true, { inspectModulePackage: () => new Promise(done => { resolve = done; }) });
  await ui.select();
  assert.equal(ui.button('Save Changes').props.disabled, true);
  assert.equal(ui.button('Inspecting ZIP...').props.disabled, true);
  resolve(metadata); await settle();
  assert.equal(ui.button('Save Changes').props.disabled, false);
  assert.equal(ui.button('Replace ZIP').props.disabled, false);
});
for (const compiler of [true, false]) {
  test(`replacement retains upload/confirm/refresh ordering and unsaved-edit confirmation (compiler: ${compiler})`, async () => {
    const ui = harness(true, { inspectModulePackage: async () => compiler ? metadata : null });
    await ui.select(); ui.state[0].description = 'Unsaved';
    await ui.button('Replace ZIP').props.onClick();
    assert.deepEqual(ui.calls.map(c => c[0]), ['presign', 's3', 'confirm', 'refresh']);
    assert.equal(ui.confirmations.length, 1); assert.match(ui.confirmations[0], /unsaved/);
    assert.equal(ui.state[0].module_id, '1558'); assert.equal(ui.state[0].name, metadata.module_title);
  });
}
test('failed backend replacement confirmation retains the existing record and reports the error', async () => {
  const ui = harness(true, { confirmModuleReplacement: async () => { throw new Error('Replacement identity mismatch'); } });
  await ui.select(); await ui.button('Replace ZIP').props.onClick();
  assert.ok(text(ui.render()).includes('Replacement identity mismatch'));
  assert.equal(ui.state[0].downloadLink, record.downloadLink); assert.ok(!ui.calls.some(c => c[0] === 'refresh'));
});
test('ZIP inspection API sends multipart with bearer token and persisted replacement target', async () => {
  let request;
  const api = load('src/api/moduleApi.ts', {
    '../utils/auth': { default: { getToken: () => 'token' } }, '../utils/globalVariables': { apiPrefix: '/local' },
  }, { fetch: async (url, options) => { request = { url, ...options }; return { ok: true, json: async () => ({ metadata }) }; } });
  assert.deepEqual(await api.inspectModulePackage(new Blob(['zip']), 5), metadata);
  assert.equal(request.url, '/local/api/admin/modules/inspect-package'); assert.equal(request.method, 'POST');
  assert.equal(request.headers.Authorization, 'Bearer token'); assert.equal(request.headers['Content-Type'], undefined);
  assert.equal(request.body.get('moduleId'), '5');
});
