import { useState } from 'react';
import type { Exercise } from '../types';
import type { SetDraft, SetLog, SetResult } from '../../lib/training.mjs';
import { validResult } from '../../lib/training.mjs';
export function SetRecorder({exercise, set, draft, previous, onDraft, onSave, ready}: {exercise: Exercise; set: number; draft?: SetDraft; previous?: SetLog; onDraft?: (d: SetDraft) => void; onSave: (r: SetResult) => void; ready: boolean}) {
  const dumbbell = exercise.equipmentTypes.includes('dumbbell');
  const [value, setValue] = useState<SetDraft>(() => draft || {weight: dumbbell ? previous ? String(previous.weight) : '' : '0', reps: ''});
  const [error, setError] = useState('');
  const change = (field: keyof SetDraft, text: string) => { const next = {...value,[field]:text}; setValue(next); onDraft?.(next); };
  return <form className="set-recorder" onSubmit={event => {
    event.preventDefault(); const result = {weight: dumbbell ? Number(value.weight) : 0, reps: Number(value.reps)};
    if (!value.reps.trim() || (dumbbell && !value.weight.trim()) || !validResult(result)) {setError('กรอกน้ำหนัก 0–200 กก. และจำนวนครั้งจริงเป็นจำนวนเต็ม 0–100'); return;}
    onSave(result);
  }}>
    <h3>{ready ? 'จังหวะจบแล้ว บันทึกที่ทำจริง' : 'บันทึกเซ็ตนี้'}</h3>
    {previous && <p className="fine">ล่าสุด: {dumbbell ? `${previous.weight} กก./ลูก × ` : ''}{previous.reps} ครั้ง · {new Date(previous.at).toLocaleDateString('th-TH')}</p>}
    {dumbbell ? <label>น้ำหนักดัมเบลต่อลูก (กก.)<input type="number" inputMode="decimal" min="0" max="200" step="any" required value={value.weight} onChange={e => change('weight',e.target.value)} /></label> : <p className="fine">ใช้น้ำหนักตัว · ไม่ต้องกรอกน้ำหนักดัมเบล</p>}
    <label>จำนวนครั้งที่ทำจริง<input type="number" inputMode="numeric" min="0" max="100" step="1" required value={value.reps} onChange={e => change('reps',e.target.value)} /></label>
    <p className="fine">กรอกได้ตามจริง แม้ทำได้น้อยกว่าเป้าหมาย · 0 = ลองแล้วแต่ยังทำไม่สำเร็จ</p>
    {error && <p role="alert">{error}</p>}
    <button className="primary" type="submit">✓ ทำเซ็ต {set} เสร็จแล้ว</button>
  </form>;
}
