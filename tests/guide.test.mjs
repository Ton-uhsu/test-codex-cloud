import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { DAYS, MUSCLES, escapeHTML, safeSourceURL, localDay, localDateKey, viewFromHash,
  filterExercises, workoutForDay, nextTrainingDay, validateGuide, loadGuide } from '../lib/guide.mjs';
import { sourceLink, exerciseCard, renderView } from '../lib/views.mjs';

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
  assert.equal(viewFromHash('#unknown'), 'today');
  assert.equal(viewFromHash(''), 'today');
});

test('HTML escaping and external-link validation reject executable content', () => {
  assert.equal(escapeHTML('<script>"\'&'), '&lt;script&gt;&quot;&#39;&amp;');
  for (const url of ['javascript:alert(1)', 'data:text/html,hi', 'http://example.com', '/local', 'https://user:password@example.com']) {
    assert.throws(() => safeSourceURL(url));
  }
  const link = sourceLink(data, 'acsm', '<img onerror="alert(1)">');
  assert.ok(link.includes('&lt;img'));
  assert.ok(link.includes('rel="noopener noreferrer"'));
  assert.ok(!link.includes('<img'));
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

test('every day renders the correct workout or a usable rest-day action', () => {
  for (let day = 0; day < 7; day += 1) {
    const html = renderView(data, { ...state, day });
    const isTraining = Boolean(data.program.weekly[day]);
    assert.equal((html.match(/<details class="exercise"(?: open)?>/g) || []).length, isTraining ? 5 : 0);
    assert.equal((html.match(/<details class="exercise" open>/g) || []).length, isTraining ? 1 : 0);
    assert.equal((html.match(/class="day"[^>]*aria-pressed="true"/g) || []).length, 1);
    assert.ok(html.includes(`data-day="${day}" aria-pressed="true"`));
    if (!isTraining) assert.ok(html.includes(`ดูวันฝึกถัดไป · ${DAYS[nextTrainingDay(data, day)]}`));
    assert.ok(html.includes('ข้อจำกัดในการเคลื่อนไหว'));
    assert.ok(!html.includes('undefined'));
  }
});

test('library filters render correct counts, and guide lists every source', () => {
  for (const muscle of Object.keys(MUSCLES)) {
    const html = renderView(data, { ...state, view: 'library', muscle });
    assert.equal((html.match(/<details class="exercise">/g) || []).length, filterExercises(data, muscle).length);
    assert.ok(html.includes(`data-muscle="${muscle}" aria-pressed="true"`));
  }
  const html = renderView(data, { ...state, view: 'guide' });
  for (const source of Object.values(data.sources)) assert.ok(html.includes(escapeHTML(source.url)));
  assert.ok(html.includes(data.reviewedAt));
  assert.ok(html.includes('ไม่ใช่โปรแกรมเฉพาะบุคคล'));
});

test('exercise cards expose full steps, dose, equipment, cautions and provenance', () => {
  for (const exercise of data.exercises) {
    const html = exerciseCard(data, exercise);
    assert.ok(html.includes('<summary>'));
    assert.equal((html.match(/<li>/g) || []).length, exercise.steps.length);
    for (const text of [exercise.name, exercise.englishName, exercise.equipment, exercise.caution]) {
      assert.ok(html.includes(escapeHTML(text)));
    }
    assert.ok(html.includes(escapeHTML(data.sources[exercise.techniqueSource].url)));
    assert.ok(html.includes('อ่านวิธีทำต้นฉบับ'));
    assert.ok(html.includes(`data-play-video="${exercise.id}"`));
    assert.ok(html.includes(`https://www.youtube.com/watch?v=${exercise.video.youtubeId}`));
  }
  const unsafe = { ...data.exercises[0], name: '<img src=x onerror=alert(1)>', steps: ['<script>alert(1)</script>'] };
  const html = exerciseCard(data, unsafe);
  assert.ok(!html.includes('<script>') && !html.includes('<img src=x'));
  assert.ok(html.includes('&lt;img src=x'));
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

test('entrypoint, modules and JSON use existing relative assets under the GitHub Pages subpath', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  assert.ok(html.includes('<html lang="th">'));
  assert.ok(html.includes('<noscript>'));
  assert.ok(html.includes('type="module"'));
  const assets = [...html.matchAll(/(?:href|src)="(\.\/[^"#]+)"/g)].map((match) => match[1]);
  assert.equal(assets.length, 2);
  for (const asset of assets) await access(new URL(asset.split('?')[0], root));
  for (const path of ['app.js', 'lib/guide.mjs', 'lib/views.mjs', 'lib/video.mjs']) {
    const text = await readFile(new URL(path, root), 'utf8');
    for (const match of text.matchAll(/from '(\.[^']+)'/g)) await access(new URL(match[1], new URL(path, root)));
  }
  const app = await readFile(new URL('app.js', root), 'utf8');
  assert.ok(app.includes("new URL('./data/guide.json?v=3', import.meta.url)"));
  assert.equal(new URL('./data/guide.json', 'https://ton-uhsu.github.io/test-codex-cloud/app.js').pathname, '/test-codex-cloud/data/guide.json');
  await access(new URL('data/guide.json', root));
  await access(new URL('.nojekyll', root));
});
