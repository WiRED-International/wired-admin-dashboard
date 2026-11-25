const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function nodes(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(nodes);
  return [node, ...nodes(node.props?.children)];
}

function page(reducedMotion) {
  const records = [
    { id: 1, name: 'First Organization', countries: [{ id: 8, name: 'Kenya' }] },
    { id: 2, name: 'Second Organization', countries: [] },
  ];
  const hooks = [], pendingEffects = [], events = [];
  let cursor, tree;
  const changed = (previous, next) => !previous || next.some((value, i) => !Object.is(value, previous[i]));
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!hooks[index]) hooks[index] = { value: index === 0 ? records : initial };
      return [hooks[index].value, next => {
        hooks[index].value = typeof next === 'function' ? next(hooks[index].value) : next;
      }];
    },
    useRef(initial) { return hooks[cursor++] ??= { current: initial }; },
    useMemo(fn, deps) {
      const index = cursor++;
      if (changed(hooks[index]?.deps, deps)) hooks[index] = { deps, value: fn() };
      return hooks[index].value;
    },
    useCallback(fn, deps) { return react.useMemo(() => fn, deps); },
    useEffect(fn, deps) {
      const index = cursor++;
      if (changed(hooks[index]?.deps, deps)) pendingEffects.push(fn);
      hooks[index] = { deps };
    },
  };
  const imports = {
    react,
    '../api/organizationsAPI': { fetchPaginatedAdminOrganizations: async () => ({
      organizations: records, pagination: { page: 1, total: 2, totalPages: 1 },
    }) },
    '../api/countriesAPI': { fetchAllCountries: async () => [{ id: 8, name: 'Kenya' }] },
    '../api/usersAPI': { fetchAdminUsers: async () => [] },
    '../api/adminPermissionsAPI': { fetchAdminPermissionsByOrganization: async () => [] },
  };
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname,
    '../src/pages/OrganizationsPage.tsx'), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { exports, console,
    window: { matchMedia: query => {
      assert.equal(query, '(prefers-reduced-motion: reduce)');
      return { matches: reducedMotion };
    } },
    require: id => Object.hasOwn(imports, id) ? imports[id] : require(id),
  });
  function render() {
    cursor = 0;
    tree = exports.default();
    for (const node of nodes(tree)) {
      if (!node.ref) continue;
      node.ref.current = {
        focus: options => events.push({ type: 'focus', options, value: node.props.value }),
        scrollIntoView: options => events.push({ type: 'scroll', options,
          margin: node.props.style.scrollMarginTop }),
      };
    }
    for (const effect of pendingEffects.splice(0)) effect();
  }
  return {
    events, render,
    async initialize() { render(); await new Promise(setImmediate); render(); },
    edit(index) {
      return nodes(tree).filter(node => node.type === 'button' && node.props.children === 'Edit')[index]
        .props.onClick();
    },
    changeName(value) {
      nodes(tree).find(node => node.type === 'input' && node.ref)
        .props.onChange({ target: { value } });
    },
    name: () => nodes(tree).find(node => node.type === 'input' && node.ref)?.props.value,
    checkedCountries: () => nodes(tree).filter(node => node.type === 'input' &&
      node.props.type === 'checkbox' && node.props.checked).length,
  };
}

for (const reducedMotion of [false, true]) {
  test(`Edit scrolls after form state is rendered (reduced motion: ${reducedMotion})`, async () => {
    const ui = page(reducedMotion);
    await ui.initialize();
    assert.equal(ui.events.length, 0);
    const loading = ui.edit(0);
    assert.equal(ui.events.length, 0, 'does not scroll before the form commits');
    ui.render();
    await loading;
    assert.equal(ui.name(), 'First Organization');
    assert.equal(ui.checkedCountries(), 1);
    assert.equal(ui.events[0].type, 'focus');
    assert.equal(ui.events[0].options.preventScroll, true);
    assert.equal(ui.events[0].value, 'First Organization');
    assert.equal(ui.events[1].options.behavior, reducedMotion ? 'instant' : 'smooth');
    assert.equal(ui.events[1].options.block, 'start');
    assert.equal(ui.events[1].margin, '96px');

    ui.changeName('Unsaved name');
    ui.render();
    assert.equal(ui.name(), 'Unsaved name');
    assert.equal(ui.events.length, 2, 'typing and permission loading do not scroll again');

    await ui.edit(0);
    ui.render();
    assert.equal(ui.events.length, 4, 'clicking Edit again on the same organization scrolls again');
    await ui.edit(1);
    ui.render();
    assert.equal(ui.name(), 'Second Organization');
    assert.equal(ui.checkedCountries(), 0);
    assert.equal(ui.events.length, 6);
    assert.equal(ui.events[4].value, 'Second Organization');
  });
}
