const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function sidebar(collapsed, role) {
  const exports = {};
  const imports = {
    'react-router-dom': { Link: 'a', useLocation: () => ({ pathname: '/classes' }) },
    '../globalStyles': { globalStyles: { colors: {} } },
    '../utils/auth': { __esModule: true, default: {
      isSuperAdmin: () => role === 'superAdmin', isInstructor: () => role === 'instructor',
    } },
    '../context/AuthContext': { useAuth: () => ({ setIsAuthenticated() {} }) },
  };
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../src/layout/Sidebar.tsx'), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { exports, require: id => Object.hasOwn(imports, id) ? imports[id] : require(id) });
  return exports.default({ collapsed, onToggle() {} });
}

for (const collapsed of [false, true]) {
  for (const role of ['superAdmin', 'admin', 'instructor']) {
    test(`sidebar navigation scrolls independently (${role}, collapsed: ${collapsed})`, () => {
      const tree = sidebar(collapsed, role);
      const [header, nav, footer] = tree.props.children;
      assert.equal(tree.props.style.height, '100vh');
      assert.equal(tree.props.style.overflow, 'hidden');
      assert.equal(tree.props.style.width, collapsed ? '64px' : '220px');
      assert.equal(header.props.style.flexShrink, 0);
      assert.equal(footer.props.style.flexShrink, 0);
      assert.equal(nav.type, 'nav');
      assert.equal(nav.props.style.flex, 1);
      assert.equal(nav.props.style.minHeight, 0);
      assert.equal(nav.props.style.overflowY, 'auto');
      assert.equal(nav.props.style.overflowX, 'hidden');
      assert.equal(nav.props.tabIndex, 0);
      assert.equal(nav.props['aria-label'], 'Sidebar navigation');
      const links = nav.props.children;
      for (const link of links) assert.equal(link.props.style.flexShrink, 0);
      assert.deepEqual(Array.from(links, link => link.props.to), role === 'superAdmin'
        ? ['/downloads/map', '/userview', '/classes', '/admin/organizations', '/admin/locations',
          '/admin/modules', '/admin/announcements', '/admin/categories', '/credentials', '/exams']
        : role === 'instructor' ? ['/userview', '/classes', '/exams'] : ['/userview', '/classes']);
    });
  }
}
