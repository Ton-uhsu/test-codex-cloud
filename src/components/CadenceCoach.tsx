import { useEffect, useRef, useState } from 'react';
import { createCadence, stepCadence, movementCues } from '../../lib/cadence.mjs';
import type { Exercise } from '../types';

export function CadenceCoach({exercise, onFinish, onClose}: {exercise: Exercise; onFinish: () => void; onClose: () => void}) {
  const [state, setState] = useState(() => stepCadence(createCadence(exercise.repsMin), 'start'));
  const [muted, setMuted] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const spoken = useRef('');
  const cues = movementCues[exercise.id] || ['เริ่มจังหวะ', 'กลับช้า ๆ'];
  const cue = state.phase === 'prep' ? `เตรียมตัว ${Math.max(1, Math.ceil((5000-state.elapsed)/1000))}` : state.phase === 'playing' ? `จังหวะ ${state.count+1} · ${cues[state.elapsed < 2000 ? 0 : 1]}` : state.phase === 'done' ? 'ครบจังหวะตัวอย่างแล้ว' : 'พักอยู่ · เริ่มเมื่อพร้อม';
  useEffect(() => {
    const synth = window.speechSynthesis;
    const check = () => setVoiceAvailable(Boolean(synth?.getVoices().find(v => /^th(?:-|_|$)/i.test(v.lang))));
    check(); synth?.addEventListener('voiceschanged', check);
    const timer = setInterval(() => setState(s => stepCadence(s, 'tick')), 100);
    const pause = () => { if (document.hidden) { setState(s => s.phase === 'done' ? s : stepCadence(s, 'pause')); synth?.cancel(); } };
    document.addEventListener('visibilitychange', pause);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', pause); synth?.removeEventListener('voiceschanged', check); synth?.cancel(); };
  }, []);
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (muted || document.hidden || !['prep','playing'].includes(state.phase)) { synth?.cancel(); spoken.current = ''; return; }
    if (spoken.current === cue) return;
    spoken.current = cue;
    const voice = synth?.getVoices().find(v => /^th(?:-|_|$)/i.test(v.lang));
    if (voice && window.SpeechSynthesisUtterance) {
      synth.cancel(); const speech = new SpeechSynthesisUtterance(cue); speech.lang = 'th-TH'; speech.voice = voice; synth.speak(speech);
    }
  }, [cue, muted, state.phase]);
  return <section className="panel cadence-coach" aria-label="ตัวนำจังหวะฝึก">
    <p className="eyebrow red">ทำตามเสียงและจังหวะ</p>
    <p className="fine">ท่านี้ยังไม่มีภาพวน ดูคลิปสอนก่อนเริ่ม · ตัวนับเป็นจังหวะตัวอย่าง ไม่ใช่จำนวนครั้งที่ตรวจวัด</p>
    <strong className="rep-number">{state.count}<small> / {state.target} จังหวะ</small></strong>
    <h2 role="status">{cue}</h2>
    <p className="fine">{voiceAvailable ? 'ใช้เสียงไทยของเครื่อง' : 'ยังไม่มีเสียงไทยในเครื่อง ดูข้อความนำจังหวะได้'}</p>
    {state.phase === 'paused' && <><label>จำนวนจังหวะ <select value={state.target} disabled={state.count > 0} onChange={e => setState(createCadence(Number(e.target.value)))}>{Array.from({length: exercise.repsMax-exercise.repsMin+1}, (_,i) => exercise.repsMin+i).map(n => <option key={n} value={n}>{n}</option>)}</select></label><button className="primary" onClick={() => setState(s => stepCadence(s,'start'))}>เตรียม 5 วินาที แล้วเริ่ม</button></>}
    {['prep','playing'].includes(state.phase) && <button className="secondary" onClick={() => setState(s => stepCadence(s,'pause'))}>หยุดพัก</button>}
    {state.phase === 'done' && <button className="primary" onClick={onFinish}>กรอกจำนวนครั้งที่ทำจริง</button>}
    <button className="text-button" aria-pressed={muted} onClick={() => setMuted(v => !v)}>{muted ? 'เปิดเสียง' : 'ปิดเสียง'}</button>
    <button className="text-button" onClick={onClose}>กลับไปดูวิธีเล่น / บันทึกเซ็ต</button>
  </section>;
}
