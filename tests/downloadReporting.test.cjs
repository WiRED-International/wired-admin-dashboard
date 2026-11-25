const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, imports = {}, globals = {}, fallback) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code.replace(/import\.meta\.env\.MODE/g, JSON.stringify("development")), { exports, URLSearchParams, AbortController, Error,
    require: id => Object.hasOwn(imports, id) ? imports[id] : fallback ? fallback(id) : require(id), ...globals });
  return exports;
}
const utils = load('src/utils/downloadReporting.ts');
const comparisons = load('src/utils/downloadComparisons.ts', { '@/utils/downloadReporting': utils });
const blank = () => utils.readDownloadFilters(new URLSearchParams());
const country = { id: 7, code: 'KE', name: 'Kenya', resolved: true };
const group = { event_type: 'module', country, module: { id: 1, title: 'Infection prevention' }, package: null, reported_download_events: 12 };
const summary = { metric: 'reported_download_events', period: { timezone: 'UTC', start_inclusive: null, end_exclusive: null },
  total_records: 15, unknown_country_events: 3, missing_coordinate_events: 2,
  groups: [group, { ...group, country: { id: null, code: 'ZZ', name: null, resolved: false }, reported_download_events: 3 }] };
const events = { metric: 'reported_download_events', period: summary.period, total_records: 51, page: 1, page_size: 25, total_pages: 3,
  records: [{ ...group, id: 10, download_date: 1704067200 }] };
const defaults = {
  '@/utils/downloadReporting': utils,
  '@/utils/downloadComparisons': comparisons,
  '@/components/ui/PageContainer': { default: 'main', __esModule: true },
  '@/components/ui/PageHeader': { default: 'header', __esModule: true },
  '@/components/ui/Button': { default: 'button', __esModule: true },
  '@/components/Downloads/DownloadsNavigation': { default: 'nav', __esModule: true },
  '@/components/Downloads/DownloadsFilters': { default: 'filters', __esModule: true },
  '@/components/Downloads/DownloadEventsTable': { default: 'event-details', __esModule: true },
  './Downloads.css': {},
};
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
function harness(file, imports = {}, { query = '', role = 3, props = {} } = {}) {
  const state = [], effects = [], tasks = [];
  let cursor = 0, params = new URLSearchParams(query);
  const page = load(file, { ...defaults,
    react: {
      useState(initial) { const index = cursor++; if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
        return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }]; },
      useEffect(callback, deps) { const index = cursor++; const previous = effects[index];
        if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i]))) {
          effects[index] = { deps, cleanup: previous?.cleanup };
          tasks.push(() => { previous?.cleanup?.(); effects[index].cleanup = callback(); });
        } },
      useCallback: callback => callback,
    },
    'react-router-dom': { Navigate: 'redirect', NavLink: 'a', useSearchParams: () => [params, value => { params = new URLSearchParams(value); }] },
    '@/utils/auth': { default: { isSuperAdmin: () => role === 3 }, __esModule: true },
    ...imports,
  });
  function render() { cursor = 0; const tree = page.default(props); while (tasks.length) tasks.shift()(); return tree; }
  function find(predicate) { const node = nodes(render()).find(predicate); assert.ok(node, 'Expected node'); return node; }
  return { render, find, text: () => text(render()), nodes: () => nodes(render()), query: () => params.toString(),
    setQuery(query) { params = new URLSearchParams(query); },
    async settle() { render(); await new Promise(resolve => setImmediate(resolve)); return render(); },
    click(label) { const button = find(node => node.type === 'button' && text(node) === label); assert.ok(!button.props.disabled); return button.props.onClick(); },
    cleanup() { effects.forEach(effect => effect?.cleanup?.()); },
  };
}

test('UTC filters preserve inclusive days, validate strict dates and allowlist reporting parameters', () => {
  const filters = utils.readDownloadFilters(new URLSearchParams('start_date=2026-11-01&end_date=2026-11-01&country_code=ke&module_id=2&package_id=3&latitude=40&user_id=1'));
  assert.equal(utils.validateDownloadFilters(filters), null);
  const params = utils.downloadFilterParams(filters);
  assert.equal(params.get('country_code'), 'KE');
  assert.equal(params.get('latitude'), null); assert.equal(params.get('user_id'), null);
  const map = new URLSearchParams(utils.downloadMapQuery(filters));
  assert.equal(Number(map.get('end_date')) - Number(map.get('start_date')), 86399);
  assert.equal(new Date(Number(map.get('start_date')) * 1000).toISOString(), '2026-11-01T00:00:00.000Z');
  for (const date of ['2026-02-30', '2026-2-01', '1700000000']) assert.match(utils.validateDownloadFilters({ ...blank(), start_date: date }), /UTC dates/);
  assert.match(utils.validateDownloadFilters({ ...blank(), start_date: '2026-11-02', end_date: '2026-11-01' }), /after/);
  assert.match(utils.validateDownloadFilters({ ...blank(), module_id: '0' }), /positive/);
  assert.match(utils.validateDownloadFilters({ ...blank(), package_id: '2147483648' }), /positive/);
});

test('report labels preserve unresolved geography, deleted resources and combined groups without double counting', () => {
  assert.equal(utils.reportCountryLabel(summary.groups[1].country), 'Unresolved country (ZZ)');
  assert.equal(utils.reportTitle({ ...group, module: { id: 1, title: null } }), 'Unavailable module (ID 1)');
  assert.equal(utils.reportTitle({ ...group, module: null }), 'Unattributed resource');
  assert.equal(utils.summaryStatistics(summary).countries, 1);
  assert.equal(utils.summaryStatistics(summary).resources, 1);
  assert.equal(utils.reportTitle({ ...group, package: { id: 2, title: 'Health pack' } }), 'Infection prevention / Health pack');
});

test('authenticated reporting APIs use absolute deployment URLs, allowed filters and backend pagination', async () => {
  for (const prefix of ['', '/apiv2/']) {
    const calls = [];
    const api = load('src/api/downloadReportsAPI.ts', {
      '@/utils/auth': { default: { getToken: () => 'test-token', isSuperAdmin: () => true }, __esModule: true },
      '@/utils/globalVariables': { apiPrefix: prefix }, '@/utils/downloadReporting': utils,
    }, { fetch: async (...args) => { calls.push(args); return { ok: true, json: async () => args[0].includes('/summary') ? summary : events }; } });
    const filters = { ...blank(), start_date: '2026-11-01', country_code: 'KE', module_id: '1', package_id: '2', latitude: '20' };
    const controller = new AbortController();
    await api.fetchDownloadSummary(filters, 'country', 'ASC', controller.signal);
    await api.fetchDownloadEvents(filters, 2, 25, 'download_date', 'DESC', controller.signal);
    assert.ok(calls[0][0].startsWith(prefix === '' ? '/api/downloads/report/summary?' : '/apiv2/api/downloads/report/summary?'));
    assert.equal(calls[0][1].headers.Authorization, 'Bearer test-token');
    assert.equal(calls[0][1].cache, 'no-store'); assert.equal(calls[0][1].signal, controller.signal);
    const query = new URL(calls[1][0], 'https://example.invalid').searchParams;
    assert.equal(query.get('start_date'), '2026-11-01'); assert.equal(query.get('page'), '2'); assert.equal(query.get('page_size'), '25');
    assert.equal(query.get('latitude'), null); assert.equal(query.get('sort_dir'), 'DESC');
  }
});

test('report API denies non-super-admin calls and gives clear auth, server and contract errors', async () => {
  for (const role of [1, 2, 4]) {
    let called = false;
    const api = load('src/api/downloadReportsAPI.ts', {
      '@/utils/auth': { default: { isSuperAdmin: () => role === 3 }, __esModule: true },
      '@/utils/globalVariables': { apiPrefix: '' }, '@/utils/downloadReporting': utils,
    }, { fetch: () => { called = true; } });
    await assert.rejects(api.fetchDownloadSummary(blank()), /Super-admin/); assert.equal(called, false);
  }
  for (const [status, message] of [[401, /session/], [403, /Super-admin/], [400, /filters/], [500, /retry/], [200, /unexpected/]]) {
    const api = load('src/api/downloadReportsAPI.ts', {
      '@/utils/auth': { default: { isSuperAdmin: () => true, getToken: () => 'test' }, __esModule: true },
      '@/utils/globalVariables': { apiPrefix: '' }, '@/utils/downloadReporting': utils,
    }, { fetch: async () => ({ ok: status === 200, status, json: async () => ({}) }) });
    await assert.rejects(api.fetchDownloadSummary(blank()), message);
  }
});

test('Map/Table navigation retains only equivalent filters', () => {
  const ui = harness('src/components/Downloads/DownloadsNavigation.tsx', {}, { query: 'country_code=KE&module_id=1&start_date=2026-11-01&sort_by=count&latitude=30' });
  const links = ui.nodes().filter(node => node.type === 'a');
  assert.equal(links[0].props.to.pathname, '/downloads/map'); assert.equal(links[1].props.to.pathname, '/downloads/table');
  assert.equal(links[0].props.to.search, links[1].props.to.search);
  assert.ok(!links[0].props.to.search.includes('sort_by')); assert.ok(!links[0].props.to.search.includes('latitude'));
});

test('summary renders counts, titles, geography and loads individual events only explicitly', async () => {
  const calls = [];
  const ui = harness('src/pages/DownloadsTablePage.tsx', { '@/api/downloadReportsAPI': { fetchDownloadSummary: async (...args) => { calls.push(args); return summary; } } });
  assert.match(ui.text(), /Loading download summary/);
  await ui.settle();
  assert.match(ui.text(), /Total reported download events15/);
  assert.match(ui.text(), /Countries represented1/);
  assert.match(ui.text(), /Module\/package groups1/);
  assert.match(ui.text(), /Unknown-country events3/);
  assert.match(ui.text(), /Infection prevention/); assert.match(ui.text(), /Unresolved country \(ZZ\)/);
  assert.equal(ui.nodes().some(node => node.type === 'event-details'), false);
  ui.click('View individual events'); assert.ok(ui.nodes().some(node => node.type === 'event-details'));
  ui.click('Hide individual events'); assert.equal(ui.nodes().some(node => node.type === 'event-details'), false);
  assert.equal(calls.length, 1);
});

test('summary sorting, URL filters, empty results and retry states', async () => {
  let fail = false;
  const calls = [];
  const ui = harness('src/pages/DownloadsTablePage.tsx', { '@/api/downloadReportsAPI': { fetchDownloadSummary: async (...args) => {
    calls.push(args); if (fail) throw new Error('Report unavailable'); return { ...summary, total_records: 0, groups: [] };
  } } }, { query: 'country_code=KE' });
  await ui.settle(); assert.match(ui.text(), /No reported download events/);
  const sort = ui.find(node => node.type === 'select' && node.props.value === 'count');
  sort.props.onChange({ target: { value: 'country' } }); await ui.settle();
  assert.equal(calls.at(-1)[1], 'country'); assert.equal(calls.at(-1)[0].country_code, 'KE');
  ui.setQuery('country_code=US'); fail = true; await ui.settle();
  assert.match(ui.text(), /Report unavailable/); fail = false; ui.click('Retry summary'); await ui.settle();
  assert.match(ui.text(), /No reported download events/);
});

test('stale summary results are aborted and cannot overwrite new filters', async () => {
  const requests = [];
  const ui = harness('src/pages/DownloadsTablePage.tsx', { '@/api/downloadReportsAPI': { fetchDownloadSummary: (...args) => new Promise(resolve => requests.push({ args, resolve })) } }, { query: 'period=7d' });
  ui.render(); ui.setQuery('period=7d&country_code=KE'); ui.render();
  assert.equal(requests[0].args[3].aborted, true);
  assert.equal(requests[1].args[3].aborted, true);
  requests[2].resolve(summary); requests[3].resolve(summary); await ui.settle();
  requests[0].resolve({ ...summary, total_records: 999 }); requests[1].resolve({ ...summary, total_records: 999 }); await ui.settle();
  assert.match(ui.text(), /Total reported download events15/); assert.ok(!ui.text().includes('999'));
});

test('events use backend pagination and page sizes, UTC timestamps and safe fields', async () => {
  const calls = [];
  const ui = harness('src/components/Downloads/DownloadEventsTable.tsx', { '@/api/downloadReportsAPI': { fetchDownloadEvents: async (...args) => { calls.push(args); return { ...events, page: args[1], page_size: args[2] }; } } }, { props: { filterQuery: 'module_id=1' } });
  await ui.settle(); assert.match(ui.text(), /2024-01-01 00:00:00 UTC/);
  assert.match(ui.text(), /Page 1 of 3/); ui.click('Next events'); await ui.settle();
  assert.equal(calls.at(-1)[1], 2); assert.equal(calls.at(-1)[0].module_id, '1');
  ui.click('Previous events'); await ui.settle(); assert.equal(calls.at(-1)[1], 1);
  ui.find(node => node.type === 'select' && node.props.value === 25).props.onChange({ target: { value: '100' } });
  await ui.settle(); assert.equal(calls.at(-1)[2], 100); assert.equal(calls.at(-1)[1], 1);
  const headings = ui.nodes().filter(node => node.type === 'th').map(text).join(' ');
  assert.ok(!/profile|coordinate|latitude|longitude|email/i.test(headings));
});

test('events empty and error states support explicit retries', async () => {
  let fail = true;
  const ui = harness('src/components/Downloads/DownloadEventsTable.tsx', { '@/api/downloadReportsAPI': { fetchDownloadEvents: async () => {
    if (fail) throw new Error('Events unavailable'); return { ...events, total_records: 0, total_pages: 0, records: [] };
  } } }, { props: { filterQuery: '' } });
  await ui.settle(); assert.match(ui.text(), /Events unavailable/); fail = false;
  ui.click('Retry events'); await ui.settle(); assert.match(ui.text(), /No individual events/); assert.match(ui.text(), /Page 0 of 0/);
  assert.equal(ui.find(node => node.type === 'button' && text(node) === 'Next events').props.disabled, true);
});

test('filter controls validate dates and apply/reset only reporting query parameters', async () => {
  const ui = harness('src/components/Downloads/DownloadsFilters.tsx', {
    '@/api/modulesAPI': { fetchModuleAndPackageInfo: async () => ({ modules: [{ id: 1, name: 'Health' }], packages: [{ id: 2, name: 'Pack' }] }) },
    '@/utils/countryNames.json': [{ code: 'KE', name: 'Kenya' }],
  });
  await ui.settle();
  const fields = () => ui.nodes().filter(node => ['input', 'select'].includes(node.type));
  fields()[0].props.onChange({ target: { value: '2026-11-02' } }); fields()[1].props.onChange({ target: { value: '2026-11-01' } });
  ui.find(node => node.type === 'form').props.onSubmit({ preventDefault() {} }); assert.match(ui.text(), /after end date/); assert.equal(ui.query(), '');
  fields()[1].props.onChange({ target: { value: '2026-11-02' } }); fields()[2].props.onChange({ target: { value: 'KE' } });
  fields()[3].props.onChange({ target: { value: '1' } }); fields()[4].props.onChange({ target: { value: '2' } });
  ui.find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  const query = new URLSearchParams(ui.query()); assert.equal(query.get('start_date'), '2026-11-02'); assert.equal(query.get('end_date'), '2026-11-02');
  assert.equal(query.get('country_code'), 'KE'); assert.equal(query.get('module_id'), '1'); assert.equal(query.get('package_id'), '2');
  ui.click('Clear filters'); assert.equal(ui.query(), '');
});

test('Downloads routes require authentication and role 3; root redirects by role; sidebar is gated', () => {
  for (const role of [1, 2, 3, 4]) {
    let routes;
    const auth = { __esModule: true, default: { isSuperAdmin: () => role === 3, isInstructor: () => role === 4 } };
    const Entry = load('src/components/Downloads/DownloadsEntry.tsx', { '@/utils/auth': auth, 'react-router-dom': { Navigate: 'redirect' } }).default;
    load('src/main.tsx', {
      './components/Downloads/DownloadsEntry': { default: Entry, __esModule: true },
      'react-router-dom': { Navigate: 'redirect', createBrowserRouter: value => { routes = value; }, RouterProvider: 'router' },
      'react-dom/client': { default: { createRoot: () => ({ render() {} }) }, __esModule: true }, '@/utils/auth': auth,
    }, { document: { getElementById: () => null } }, id => id === 'react/jsx-runtime' ? require(id) : ({ default: 'component', __esModule: true }));
    const children = routes[0].children;
    const guard = load('src/components/ProtectedRoute.tsx', {
      'react-router-dom': { Navigate: 'redirect' }, '../context/AuthContext': { useAuth: () => ({ isAuthenticated: true }) },
    }).default;
    for (const route of children.filter(route => ['/downloads/map', '/downloads/table'].includes(route.path))) {
      assert.equal(route.element.props.allow(), role === 3);
      assert.equal(guard(route.element.props).type === 'redirect', role !== 3);
      const loggedOut = load('src/components/ProtectedRoute.tsx', { 'react-router-dom': { Navigate: 'redirect' }, '../context/AuthContext': { useAuth: () => ({ isAuthenticated: false }) } }).default;
      assert.equal(loggedOut(route.element.props).props.to, '/login');
    }
    assert.equal(children.find(route => route.index).element.props.children.type().props.to, role === 3 ? '/downloads/map' : '/userview');
    for (const pathname of ['/downloads/map', '/downloads/table']) {
      const sidebar = load('src/layout/Sidebar.tsx', {
        '../utils/auth': auth, '../context/AuthContext': { useAuth: () => ({ setIsAuthenticated() {} }) },
        '../globalStyles': { globalStyles: { colors: {} } },
        'react-router-dom': { Link: 'a', useLocation: () => ({ pathname }) },
      }).default({ collapsed: false, onToggle() {} });
      const link = nodes(sidebar).find(node => node.type === 'a' && text(node).includes('Downloads'));
      assert.equal(!!link, role === 3); if (link) assert.equal(link.props.style.backgroundColor, '#DBEAFE');
    }
  }
});

test('legacy map still receives markers, clusters and bounds, including when the script loads late', async () => {
  const markers = [{ id: 1, latitude: '1.2', longitude: '3.4', download_date: 1704067200, module: { name: 'Health' } }];
  const calls = [], fits = [];
  const ui = harness('src/pages/AdminDashboard.tsx', {
    '@/api/downloadsApi': { fetchDownloads: async (...args) => { calls.push(args); return markers; } },
    '@/api/googleAPIKey': { fetchGoogleAPIKey: async () => 'fixture-key' },
    '@/components/GoogleMap': { default: 'map', __esModule: true },
  }, { query: 'start_date=2026-11-01&end_date=2026-11-01&module_id=1' });
  await ui.settle(); const map = ui.find(node => node.type === 'map');
  assert.equal(map.props.downloads, markers); map.props.handleViewAllDownloads(); assert.equal(calls.length, 1);
  assert.equal(new URLSearchParams(calls[0][0]).get('module_id'), '1');
  class Bounds { extend(value) { fits.push(value); return this; } }
  // This isolated component requires the Google Maps namespace, never network access.
  const component = load('src/components/GoogleMap.tsx', {
    react: { useState: initial => [initial, () => {}], useRef: initial => ({ current: initial }), useCallback: callback => callback, useEffect() {} },
    '@react-google-maps/api': { GoogleMap: 'google-map', Marker: 'marker', MarkerClusterer: 'clusters', InfoWindow: 'info', useLoadScript: () => ({ isLoaded: true }) },
  }, { window: { google: { maps: { LatLngBounds: Bounds, LatLng: class { constructor(lat, lng) { this.lat = lat; this.lng = lng; } } } } } }).default(map.props);
  nodes(component).find(node => node.type === 'google-map').props.onLoad({ fitBounds: bounds => assert.ok(bounds instanceof Bounds) });
  assert.equal(fits.length, 1);
  const cluster = nodes(component).find(node => node.type === 'clusters'); assert.equal(cluster.props.options.maxZoom, 15); assert.equal(cluster.props.options.gridSize, 60);
  const marker = nodes(cluster.props.children('clusterer')).find(node => node.type === 'marker'); assert.equal(marker.props.position.lat, 1.2);

});

const os = require('node:os');
const { spawn } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const chrome = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '/usr/bin/chromium', '/usr/bin/google-chrome']
  .find(candidate => candidate && fs.existsSync(candidate));

test('Downloads table, filters and event details fit 900, 768, 390 and 360px with keyboard focus', {
  skip: chrome ? false : 'Headless Chrome unavailable', timeout: 30000,
}, async context => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'wired-downloads-layout-'));
  try {
    const params = new URLSearchParams('country_code=KE&module_id=1');
    const staticReact = { ...React, useEffect() {}, useState: initial => [typeof initial === 'function' ? initial() : initial, () => {}] };
    const router = { Navigate: () => null, useSearchParams: () => [params, () => {}],
      NavLink: ({ to, children }) => React.createElement('a', { href: to.pathname + '?' + to.search }, children) };
    const imports = { ...defaults, react: staticReact, 'react-router-dom': router,
      '@/utils/auth': { default: { isSuperAdmin: () => true }, __esModule: true },
      '@/api/downloadReportsAPI': {}, '@/api/modulesAPI': {},
      '@/utils/countryNames.json': [{ code: 'KE', name: 'Kenya' }],
    };
    for (const name of ['PageContainer', 'PageHeader', 'Button']) imports[`@/components/ui/${name}`] = { default: load(`src/components/ui/${name}.tsx`).default, __esModule: true };
    for (const name of ['DownloadsNavigation', 'DownloadsFilters']) imports[`@/components/Downloads/${name}`] = { default: load(`src/components/Downloads/${name}.tsx`, imports).default, __esModule: true };
    const longGroup = { ...group, module: { id: 1, title: 'LongUnbrokenModuleTitle'.repeat(12) } };
    const state = [{ ...summary, groups: [longGroup] }, null, false, 0, null, 1, { ...summary, groups: [] }, null, false]; let cursor = 0;
    const page = load('src/pages/DownloadsTablePage.tsx', { ...imports,
      react: { ...staticReact, useState: initial => { const index = cursor++; return [index < state.length ? state[index] : typeof initial === 'function' ? initial() : initial, () => {}]; } },
    }).default;
    const eventState = [1, 25, 'download_date', 'DESC', { ...events, records: [{ ...longGroup, id: 1, download_date: 1704067200 }] }, null, false, 0]; let eventCursor = 0;
    const EventPage = load('src/components/Downloads/DownloadEventsTable.tsx', { ...imports,
      react: { ...staticReact, useState: () => [eventState[eventCursor++], () => {}] },
    }).default;
    const markup = renderToStaticMarkup(page());
    const eventMarkup = renderToStaticMarkup(React.createElement(EventPage, { filterQuery: params.toString() }));
    const css = fs.readFileSync(path.join(__dirname, '../src/pages/Downloads.css'), 'utf8');
    const fixture = `<html><head><meta charset="utf-8"><style>body{margin:0}*{box-sizing:border-box}${css}</style></head><body><div style="display:flex"><aside style="width:64px;flex-shrink:0"></aside><main style="min-width:0;flex:1">${markup}<div class="downloads-page"><div style="padding:16px"><div class="downloads">${eventMarkup}</div></div></div></main></div></body></html>`;
    const script = `Promise.all([900,768,390,360].flatMap(width=>[64,220].map(sidebar=>new Promise(resolve=>{
      const frame=document.createElement('iframe');frame.style.cssText='border:0;width:'+width+'px;height:2400px';
      frame.onload=()=>{const doc=frame.contentDocument,win=frame.contentWindow;
        const input=doc.querySelector('input');input.focus();
        const overflow=[...doc.querySelectorAll('.downloads-filters,.downloads-stat,.downloads-toolbar,.downloads-navigation,.downloads-table-scroll,.downloads-period-bar')].filter(el=>el.getBoundingClientRect().right>win.innerWidth+1).map(el=>el.className);
        resolve({width,sidebar,scroll:doc.documentElement.scrollWidth,viewport:doc.documentElement.clientWidth,overflow,focus:doc.activeElement===input&&win.getComputedStyle(input).outlineStyle!=='none',tables:doc.querySelectorAll('table').length});};
      frame.srcdoc=${JSON.stringify(fixture)}.replace("width:64px", "width:"+sidebar+"px");document.body.append(frame);
    })))).then(results=>{const node=document.createElement('pre');node.id='results';node.dataset.results=btoa(JSON.stringify(results));document.body.append(node);});`;
    const target = path.join(temp, 'layout.html');
    fs.writeFileSync(target, `<html><body><script>${script}</script></body></html>`);
    const output = await new Promise((resolve, reject) => {
      const child = spawn(chrome, ['--headless', '--no-first-run', '--disable-extensions', `--user-data-dir=${path.join(temp, 'profile')}`, '--dump-dom', '--virtual-time-budget=4000', pathToFileURL(target).href], { windowsHide: true, signal: context.signal });
      let stdout = '', stderr = ''; child.stdout.on('data', data => { stdout += data; }); child.stderr.on('data', data => { stderr += data; });
      child.on('error', reject); child.on('close', code => code === 0 ? resolve(stdout) : reject(new Error(stderr.slice(-1000))));
    });
    const match = output.match(/id="results" data-results="([^"]+)"/); assert.ok(match, 'Expected browser measurements');
    const results = JSON.parse(Buffer.from(match[1], 'base64').toString());
    console.log('Downloads responsive measurements:', JSON.stringify(results));
    for (const result of results) { assert.equal(result.scroll, result.viewport, JSON.stringify(result)); assert.deepEqual(result.overflow, []); assert.ok(result.focus); assert.equal(result.tables, 2); }
  } finally {
    assert.ok(path.resolve(temp).startsWith(path.resolve(os.tmpdir()) + path.sep));
    fs.rmSync(temp, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});

test('both Downloads pages defend against direct non-super-admin rendering without issuing requests', async () => {
  for (const role of [1, 2, 4]) {
    let requests = 0;
    const api = { fetchDownloadSummary() { requests++; }, fetchDownloads() { requests++; }, fetchGoogleAPIKey() { requests++; } };
    for (const file of ['src/pages/DownloadsTablePage.tsx', 'src/pages/AdminDashboard.tsx']) {
      const ui = harness(file, { '@/api/downloadReportsAPI': api, '@/api/downloadsApi': api, '@/api/googleAPIKey': api,
        '@/components/GoogleMap': { default: 'map', __esModule: true } }, { role });
      assert.equal((await ui.settle()).type, 'redirect');
    }
    assert.equal(requests, 0);
  }
});

test('home redirect resolves the current role after login rather than router initialization', () => {
  let role = null, routes;
  const auth = { default: { isSuperAdmin: () => role === 3 }, __esModule: true };
  const Entry = load('src/components/Downloads/DownloadsEntry.tsx', { '@/utils/auth': auth, 'react-router-dom': { Navigate: 'redirect' } }).default;
  load('src/main.tsx', {
    './components/Downloads/DownloadsEntry': { default: Entry, __esModule: true },
    'react-router-dom': { Navigate: 'redirect', createBrowserRouter: value => { routes = value; }, RouterProvider: 'router' },
    'react-dom/client': { default: { createRoot: () => ({ render() {} }) }, __esModule: true },
    '@/utils/auth': { default: { isSuperAdmin: () => role === 3 }, __esModule: true },
  }, { document: { getElementById: () => null } }, id => id === 'react/jsx-runtime' ? require(id) : ({ default: 'component', __esModule: true }));
  const entry = routes[0].children.find(route => route.index).element.props.children.type;
  role = 3; assert.equal(entry().props.to, '/downloads/map');
  role = 2; assert.equal(entry().props.to, '/userview');
});

test('map and lookup helpers stay root-relative on development and deployed nested routes', async () => {
  for (const prefix of ['', '/apiv2/']) {
    const calls = [];
    const globals = { fetch: async (url, options) => { calls.push({ url, options }); return { ok: true, headers: { get: () => 'application/json' }, json: async () => url.endsWith('googleAPIKey') ? { googleAPIKey: 'fixture' } : [] }; } };
    const imports = { '../utils/auth': { default: { getToken: () => 'test' }, __esModule: true }, '../utils/globalVariables': { apiPrefix: prefix } };
    const signal = new AbortController().signal;
    await load('src/api/downloadsApi.ts', imports, globals).fetchDownloads('country_code=KE', signal);
    await load('src/api/googleAPIKey.ts', imports, globals).fetchGoogleAPIKey();
    await load('src/api/modulesAPI.ts', imports, globals).fetchModuleAndPackageInfo();
    const base = prefix === '' ? '' : '/apiv2';
    assert.deepEqual(calls.map(call => call.url), [`${base}/api/downloads?country_code=KE`, `${base}/api/googleAPIKey`, `${base}/modules/names`, `${base}/packages/names`]);
    assert.equal(calls[0].options.signal, signal);
    assert.ok(calls.every(call => call.options.headers.Authorization === 'Bearer test'));
  }
});

test('period presets use completed UTC dates and retain explicit or open-ended URL ranges', () => {
  const now = new Date('2026-11-21T00:30:00Z');
  const seven = comparisons.resolveDownloadPeriod(new URLSearchParams('period=7d&country_code=KE'), now);
  assert.equal(seven.choice, '7d'); assert.equal(seven.needsDates, true);
  assert.equal(seven.filters.start_date, '2026-11-14'); assert.equal(seven.filters.end_date, '2026-11-20');
  assert.equal(seven.filters.country_code, 'KE');
  const thirty = comparisons.downloadPresetDates('30d', now);
  assert.equal(thirty.start_date, '2026-10-22'); assert.equal(thirty.end_date, '2026-11-20');
  const today = comparisons.downloadPresetDates('today', now);
  assert.equal(today.start_date, '2026-11-21'); assert.equal(today.end_date, '2026-11-21');
  const custom = comparisons.resolveDownloadPeriod(new URLSearchParams('start_date=2024-02-01&end_date=2024-02-29'), now);
  assert.equal(custom.choice, 'custom'); assert.equal(custom.filters.end_date, '2024-02-29'); assert.equal(custom.needsDates, false);
  const bookmarked = comparisons.resolveDownloadPeriod(new URLSearchParams('period=7d&start_date=2026-10-01&end_date=2026-10-07'), now);
  assert.equal(bookmarked.choice, 'custom'); assert.equal(bookmarked.filters.start_date, '2026-10-01');
  assert.equal(comparisons.resolveDownloadPeriod(new URLSearchParams('period=custom'), now).filters.start_date, '');
});

test('comparison dates are contiguous equal-length inclusive UTC periods across leap days, years and DST', () => {
  const cases = [
    ['2024-03-01', '2024-03-07', '2024-02-23', '2024-02-29'],
    ['2026-01-01', '2026-01-07', '2025-12-25', '2025-12-31'],
    ['2026-03-08', '2026-03-14', '2026-03-01', '2026-03-07'],
    ['2026-11-21', '2026-11-21', '2026-11-20', '2026-11-20'],
    ['2024-02-01', '2024-02-29', '2024-01-03', '2024-01-31'],
  ];
  for (const [start, end, expectedStart, expectedEnd] of cases) {
    const current = { ...blank(), start_date: start, end_date: end, country_code: 'KE', module_id: '2', package_id: '3' };
    const prior = comparisons.previousDownloadPeriod(current);
    assert.equal(prior.reason, null); assert.equal(prior.filters.start_date, expectedStart); assert.equal(prior.filters.end_date, expectedEnd);
    for (const key of ['country_code', 'module_id', 'package_id']) assert.equal(prior.filters[key], current[key]);
    assert.equal(Date.parse(end) - Date.parse(start), Date.parse(expectedEnd) - Date.parse(expectedStart));
    assert.equal(Date.parse(start) - Date.parse(expectedEnd), 86400000);
  }
});

test('unrepresentable comparisons are identified rather than approximated', () => {
  for (const current of [blank(), { ...blank(), start_date: '2026-11-01' }, { ...blank(), end_date: '2026-11-01' }]) {
    const result = comparisons.previousDownloadPeriod(current);
    assert.equal(result.filters, null); assert.match(result.reason, /Open-ended ranges/);
  }
  assert.match(comparisons.previousDownloadPeriod({ ...blank(), start_date: '2026-02-30', end_date: '2026-03-01' }).reason, /valid UTC dates/);
  assert.match(comparisons.previousDownloadPeriod({ ...blank(), start_date: '2026-11-02', end_date: '2026-11-01' }).reason, /after/);
  assert.match(comparisons.previousDownloadPeriod({ ...blank(), start_date: '0000-01-01', end_date: '0000-01-02' }).reason, /outside/);
});

test('download changes handle increases, decreases, unchanged counts and zero baselines without infinity', () => {
  for (const [current, prior, direction, label] of [
    [15, 10, 'up', '50% increase'], [5, 10, 'down', '50% decrease'], [0, 10, 'down', '100% decrease'],
    [10, 10, 'flat', 'No change (0%)'], [0, 0, 'flat', 'No change (0%)'], [5, 0, 'up', 'New activity (previously 0)'],
    [100001, 100000, 'up', '<0.1% increase'], [99999, 100000, 'down', '<0.1% decrease'],
  ]) {
    const change = comparisons.downloadChange(current, prior);
    assert.equal(change.direction, direction); assert.equal(change.label, label); assert.doesNotMatch(change.label, /Infinity|NaN/);
  }
});

test('comparison matching uses country/resource identifiers and event type, never titles', () => {
  const prior = { ...group, reported_download_events: 6 };
  const renamed = { ...group, module: { id: 1, title: 'Renamed module' }, country: { ...country, name: 'Renamed country' } };
  assert.equal(comparisons.downloadGroupKey(prior), comparisons.downloadGroupKey(renamed));
  const rows = comparisons.compareDownloadGroups([renamed], [prior], 'count', 'DESC');
  assert.equal(rows.length, 1); assert.equal(rows[0].previous_events, 6); assert.equal(rows[0].reported_download_events, 12);
  for (const changed of [
    { ...group, country: { ...country, id: 8 } }, { ...group, country: { ...country, code: 'UG' } },
    { ...group, module: { ...group.module, id: 2 } }, { ...group, event_type: 'module_and_package', package: { id: 3, title: 'Pack' } },
    { ...group, event_type: 'unattributed' },
  ]) assert.notEqual(comparisons.downloadGroupKey(group), comparisons.downloadGroupKey(changed));
});

test('missing comparison groups are zero and disappeared current groups show a full decrease', () => {
  const gone = { ...group, module: { id: 2, title: 'No recent activity' }, reported_download_events: 9 };
  const fresh = { ...group, module: { id: 3, title: 'New module activity' }, reported_download_events: 4 };
  const rows = comparisons.compareDownloadGroups([group, fresh], [{ ...group, reported_download_events: 6 }, gone], 'count', 'DESC');
  assert.equal(rows.length, 3); assert.equal(rows[0].reported_download_events, 12);
  assert.equal(rows.find(row => row.module.id === 3).previous_events, 0);
  assert.equal(rows.find(row => row.module.id === 2).reported_download_events, 0);
  assert.equal(comparisons.downloadChange(0, rows.find(row => row.module.id === 2).previous_events).label, '100% decrease');
  const historical = comparisons.compareDownloadGroups([group, group], [{ ...group, reported_download_events: 2 }, { ...group, reported_download_events: 3 }], 'country', 'ASC');
  assert.equal(historical.length, 1); assert.equal(historical[0].reported_download_events, 24); assert.equal(historical[0].previous_events, 5);
  assert.equal(group.reported_download_events, 12, 'Comparison must not mutate API responses');
});

test('period selection persists exact dates, presets and existing filters/sort in the URL', async () => {
  const calls = [];
  const ui = harness('src/pages/DownloadsTablePage.tsx', { '@/api/downloadReportsAPI': { fetchDownloadSummary: async (...args) => { calls.push(args); return summary; } } }, { query: 'country_code=KE&module_id=1&package_id=2&sort_by=country&sort_dir=ASC' });
  await ui.settle();
  assert.equal(ui.find(node => node.type === 'select' && node.props.value === 'all').props.value, 'all');
  assert.equal(calls.length, 1, 'All time makes just one unbounded request');
  ui.find(node => node.type === 'select' && node.props.value === 'all').props.onChange({ target: { value: '7d' } });
  await ui.settle();
  let params = new URLSearchParams(ui.query()); assert.equal(params.get('period'), '7d');
  assert.equal(params.get('start_date'), comparisons.downloadPresetDates('7d').start_date);
  assert.equal(calls.length, 3, 'Selecting a bounded period adds current and previous requests');
  ui.find(node => node.type === 'select' && node.props.value === '7d').props.onChange({ target: { value: '30d' } });
  await ui.settle(); params = new URLSearchParams(ui.query());
  assert.equal(params.get('period'), '30d'); assert.equal(params.get('start_date'), comparisons.downloadPresetDates('30d').start_date);
  for (const [key, value] of [['country_code', 'KE'], ['module_id', '1'], ['package_id', '2'], ['sort_by', 'country'], ['sort_dir', 'ASC']]) assert.equal(params.get(key), value);
  assert.equal(calls.length, 5);
  ui.find(node => node.type === 'select' && node.props.value === '30d').props.onChange({ target: { value: 'today' } });
  await ui.settle(); assert.match(ui.text(), /not equal elapsed hours or a rolling 24-hour window/);
  ui.find(node => node.type === 'select' && node.props.value === 'today').props.onChange({ target: { value: 'custom' } });
  await ui.settle(); assert.equal(new URLSearchParams(ui.query()).get('period'), 'custom');
  assert.match(ui.text(), /Comparison:/);
});

test('date edits select custom while geography-only edits retain presets and table sorting', async () => {
  const query = new URLSearchParams({ period: '7d', ...comparisons.downloadPresetDates('7d'), country_code: 'KE', sort_by: 'country', sort_dir: 'ASC' }).toString();
  const ui = harness('src/components/Downloads/DownloadsFilters.tsx', {
    '@/api/modulesAPI': { fetchModuleAndPackageInfo: async () => ({ modules: [], packages: [] }) },
    '@/utils/countryNames.json': [{ code: 'KE', name: 'Kenya' }, { code: 'UG', name: 'Uganda' }],
  }, { query });
  await ui.settle();
  ui.find(node => node.type === 'select' && node.props.value === 'KE').props.onChange({ target: { value: 'UG' } });
  ui.find(node => node.type === 'form').props.onSubmit({ preventDefault() {} }); await ui.settle();
  let params = new URLSearchParams(ui.query()); assert.equal(params.get('period'), '7d'); assert.equal(params.get('sort_by'), 'country');
  ui.nodes().filter(node => node.type === 'input')[0].props.onChange({ target: { value: '2024-01-01' } });
  ui.find(node => node.type === 'form').props.onSubmit({ preventDefault() {} }); await ui.settle();
  params = new URLSearchParams(ui.query()); assert.equal(params.get('period'), 'custom'); assert.equal(params.get('start_date'), '2024-01-01');
  assert.equal(params.get('country_code'), 'UG'); assert.equal(params.get('sort_dir'), 'ASC');
});

test('Map/Table links retain applied period metadata and dates without sending it to the API', () => {
  const dates = comparisons.downloadPresetDates('7d');
  const query = new URLSearchParams({ ...dates, period: '7d', country_code: 'KE', module_id: '1' }).toString();
  const ui = harness('src/components/Downloads/DownloadsNavigation.tsx', {}, { query });
  for (const link of ui.nodes().filter(node => node.type === 'a')) {
    const params = new URLSearchParams(link.props.to.search);
    assert.equal(params.get('period'), '7d'); assert.equal(params.get('start_date'), dates.start_date); assert.equal(params.get('country_code'), 'KE');
    assert.equal(utils.downloadFilterParams(utils.readDownloadFilters(params)).get('period'), null);
  }
});

test('comparison requests use identical geographic/resource filters and render prior-only and zero-baseline activity', async () => {
  const calls = [];
  const prior = { ...summary, groups: [{ ...group, reported_download_events: 6 }, { ...group, module: { id: 2, title: 'Stopped activity' }, reported_download_events: 9 }] };
  const current = { ...summary, groups: [group, { ...group, module: { id: 3, title: 'Fresh activity' }, reported_download_events: 4 }] };
  const ui = harness('src/pages/DownloadsTablePage.tsx', { '@/api/downloadReportsAPI': { fetchDownloadSummary: async (...args) => {
    calls.push(args); return args[0].start_date === '2026-11-08' ? current : prior;
  } } }, { query: 'start_date=2026-11-08&end_date=2026-11-14&country_code=KE&module_id=1&package_id=2' });
  await ui.settle(); assert.equal(calls.length, 2);
  assert.equal(calls[1][0].start_date, '2026-11-01'); assert.equal(calls[1][0].end_date, '2026-11-07');
  for (const key of ['country_code', 'module_id', 'package_id']) assert.equal(calls[0][0][key], calls[1][0][key]);
  assert.match(ui.text(), /100% increase/); assert.match(ui.text(), /100% decrease/); assert.match(ui.text(), /New activity \(previously 0\)/);
  assert.match(ui.text(), /Stopped activity/); assert.match(ui.text(), /2026-11-01 through 2026-11-07/);
  assert.equal(ui.nodes().some(node => node.type === 'event-details'), false);
});

test('a failed comparison preserves current counts and never treats an unavailable baseline as zero', async () => {
  let failed = true;
  const ui = harness('src/pages/DownloadsTablePage.tsx', { '@/api/downloadReportsAPI': { fetchDownloadSummary: async filters => {
    if (filters.start_date === '2026-11-01' && failed) throw new Error('Baseline unavailable');
    return summary;
  } } }, { query: 'start_date=2026-11-08&end_date=2026-11-14' });
  await ui.settle(); assert.match(ui.text(), /Total reported download events15/); assert.match(ui.text(), /Baseline unavailable/);
  assert.doesNotMatch(ui.text(), /New activity|% increase|% decrease/);
  failed = false; ui.click('Retry comparison'); await ui.settle(); assert.match(ui.text(), /No change \(0%\)/);
});

test('rapid filter changes abort both period requests and suppress stale baseline successes and errors', async () => {
  const requests = [];
  const ui = harness('src/pages/DownloadsTablePage.tsx', { '@/api/downloadReportsAPI': { fetchDownloadSummary: (...args) => new Promise((resolve, reject) => requests.push({ args, resolve, reject })) } }, { query: 'start_date=2026-11-08&end_date=2026-11-14' });
  ui.render(); requests[0].resolve(summary); requests[1].resolve(summary); await ui.settle(); assert.match(ui.text(), /No change/);
  ui.setQuery('start_date=2026-10-08&end_date=2026-10-14&country_code=US');
  assert.doesNotMatch(text(ui.render()), /Total reported download events15/, 'Never show old totals under new period labels');
  ui.setQuery('start_date=2026-09-08&end_date=2026-09-14&country_code=KE'); ui.render();
  assert.equal(requests[2].args[3].aborted, true); assert.equal(requests[3].args[3].aborted, true);
  requests[4].resolve({ ...summary, groups: [{ ...group, reported_download_events: 12 }] });
  requests[5].resolve({ ...summary, groups: [{ ...group, reported_download_events: 6 }] }); await ui.settle();
  requests[2].resolve({ ...summary, total_records: 999 }); requests[3].reject(new Error('Stale baseline failure')); await ui.settle();
  assert.match(ui.text(), /100% increase/); assert.doesNotMatch(ui.text(), /999|Stale baseline failure/);
});

test('open-ended custom reports retain their existing scope but do not request invented comparison periods', async () => {
  const calls = [];
  const ui = harness('src/pages/DownloadsTablePage.tsx', { '@/api/downloadReportsAPI': { fetchDownloadSummary: async (...args) => { calls.push(args); return summary; } } }, { query: 'period=custom&start_date=2026-11-01' });
  await ui.settle(); assert.equal(calls.length, 1); assert.equal(calls[0][0].end_date, '');
  assert.match(ui.text(), /Open-ended ranges cannot be compared accurately/); assert.match(ui.text(), /Comparison unavailable/);
  assert.doesNotMatch(ui.text(), /New activity|% increase|% decrease/);
});

test('All time is the default without dates, while explicit presets and date URLs retain precedence', () => {
  const now = new Date('2026-11-21T12:00:00Z');
  for (const query of ['', 'country_code=KE&module_id=1&package_id=2', 'period=all']) {
    const period = comparisons.resolveDownloadPeriod(new URLSearchParams(query), now);
    assert.equal(period.choice, 'all'); assert.equal(period.needsDates, false);
    assert.equal(period.filters.start_date, ''); assert.equal(period.filters.end_date, '');
  }
  for (const choice of ['today', '7d', '30d']) {
    const period = comparisons.resolveDownloadPeriod(new URLSearchParams('period=' + choice), now);
    assert.equal(period.choice, choice); assert.equal(period.needsDates, true);
    assert.ok(period.filters.start_date); assert.ok(period.filters.end_date);
  }
  for (const query of ['start_date=2020-01-01&end_date=2020-12-31', 'period=all&start_date=2020-01-01&end_date=2020-12-31']) {
    const period = comparisons.resolveDownloadPeriod(new URLSearchParams(query), now);
    assert.equal(period.choice, 'custom'); assert.equal(period.needsDates, false);
    assert.equal(period.filters.start_date, '2020-01-01'); assert.equal(period.filters.end_date, '2020-12-31');
  }
});

test('All time sends one unbounded authenticated summary request and shows Not applicable changes', async () => {
  const requests = [];
  const api = load('src/api/downloadReportsAPI.ts', {
    '@/utils/auth': { default: { getToken: () => 'test', isSuperAdmin: () => true }, __esModule: true },
    '@/utils/globalVariables': { apiPrefix: '' }, '@/utils/downloadReporting': utils,
  }, { fetch: async (url, options) => { requests.push({ url, options }); return { ok: true, json: async () => summary }; } });
  const ui = harness('src/pages/DownloadsTablePage.tsx', { '@/api/downloadReportsAPI': api }, { query: 'country_code=KE&module_id=1&package_id=2&sort_by=country&sort_dir=ASC' });
  await ui.settle(); assert.equal(requests.length, 1);
  const params = new URL(requests[0].url, 'https://example.invalid').searchParams;
  for (const key of ['start_date', 'end_date', 'period']) assert.equal(params.has(key), false);
  for (const [key, value] of [['country_code', 'KE'], ['module_id', '1'], ['package_id', '2'], ['sort_by', 'country'], ['sort_dir', 'ASC']]) assert.equal(params.get(key), value);
  assert.match(ui.text(), /Selected: All time/); assert.match(ui.text(), /Not applicable/);
  assert.doesNotMatch(ui.text(), /Comparison unavailable|Loading comparison|% increase|% decrease/);
});

test('selecting All time clears dates, retains geographic/resource filters and sorting, and stops comparisons', async () => {
  const calls = [];
  const ui = harness('src/pages/DownloadsTablePage.tsx', { '@/api/downloadReportsAPI': { fetchDownloadSummary: async (...args) => { calls.push(args); return summary; } } }, {
    query: 'period=7d&start_date=2026-11-14&end_date=2026-11-20&country_code=KE&module_id=1&package_id=2&sort_by=country&sort_dir=ASC',
  });
  await ui.settle(); assert.equal(calls.length, 2);
  ui.find(node => node.type === 'select' && node.props.value !== 'country' && node.props.value !== 'ASC').props.onChange({ target: { value: 'all' } });
  await ui.settle(); assert.equal(calls.length, 3);
  const params = new URLSearchParams(ui.query()); assert.equal(params.get('period'), 'all');
  assert.equal(params.has('start_date'), false); assert.equal(params.has('end_date'), false);
  for (const [key, value] of [['country_code', 'KE'], ['module_id', '1'], ['package_id', '2'], ['sort_by', 'country'], ['sort_dir', 'ASC']]) assert.equal(params.get(key), value);
  assert.equal(calls[2][0].start_date, ''); assert.equal(calls[2][0].end_date, '');
  assert.match(ui.text(), /Not applicable/); assert.doesNotMatch(ui.text(), /No change \(0%\)/);
});

test('opening an explicit historical date URL preserves it and compares its preceding period', async () => {
  const calls = [];
  const query = 'start_date=2020-01-01&end_date=2020-01-07&country_code=KE';
  const ui = harness('src/pages/DownloadsTablePage.tsx', { '@/api/downloadReportsAPI': { fetchDownloadSummary: async (...args) => { calls.push(args); return summary; } } }, { query });
  await ui.settle(); assert.equal(ui.query(), query); assert.equal(calls.length, 2);
  assert.equal(calls[0][0].start_date, '2020-01-01'); assert.equal(calls[0][0].end_date, '2020-01-07');
  assert.equal(calls[1][0].start_date, '2019-12-25'); assert.equal(calls[1][0].end_date, '2019-12-31');
  assert.ok(ui.find(node => node.type === 'select' && node.props.value === 'custom'));
});

test('Clear filters restores All time and removes all date and resource restrictions', async () => {
  const calls = [];
  const query = 'period=7d&start_date=2026-11-14&end_date=2026-11-20&country_code=KE&module_id=1&package_id=2';
  const page = harness('src/pages/DownloadsTablePage.tsx', { '@/api/downloadReportsAPI': { fetchDownloadSummary: async (...args) => { calls.push(args); return summary; } } }, { query });
  await page.settle(); assert.equal(calls.length, 2);
  const filters = harness('src/components/Downloads/DownloadsFilters.tsx', {
    '@/api/modulesAPI': { fetchModuleAndPackageInfo: async () => ({ modules: [], packages: [] }) },
    '@/utils/countryNames.json': [{ code: 'KE', name: 'Kenya' }],
  }, { query });
  await filters.settle(); filters.click('Clear filters'); assert.equal(filters.query(), '');
  page.setQuery(filters.query()); await page.settle(); assert.equal(calls.length, 3); assert.equal(page.query(), '');
  for (const key of ['start_date', 'end_date', 'country_code', 'module_id', 'package_id']) assert.equal(calls[2][0][key], '');
  assert.ok(page.find(node => node.type === 'select' && node.props.value === 'all')); assert.match(page.text(), /Not applicable/);
});

test('aggregated headers stay visible during loading, empty results and errors; empty help is a table row', async () => {
  let fail = false;
  const ui = harness('src/pages/DownloadsTablePage.tsx', { '@/api/downloadReportsAPI': { fetchDownloadSummary: async () => {
    if (fail) throw new Error('Report unavailable'); return { ...summary, total_records: 0, unknown_country_events: 0, groups: [] };
  } } });
  const assertHeaders = () => {
    const headers = ui.nodes().filter(node => node.type === 'th').map(text).join(' ');
    for (const label of ['Country', 'Module or package title', 'Resource type', 'Reported downloads (events)', 'Change']) assert.ok(headers.includes(label));
  };
  assertHeaders(); await ui.settle(); assertHeaders();
  const empty = ui.find(node => node.type === 'tbody');
  assert.match(text(empty), /No reported download events match these filters/);
  assert.match(text(empty), /clearing country, module, or package filters/);
  assert.equal(nodes(empty).find(node => node.type === 'td').props.colSpan, 5);
  fail = true; ui.setQuery('country_code=KE'); await ui.settle(); assertHeaders();
  assert.match(text(ui.find(node => node.type === 'tbody')), /report could not be loaded/);
});
