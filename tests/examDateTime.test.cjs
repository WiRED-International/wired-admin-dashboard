const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Exercise the production TypeScript helper with Node's built-in test runner.
const filename = path.resolve(__dirname, '../src/utils/examDateTime.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
const exportsObject = {};
vm.runInNewContext(compiled, { exports: exportsObject, require, Date });
const { formatExamDateTime, examDateTimeInput, formatExamSchedulePreview,
  examScheduleValue, requireExamTimeZone, examDisplayTimeZone } = exportsObject;

test('Nairobi displays the intended date and time independently of browser timezone', () => {
  assert.equal(formatExamDateTime('2026-11-20T06:00:00.000Z', 'Africa/Nairobi'),
    'Nov 20, 2026, 9:00 AM');
  assert.equal(examDateTimeInput('2026-11-20T06:00:00.000Z', 'Africa/Nairobi'),
    '2026-11-20T09:00');
});

test('selected timezone controls date rollover and fractional-hour offsets', () => {
  const utc = '2026-11-20T06:00:00.000Z';
  assert.equal(formatExamDateTime(utc, 'America/Los_Angeles'), 'Nov 19, 2026, 10:00 PM');
  assert.equal(examDateTimeInput(utc, 'America/Los_Angeles'), '2026-11-19T22:00');
  assert.equal(examDateTimeInput(utc, 'Asia/Kolkata'), '2026-11-20T11:30');
});

test('unchanged start/end inputs preserve UTC across repeated saves', () => {
  for (const zone of ['Africa/Nairobi', 'America/Los_Angeles', 'America/New_York', 'Europe/London', 'Asia/Kolkata', 'UTC']) {
    for (const original of ['2026-11-20T06:00:00.000Z', '2026-11-20T07:00:00.000Z', '2026-07-20T06:15:27.123Z']) {
      let saved = original;
      for (let edit = 0; edit < 3; edit++) {
        saved = examScheduleValue(examDateTimeInput(saved, zone), zone,
          { utc: saved, timeZone: zone });
        assert.equal(saved, original, zone);
      }
    }
  }
});

test('both occurrences of the repeated Los Angeles hour survive title-only and repeated saves', () => {
  const zone = 'America/Los_Angeles';
  for (const original of ['2026-11-01T08:30:00.000Z', '2026-11-01T09:30:00.000Z']) {
    let saved = original;
    for (let edit = 0; edit < 3; edit++) {
      const wall = examDateTimeInput(saved, zone);
      assert.equal(wall, '2026-11-01T01:30');
      saved = examScheduleValue(wall, zone, { utc: saved, timeZone: zone });
      assert.equal(saved, original);
    }
  }
});

test('unchanged boundaries are independent of edits to the other boundary', () => {
  const zone = 'America/Los_Angeles';
  assert.equal(examScheduleValue('2026-11-01T01:30', zone,
    { utc: '2026-11-01T08:30:00.000Z', timeZone: zone }), '2026-11-01T08:30:00.000Z');
  assert.equal(examScheduleValue('2026-11-01T03:00', zone,
    { utc: '2026-11-01T09:30:00.000Z', timeZone: zone }), '2026-11-01T03:00');
});

test('changed repeated-hour times and timezone changes into ambiguity are blocked', () => {
  const zone = 'America/Los_Angeles';
  assert.throws(() => examScheduleValue('2026-11-01T01:30', zone), /occurs twice/);
  assert.throws(() => examScheduleValue('2026-11-01T01:30', zone,
    { utc: '2026-11-01T07:30:00.000Z', timeZone: zone }), /occurs twice/);
  assert.throws(() => examScheduleValue('2026-11-01T01:30', zone,
    { utc: '2026-11-01T01:30:00.000Z', timeZone: 'UTC' }), /occurs twice/);
  assert.match(formatExamSchedulePreview('2026-11-01T01:30', zone), /occurs twice/);
});

test('spring-forward gaps are blocked rather than normalized to a different time', () => {
  assert.throws(() => examScheduleValue('2026-03-08T02:30', 'America/Los_Angeles'), /does not exist/);
  assert.match(formatExamSchedulePreview('2026-03-08T02:30', 'America/Los_Angeles'), /does not exist/);
  assert.equal(examScheduleValue('2026-03-08T03:30', 'America/Los_Angeles'), '2026-03-08T03:30');
});

test('missing, invalid and blank zones use display fallback but cannot alter scheduling', () => {
  for (const zone of [undefined, null, '', '   ', 'Invalid/Zone']) {
    assert.equal(examDisplayTimeZone(zone), 'Africa/Nairobi');
    assert.equal(formatExamDateTime('2026-11-20T06:00:00.000Z', zone), 'Nov 20, 2026, 9:00 AM');
    assert.equal(examDateTimeInput('2026-11-20T06:00:00.000Z', zone), '');
    assert.throws(() => requireExamTimeZone(zone), /valid exam timezone/);
    assert.throws(() => examScheduleValue('2026-11-20T09:00', zone,
      { utc: '2026-11-20T06:00:00.000Z', timeZone: zone }), /valid exam timezone/);
    assert.match(formatExamSchedulePreview('2026-11-20T09:00', zone), /valid exam timezone/);
  }
  assert.equal(requireExamTimeZone(' Africa/Nairobi '), 'Africa/Nairobi');
  assert.equal(examDisplayTimeZone(' America/Los_Angeles '), 'America/Los_Angeles');
});

test('invalid dates and offset-bearing user inputs cannot bypass changed-time validation', () => {
  for (const value of ['', '2026-02-30T09:00', '2026-11-20T09:00Z']) {
    assert.throws(() => examScheduleValue(value, 'Africa/Nairobi'), /valid exam date/);
  }
});

// Optional integration with an adjacent backend checkout; no frontend dependency
// on Luxon and no database access. Set EXAM_TIMEZONE_BACKEND_ROOT to override.
const backendHelper = path.resolve(process.env.EXAM_TIMEZONE_BACKEND_ROOT ||
  path.resolve(__dirname, '../../wired_modules_api'), 'utils/timezoneUtils.js');
test('actual backend Luxon parser preserves explicit UTC payloads and converts changed wall times',
  { skip: !fs.existsSync(backendHelper) && 'Backend checkout unavailable' }, () => {
    const { localToUtcISO } = require(backendHelper);
    for (const zone of ['Africa/Nairobi', 'America/Los_Angeles', 'Europe/London', 'Asia/Kolkata', 'UTC']) {
      for (const original of ['2026-11-01T08:30:00.000Z', '2026-11-01T09:30:00.000Z',
        '2026-11-20T06:00:00.000Z', '2026-07-20T06:15:27.123Z']) {
        let saved = original;
        for (let edit = 0; edit < 3; edit++) {
          const payload = examScheduleValue(examDateTimeInput(saved, zone), zone,
            { utc: saved, timeZone: zone });
          saved = localToUtcISO(payload, zone);
          assert.equal(saved, original, zone);
        }
      }
    }
    assert.equal(localToUtcISO(examScheduleValue('2026-11-20T09:00', 'Africa/Nairobi'),
      'Africa/Nairobi'), '2026-11-20T06:00:00.000Z');
    assert.equal(localToUtcISO(examScheduleValue('2026-11-01T03:30', 'America/Los_Angeles'),
      'America/Los_Angeles'), '2026-11-01T11:30:00.000Z');
  });

test('preview interprets datetime-local values in the selected zone', () => {
  assert.equal(formatExamSchedulePreview('2026-11-20T09:00', 'Africa/Nairobi'),
    'Nov 20, 2026, 9:00 AM');
  assert.equal(formatExamSchedulePreview('2026-11-19T22:00', 'America/Los_Angeles'),
    'Nov 19, 2026, 10:00 PM');
  assert.equal(formatExamSchedulePreview('', 'Africa/Nairobi'), 'Not Set');
});
