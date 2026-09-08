import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createFollow, stepFollow, followRemaining } from '../lib/follow-state.mjs';
import { FOLLOW_ID, openFollow } from '../lib/follow-along.mjs';
const data = JSON.parse(await readFile(new URL('../data/guide.json', import.meta.url)));
const exercise = data.exercises.find(e => e.id === FOLLOW_ID);

test('clock time cannot count reps, partial cycles restart, and confirmation is idempotent', () => {
  for (const reps of [8, 10, 12]) {
    let s = createFollow(reps);
    s = stepFollow(s, 'start', 0);
    assert.equal(followRemaining(s, 1000), 4);
    assert.equal(stepFollow(s, 'tick', 4999).phase, 'prep');
    s = stepFollow(s, 'tick', 5000);
    assert.equal(s.phase, 'loading');
    assert.equal(stepFollow(s, 'tick', 1e9).completed, 0);
    s = stepFollow(s, 'playing');
    s = stepFollow(s, 'pause');
    assert.equal(stepFollow(s, 'ended').completed, 0);
    s = stepFollow(stepFollow(s, 'start', 0), 'tick', 5000);
    for (let i = 0; i < reps; i++) {
      s = stepFollow(s, 'playing');
      s = stepFollow(s, 'ended');
      assert.equal(s.completed, i + 1);
      assert.deepEqual(stepFollow(s, 'ended'), s, 'duplicate ended event cannot count another cycle');
    }
    assert.equal(s.phase, 'confirm');
    assert.equal(stepFollow(s, 'tick', 1e9).phase, 'confirm');
    s = stepFollow(s, 'confirm', 100);
    assert.equal(followRemaining(s, 100), 90);
    assert.deepEqual(stepFollow(s, 'confirm', 3000), s);
    s = stepFollow(s, 'extend', 100);
    assert.equal(followRemaining(s, 100), 120);
    assert.equal(stepFollow(s, 'tick', 120100).phase, 'done');
  }
  assert.throws(() => createFollow(100));
});

test('only reviewed exercise exposes a coach, with a separate practice entry and asset provenance', async () => {
  const credits = JSON.parse(await readFile(new URL('../public/assets/exercises/credits.json', import.meta.url)));
  assert.equal(credits.sourceRecord.license, credits.sourceLicense.id);
  assert.equal(credits.sourceRecord.license_author, 'Goulart');
  for (const [name, info] of Object.entries(credits.files)) {
    const bytes = await readFile(new URL(`../public/assets/exercises/${name}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), info.sha256);
    assert.equal(bytes.length, info.bytes);
    assert.ok(bytes.length < 500000);
  }
});

// Event fakes exercise production lifecycle code, not browser rendering or codecs.
function harness(t, options = {}) {
  const nodes = new Map();
  class Element extends EventTarget {
    setAttribute(k, v) { this[k] = v; }
    removeAttribute(k) { delete this[k]; }
    querySelector(k) { if (!nodes.has(k)) nodes.set(k, new Element()); return nodes.get(k); }
    pause() { this.paused = true; }
    play() { this.paused = false; return options.play ? options.play() : Promise.resolve(); }
    load() {}
    showModal() { this.open = true; }
    close() { this.open = false; }
    remove() { this.removed = true; }
  }
  const dialog = new Element(), doc = new Element();
  doc.createElement = () => dialog; doc.body = { append() {} }; doc.hidden = false;
  const saved = { document: globalThis.document, window: globalThis.window, setInterval: globalThis.setInterval, clearInterval: globalThis.clearInterval, now: Date.now };
  let clock, now = 0, cleared = false, completed = 0, cancellations = 0;
  globalThis.document = doc;
  globalThis.window = { speechSynthesis: Object.assign(new Element(), { getVoices: () => [], cancel() { cancellations++; } }) };
  globalThis.setInterval = fn => { clock = fn; return 1; };
  globalThis.clearInterval = () => { cleared = true; };
  Date.now = () => now;
  const close = openFollow(exercise, { onComplete: options.standalone ? null : () => completed++ });
  t.after(() => { close(); Object.assign(globalThis, { document: saved.document, window: saved.window, setInterval: saved.setInterval, clearInterval: saved.clearInterval }); Date.now = saved.now; });
  const event = (target, type) => target.dispatchEvent(new Event(type));
  return { nodes, dialog, doc, close,
    click(attr) {
      const e = new Event('click');
      Object.defineProperty(e, 'target', { value: { closest: () => ({ hasAttribute: k => k === attr }) } });
      dialog.dispatchEvent(e);
    },
    async tick(ms) { now = ms; clock(); await Promise.resolve(); await Promise.resolve(); },
    async end() { event(nodes.get('video'), 'ended'); await Promise.resolve(); },
    hide() { doc.hidden = true; event(doc, 'visibilitychange'); },
    stall() { event(nodes.get('video'), 'waiting'); },
    get completed() { return completed; }, get cleared() { return cleared; }, get cancellations() { return cancellations; },
  };
}

test('real player stops on hidden tabs and stalls, preserves count, and confirms exactly once', async t => {
  const h = harness(t);
  assert.match(h.nodes.get('[data-voice-status]').textContent, /ยังไม่พบเสียงไทย/);
  h.click('data-start'); await h.tick(5000);
  await h.end();
  assert.equal(h.nodes.get('[data-count]').textContent, '1 / 8 จังหวะ');
  h.hide(); await h.end();
  assert.equal(h.nodes.get('[data-count]').textContent, '1 / 8 จังหวะ');
  assert.equal(h.nodes.get('video').paused, true);
  h.doc.hidden = false; h.click('data-start'); await h.tick(10000);
  h.stall(); await h.end();
  assert.equal(h.nodes.get('[data-count]').textContent, '1 / 8 จังหวะ');
  h.click('data-start'); await h.tick(15000);
  for (let i = 0; i < 7; i++) await h.end();
  assert.equal(h.completed, 0);
  assert.equal(h.nodes.get('[data-confirm]').hidden, false);
  h.click('data-confirm'); h.click('data-confirm');
  assert.equal(h.completed, 1);
  assert.equal(h.cleared, true);
  assert.ok(h.cancellations > 0);
  assert.equal(h.dialog.removed, true);
});

test('play rejection and late promise after closing cannot count or complete a set', async t => {
  const h = harness(t, { play: () => Promise.reject(new Error('blocked')) });
  h.click('data-start'); await h.tick(5000); await h.end();
  assert.match(h.nodes.get('[data-cue]').textContent, /วิดีโอเล่นไม่ได้/);
  assert.equal(h.nodes.get('[data-start]').hidden, false);
  assert.equal(h.nodes.get('[data-count]').textContent, '0 / 8 จังหวะ');
  assert.equal(h.completed, 0);
});

test('closing while video play is pending invalidates the continuation', async t => {
  let resolve;
  const pending = new Promise(r => { resolve = r; });
  const h = harness(t, { play: () => pending });
  h.click('data-start'); await h.tick(5000);
  h.close(); resolve(); await Promise.resolve(); await h.end();
  assert.equal(h.nodes.get('[data-count]').textContent, '0 / 8 จังหวะ');
  assert.equal(h.completed, 0);
  assert.equal(h.cleared, true);
});

test('standalone practice offers a real rest and never changes workout progress', async t => {
  const h = harness(t, { standalone: true });
  h.click('data-start'); await h.tick(5000);
  for (let i = 0; i < 8; i++) await h.end();
  h.click('data-confirm'); await h.tick(35000);
  assert.match(h.nodes.get('[data-cue]').textContent, /60 วินาที/);
  h.click('data-extend'); await h.tick(95000);
  assert.match(h.nodes.get('[data-cue]').textContent, /30 วินาที/);
  await h.tick(125000);
  assert.equal(h.nodes.get('[data-start]').textContent, 'เริ่มเซ็ตใหม่');
  assert.equal(h.completed, 0);
});
