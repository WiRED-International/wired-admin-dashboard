// Render the actual importer components with synthetic state and no network access.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '../..');

function load(file, imports = {}) {
  const exports = {};
  const output = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(output, { exports,
    require: id => Object.hasOwn(imports, id) ? imports[id] : require(id),
    crypto: require('node:crypto').webcrypto, AbortController,
    window: { sessionStorage: { getItem: () => null } },
  });
  return exports;
}

function importLayoutFixture() {
  const util = load('src/utils/examTemplateImport.ts');
  const draftUtil = load('src/utils/examTemplateImportDraft.ts');
  const saveUtil = load('src/utils/examTemplateImportSave.ts', {
    '@/utils/examTemplateImportDraft': draftUtil, '@/utils/examTemplateImport': util,
  });
  const editor = load('src/components/Exams/ImportQuestionEditor.tsx', { '@/utils/examTemplateImportDraft': draftUtil });
  const longText = 'LongUnbrokenExamContent'.repeat(12);
  const preview = { title: 'Basic Training Final Exam', valid: true, errors: [],
    warnings: [{ code: 'EXPLANATION_IGNORED' }, { code: 'REVIEW_TITLE', message: longText }],
    questions: [
      { question_text: `Which actions prevent infection? ${longText}`, question_type: 'multiple',
        options: { a: `Wash hands ${longText}`, b: 'Share utensils', c: 'Cover coughs', d: 'Avoid cleaning' },
        correct_answers: ['a', 'c'], order: 1, source: { table: 1, row: 2 }, errors: [], warnings: [{ code: 'EXPLANATION_IGNORED' }] },
      { question_text: 'Clean drinking water is essential for good health.', question_type: 'true_false',
        options: { a: 'True', b: 'False' }, correct_answers: ['a'], order: 2, source: { table: 1, row: 3 }, errors: [], warnings: [] },
    ] };
  const draft = draftUtil.changeImportExamType(draftUtil.createImportDraft(preview, 'layout-fixture'), 'basic_qualifying');
  const state = [{ name: `${longText}.docx`, size: 18264 }, preview, null, false, 0, false, null, draft, true];
  let cursor = 0;
  const imports = {
    react: { ...React,
      useState: value => { const index = cursor++; return [index < state.length ? state[index] : typeof value === 'function' ? value() : value, () => {}]; },
      useRef: value => { cursor++; return { current: value }; }, useEffect: () => {},
    },
    'react-router-dom': { Link: ({ to, children, ...props }) => React.createElement('a', { href: to, ...props }, children), Navigate: () => null, useNavigate: () => () => {} },
    '@/utils/auth': { __esModule: true, default: { isSuperAdmin: () => true, getProfile: () => ({ sub: 'layout-fixture' }) } },
    '@/api/examTemplatesAPI': {}, '@/utils/examTemplateImport': util,
    '@/utils/examTemplateImportDraft': draftUtil, '@/utils/examTemplateImportSave': saveUtil,
    '@/components/Exams/ImportQuestionEditor': { __esModule: true, default: editor.default },
    './ExamTemplateImportPage.css': {},
  };
  for (const name of ['PageContainer', 'PageHeader', 'Panel', 'Button']) {
    imports[`@/components/ui/${name}`] = { __esModule: true, default: load(`src/components/ui/${name}.tsx`).default };
  }
  const page = load('src/pages/ExamTemplateImportPage.tsx', imports);
  const templatePage = load('src/pages/ExamTemplatesPage.tsx', {
    ...imports, './ExamTemplatesPage.css': {},
    react: { ...React, useEffect() {}, useState: value => [value === true ? false : value, () => {}] },
  });
  function findActions(node) {
    if (!node || typeof node !== 'object') return null;
    if (Array.isArray(node)) return node.map(findActions).find(Boolean);
    if (node.props?.className === 'exam-template-actions') return node;
    return findActions(node.props?.children);
  }
  const actions = renderToStaticMarkup(findActions(templatePage.default()));
  const markup = renderToStaticMarkup(page.default()).replace(/<details /g, '<details open ')
    .replace('<div class="exam-import">', '<div class="exam-import">' + actions);
  const font = fs.readFileSync(path.join(root, 'node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2')).toString('base64');
  const css = fs.readFileSync(path.join(root, 'src/pages/ExamTemplateImportPage.css'), 'utf8')
    + fs.readFileSync(path.join(root, 'src/pages/ExamTemplatesPage.css'), 'utf8');
  // Embed CSS after host rules, as in the existing isolated preview. A BOM in
  // the middle of a stylesheet must not invalidate the importer's root selector.
  return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    + `<style>@font-face{font-family:Inter;src:url(data:font/woff2;base64,${font})}body{margin:0;background:#f1f5f9}${css}</style>`
    + `</head><body>${markup}</body></html>`;
}

module.exports = { importLayoutFixture };
