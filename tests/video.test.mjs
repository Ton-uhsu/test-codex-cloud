import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { youtubeLinks } from '../lib/video.mjs';

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
  }
  assert.equal(ids.size, 10);
  for (const workout of Object.values(data.program.workouts)) {
    assert.ok(!workout.exercises.includes('dumbbell-rdl'));
    assert.ok(!workout.exercises.includes('reverse-fly'));
  }
  assert.match(data.exercises.find((e) => e.id === 'dumbbell-rdl').learningNote, /ระดับกลาง/);

});

test('only exact YouTube IDs can build embed URLs and video labels are escaped', () => {
  for (const id of ['bad', '../etc/passwd', 'https://youtube.com/watch?v=123', 'abc" onload="', null, ['uUGDRwge4F8']]) {
    assert.throws(() => youtubeLinks(id), /Invalid YouTube/);
  }

});
