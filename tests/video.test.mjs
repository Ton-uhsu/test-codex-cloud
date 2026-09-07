import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { youtubeLinks, videoPreview, playVideo, stopVideos } from '../lib/video.mjs';
import { renderView } from '../lib/views.mjs';

const data = JSON.parse(await readFile(new URL('../data/guide.json', import.meta.url), 'utf8'));

test('every exercise has a specific video and needs no machine, barbell or bench', () => {
  const ids = new Set();
  for (const e of data.exercises) {
    const urls = youtubeLinks(e.video.youtubeId);
    ids.add(e.video.youtubeId);
    assert.ok(e.video.title && e.video.channel && e.video.sourceUrl);
    assert.equal(e.video.language, 'en');
    assert.equal(new URL(urls.embed).hostname, 'www.youtube-nocookie.com');
    assert.ok(e.equipmentTypes.every((type) => ['dumbbell', 'bodyweight', 'floor', 'wall'].includes(type)));
    assert.doesNotMatch(e.equipment, /machine|bench|barbell|เครื่อง|ม้านั่ง/i);
    assert.doesNotMatch(videoPreview(e), /<iframe/);
    assert.match(videoPreview(e), /data-play-video/);
  }
  assert.equal(ids.size, 10);
  for (const workout of Object.values(data.program.workouts)) {
    assert.ok(!workout.exercises.includes('dumbbell-rdl'));
    assert.ok(!workout.exercises.includes('reverse-fly'));
  }
  assert.match(data.exercises.find((e) => e.id === 'dumbbell-rdl').learningNote, /ระดับกลาง/);
  const html = renderView(data, { view: 'library', muscle: 'all' });
  assert.equal((html.match(/data-play-video=/g) || []).length, 10);
  assert.equal((html.match(/เปิดใน YouTube/g) || []).length, 10);
  assert.doesNotMatch(html, /<iframe/);
});

test('only exact YouTube IDs can build embed URLs and video labels are escaped', () => {
  for (const id of ['bad', '../etc/passwd', 'https://youtube.com/watch?v=123', 'abc" onload="', null, ['uUGDRwge4F8']]) {
    assert.throws(() => youtubeLinks(id), /Invalid YouTube/);
  }
  const unsafe = { ...data.exercises[0], name: '<script>alert(1)</script>' };
  assert.doesNotMatch(videoPreview(unsafe), /<script>/);
  assert.match(videoPreview(unsafe), /&lt;script&gt;/);
});

test('player lifecycle is click-to-load, single-player, and removable on collapse', () => {
  // Lightweight fakes check lifecycle logic only; this is not a browser playback test.
  const containers = new Map(data.exercises.map((e) => [e.id, {
    innerHTML: videoPreview(e), frame: null,
    replaceChildren(frame) { this.innerHTML = ''; this.frame = frame; frame.parentElement = this; },
  }]));
  const root = {
    querySelectorAll() { return [...containers.values()].map((c) => c.frame).filter(Boolean); },
    querySelector(selector) { return containers.get(selector.match(/="([^"]+)"/)[1]); },
  };
  const doc = { createElement(tag) {
    assert.equal(tag, 'iframe');
    return { dataset: {}, focus() { this.focused = true; }, remove() { this.parentElement.frame = null; } };
  } };
  assert.equal(root.querySelectorAll().length, 0);
  playVideo(root, data.exercises[0], data.exercises, doc);
  const first = root.querySelectorAll()[0];
  assert.equal(first.src, youtubeLinks(data.exercises[0].video.youtubeId).embed);
  assert.equal(first.referrerPolicy, 'strict-origin-when-cross-origin');
  assert.equal(first.allowFullscreen, true);
  assert.ok(first.focused);
  playVideo(root, data.exercises[1], data.exercises, doc);
  assert.equal(root.querySelectorAll().length, 1);
  assert.equal(root.querySelectorAll()[0].dataset.exerciseVideo, data.exercises[1].id);
  assert.match(containers.get(data.exercises[0].id).innerHTML, /data-play-video/);
  stopVideos(root, data.exercises);
  assert.equal(root.querySelectorAll().length, 0);
  assert.match(containers.get(data.exercises[1].id).innerHTML, /data-play-video/);
});
