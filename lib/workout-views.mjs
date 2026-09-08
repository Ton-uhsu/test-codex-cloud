import { followButton, followIntro } from './follow-along.mjs?v=5';
import { DAYS, WEEK_ORDER, MUSCLES, escapeHTML as h, workoutForDay, nextTrainingDay } from './guide.mjs?v=5';
import { videoPreview, youtubeLinks } from './video.mjs?v=5';
import { remainingRest } from './session.mjs?v=5';

export function sessionWorkout(data, session) {
  const workout = data.program.workouts[session.key];
  return { ...workout, key: session.key, exercises: workout.exercises.map((id) => data.exercises.find((e) => e.id === id)) };
}

function runner(data, state) {
  const s = state.session;
  const w = sessionWorkout(data, s);
  const count = w.exercises.reduce((total, e) => total + e.sets, 0);
  const heading = (name, subtitle) => `<div class="page-heading"><div><p class="eyebrow">03 / MOVE AT YOUR PACE</p><h1 id="page-title" tabindex="-1">${h(name)}</h1><p>${h(subtitle)}</p></div><button type="button" class="secondary" data-session-pause>กลับหน้าตาราง</button></div>`;
  if (s.phase === 'warmup') return heading(`ก่อนเริ่มโปรแกรม ${w.key}`, 'เตรียมตัวสักครู่ แล้วเริ่มจากท่าแรก') + `
    <section class="warmup-card"><span class="step-label">เตรียมก่อนฝึก</span><h2>ขยับร่างกาย แล้วลองท่ามือเปล่า</h2>
    <ol class="steps"><li>เดินหรือขยับเบา ๆ เพื่อวอร์มอัปก่อนยกน้ำหนัก</li><li>วางดัมเบลในที่หยิบง่าย เคลียร์พื้นไม่ให้ลื่น และตรวจตัวล็อกน้ำหนัก</li><li>เลือกน้ำหนักเบาที่คุมได้ ดูคลิปแล้วลองเคลื่อนไหวมือเปล่าก่อนเริ่ม</li></ol>
    <p>วันนี้มี ${w.exercises.length} ท่า ท่าละ 2 เซ็ต ทำท่าแรกให้ครบแล้วค่อยไปท่าถัดไป หากเจ็บแปลบ เจ็บข้อ หรือเวียนหัว ให้หยุดฝึก</p>
    <button type="button" class="action" data-session-action="ready">พร้อมแล้ว เริ่มท่าแรก →</button><p class="source-note">อิงคำแนะนำ <a href="${h(data.sources.mayo.url)}" target="_blank" rel="noopener noreferrer">Mayo Clinic ↗</a></p></section>`;
  if (s.phase === 'done') return heading(s.skipped.length ? 'จบการฝึกรอบนี้แล้ว' : 'ฝึกครบแล้ว พักได้เลย', `โปรแกรม ${w.key} · ทำเสร็จ ${s.completedSets} จาก ${count} เซ็ต`) + `
    <section class="warmup-card"><span class="completion-number">${s.completedSets}<small> / ${count} เซ็ต</small></span><h2>ค่อย ๆ ทำให้สม่ำเสมอ</h2><p>${s.skipped.length ? `มีท่าที่ข้าม ${s.skipped.length} ท่า ไม่ต้องฝืนหรือรีบทำชดเชย` : 'วันนี้ทำครบตามตัวอย่างแล้ว ไม่จำเป็นต้องฝึกเพิ่มให้หมดแรง'}</p><p>เว้นอย่างน้อยหนึ่งวันเต็มก่อนฝึกกลุ่มเดิมซ้ำ กินให้เพียงพอและพักฟื้น หากยังเจ็บหรือฟื้นตัวไม่ดี ให้เลื่อนวันฝึก</p><p class="small-note">ความคืบหน้าอยู่ในหน้านี้เท่านั้น รีเฟรชแล้วเริ่มใหม่ ไม่มีการเก็บประวัติการฝึก</p><div class="button-row"><a class="action" href="#nutrition">ดูแผนกิน</a><button type="button" class="secondary" data-session-pause>กลับหน้าตาราง</button></div></section>`;
  const e = w.exercises[s.index];
  const seconds = remainingRest(s);
  const next = s.set < e.sets ? `เซ็ต ${s.set + 1} ของท่าเดิม` : w.exercises[s.index + 1]?.name;
  const source = data.sources[e.techniqueSource];
  const links = youtubeLinks(e.video.youtubeId);
  return heading(e.name, `ท่า ${s.index + 1} จาก ${w.exercises.length} · ${MUSCLES[e.muscle]} · โปรแกรม ${w.key}`) + `
    <div class="session-progress"><progress max="${count}" value="${s.completedSets}" aria-label="เซ็ตที่ทำเสร็จ"></progress><span>เสร็จ ${s.completedSets} / ${count} เซ็ต</span></div>
    <div class="runner-grid"><section class="runner-video"><div class="video-container" data-video-container="${h(e.id)}">${videoPreview(e)}</div>
      <p class="video-credit">คลิป: ${h(e.video.channel)} · ภาษาอังกฤษ <a href="${links.watch}" target="_blank" rel="noopener noreferrer">เปิดใน YouTube ↗</a></p>
    </section><aside class="set-panel" aria-label="เซ็ตปัจจุบัน">
      ${s.phase === 'rest' ? `<span class="step-label">พักระหว่างเซ็ต</span><p class="rest-clock" data-rest-clock role="timer" aria-label="เวลาพักที่เหลือ">${seconds}</p><p>วินาที · พักเพิ่มได้ถ้ายังไม่พร้อม</p><p class="small-note">ถัดไป: ${h(next)}</p><button type="button" class="action" data-session-action="continue"${seconds > 0 ? ' disabled' : ''}>${seconds > 0 ? 'พักให้พร้อมก่อน' : 'พร้อมแล้ว ไปต่อ →'}</button><button type="button" class="secondary" data-session-action="extend">พักเพิ่ม 30 วินาที</button><p class="small-note">นาฬิกาช่วยเตือนเท่านั้น เว็บไม่เปลี่ยนท่าเองเมื่อหมดเวลา</p>` : `<span class="step-label">เซ็ตที่ ${s.set} / ${e.sets}</span><div class="rep-number">${e.repsMin}–${e.repsMax}<small>ครั้ง</small></div><p>ทำช้า ๆ คุมท่าได้ แล้วค่อยกดเสร็จ</p><p class="small-note">${h(e.equipment)} · พัก ${e.restSeconds} วินาทีหลังเซ็ต ไม่ต้องฝืนให้ถึงจำนวนสูงสุด</p>${followButton(e.id, true)}<button type="button" class="action" data-session-action="complete">✓ ทำเซ็ต ${s.set} เสร็จแล้ว</button><button type="button" class="text-button" data-session-action="skip">ข้ามท่านี้</button>`}
      <p class="small-note">หยุดหากเจ็บแปลบ เจ็บข้อ เวียนหัว หรือผิดปกติ</p><button type="button" class="text-button" data-session-pause>พักการฝึกไว้ก่อน</button>
    </aside><section class="runner-instructions"><h2>วิธีเล่น</h2><ol class="steps">${e.steps.map((step) => `<li>${h(step)}</li>`).join('')}</ol><p class="caution">${h(e.caution)}</p><p class="source-link"><a href="${h(source.url)}" target="_blank" rel="noopener noreferrer">วิธีทำต้นฉบับ · ${h(source.name)} ↗</a></p></section></div>`;
}

export function workoutView(data, state) {
  if (state.session && state.showRunner) return runner(data, state);
  const w = workoutForDay(data, state.day);
  const next = nextTrainingDay(data, state.day);
  const active = state.session && state.session.phase !== 'done';
  const finished = state.session?.phase === 'done' && state.session.key === w?.key;
  const week = WEEK_ORDER.map((day) => `<button type="button" class="day" data-day="${day}" aria-pressed="${day === state.day}" aria-label="วัน${DAYS[day]} ${data.program.weekly[day] || 'พักเวท'}"><strong>${DAYS[day]}</strong><span>${data.program.weekly[day] ? `โปรแกรม ${data.program.weekly[day]}` : 'พักเวท'}</span>${day === state.today ? '<small>วันนี้</small>' : ''}</button>`).join('');
  return `<div class="page-heading"><div><p class="eyebrow">03 / LET’S TRAIN</p><h1 id="page-title" tabindex="-1">${state.day === state.today ? 'วันนี้ ฝึกอะไรดี?' : `แผนวัน${DAYS[state.day]}`}</h1><p>ดูคลิป ทำทีละเซ็ต แล้วพักตามจังหวะของคุณ</p></div><a href="#plan">แผนของฉัน</a></div>
    ${active ? `<section class="resume-card"><div><h2>มีโปรแกรม ${state.session.key} ที่ฝึกค้างไว้</h2><p>ทำเสร็จแล้ว ${state.session.completedSets} เซ็ต · อยู่ในหน้านี้จนกว่าจะรีเฟรช</p></div><button type="button" class="action" data-session-resume>ฝึกต่อ →</button><button type="button" class="text-button" data-session-discard>จบรอบนี้</button></section>` : ''}
    ${state.confirmEnd ? '<div class="form-panel" role="group" aria-label="ยืนยันจบการฝึก"><p>จบรอบที่ค้างไว้? ความคืบหน้ารอบนี้จะถูกล้าง</p><button class="secondary" type="button" data-session-discard-confirm>จบรอบนี้</button> <button class="text-button" type="button" data-session-discard-cancel>ฝึกต่อภายหลัง</button></div>' : ''}
    ${w ? `<section class="workout-start"><div><span class="badge">ดัมเบล + น้ำหนักตัว</span><h2>โปรแกรม ${h(w.key)} · ฝึกทั้งตัว</h2><p>${w.exercises.length} ท่า · ท่าละ 2 เซ็ต · มีเวลาพักคั่น</p></div><button type="button" class="action" ${finished ? 'data-session-resume' : 'data-session-start'}${active ? ' disabled' : ''}>${finished ? 'ดูสรุปรอบที่ฝึกแล้ว' : `เริ่มฝึกโปรแกรม ${h(w.key)} →`}</button></section><ol class="exercise-overview">${w.exercises.map((e, i) => `<li><span class="overview-number">${i + 1}</span><img data-video-image src="${youtubeLinks(e.video.youtubeId).thumbnail}" alt="" width="120" height="90" loading="lazy"><div><strong>${h(e.name)}</strong><span>${h(MUSCLES[e.muscle])} · ${e.sets} เซ็ต × ${e.repsMin}–${e.repsMax} ครั้ง</span></div></li>`).join('')}</ol>` : `<section class="rest-card"><h2 id="session-title">วันนี้ให้กล้ามเนื้อได้พัก</h2><p>เดินสบาย ๆ หรือขยับร่างกายเบา ๆ ตามความพร้อม วันฝึกถัดไปคือวัน${DAYS[next]} ไม่ต้องฝึกชดเชยติดกัน</p><button type="button" class="action" data-day="${next}">ดูวันฝึกถัดไป →</button></section>`}
    ${followIntro()}
    <details class="schedule-details"${state.scheduleOpen ? ' open' : ''}><summary>ดูตารางทั้งสัปดาห์ / เลือกวันฝึก</summary><div class="week" role="group" aria-label="เลือกวันในตาราง">${week}</div><p class="small-note">เลือกวันเพื่อดูโปรแกรม ไม่ใช่บันทึกว่าฝึกเสร็จแล้ว · เว้นอย่างน้อยหนึ่งวันเต็มก่อนฝึกกลุ่มเดิม${state.profile ? ' · <a href="#setup">เปลี่ยนวันฝึกประจำ</a>' : ' · <a href="#setup">ตั้งเป้าหมายและวันฝึกของคุณ</a>'}</p></details>
    <p class="equipment-note">${h(data.program.equipmentNote)}</p><p class="notice">โปรแกรมมือใหม่ทั่วไป หากมีอาการบาดเจ็บ โรคประจำตัว หรือข้อจำกัดการเคลื่อนไหว ควรปรึกษาผู้เชี่ยวชาญก่อนฝึก <a href="#guide">อ่านหลักการและแหล่งข้อมูล</a> · <a href="#library">ดูคลังท่าทั้งหมด</a></p>`;
}
