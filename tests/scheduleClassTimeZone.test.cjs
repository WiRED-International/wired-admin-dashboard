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

const fixture = (id, zone, locationId = id) => ({
  id, name: `Class ${id}`, organization_id: 1, status: 'active',
  program: { id: 1, name: 'Training Program' },
  location_id: locationId, class_enrollments: [{ id: id * 10 }],
  location: locationId === null ? null : { id: locationId, name: `Location ${id}`, time_zone: zone },
});
const dateTime = load('src/utils/examDateTime.ts');
const locationTimeZone = load('src/utils/locationTimeZone.ts');

// Run actual page effects/handlers and both API clients with mocked transport.
// Effects have dependency tracking and cleanup so race protections are exercised.
async function schedulingForm(records, lookup = async id => records.find(c => c.id === id), listPage) {
  const writes = [], reads = [], alerts = [];
  const auth = { __esModule: true, default: { getToken: () => 'test-token' } };
  const prefix = { apiPrefix: '' };
  const quietConsole = { log() {}, error() {} };
  const axios = {
    get: async url => ({ data: url.endsWith('/templates')
      ? [{ id: 50, title: 'Reusable Template' }]
      : { organizations: [{ id: 1, name: 'Organization', userCount: 2 }] } }),
    post: async (url, payload) => {
      writes.push({ url, payload });
      return { data: url === '/api/admin/exams' ? { exam: { id: 100 + writes.length } } : {} };
    },
  };
  const exams = load('src/api/examsAPI.ts', {
    axios, '@/utils/auth': auth, '@/utils/globalVariables': prefix,
  }, { console: quietConsole });
  const classes = load('src/api/classAPI.ts', {
    '../utils/auth': auth, '../utils/globalVariables': prefix,
  }, {
    URLSearchParams, console: quietConsole,
    fetch: async url => {
      reads.push(url);
      const parsed = new URL(url, 'http://local.test');
      if (parsed.search) {
        const page = Number(parsed.searchParams.get('page'));
        const data = listPage ? await listPage(page) : {
          classes: records.slice(page - 1, page),
          pagination: { totalPages: records.length },
        };
        return { ok: true, json: async () => ({
          ...data,
        }) };
      }
      const record = await lookup(Number(parsed.pathname.split('/').pop()));
      return { ok: true, json: async () => ({ class: record }) };
    },
  });
  const hooks = [];
  let cursor = 0, dirty = true, tree;
  const effects = [];
  function Picker() {}
  function Organizations() {}
  function Frame() {}
  const page = load('src/pages/ScheduleExamPage.tsx', {
    react: {
      useState: initial => {
        const index = cursor++;
        hooks[index] ??= { value: initial };
        return [hooks[index].value, next => {
          const value = typeof next === 'function' ? next(hooks[index].value) : next;
          if (!Object.is(value, hooks[index].value)) { hooks[index].value = value; dirty = true; }
        }];
      },
      useRef: initial => {
        const index = cursor++;
        hooks[index] ??= { current: initial };
        return hooks[index];
      },
      useEffect: (callback, deps) => {
        const index = cursor++;
        const old = hooks[index];
        if (!old || deps.some((value, i) => !Object.is(value, old.deps[i]))) {
          effects.push(() => {
            old?.cleanup?.();
            hooks[index] = { deps, cleanup: callback() };
          });
        }
      },
    },
    '@/api/examsAPI': exams, '@/api/classAPI': classes,
    '@/api/usersAPI': { searchUsersBroad: async () => ({ users: [{ id: 77, first_name: 'Test', last_name: 'Learner' }] }) },
    '@/utils/examDateTime': dateTime, '@/utils/locationTimeZone': locationTimeZone,
    '@/components/Common/SearchableTimeZonePicker': { __esModule: true, default: Picker },
    '@/components/Common/SearchableOrganizationMultiSelect': { __esModule: true, default: Organizations },
    ...Object.fromEntries(['PageContainer', 'PageHeader', 'Panel'].map(name =>
      [`@/components/ui/${name}`, { __esModule: true, default: Frame }])),
    'react-router-dom': { useNavigate: () => () => {} },
  }, {
    console: quietConsole, alert: message => alerts.push(message),
    setTimeout: callback => { callback(); return 1; }, clearTimeout() {},
  });
  async function flush() {
    for (let iteration = 0; iteration < 20; iteration++) {
      if (dirty) {
        dirty = false;
        cursor = 0;
        tree = page.default();
        while (effects.length) effects.shift()();
      }
      await new Promise(setImmediate);
      if (!dirty) return;
    }
    assert.fail('Page did not settle');
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
  function find(predicate) {
    const node = nodes(tree).find(predicate);
    assert.ok(node, 'Expected scheduling control');
    return node;
  }
  async function change(predicate, value) {
    find(predicate).props.onChange({ target: { value } });
    await flush();
  }
  const classSelector = node => node.type === 'select' && node.props['aria-label'] === 'Class for this exam';
  await flush();
  return {
    writes, reads, alerts, flush,
    text: () => text(tree),
    dateLabels: () => nodes(tree).filter(n => n.type === 'label' && /^(Start|End) Date/.test(text(n))).map(text),
    manualZone: () => find(n => n.type === Picker).props.value,
    hasTimeZoneHeading: () => nodes(tree).some(n => n.type === 'label' && text(n) === 'Time Zone'),
    manualPlaceholder: () => find(n => n.type === Picker).props.placeholder,
    prominentZone: () => nodes(tree).filter(n => n.type === 'strong').map(text),
    classOptions: () => nodes(find(classSelector)).filter(n => n.type === 'option').map(n => n.props.value),
    classLabels: () => nodes(find(classSelector)).filter(n => n.type === 'option').map(text),
    selectClass: async id => {
      find(n => n.type === Organizations).props.onChange([1]);
      await flush();
      await change(classSelector, id === null ? '' : String(id));
    },
    clearOrganizations: async () => { find(n => n.type === Organizations).props.onChange([]); await flush(); },
    chooseManualZone: async zone => {
      find(n => n.type === Picker).props.onChange(zone);
      await flush();
    },
    hasManualPicker: () => nodes(tree).some(n => n.type === Picker),
    ready: () => !find(n => n.type === 'button' && text(n).trim() === 'Schedule Exam').props.disabled,
    click: async label => {
      await find(n => n.type === 'button' && text(n).trim() === label).props.onClick();
      await flush();
    },
    fillSchedule: async (start = '2026-11-20T09:00', end = '2026-11-20T10:00') => {
      await change(n => n.type === 'select' && !n.props['aria-label'], '50');
      await change(n => n.type === 'input' && n.props.type === 'text' && !n.props.placeholder, 'Scheduled Exam');
      const dates = nodes(tree).filter(n => n.type === 'input' && n.props.type === 'datetime-local');
      dates[0].props.onChange({ target: { value: start } });
      dates[1].props.onChange({ target: { value: end } });
      await flush();
    },
    addStudent: async () => {
      await change(n => n.type === 'input' && n.props.placeholder === 'Search users by name or email...', 'Test');
      await find(n => n.type === 'button' && text(n).trim() === 'Add').props.onClick();
      await flush();
    },
  };
}

test('initial scheduling state has neutral timezone guidance and no default timezone', async () => {
  const form = await schedulingForm([fixture(1, 'Africa/Nairobi')]);
  assert.match(form.text(), /Select a class to determine the timezone\./);
  assert.doesNotMatch(form.text(), /Africa\/Nairobi/);
  assert.equal(form.manualZone(), '');
  assert.deepEqual(form.dateLabels(), [
    'Start Date / Time (select a timezone)',
    'End Date / Time (select a timezone)',
  ]);
  assert.equal(form.hasTimeZoneHeading(), false);
  assert.equal(form.manualPlaceholder(), 'Or select a timezone manually…');
  await form.fillSchedule();
  assert.equal(form.ready(), false);
  await form.click('Schedule Exam');
  assert.equal(form.writes.length, 0);
});

test('one class uses its saved location timezone and creates a fresh exam using an existing template', async () => {
  const form = await schedulingForm([fixture(1, 'Africa/Nairobi'), fixture(2, 'America/Los_Angeles')]);
  await form.selectClass(1);
  assert.deepEqual(form.classOptions(), ['', 1, 2]);
  assert.equal(form.hasManualPicker(), false);
  assert.ok(form.prominentZone().includes('Africa/Nairobi'));
  assert.match(form.text(), /Automatically selected from the class location: Location 1\./);
  assert.match(form.text(), /Start Date \/ Time \(Africa\/Nairobi\)/);
  assert.match(form.text(), /End Date \/ Time \(Africa\/Nairobi\)/);
  assert.doesNotMatch(form.text(), /Select a class to determine/);
  await form.fillSchedule();
  assert.equal(form.ready(), true);
  await form.click('Schedule Exam');
  assert.equal(form.writes[0].payload.timeZone, 'Africa/Nairobi');
  assert.equal(form.writes[0].payload.localStart, '2026-11-20T09:00');
  assert.match(form.writes[1].url, /\/exams\/101\/assign-class\/1$/);

  await form.selectClass(2);
  assert.ok(form.prominentZone().includes('America/Los_Angeles'));
  assert.match(form.text(), /Automatically selected from the class location: Location 2\./);
  assert.equal(form.hasManualPicker(), false);
  await form.fillSchedule();
  await form.click('Schedule Exam');
  assert.equal(form.writes[2].payload.exam_template_id, form.writes[0].payload.exam_template_id);
  assert.equal(form.writes[2].payload.timeZone, 'America/Los_Angeles');
  assert.match(form.writes[3].url, /\/exams\/103\/assign-class\/2$/);
  assert.equal(form.writes.length, 4);
  assert.ok(form.reads.some(url => url.includes('page=2')));
  assert.ok(form.reads.includes('/api/admin/classes/1'));
});

test('switching classes schedules only the final selected class', async () => {
  const form = await schedulingForm([fixture(1, 'Africa/Nairobi'), fixture(2, 'Europe/London')]);
  await form.selectClass(1);
  await form.selectClass(2);
  await form.fillSchedule();
  await form.click('Schedule Exam');
  assert.equal(form.writes[0].payload.timeZone, 'Europe/London');
  assert.match(form.writes[1].url, /assign-class\/2$/);
  assert.equal(form.writes.length, 2);
});

test('missing location, legacy null, and invalid zones require explicit manual selection', async () => {
  for (const record of [fixture(1, null, null), fixture(1, null), fixture(1, 'Invalid/Zone')]) {
    const form = await schedulingForm([record]);
    await form.selectClass(1);
    await form.fillSchedule();
    assert.match(form.text(), /Select a timezone manually/);
    assert.equal(form.hasManualPicker(), true);
    assert.equal(form.manualPlaceholder(), 'Select Time Zone');
    assert.doesNotMatch(form.text(), /Select a class to determine|Automatically selected/);
    assert.equal(form.ready(), false);
    await form.click('Schedule Exam');
    assert.equal(form.writes.length, 0);
    await form.chooseManualZone('Asia/Kolkata');
    assert.deepEqual(form.dateLabels(), ['Start Date / Time (Asia/Kolkata)', 'End Date / Time (Asia/Kolkata)']);
    await form.click('Schedule Exam');
    assert.equal(form.writes[0].payload.timeZone, 'Asia/Kolkata');
  }
});

test('student-only scheduling retains explicit manual timezone selection without class assignment', async () => {
  const form = await schedulingForm([fixture(1, 'Africa/Nairobi')]);
  await form.addStudent();
  assert.equal(form.manualZone(), '');
  assert.match(form.text(), /Select a timezone manually for student-only exams\./);
  assert.equal(form.manualPlaceholder(), 'Select Time Zone');
  assert.doesNotMatch(form.text(), /Select a class to determine/);
  await form.fillSchedule();
  assert.equal(form.ready(), false);
  await form.chooseManualZone('America/New_York');
  assert.deepEqual(form.dateLabels(), ['Start Date / Time (America/New_York)', 'End Date / Time (America/New_York)']);
  await form.fillSchedule();
  await form.click('Schedule Exam');
  assert.equal(form.writes[0].payload.timeZone, 'America/New_York');
  assert.equal(form.writes[1].url, '/api/admin/exams/101/assign');
  assert.deepEqual(Array.from(form.writes[1].payload.user_ids), [77]);
});

test('consecutive student-only submissions preserve the administrator\'s manual timezone', async () => {
  const form = await schedulingForm([fixture(1, 'Africa/Nairobi')]);
  await form.chooseManualZone('America/New_York');
  for (let submission = 0; submission < 2; submission++) {
    await form.addStudent();
    await form.fillSchedule();
    assert.match(form.text(), /Start Date \/ Time \(America\/New_York\)/);
    await form.click('Schedule Exam');
  }
  const exams = form.writes.filter(write => write.url === '/api/admin/exams');
  assert.equal(exams.length, 2);
  for (const exam of exams) {
    assert.equal(exam.payload.timeZone, 'America/New_York');
    assert.equal(exam.payload.localStart, '2026-11-20T09:00');
    assert.equal(exam.payload.localEnd, '2026-11-20T10:00');
  }
});

test('later pagination failure retains loaded classes without duplicates and displays a warning', async () => {
  const records = [fixture(1, 'Africa/Nairobi'), fixture(2, 'Europe/London')];
  const form = await schedulingForm(records, undefined, async page => {
    if (page === 3) throw new Error('Later page unavailable');
    return {
      classes: page === 1 ? [records[0]] : records,
      pagination: { totalPages: 4 },
    };
  });
  await form.selectClass(2);
  assert.deepEqual(form.classOptions(), ['', 1, 2]);
  assert.match(form.text(), /Additional classes could not be loaded/);
  assert.ok(!form.text().includes('No active classes found'));
  assert.ok(!form.reads.some(url => url.includes('page=4')));
  await form.fillSchedule();
  assert.equal(form.ready(), true);
  await form.click('Schedule Exam');
  assert.equal(form.writes[0].payload.timeZone, 'Europe/London');
  assert.match(form.writes[1].url, /assign-class\/2$/);
});

test('class selector identifies each class and its associated program', async () => {
  const first = fixture(1, 'Africa/Nairobi');
  const second = { ...fixture(2, 'UTC'), program: { id: 2, name: 'Another Program' } };
  const form = await schedulingForm([first, second]);
  await form.selectClass(null);
  assert.deepEqual(form.classLabels(), [
    'No class (individual students only)',
    'Class 1 - Training Program',
    'Class 2 - Another Program',
  ]);
});

test('changed class schedules still reject repeated-hour and spring-forward gap times', async () => {
  for (const start of ['2026-11-01T01:30', '2026-03-08T02:30']) {
    const form = await schedulingForm([fixture(1, 'America/Los_Angeles')]);
    await form.selectClass(1);
    await form.fillSchedule(start, '2026-11-20T10:00');
    await form.click('Schedule Exam');
    assert.equal(form.writes.length, 0);
    assert.match(form.alerts[0], /occurs twice|does not exist/);
  }
});

test('stale class lookups cannot replace the current class timezone or enable premature scheduling', async () => {
  let resolveFirst;
  const records = [fixture(1, 'Africa/Nairobi'), fixture(2, 'Europe/London')];
  const pending = new Promise(resolve => { resolveFirst = resolve; });
  const form = await schedulingForm(records, id => id === 1 ? pending : Promise.resolve(records[1]));
  await form.selectClass(1);
  await form.fillSchedule();
  assert.equal(form.ready(), false);
  await form.selectClass(2);
  resolveFirst(records[0]);
  await form.flush();
  await form.click('Schedule Exam');
  assert.equal(form.writes[0].payload.timeZone, 'Europe/London');
});

test('lookup failures block submission, and retry loads the configured timezone', async () => {
  let fail = true;
  const record = fixture(1, 'Africa/Nairobi');
  const form = await schedulingForm([record], async () => {
    if (fail) throw new Error('Network failed');
    return record;
  });
  await form.selectClass(1);
  await form.fillSchedule();
  assert.equal(form.ready(), false);
  assert.match(form.text(), /Unable to load/);
  fail = false;
  await form.click('Retry location lookup');
  assert.equal(form.ready(), true);
});

test('removing a class organization clears its automatic timezone and requires a manual choice', async () => {
  const form = await schedulingForm([fixture(1, 'Africa/Nairobi')]);
  await form.selectClass(1);
  await form.addStudent();
  await form.fillSchedule();
  await form.clearOrganizations();
  assert.equal(form.hasManualPicker(), true);
  assert.equal(form.ready(), false);
  await form.chooseManualZone('UTC');
  await form.click('Schedule Exam');
  assert.equal(form.writes[0].payload.timeZone, 'UTC');
  assert.ok(!form.writes.some(write => write.url.includes('assign-class')));
});
