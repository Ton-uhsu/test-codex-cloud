import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { calculateNutrition, validateProfile, personalizedData, readProfile, writeProfile, PROFILE_KEY, GOALS, ACTIVITIES } from '../lib/nutrition.mjs';
import { buildMeals, foodNutrients } from '../lib/meals.mjs';
import { createSession, advanceSession, remainingRest } from '../lib/session.mjs';
import { workoutForDay } from '../lib/guide.mjs';

const data = JSON.parse(await readFile(new URL('../data/guide.json', import.meta.url), 'utf8'));
const profile = { goal: 'maintain', weight: 70, height: 175, age: 25, sex: 'male', activity: 'light', needsAdvice: false, startDay: 2 };
const state = { view: 'plan', today: 2, day: 2, muscle: 'all', profile, remember: false };

test('known Mifflin examples and daily energy use the correct sex constant and activity factor', () => {
  const result = calculateNutrition(profile);
  assert.equal(result.status, 'ready');
  assert.equal(result.resting, 1674); // 700 + 1093.75 - 125 + 5
  assert.equal(result.maintenance, 2301);
  assert.equal(result.calories, 2300);
  assert.deepEqual([result.protein, result.fat, result.carbs], [112, 77, 290]);
  assert.equal(calculateNutrition({ ...profile, sex: 'female' }).resting, 1508);
  assert.equal(calculateNutrition({ ...profile, activity: 'sedentary' }).maintenance, 2009);
  assert.equal(calculateNutrition({ ...profile, goal: 'lose' }).calories, 2070);
  assert.equal(calculateNutrition({ ...profile, goal: 'gain' }).calories, 2530);
});

test('empty, nonfinite, out-of-range, fractional age and unknown options cannot produce targets', () => {
  for (const change of [{ age: 17 }, { age: 25.5 }, { age: 81 }, { weight: 0 }, { weight: '' }, { weight: Infinity }, { weight: NaN }, { height: 1750 }, { height: -1 }, { sex: '' }, { goal: '__proto__' }, { activity: 'constructor' }, { needsAdvice: undefined }, { startDay: 7 }, { startDay: 1.5 }]) {
    assert.equal(calculateNutrition({ ...profile, ...change }).status, 'invalid', JSON.stringify(change));
  }
  assert.ok(Object.keys(validateProfile(null)).length);
});

test('special nutritional needs, underweight and unsupported targets are never silently clamped', () => {
  for (const change of [{ needsAdvice: true }, { weight: 45 }, { sex: 'female', age: 80, height: 150, weight: 45, activity: 'sedentary' }, { weight: 240, height: 210, activity: 'active' }]) {
    const result = calculateNutrition({ ...profile, ...change });
    assert.equal(result.status, 'unsupported');
    assert.equal(result.calories, undefined);
    assert.ok(result.message.length);
  }
});

test('meals use cooked USDA portions, include all ingredients and reconcile rounded totals', () => {
  assert.deepEqual(foodNutrients('egg', 100), { calories: 156, protein: 12, carbs: 2, fat: 10 });
  assert.deepEqual(foodNutrients('rice', 195), { calories: 216, protein: 5, carbs: 45, fat: 2 });
  assert.throws(() => foodNutrients('chicken', -100));
  assert.throws(() => buildMeals({ status: 'unsupported' }));
  const smaller = calculateNutrition({ ...profile, weight: 35, height: 120, activity: 'active', goal: 'gain' });
  assert.equal(smaller.status, 'ready');
  const smallPlan = buildMeals(smaller);
  assert.ok(Math.abs(smallPlan.totals.protein - smaller.protein) <= 5);
  assert.ok(Math.abs(smallPlan.totals.calories - smaller.calories) < smaller.calories * .08);
  for (const weight of [55, 70, 95]) for (const goal of Object.keys(GOALS)) for (const activity of Object.keys(ACTIVITIES)) {
    const r = calculateNutrition({ ...profile, weight, goal, activity });
    if (r.status !== 'ready') continue;
    const plan = buildMeals(r);
    assert.equal(plan.meals.length, 4);
    for (const key of ['calories', 'protein', 'carbs', 'fat']) {
      assert.equal(plan.totals[key], plan.meals.reduce((sum, m) => sum + m[key], 0));
      for (const meal of plan.meals) {
        assert.equal(meal[key], Math.round(meal.items.reduce((sum, item) => sum + foodNutrients(item.id, item.grams)[key], 0)));
        assert.ok(meal.items.every((item) => item.grams > 0 && Number.isFinite(item.grams)));
      }
    }
    assert.ok(Math.abs(plan.totals.calories - r.calories) < r.calories * .08);
    assert.ok(Math.abs(plan.totals.protein - r.protein) <= 5);
    assert.ok(Math.abs(plan.totals.carbs - r.carbs) <= 5);
    assert.ok(Math.abs(plan.totals.fat - r.fat) <= 6);
    assert.ok(Math.abs(r.protein * 4 + r.carbs * 4 + r.fat * 9 - r.calories) <= 2);
  }
});

test('profile storage is opt-in, validates restoration, removes only this app key, and handles denial', () => {
  const map = new Map([['unrelated', 'keep']]);
  const storage = { getItem: (k) => map.get(k), setItem: (k, v) => map.set(k, v), removeItem: (k) => map.delete(k) };
  assert.equal(readProfile(storage), null);
  assert.equal(writeProfile(storage, profile, true), true);
  assert.deepEqual(readProfile(storage), profile);
  assert.ok(!map.get(PROFILE_KEY).includes('calories'));
  writeProfile(storage, profile, false);
  assert.equal(readProfile(storage), null);
  assert.equal(map.get('unrelated'), 'keep');
  for (const value of ['broken', 'null', '{"version":9}', JSON.stringify({ version: 1, profile: { ...profile, age: 8 } })]) {
    map.set(PROFILE_KEY, value); assert.equal(readProfile(storage), null);
  }
  const blocked = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('quota'); }, removeItem() { throw new Error('denied'); } };
  assert.equal(readProfile(blocked), null);
  assert.equal(writeProfile(blocked, profile, true), false);
  assert.equal(writeProfile(blocked, null, false), false);
  assert.equal(writeProfile(storage, { ...profile, weight: 0 }, true), false);
});

test('all starting weekdays produce A/B with recovery between both weeks and preserve source data', () => {
  for (let day = 0; day < 7; day++) {
    const personalized = personalizedData(data, { ...profile, startDay: day });
    assert.equal(workoutForDay(personalized, day).key, 'A');
    assert.equal(workoutForDay(personalized, (day + 3) % 7).key, 'B');
    assert.equal(personalized.program.weekly.filter(Boolean).length, 2);
    for (let i = 0; i < 7; i++) assert.ok(!(personalized.program.weekly[i] && personalized.program.weekly[(i + 1) % 7]));
  }
  assert.deepEqual(data.program.weekly, [null, 'A', null, null, 'B', null, null]);
});

test('a complete guided workout has ten sets, real rests and a terminal finish', () => {
  const workout = workoutForDay(data, 1);
  let s = createSession(workout);
  assert.equal(s.phase, 'warmup');
  s = advanceSession(s, workout, 'ready', 0);
  for (let index = 0; index < 5; index++) for (let set = 1; set <= 2; set++) {
    assert.equal(s.index, index); assert.equal(s.set, set); assert.equal(s.phase, 'exercise');
    s = advanceSession(s, workout, 'complete', 1000);
    assert.equal(s.completedSets, index * 2 + set);
    if (index === 4 && set === 2) break;
    assert.equal(remainingRest(s, 1000), 90);
    assert.deepEqual(advanceSession(s, workout, 'complete', 1000), s, 'double tap cannot complete another set');
    assert.deepEqual(advanceSession(s, workout, 'continue', 5000), s, 'rest must finish first');
    assert.equal(remainingRest(s, 200000), 0, 'elapsed time survives inactive tabs');
    s = advanceSession(s, workout, 'continue', 200000);
  }
  assert.equal(s.phase, 'done');
  assert.equal(s.completedSets, 10);
  assert.deepEqual(advanceSession(s, workout, 'complete', 400000), s);
});

test('extend, skip and resume preserve counts without declaring skipped sets complete', () => {
  const workout = workoutForDay(data, 1);
  const original = createSession(workout);
  let s = advanceSession(original, workout, 'ready', 0);
  s = advanceSession(s, workout, 'complete', 0);
  s = advanceSession(s, workout, 'extend', 100000);
  assert.equal(remainingRest(s, 100000), 30);
  s = advanceSession(s, workout, 'continue', 130000);
  assert.equal(s.set, 2);
  while (s.phase !== 'done') s = advanceSession(s, workout, 'skip', 130000);
  assert.equal(s.completedSets, 1);
  assert.equal(s.skipped.length, 5);
  assert.equal(original.phase, 'warmup');
  assert.deepEqual(original.skipped, []);
});
