export const MUSCLES = Object.freeze({
  all: 'ทั้งหมด', chest: 'อก', back: 'หลัง', shoulders: 'ไหล่', legs: 'ขา / สะโพก',
});

export const DAYS = Object.freeze(['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']);
export const WEEK_ORDER = Object.freeze([1, 2, 3, 4, 5, 6, 0]);

export function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

export function safeSourceURL(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error('Source links must be public HTTPS URLs');
  }
  return url.href;
}

export function localDay(date = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new TypeError('A valid date is required');
  }
  return date.getDay();
}

export function localDateKey(date = new Date()) {
  localDay(date);
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');
}

export function viewFromHash(hash) {
  const view = hash.replace(/^#/, '');
  return ['today', 'library', 'guide'].includes(view) ? view : 'today';
}

export function filterExercises(data, muscle = 'all') {
  if (!Object.hasOwn(MUSCLES, muscle)) return [];
  return data.exercises.filter((exercise) => muscle === 'all' || exercise.muscle === muscle);
}

export function workoutForDay(data, day) {
  if (!Number.isInteger(day) || day < 0 || day > 6) throw new RangeError('Invalid weekday');
  const key = data.program.weekly[day];
  if (!key) return null;
  const workout = data.program.workouts[key];
  return { ...workout, key, exercises: workout.exercises.map((id) => data.exercises.find((e) => e.id === id)) };
}

export function nextTrainingDay(data, fromDay) {
  workoutForDay(data, fromDay);
  for (let offset = 1; offset <= 7; offset += 1) {
    const day = (fromDay + offset) % 7;
    if (workoutForDay(data, day)) return day;
  }
  return null;
}

export function validateGuide(data) {
  const require = (condition, message) => { if (!condition) throw new Error(`Invalid guide: ${message}`); };
  const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
  require(data && data.schemaVersion === 1, 'schema version');
  const reviewDate = new Date(data.reviewedAt);
  require(typeof data.reviewedAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.reviewedAt) &&
    !Number.isNaN(reviewDate.getTime()) && reviewDate.toISOString().slice(0, 10) === data.reviewedAt, 'review date');
  require(data.sources && typeof data.sources === 'object', 'sources');
  for (const source of Object.values(data.sources)) {
    require(source && hasText(source.name) && hasText(source.url), 'source fields');
    safeSourceURL(source.url);
  }
  const sourceExists = (id) => Object.hasOwn(data.sources, id);
  require(['acsm', 'nhs-strength', 'mayo', 'rest'].every(sourceExists), 'general sources');
  require(Array.isArray(data.exercises) && data.exercises.length > 0, 'exercise list');
  const ids = new Set();
  for (const exercise of data.exercises) {
    require(exercise && /^[a-z][a-z0-9-]*$/.test(exercise.id) && !ids.has(exercise.id), 'unique exercise id');
    ids.add(exercise.id);
    require(['name', 'englishName', 'equipment', 'target', 'caution'].every((key) => hasText(exercise[key])), 'exercise fields');
    require(exercise.muscle !== 'all' && Object.hasOwn(MUSCLES, exercise.muscle), 'muscle');
    require(Array.isArray(exercise.steps) && exercise.steps.length >= 3 && exercise.steps.every(hasText), 'steps');
    require(['sets', 'repsMin', 'repsMax', 'restSeconds'].every((key) => Number.isInteger(exercise[key]) && exercise[key] > 0), 'dose');
    require(exercise.repsMin <= exercise.repsMax, 'repetition range');
    require(sourceExists(exercise.techniqueSource) && sourceExists(exercise.doseSource), 'exercise sources');
  }
  const program = data.program;
  require(program && ['name', 'audience', 'provenance', 'doseNote', 'restNote'].every((key) => hasText(program[key])), 'program fields');
  require(Array.isArray(program.sources) && program.sources.length > 0 && program.sources.every(sourceExists), 'program sources');
  require(program.workouts && Object.keys(program.workouts).length > 0, 'workouts');
  for (const [key, workout] of Object.entries(program.workouts)) {
    require(/^[A-Z]$/.test(key) && workout && hasText(workout.name) && hasText(workout.description), 'workout fields');
    require(Array.isArray(workout.exercises) && workout.exercises.length > 0 && workout.exercises.every((id) => ids.has(id)), 'workout exercise ids');
    require(new Set(workout.exercises).size === workout.exercises.length, 'duplicate workout exercise');
  }
  require(Array.isArray(program.weekly) && program.weekly.length === 7, 'weekly schedule');
  require(program.weekly.every((key) => key === null || Object.hasOwn(program.workouts, key)), 'scheduled workout');
  require(program.weekly.some(Boolean), 'at least one training day');
  return data;
}

export async function loadGuide(url, { fetcher = globalThis.fetch, timeoutMs = 10000 } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Guide request failed (${response.status})`);
    return validateGuide(await response.json());
  } finally {
    clearTimeout(timeout);
  }
}
