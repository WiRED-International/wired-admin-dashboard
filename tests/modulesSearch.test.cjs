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

function searchPage(records) {
  const state = [records, false];
  let cursor;
  const code = ts.transpileModule(fs.readFileSync(
    path.resolve(__dirname, '../src/pages/ModulesPage.tsx'), 'utf8'
  ), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  const imports = {
    react: {
      useEffect: () => {},
      useState: initial => {
        const index = cursor++;
        if (!(index in state)) state[index] = initial;
        return [state[index], next => { state[index] = next; }];
      },
    },
    'react-router-dom': { useNavigate: () => () => {}, useLocation: () => ({}) },
    '../api/moduleApi': {},
  };
  vm.runInNewContext(code, { exports,
    require: id => Object.hasOwn(imports, id) ? imports[id] : require(id) });
  function render() { cursor = 0; return exports.default(); }
  return query => {
    const input = nodes(render()).find(node => node.type === 'input' &&
      node.props.placeholder === 'Search by module name or ID...');
    input.props.onChange({ target: { value: query } });
    const tree = render();
    assert.equal(nodes(tree).find(node => node.type === 'input').props.value, query);
    return nodes(tree).filter(node => node.type === 'tr' && node.key != null)
      .map(node => Number(node.key));
  };
}

test('typing searches numeric, string, null and missing module IDs without crashing', () => {
  const search = searchPage([
    { id: 1, name: 'Numeric', module_id: 12345 },
    { id: 2, name: 'String', module_id: 'AbC-123' },
    { id: 3, name: 'Null ID', module_id: null },
    { id: 4, name: 'Missing ID' },
    { id: 5, name: 'Zero', module_id: 0 },
  ]);
  for (const [query, expected] of [
    ['1', [1, 2]], ['12', [1, 2]], ['1234', [1]],
    ['  aBc-123  ', [2]], ['0', [5]], ['NULL ID', [3]],
    ['missing', [4]], ['numeric', [1]], ['unmatched', []],
    ['null', [3]], ['undefined', []], ['', [4, 3, 1, 2, 5]],
    ['   ', [4, 3, 1, 2, 5]],
  ]) {
    assert.deepEqual(search(query), expected, `search: ${JSON.stringify(query)}`);
  }
});
