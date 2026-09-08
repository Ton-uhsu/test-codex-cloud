export function createSession(workout) {
  if (!workout?.exercises?.length) throw new Error('A workout is required');
  return { key: workout.key, index: 0, set: 1, phase: 'warmup', completedSets: 0, skipped: [], restUntil: null };
}

export function remainingRest(session, now = Date.now()) {
  return session?.phase === 'rest' ? Math.max(0, Math.ceil((session.restUntil - now) / 1000)) : 0;
}

export function advanceSession(session, workout, action, now = Date.now()) {
  const s = { ...session, skipped: [...session.skipped] };
  const e = workout.exercises[s.index];
  if (!e || s.phase === 'done') return s;
  if (action === 'ready' && s.phase === 'warmup') s.phase = 'exercise';
  if (action === 'complete' && s.phase === 'exercise') {
    s.completedSets += 1;
    if (s.index === workout.exercises.length - 1 && s.set === e.sets) s.phase = 'done';
    else { s.phase = 'rest'; s.restUntil = now + e.restSeconds * 1000; }
  }
  if (action === 'extend' && s.phase === 'rest') s.restUntil = Math.max(now, s.restUntil) + 30000;
  if (action === 'continue' && s.phase === 'rest' && remainingRest(s, now) === 0) {
    if (s.set < e.sets) s.set += 1;
    else { s.index += 1; s.set = 1; }
    s.phase = 'exercise'; s.restUntil = null;
  }
  if (action === 'skip' && ['exercise', 'rest'].includes(s.phase)) {
    s.skipped.push(e.id);
    s.index += 1; s.set = 1; s.restUntil = null;
    s.phase = s.index >= workout.exercises.length ? 'done' : 'exercise';
  }
  return s;
}
