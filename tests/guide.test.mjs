import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { DAYS, MUSCLES, escapeHTML, safeSourceURL, localDay, localDateKey, viewFromHash,
  filterExercises, workoutForDay, nextTrainingDay, validateGuide, loadGuide } from '../lib/guide.mjs';

const root = new URL('../', import.meta.url);
const data = JSON.parse(await readFile(new URL('data/guide.json', root), 'utf8'));
const state = { view: 'today', today: 1, day: 1, muscle: 'all' };

test('all published exercise data passes validation', () => {
  assert.equal(validateGuide(data), data);
  assert.equal(data.exercises.length, 10);
  assert.deepEqual(Object.keys(MUSCLES).slice(1).map((muscle) => filterExercises(data, muscle).length), [2, 2, 2, 4]);
  assert.ok(data.exercises.every((e) => e.sets === 2 && e.restSeconds === 90));
  assert.deepEqual([data.exercises.find((e) => e.id === 'wall-pushup').repsMin, data.exercises.find((e) => e.id === 'wall-pushup').repsMax], [5, 10]);
});

test('A/B each cover chest, back, shoulders and legs with five unique exercises', () => {
  for (const day of [1, 4]) {
    const workout = workoutForDay(data, day);
    assert.equal(workout.exercises.length, 5);
    assert.equal(new Set(workout.exercises.map((e) => e.id)).size, 5);
    assert.deepEqual([...new Set(workout.exercises.map((e) => e.muscle))].sort(), ['back', 'chest', 'legs', 'shoulders']);
  }
});

test('the seven-day schedule includes recovery and wraps across Sunday', () => {
  assert.deepEqual(Array.from({ length: 7 }, (_, day) => workoutForDay(data, day)?.key || null), [null, 'A', null, null, 'B', null, null]);
  for (let day = 0; day < 7; day += 1) {
    assert.ok(!(workoutForDay(data, day) && workoutForDay(data, (day + 1) % 7)), 'No back-to-back full-body days');
  }
  assert.equal(nextTrainingDay(data, 1), 4);
  assert.equal(nextTrainingDay(data, 4), 1);
  assert.equal(nextTrainingDay(data, 0), 1);
  assert.throws(() => workoutForDay(data, 7), RangeError);
  assert.throws(() => nextTrainingDay(data, -1), RangeError);
});

test('dates use local weekdays, not UTC, including Thailand around midnight', () => {
  assert.equal(localDay(new Date(2026, 8, 7, 12)), 1);
  assert.equal(localDateKey(new Date(2026, 8, 7, 12)), '2026-9-7');
  assert.throws(() => localDay(new Date('invalid')), TypeError);
  const moduleURL = new URL('lib/guide.mjs', root).href;
  const script = `import {localDay,localDateKey} from '${moduleURL}'; const d=new Date('2026-09-06T18:00:00Z'); console.log(JSON.stringify([localDay(d),localDateKey(d)]));`;
  const run = (timezone) => JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', script], { env: { ...process.env, TZ: timezone }, encoding: 'utf8' }));
  assert.deepEqual(run('Asia/Bangkok'), [1, '2026-9-7']);
  assert.deepEqual(run('America/Los_Angeles'), [0, '2026-9-6']);
});

test('filters return only the requested muscle without mutating the source', () => {
  assert.equal(filterExercises(data, 'all').length, 10);
  assert.ok(filterExercises(data, 'chest').every((e) => e.muscle === 'chest'));
  assert.deepEqual(filterExercises(data, 'unknown'), []);
  assert.deepEqual(filterExercises(data, '__proto__'), []);
  assert.equal(data.exercises.length, 10);
});

test('hash navigation has a deterministic fallback', () => {
  assert.equal(viewFromHash('#today'), 'today');
  assert.equal(viewFromHash('#library'), 'library');
  assert.equal(viewFromHash('#guide'), 'guide');
  for (const view of ['plan', 'setup', 'nutrition']) assert.equal(viewFromHash(`#${view}`), view);
  assert.equal(viewFromHash('#unknown'), 'home');
  assert.equal(viewFromHash(''), 'home');
});

test('HTML escaping and external-link validation reject executable content', () => {
  assert.equal(escapeHTML('<script>"\'&'), '&lt;script&gt;&quot;&#39;&amp;');
  for (const url of ['javascript:alert(1)', 'data:text/html,hi', 'http://example.com', '/local', 'https://user:password@example.com']) {
    assert.throws(() => safeSourceURL(url));
  }
});

test('invalid or incomplete data fails closed before rendering', () => {
  const cases = [
    (d) => { d.schemaVersion = 99; },
    (d) => { d.reviewedAt = '2026-02-31'; },
    (d) => { d.reviewedAt = '2026-99-99'; },
    (d) => { d.exercises[0].id = d.exercises[1].id; },
    (d) => { d.exercises[0].steps = []; },
    (d) => { d.exercises[0].sets = '2<script>'; },
    (d) => { d.exercises[0].repsMax = 1; },
    (d) => { d.exercises[0].muscle = 'unknown'; },
    (d) => { d.exercises[0].techniqueSource = 'missing'; },
    (d) => { d.exercises[0].equipmentTypes = ['machine']; },
    (d) => { d.exercises[0].equipmentTypes = ['bench']; },
    (d) => { delete d.exercises[0].video; },
    (d) => { d.exercises[0].video.youtubeId = 'bad-id'; },
    (d) => { d.exercises[0].video.sourceUrl = 'javascript:alert(1)'; },
    (d) => { d.sources.acsm.url = 'javascript:alert(1)'; },
    (d) => { d.program.workouts.A.exercises.push('missing'); },
    (d) => { d.program.weekly = [null]; },
    (d) => { d.program.weekly[0] = 'C'; },
    (d) => { d.program.weekly = Array(7).fill(null); },
  ];
  for (const mutate of cases) {
    const invalid = structuredClone(data);
    mutate(invalid);
    assert.throws(() => validateGuide(invalid));
  }
});

test('data loading handles success, HTTP errors, malformed JSON and schema errors', async () => {
  const result = await loadGuide('https://example.com/guide.json', { fetcher: async () => ({ ok: true, json: async () => structuredClone(data) }) });
  assert.equal(result.exercises.length, 10);
  await assert.rejects(loadGuide('https://example.com/guide.json', { fetcher: async () => ({ ok: false, status: 404 }) }), /404/);
  await assert.rejects(loadGuide('https://example.com/guide.json', { fetcher: async () => ({ ok: true, json: async () => { throw new SyntaxError('JSON'); } }) }), SyntaxError);
  await assert.rejects(loadGuide('https://example.com/guide.json', { fetcher: async () => ({ ok: true, json: async () => ({}) }) }), /Invalid guide/);
});

test('data loading aborts a stalled request', async () => {
  const fetcher = (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
  });
  await assert.rejects(loadGuide('https://example.com/guide.json', { fetcher, timeoutMs: 15 }), /aborted/);
});
