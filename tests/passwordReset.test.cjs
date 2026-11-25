const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadAuth(mode, fetch) {
  // Evaluate the actual shared prefix with Vite's mode substituted.
  const prefixSource = fs.readFileSync(path.resolve(__dirname, '../src/utils/globalVariables.ts'), 'utf8')
    .replaceAll('import.meta.env.MODE', JSON.stringify(mode));
  const prefixExports = {};
  vm.runInNewContext(ts.transpileModule(prefixSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, { exports: prefixExports });
  const source = fs.readFileSync(path.resolve(__dirname, '../src/api/authAPI.ts'), 'utf8');
  const exports = {};
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, {
    exports,
    require: id => {
      assert.equal(id, '../utils/globalVariables');
      return prefixExports;
    },
    fetch,
    console: { error() {} },
  });
  return exports;
}

function response(ok, data, contentType = 'application/json') {
  return { ok, headers: { get: () => contentType }, json: async () => data };
}

for (const [mode, prefix] of [['production', '/apiv2/'], ['development', '']]) {
  test(`${mode}: auth requests use the shared prefix and preserve their payloads`, async () => {
    const requests = [];
    const api = loadAuth(mode, async (url, options) => {
      requests.push({ url, ...options });
      return response(true, { message: 'Success' });
    });
    const user = { email: 'test@example.com', password: 'test-password' };
    await api.login(user);
    await api.sendPasswordResetEmail(user.email);
    const result = await api.resetPassword('test-token', user.password);
    assert.equal(result.message, 'Success');
    assert.deepEqual(requests.map(request => request.url), [
      `${prefix}auth/login`, `${prefix}auth/forgot-password`, `${prefix || '/'}auth/reset-password`,
    ]);
    assert.deepEqual(requests.map(request => JSON.parse(request.body)), [
      user, { email: user.email }, { token: 'test-token', password: user.password },
    ]);
    for (const request of requests) {
      assert.equal(request.method, 'POST');
      assert.equal(request.headers['Content-Type'], 'application/json');
    }
    const resolved = new URL(requests[2].url, 'https://widm.wiredhealthresources.net/reset-password/test-token');
    assert.equal(resolved.pathname, `${prefix || '/'}auth/reset-password`);
  });
}

test('reset preserves JSON validation errors and rejects HTML responses', async () => {
  const validation = loadAuth('production', async () => response(false, { message: 'Invalid reset token' }));
  await assert.rejects(validation.resetPassword('test-token', 'test-password'), /Invalid reset token/);
  const html = loadAuth('production', async () => response(false, null, 'text/html'));
  await assert.rejects(html.resetPassword('test-token', 'test-password'), /Server returned an invalid response\./);
});
