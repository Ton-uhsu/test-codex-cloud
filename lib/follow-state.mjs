// Counts demonstrated cycles only; no camera or movement detection.
export function createFollow(reps = 8) {
  if (![8, 10, 12].includes(reps)) throw new Error('Unsupported repetition target');
  return { phase: 'idle', reps, completed: 0, until: null };
}
export function followRemaining(s, now) {
  return s.until === null ? 0 : Math.max(0, Math.ceil((s.until - now) / 1000));
}
export function stepFollow(s, action, now = Date.now()) {
  if (action === 'start' && ['idle', 'paused', 'error'].includes(s.phase)) return { ...s, phase: 'prep', until: now + 5000 };
  if (action === 'tick' && s.phase === 'prep' && followRemaining(s, now) === 0) return { ...s, phase: 'loading', until: null };
  if (action === 'playing' && s.phase === 'loading') return { ...s, phase: 'playing' };
  if (action === 'ended' && s.phase === 'playing') {
    const completed = s.completed + 1;
    return { ...s, completed, phase: completed === s.reps ? 'confirm' : 'loading' };
  }
  if (action === 'pause' && ['prep', 'loading', 'playing'].includes(s.phase)) return { ...s, phase: 'paused', until: null };
  if (action === 'error' && ['prep', 'loading', 'playing'].includes(s.phase)) return { ...s, phase: 'error', until: null };
  if (action === 'confirm' && s.phase === 'confirm') return { ...s, phase: 'rest', until: now + 90000 };
  if (action === 'tick' && s.phase === 'rest' && followRemaining(s, now) === 0) return { ...s, phase: 'done', until: null };
  if (action === 'extend' && s.phase === 'rest') return { ...s, until: Math.max(now, s.until) + 30000 };
  return s;
}
