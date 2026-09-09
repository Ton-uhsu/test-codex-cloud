// A metronome counts prompts, never observed exercise repetitions.
export const movementCues = {
  'floor-press': ['ดันขึ้น', 'ค่อย ๆ ลดลง'],
  'dumbbell-row': ['ดึงศอกขึ้น', 'ค่อย ๆ ลดลง'],
  'glute-bridge': ['ยกสะโพกขึ้น', 'ค่อย ๆ ลดลง'],
  'goblet-squat': ['ค่อย ๆ ย่อตัว', 'ดันตัวขึ้น'],
  'wall-pushup': ['งอศอกเข้าหากำแพง', 'ดันตัวกลับ'],
  'shoulder-press': ['ดันขึ้น', 'ค่อย ๆ ลดลง'],
};
export function createCadence(target) {
  if (!Number.isInteger(target) || target < 1 || target > 30) throw Error('Invalid target');
  return {target, phase: 'paused', count: 0, elapsed: 0, last: null};
}
export function stepCadence(s, action, now = Date.now()) {
  if (action === 'pause') return {...s, phase: 'paused', elapsed: 0, last: null};
  if (action === 'start' && s.phase === 'paused') return {...s, phase: 'prep', elapsed: 0, last: now};
  if (action !== 'tick' || !['prep','playing'].includes(s.phase)) return s;
  const delta = now - s.last;
  // Do not catch up prompts after a background tab, blocked thread or clock change.
  if (delta < 0 || delta > 1000) return stepCadence(s, 'pause');
  const elapsed = s.elapsed + delta;
  if (s.phase === 'prep') return elapsed >= 5000 ? {...s, phase: 'playing', elapsed: 0, last: now} : {...s, elapsed, last: now};
  if (elapsed >= 4000) return {...s, count: s.count + 1, phase: s.count + 1 >= s.target ? 'done' : 'playing', elapsed: 0, last: now};
  return {...s, elapsed, last: now};
}
