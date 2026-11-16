const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadTypeScript(file, imports, globals = {}) {
  const output = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../', file), 'utf8'), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const exports = {};
  vm.runInNewContext(output, {
    exports,
    require: id => Object.hasOwn(imports, id) ? imports[id] : require(id),
    ...globals,
  });
  return exports;
}

const { isValidLocationTimeZone } = loadTypeScript('src/utils/locationTimeZone.ts', {});

// Exercise the real form handlers and API serialization with mocked network and
// React hooks. No server, database, browser, or additional test dependency needed.
async function locationForm(timeZone = null) {
  const location = {
    id: 7, name: 'Test County', country_id: 1, location_type: 'county',
    parent_location_id: null, time_zone: timeZone,
    country: { id: 1, name: 'Kenya', code: 'KE' },
  };
  const writes = [];
  const api = loadTypeScript('src/api/locationsAPI.ts', {
    '../utils/auth': { __esModule: true, default: { getToken: () => 'test-token' } },
    '../utils/globalVariables': { apiPrefix: '' },
  }, {
    URLSearchParams,
    fetch: async (url, options = {}) => {
      if (options.method) {
        const payload = JSON.parse(options.body);
        writes.push({ url, method: options.method, payload, headers: options.headers });
        Object.assign(location, payload);
        return { ok: true, json: async () => ({ location, message: 'Saved' }) };
      }
      return {
        ok: true,
        json: async () => url.includes('?')
          ? { locations: [location], pagination: { page: 1, total: 1, totalPages: 1 } }
          : [location],
      };
    },
  });
  const state = [];
  let cursor = 0;
  let effect;
  function Picker() {}
  const page = loadTypeScript('src/pages/LocationsPage.tsx', {
    react: {
      useState: initial => {
        const index = cursor++;
        if (!(index in state)) state[index] = initial;
        return [state[index], next => {
          state[index] = typeof next === 'function' ? next(state[index]) : next;
        }];
      },
      useEffect: callback => { effect ??= callback; },
      useMemo: callback => callback(),
      useCallback: callback => callback,
    },
    '../api/locationsAPI': api,
    '../api/countriesAPI': { fetchAllCountries: async () => [location.country] },
    '../utils/locationTimeZone': { isValidLocationTimeZone },
    '../components/Common/SearchableTimeZonePicker': { __esModule: true, default: Picker },
  }, { window: { setTimeout: () => {} }, console });
  function render() { cursor = 0; return page.default(); }
  function nodes(node) {
    if (!node || typeof node !== 'object') return [];
    if (Array.isArray(node)) return node.flatMap(nodes);
    return [node, ...nodes(node.props?.children)];
  }
  function text(node) {
    if (node == null || typeof node === 'boolean') return '';
    if (typeof node !== 'object') return String(node);
    if (Array.isArray(node)) return node.map(text).join('');
    return text(node.props?.children);
  }
  function find(predicate) {
    const result = nodes(render()).find(predicate);
    assert.ok(result, 'Expected form control');
    return result;
  }
  async function click(label) {
    await find(node => node.type === 'button' && text(node).trim() === label).props.onClick();
  }
  render();
  effect();
  await new Promise(setImmediate);
  return {
    writes, click,
    changeServerTimeZone: zone => { location.time_zone = zone; },
    picker: () => find(node => node.type === Picker),
    text: () => text(render()),
    fillCreate: () => {
      find(node => node.type === 'input' && node.props.placeholder === 'Enter location name...')
        .props.onChange({ target: { value: 'New County' } });
      find(node => node.type === 'select').props.onChange({ target: { value: '1' } });
    },
  };
}

test('creation requires an explicitly selected valid timezone and sends it in POST', async () => {
  const form = await locationForm();
  await form.click('+ Create Location');
  form.fillCreate();
  assert.equal(form.picker().props.value, '');
  for (const zone of ['', '   ', 'Invalid/Zone', 'EST', 'Etc/GMT+3']) {
    form.picker().props.onChange(zone);
    await form.click('Create Location');
    assert.equal(form.writes.length, 0);
    assert.match(form.text(), /Select a valid timezone/);
  }
  form.picker().props.onChange('Africa/Nairobi');
  await form.click('Create Location');
  assert.equal(form.writes[0].method, 'POST');
  assert.equal(form.writes[0].payload.time_zone, 'Africa/Nairobi');
  assert.equal(form.writes[0].headers.Authorization, 'Bearer test-token');
});

test('legacy null timezone is displayed as unset and omitted from unrelated PUT edits', async () => {
  const form = await locationForm();
  assert.match(form.text(), /Not set/);
  await form.click('Edit');
  assert.equal(form.picker().props.value, '');
  assert.equal(form.picker().props.filterTimeZone('EST'), false);
  assert.equal(form.picker().props.filterTimeZone('Africa/Nairobi'), true);
  await form.click('Save Changes');
  assert.equal(form.writes[0].method, 'PUT');
  assert.equal(Object.hasOwn(form.writes[0].payload, 'time_zone'), false);
});

test('a timezone selected for a legacy location is saved and shown in the list', async () => {
  const form = await locationForm();
  await form.click('Edit');
  form.picker().props.onChange('America/Los_Angeles');
  await form.click('Save Changes');
  assert.equal(form.writes[0].payload.time_zone, 'America/Los_Angeles');
  assert.match(form.text(), /America\/Los_Angeles/);
});

test('saved timezone populates editing, survives unrelated saves, and can be changed', async () => {
  const form = await locationForm('Africa/Nairobi');
  await form.click('Edit');
  assert.equal(form.picker().props.value, 'Africa/Nairobi');
  await form.click('Save Changes');
  assert.equal(Object.hasOwn(form.writes[0].payload, 'time_zone'), false);
  await form.click('Edit');
  form.picker().props.onChange('Europe/London');
  await form.click('Save Changes');
  assert.equal(form.writes[1].payload.time_zone, 'Europe/London');
  await form.click('Edit');
  await form.click('Save Changes');
  assert.equal(Object.hasOwn(form.writes[2].payload, 'time_zone'), false);
});

test('unchanged edits do not overwrite a timezone changed on the server', async () => {
  const form = await locationForm('Africa/Nairobi');
  await form.click('Edit');
  form.changeServerTimeZone('Europe/London');
  await form.click('Save Changes');
  assert.equal(Object.hasOwn(form.writes[0].payload, 'time_zone'), false);
  await form.click('Edit');
  assert.equal(form.picker().props.value, 'Europe/London');
  form.picker().props.onChange('Africa/Nairobi');
  form.picker().props.onChange('Europe/London');
  await form.click('Save Changes');
  assert.equal(Object.hasOwn(form.writes[1].payload, 'time_zone'), false);
});

test('location validation supports geographic IANA zones and UTC, excluding backend-prohibited aliases', () => {
  for (const zone of ['Africa/Nairobi', 'America/Chicago', 'Asia/Kathmandu', 'UTC', 'Etc/UTC']) {
    assert.equal(isValidLocationTimeZone(zone), true, zone);
  }
  for (const zone of [null, undefined, '', '   ', ' Africa/Nairobi ', 'Invalid/Zone',
    'EST', 'GMT', 'CET', '+03:00', 'Etc/GMT+3', 'Etc/GMT-8']) {
    assert.equal(isValidLocationTimeZone(zone), false, String(zone));
  }
});

function pickerOptions(query, filterTimeZone) {
  let index = 0;
  const picker = loadTypeScript('src/components/Common/SearchableTimeZonePicker.tsx', {
    react: {
      useState: () => [[true, query][index++], () => {}],
      useMemo: callback => callback(),
      useRef: () => ({ current: null }),
      useEffect: () => {},
    },
    '@/data/timeZoneAliases': loadTypeScript('src/data/timeZoneAliases.ts', {}),
  }).default;
  const options = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(visit);
    const children = node.props?.children;
    if (node.type === 'div' && Array.isArray(children) && children.length === 2 &&
      typeof children[1] === 'string' && require('moment-timezone').tz.zone(children[1])) {
      options.push(children[1]);
    }
    visit(children);
  }
  visit(picker({ value: '', onChange: () => {}, filterTimeZone }));
  return options;
}

test('optional picker filter covers defaults, aliases, and search without changing unfiltered exam choices', () => {
  assert.ok(pickerOptions('EST').includes('EST'));
  assert.ok(pickerOptions('Etc/GMT+3').includes('Etc/GMT+3'));
  for (const query of ['', 'EST', 'Etc/GMT', 'Kenya', 'Nairobi', 'UTC', 'America', 'Asia', 'GMT']) {
    assert.ok(pickerOptions(query, isValidLocationTimeZone).every(isValidLocationTimeZone), query);
    assert.deepEqual(pickerOptions(query, () => false), [], query);
  }
  assert.ok(pickerOptions('', isValidLocationTimeZone).includes('UTC'));
  assert.ok(pickerOptions('Kenya', isValidLocationTimeZone).includes('Africa/Nairobi'));
});

const backendValidator = path.resolve(process.env.EXAM_TIMEZONE_BACKEND_ROOT ||
  path.resolve(__dirname, '../../wired_modules_api'), 'utils/locationTimezone.js');
test('every location-picker timezone matches the actual backend policy in this runtime',
  { skip: !fs.existsSync(backendValidator) && 'Backend checkout unavailable' }, () => {
    const backend = require(backendValidator).isValidLocationTimeZone;
    for (const zone of require('moment-timezone').tz.names()) {
      assert.equal(isValidLocationTimeZone(zone), backend(zone), zone);
    }
  });

test('invalid editing timezone is rejected; cancellation does not leak selection into creation', async () => {
  const form = await locationForm('Africa/Nairobi');
  await form.click('Edit');
  form.picker().props.onChange('Invalid/Zone');
  await form.click('Save Changes');
  assert.equal(form.writes.length, 0);
  assert.match(form.text(), /Select a valid timezone/);
  await form.click('Cancel');
  await form.click('+ Create Location');
  assert.equal(form.picker().props.value, '');
});
