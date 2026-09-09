import { createSession, advanceSession } from './session.mjs';
export const TRAINING_KEY = 'beginner-strength.training.v1';
export const emptyTraining = () => ({version: 1, session: null, logs: [], drafts: {}});
export function validResult(result) {
  return result && Number.isFinite(result.weight) && result.weight >= 0 && result.weight <= 200 && Number.isInteger(result.reps) && result.reps >= 0 && result.reps <= 100;
}
export function setKey(s) { return `${s.id}:${s.index}:${s.set}`; }
export function startTraining(state, workout, id, now = Date.now()) {
  if (state.session && state.session.phase !== 'done') return state;
  return {...state, drafts: {}, session: {...createSession(workout), id, startedAt: now}};
}
export function recordSet(state, workout, result, expectedKey, now = Date.now()) {
  const s = state.session;
  if (!s || s.phase !== 'exercise' || setKey(s) !== expectedKey || !validResult(result)) return state;
  const e = workout.exercises[s.index];
  if (!e || state.logs.some(l => l.key === expectedKey)) return state;
  const log = {key: expectedKey, sessionId: s.id, exerciseId: e.id, set: s.set, weight: result.weight, reps: result.reps, at: now};
  const drafts = {...state.drafts}; delete drafts[expectedKey];
  return {...state, drafts, logs: [...state.logs, log].slice(-1000), session: advanceSession(s, workout, 'complete', now)};
}
export function lastResult(logs, exerciseId) { return logs.findLast(l => l.exerciseId === exerciseId); }
export function readTraining(storage, guide) {
  try {
    const raw = storage?.getItem(TRAINING_KEY);
    if (!raw) return emptyTraining();
    const v = JSON.parse(raw), ids = new Set(guide.exercises.map(e => e.id));
    if (v.version !== 1 || !Array.isArray(v.logs) || v.logs.length > 1000 || !v.drafts || typeof v.drafts !== 'object' || Array.isArray(v.drafts)) return emptyTraining();
    const validLog = l => validResult(l) && typeof l.key === 'string' && typeof l.sessionId === 'string' && ids.has(l.exerciseId) && Number.isInteger(l.set) && l.set > 0 && Number.isFinite(l.at);
    if (!v.logs.every(validLog) || new Set(v.logs.map(l => l.key)).size !== v.logs.length) return emptyTraining();
    const s = v.session;
    if (s) {
      const config = guide.program.workouts[s.key];
      if (!config || typeof s.id !== 'string' || !s.id || !Number.isFinite(s.startedAt) || !Number.isInteger(s.index) || s.index < 0 || s.index > config.exercises.length || !['warmup','exercise','rest','done'].includes(s.phase) || !Array.isArray(s.skipped) || !s.skipped.every(id => config.exercises.includes(id)) || !Number.isInteger(s.completedSets) || s.completedSets < 0) return emptyTraining();
      const exercises = config.exercises.map(id => guide.exercises.find(e => e.id === id));
      const e = exercises[s.index];
      if ((s.phase !== 'done' && !e) || !Number.isInteger(s.set) || s.set < 1 || (e && s.set > e.sets) || s.completedSets > exercises.reduce((n,e)=>n+e.sets,0) || (s.phase === 'rest' && !Number.isFinite(s.restUntil))) return emptyTraining();
    }
    // Drafts are plain strings; a restored draft must be confirmed again by the user.
    const drafts = {};
    if (s && v.drafts[setKey(s)]) {
      const d = v.drafts[setKey(s)];
      if (typeof d.weight === 'string' && typeof d.reps === 'string' && d.weight.length <= 20 && d.reps.length <= 20) drafts[setKey(s)] = {weight:d.weight,reps:d.reps};
    }
    return {version: 1, session: s || null, logs: v.logs, drafts};
  } catch { return emptyTraining(); }
}
export function writeTraining(storage, state) {
  try { if (!storage) return false; storage.setItem(TRAINING_KEY, JSON.stringify(state)); return true; } catch { return false; }
}
