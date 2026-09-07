import { DAYS, WEEK_ORDER, MUSCLES, escapeHTML as h, safeSourceURL, filterExercises, workoutForDay, nextTrainingDay } from './guide.mjs';

export function sourceLink(data, id, label) {
  const source = data.sources[id];
  return `<a href="${h(safeSourceURL(source.url))}" target="_blank" rel="noopener noreferrer">${h(label || source.name)} <span aria-hidden="true">↗</span><span class="sr-only"> (เปิดแท็บใหม่)</span></a>`;
}

const heading = (eyebrow, title, description, badge = '') => `
  <div class="page-heading">
    <div><p class="eyebrow">${h(eyebrow)}</p><h1 id="page-title" tabindex="-1">${h(title)}</h1><p>${h(description)}</p></div>
    ${badge ? `<span class="badge">${h(badge)}</span>` : ''}
  </div>`;

export function exerciseCard(data, exercise, index = null) {
  const e = exercise;
  const reps = `${e.repsMin}–${e.repsMax}`;
  return `<details class="exercise">
    <summary>
      ${index !== null ? `<span class="exercise-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>` : ''}
      <span>
        <strong class="exercise-name">${h(e.name)}</strong>
        <span class="exercise-en" lang="en">${h(e.englishName)}</span>
        <span class="exercise-tags"><span class="muscle">${h(MUSCLES[e.muscle])}</span><span>${h(e.equipment)}</span></span>
      </span>
      <span class="prescription-short">
        <span><strong>${e.sets} เซ็ต × ${reps}</strong> ครั้ง</span>
        <span class="toggle-label"><span class="when-closed">ดูวิธีเล่น ＋</span><span class="when-open">ซ่อนวิธีเล่น −</span></span>
      </span>
    </summary>
    <div class="exercise-body">
      <dl class="dose-grid">
        <div><dt>จำนวนเซ็ต</dt><dd>${e.sets} เซ็ต</dd></div>
        <div><dt>ครั้ง / เซ็ต</dt><dd>${reps} ครั้ง</dd></div>
        <div><dt>พักเริ่มต้น</dt><dd>${e.restSeconds} วินาที</dd></div>
      </dl>
      <p><strong>กล้ามเนื้อที่ใช้:</strong> ${h(e.target)}</p>
      <h3>วิธีเล่นทีละขั้น</h3>
      <ol class="steps">${e.steps.map((step) => `<li>${h(step)}</li>`).join('')}</ol>
      <p class="caution"><strong>ระวัง:</strong> ${h(e.caution)}</p>
      <p class="source-link">${sourceLink(data, e.techniqueSource, `ดูวิธีทำและภาพสาธิตต้นฉบับ · ${data.sources[e.techniqueSource].name}`)}</p>
      <p class="source-note">เซ็ต–ครั้งเป็นค่าตัวอย่างของเว็บ อิง ${sourceLink(data, e.doseSource)}; พักเพิ่มได้หากยังคุมท่าไม่ไหว · <a href="#guide">อ่านหลักการปรับโปรแกรม</a></p>
      <p class="source-note">ตรวจแหล่งข้อมูล <time datetime="${h(data.reviewedAt)}">${h(data.reviewedAt)}</time> · ไม่ใช่คำแนะนำเฉพาะบุคคล</p>
    </div>
  </details>`;
}

function safetyNotice() {
  return `<p class="notice"><strong>ฝึกอย่างปลอดภัย:</strong> หยุดหากเจ็บแปลบ เจ็บข้อ เวียนหัว หรือผิดปกติ ไม่ฝืนทำให้ครบ หากมีอาการบาดเจ็บ โรคประจำตัว หรือข้อจำกัดในการเคลื่อนไหว ควรปรึกษาผู้เชี่ยวชาญก่อนเริ่ม โปรแกรมนี้เป็นข้อมูลทั่วไปสำหรับผู้ใหญ่ ไม่ใช่คำแนะนำทางการแพทย์</p>`;
}

function tips(data) {
  return `<aside class="aside" aria-label="คำแนะนำก่อนฝึก">
    <section class="tip-card feature"><p class="tip-index">START SMALL</p><h2>ครั้งแรก เบาไว้ก่อน</h2>
      <p>เลือกน้ำหนักที่เคลื่อนไหวได้ช้าและมั่นคง ไม่ต้องยกจนหมดแรง ถ้าฟอร์มเริ่มเสียให้จบเซ็ตและลดน้ำหนักครั้งถัดไป</p>
      <p class="source-link">${sourceLink(data, 'acsm', 'อ่านหลักการ · ACSM')}</p></section>
    <section class="tip-card"><p class="tip-index">BEFORE YOU LIFT</p><h2>วอร์มอัป แล้วค่อยเริ่ม</h2>
      <p>เดินหรือขยับร่างกายเบา ๆ สักครู่ก่อนฝึก ขอเจ้าหน้าที่ยิมสอนปรับเครื่องและตรวจท่าในครั้งแรก</p>
      <p class="source-link">${sourceLink(data, 'mayo', 'อ่านคำแนะนำ · Mayo Clinic')}</p></section>
  </aside>`;
}

export function todayView(data, state) {
  const { day, today } = state;
  const workout = workoutForDay(data, day);
  const next = nextTrainingDay(data, day);
  const week = WEEK_ORDER.map((weekday) => {
    const key = data.program.weekly[weekday];
    return `<button type="button" class="day" data-day="${weekday}" aria-pressed="${weekday === day}" aria-label="วัน${DAYS[weekday]} ${key ? `โปรแกรม ${h(key)}` : 'พักเวท'}${weekday === today ? ' วันนี้' : ''}">
      <strong>${DAYS[weekday]}</strong><span>${key ? `โปรแกรม ${h(key)}` : 'พักเวท'}</span>${weekday === today ? '<small>วันนี้</small>' : ''}
    </button>`;
  }).join('');
  const session = workout ? `<section aria-labelledby="session-title">
    <div class="session-banner"><span class="session-letter" aria-hidden="true">${h(workout.key)}</span>
      <div><h2 id="session-title">โปรแกรม ${h(workout.key)} · ${h(workout.name)}</h2><p>${workout.exercises.length} ท่า · ฝึกทั้งตัว · เครื่องในยิม + ดัมเบล + น้ำหนักตัว</p></div>
    </div>
    <p>${h(workout.description)} ทำทีละท่าให้ครบเซ็ตก่อนเปลี่ยนท่า กดแต่ละท่าเพื่ออ่านวิธีเล่น</p>
    <div class="workout-list">${workout.exercises.map((e, i) => exerciseCard(data, e, i)).join('')}</div>
    <p class="notice">${h(data.program.restNote)} ${sourceLink(data, 'rest', 'ที่มาช่วงพัก')}</p>
  </section>` : `<section class="rest-card" aria-labelledby="session-title">
    <p class="eyebrow">RECOVER &amp; RESET</p><h2 id="session-title">วันนี้ให้กล้ามเนื้อได้พัก</h2>
    <p>ตามตารางตัวอย่าง วันนี้ไม่มีเวท จะเดินสบาย ๆ หรือขยับร่างกายเบา ๆ ตามความพร้อมก็ได้ การพักเป็นส่วนหนึ่งของการฝึก</p>
    <p>เว้นอย่างน้อยหนึ่งวันเต็มก่อนฝึกกล้ามเนื้อกลุ่มเดิมซ้ำ ถ้ายังเจ็บหรือฟื้นตัวไม่ดี ให้เลื่อนวันฝึกออกไป ${sourceLink(data, 'mayo', 'อ่านเรื่องพักฟื้น')}</p>
    <button type="button" class="action" data-day="${next}">ดูวันฝึกถัดไป · ${DAYS[next]} →</button>
  </section>`;
  return heading('YOUR FIRST REP STARTS HERE', day === today ? 'วันนี้ เล่นอะไรดี?' : `แผนวัน${DAYS[day]}`, 'เริ่มทีละท่า ฝึกทั้งตัว และให้เวลาร่างกายได้พัก', 'มือใหม่ · 2 วัน / สัปดาห์') + `
    <div class="week" role="group" aria-label="เลือกวันในตารางตัวอย่าง">${week}</div>
    <p class="schedule-note">ตารางตัวอย่าง: จันทร์ A · พฤหัสบดี B — เลือกวันเพื่อดูแผน ไม่ใช่การบันทึกว่าฝึกเสร็จแล้ว · วันนี้อิงเวลาบนอุปกรณ์</p>
    <div class="content-grid">${session}${tips(data)}</div>
    <p class="notice">${h(data.program.provenance)} <a href="#guide">อ่านก่อนเริ่มฝึก →</a></p>
    ${safetyNotice()}`;
}

export function libraryView(data, state) {
  const list = filterExercises(data, state.muscle);
  return heading('MOVEMENT LIBRARY', 'รู้จักท่า ก่อนจับเวท', 'เลือกกล้ามเนื้อที่อยากเรียนรู้ แล้วเปิดดูวิธีเล่นทีละขั้น', `${data.exercises.length} ท่าพื้นฐาน`) + `
    <div class="filters" role="group" aria-label="กรองท่าตามกล้ามเนื้อ">
      ${Object.entries(MUSCLES).map(([id, name]) => `<button type="button" class="filter" data-muscle="${id}" aria-pressed="${id === state.muscle}">${h(name)}</button>`).join('')}
    </div>
    <p class="result-count">${h(MUSCLES[state.muscle] || 'ไม่พบหมวด')} · ${list.length} ท่า — ตัวเลขบนการ์ดเป็นแนวทางเริ่มต้น ไม่ใช่ให้เล่นทุกท่าในวันนี้</p>
    <div class="library-grid">${list.map((e) => exerciseCard(data, e)).join('') || '<p>ยังไม่มีท่าในหมวดนี้ ลองเลือก “ทั้งหมด”</p>'}</div>
    ${safetyNotice()}`;
}

export function guideView(data) {
  return heading('A LITTLE KNOWLEDGE GOES A LONG WAY', 'เริ่มอย่างถูกวิธี', 'ไม่ต้องรู้ทุกอย่าง แค่เข้าใจพื้นฐานก่อนเริ่มเซ็ตแรก') + `
    <div class="guide-grid">
      <section class="tip-card"><p class="tip-index">01 / THE PLAN</p><h2>ทำไมเริ่มจากทั้งตัว 2 วัน?</h2>
        <p>เพื่อฝึกกล้ามเนื้อหลักอย่างสม่ำเสมอและมีวันพักคั่น เว็บจึงจัดตัวอย่าง A วันจันทร์ และ B วันพฤหัสบดี หากย้ายวันให้เว้นอย่างน้อยหนึ่งวันเต็มก่อนฝึกกลุ่มเดิม ไม่ต้องฝึกชดเชยสองโปรแกรมติดกัน</p>
        <p class="source-link">${sourceLink(data, 'acsm')} · ${sourceLink(data, 'mayo')}</p></section>
      <section class="tip-card"><p class="tip-index">02 / SETS &amp; REPS</p><h2>2 เซ็ต × 8–12 ครั้ง คืออะไร?</h2>
        <p>ทำท่าเดิม 8–12 ครั้ง = 1 เซ็ต จากนั้นพัก แล้วทำอีก 1 เซ็ต ไม่ต้องฝืนให้ถึง 12 ถ้าคุมท่าไม่ได้</p>
        <p>${h(data.program.doseNote)} หากยังไม่พร้อม ให้เริ่มฝึกท่าด้วยปริมาณน้อยแล้วค่อยเพิ่ม</p>
        <p class="source-link">${sourceLink(data, 'nhs-strength')} · ${sourceLink(data, 'nhs-exercises')}</p></section>
      <section class="tip-card"><p class="tip-index">03 / LOAD &amp; CONTROL</p><h2>เลือกน้ำหนักยังไง?</h2>
        <p>เริ่มเบาให้เรียนรู้ท่าได้ก่อน ช่วงท้ายเซ็ตควรรู้สึกว่ากล้ามเนื้อทำงาน แต่ยังควบคุมการเคลื่อนไหวและหายใจได้ ไม่ต้องทดสอบน้ำหนักสูงสุดหรือฝืนจนยกไม่ขึ้น</p>
        <p>เมื่อทำถึงปลายช่วงครั้งได้สบายและฟอร์มดี ค่อยเพิ่มน้ำหนักทีละน้อย หากเครื่องไม่คุ้นเคย ให้เจ้าหน้าที่ตรวจการตั้งค่าและท่าฝึก</p>
        <p class="source-link">${sourceLink(data, 'acsm')} · ${sourceLink(data, 'mayo')}</p></section>
      <section class="tip-card"><p class="tip-index">04 / REST &amp; RECOVERY</p><h2>พักพอ ไม่ต้องรีบ</h2>
        <p>${h(data.program.restNote)}</p>
        <p>ก่อนฝึกเดินหรือขยับเบา ๆ สักครู่ ระหว่างท่าอย่ากลั้นหายใจ วันพักไม่จำเป็นต้องหยุดเคลื่อนไหวทั้งหมด แต่ไม่ควรฝืนกล้ามเนื้อที่เจ็บ</p>
        <p class="source-link">${sourceLink(data, 'rest')} · ${sourceLink(data, 'mayo')}</p></section>
    </div>
    <section aria-labelledby="sources-title"><p class="eyebrow">READ THE ORIGINALS</p><h2 id="sources-title">ข้อมูลมาจากไหน?</h2>
      <p>${h(data.program.provenance)}</p><p class="source-note">วิธีเล่นสรุปเป็นภาษาไทยจากแหล่งด้านล่าง ภาพสาธิตเปิดบนเว็บต้นฉบับ ไม่ได้นำภาพมาใช้ซ้ำ · ตรวจแหล่งข้อมูล <time datetime="${h(data.reviewedAt)}">${h(data.reviewedAt)}</time></p>
      <ul class="source-list">${Object.entries(data.sources).map(([id, source]) => `<li>${sourceLink(data, id)}${source.description ? `<p>${h(source.description)}</p>` : '<p>วิธีจัดท่า การเคลื่อนไหว และข้อควรระวัง</p>'}</li>`).join('')}</ul>
    </section>
    <p class="notice"><strong>ขอบเขตเวอร์ชันนี้:</strong> ${h(data.program.audience)} · ไม่มีบัญชีผู้ใช้ ไม่มีการเก็บประวัติฝึก และไม่มีการประเมินร่างกายเฉพาะบุคคล นี่เป็นคู่มือเวท ไม่ใช่แผนกิจกรรมทางกายทั้งหมด</p>
    ${safetyNotice()}`;
}

export function renderView(data, state) {
  if (state.view === 'library') return libraryView(data, state);
  if (state.view === 'guide') return guideView(data);
  return todayView(data, state);
}
