import { followButton } from './follow-along.mjs?v=5';
import { MUSCLES, escapeHTML as h, safeSourceURL, filterExercises } from './guide.mjs?v=5';
import { youtubeLinks, videoPreview } from './video.mjs?v=5';
import { workoutView } from './workout-views.mjs?v=5';
import { setupView, planView, nutritionView } from './profile-views.mjs?v=5';

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
  const links = youtubeLinks(e.video.youtubeId);
  return `<details class="exercise"${index === 0 ? ' open' : ''}>
    <summary>
      ${index !== null ? `<span class="exercise-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>` : ''}
      <span class="exercise-thumb" aria-hidden="true"><img data-video-image src="${links.thumbnail}" alt="" width="480" height="360" loading="lazy" decoding="async"><span>▶</span></span>
      <span class="exercise-heading">
        <strong class="exercise-name">${h(e.name)}</strong>
        <span class="exercise-en" lang="en">${h(e.englishName)}</span>
        <span class="exercise-tags"><span class="muscle">${h(MUSCLES[e.muscle])}</span><span>${h(e.equipment)}</span></span>
      </span>
      <span class="prescription-short">
        <span><strong>${e.sets} เซ็ต × ${reps}</strong> ครั้ง</span>
        <span class="toggle-label"><span class="when-closed">ดูคลิป + วิธีเล่น</span><span class="when-open">ซ่อนวิธีเล่น −</span></span>
      </span>
    </summary>
    <div class="exercise-body">
      ${followButton(e.id)}
      <div class="video-block">
        <div class="video-container" data-video-container="${h(e.id)}">${videoPreview(e)}</div>
        <p class="video-credit"><span lang="en">${h(e.video.title)}</span><br>ที่มา: ${h(e.video.channel)} · คลิปภาษาอังกฤษ</p>
        <p class="video-fallback"><a href="${links.watch}" target="_blank" rel="noopener noreferrer">เปิดใน YouTube ↗<span class="sr-only"> (เปิดแท็บใหม่)</span></a> หากคลิปเล่นไม่ได้หรือถูกจำกัดบนเว็บนี้</p>
      </div>
      <dl class="dose-grid">
        <div><dt>จำนวนเซ็ต</dt><dd>${e.sets} เซ็ต</dd></div>
        <div><dt>ครั้ง / เซ็ต</dt><dd>${reps} ครั้ง</dd></div>
        <div><dt>พักเริ่มต้น</dt><dd>${e.restSeconds} วินาที</dd></div>
      </dl>
      <p><strong>กล้ามเนื้อที่ใช้:</strong> ${h(e.target)}</p>
      ${e.learningNote ? `<p class="learning-note">${h(e.learningNote)}</p>` : ''}
      <h3>วิธีเล่นทีละขั้น</h3>
      <ol class="steps">${e.steps.map((step) => `<li>${h(step)}</li>`).join('')}</ol>
      <p class="caution"><strong>ระวัง:</strong> ${h(e.caution)}</p>
      <p class="source-link">${sourceLink(data, e.techniqueSource, `อ่านวิธีทำต้นฉบับ · ${data.sources[e.techniqueSource].name}`)}</p>
      <p class="source-note">เซ็ต–ครั้งเป็นค่าตัวอย่างของเว็บ อิง ${sourceLink(data, e.doseSource)}; พักเพิ่มได้หากยังคุมท่าไม่ไหว · <a href="#guide">อ่านหลักการปรับโปรแกรม</a></p>
      <p class="source-note">ตรวจแหล่งข้อมูล <time datetime="${h(data.reviewedAt)}">${h(data.reviewedAt)}</time> · ไม่ใช่คำแนะนำเฉพาะบุคคล</p>
    </div>
  </details>`;
}

function safetyNotice() {
  return `<p class="notice"><strong>ฝึกอย่างปลอดภัย:</strong> หยุดหากเจ็บแปลบ เจ็บข้อ เวียนหัว หรือผิดปกติ ไม่ฝืนทำให้ครบ หากมีอาการบาดเจ็บ โรคประจำตัว หรือข้อจำกัดในการเคลื่อนไหว ควรปรึกษาผู้เชี่ยวชาญก่อนเริ่ม โปรแกรมนี้เป็นข้อมูลทั่วไปสำหรับผู้ใหญ่ ไม่ใช่คำแนะนำทางการแพทย์</p>`;
}

export function todayView(data, state) { return workoutView(data, state); }

export function libraryView(data, state) {
  const list = filterExercises(data, state.muscle);
  return heading('WATCH & LEARN', 'ดูท่า แล้วค่อยลอง', 'ดัมเบลและน้ำหนักตัว พร้อมวิดีโอสาธิตและคำแนะนำภาษาไทย', `${data.exercises.length} ท่า · มีคลิปทุกท่า`) + `
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
        <p>เพื่อฝึกกล้ามเนื้อหลักอย่างสม่ำเสมอและมีวันพักคั่น เลือกวันฝึกแรกในหน้า “ปรับแผนของคุณ” ได้ เว็บจัดโปรแกรม B ห่างจากวัน A สามวัน ถ้ายังไม่ได้ตั้งข้อมูลจะใช้ตัวอย่างจันทร์ A และพฤหัสบดี B หากย้ายวันให้เว้นอย่างน้อยหนึ่งวันเต็มก่อนฝึกกลุ่มเดิม ไม่ต้องฝึกชดเชยสองโปรแกรมติดกัน</p>
        <p class="source-link">${sourceLink(data, 'acsm')} · ${sourceLink(data, 'mayo')}</p></section>
      <section class="tip-card"><p class="tip-index">02 / SETS &amp; REPS</p><h2>2 เซ็ต × 8–12 ครั้ง คืออะไร?</h2>
        <p>ทำท่าเดิม 8–12 ครั้ง = 1 เซ็ต จากนั้นพัก แล้วทำอีก 1 เซ็ต ไม่ต้องฝืนให้ถึง 12 ถ้าคุมท่าไม่ได้</p>
        <p>${h(data.program.doseNote)} หากยังไม่พร้อม ให้เริ่มฝึกท่าด้วยปริมาณน้อยแล้วค่อยเพิ่ม</p>
        <p class="source-link">${sourceLink(data, 'nhs-strength')} · ${sourceLink(data, 'nhs-exercises')}</p></section>
      <section class="tip-card"><p class="tip-index">03 / LOAD &amp; CONTROL</p><h2>เลือกน้ำหนักยังไง?</h2>
        <p>เริ่มเบาให้เรียนรู้ท่าได้ก่อน ช่วงท้ายเซ็ตควรรู้สึกว่ากล้ามเนื้อทำงาน แต่ยังควบคุมการเคลื่อนไหวและหายใจได้ ไม่ต้องทดสอบน้ำหนักสูงสุดหรือฝืนจนยกไม่ขึ้น</p>
        <p>เมื่อทำถึงปลายช่วงครั้งได้สบายและฟอร์มดี ค่อยเพิ่มน้ำหนักทีละน้อย อย่าใช้น้ำหนักเท่าคนในคลิปโดยอัตโนมัติ ถ้าดัมเบลที่มีหนักเกินสำหรับท่าไหล่ ให้ฝึกการเคลื่อนไหวมือเปล่าก่อน</p>
        <p class="source-link">${sourceLink(data, 'acsm')} · ${sourceLink(data, 'mayo')}</p></section>
      <section class="tip-card"><p class="tip-index">04 / REST &amp; RECOVERY</p><h2>พักพอ ไม่ต้องรีบ</h2>
        <p>${h(data.program.restNote)}</p>
        <p>ก่อนฝึกเดินหรือขยับเบา ๆ สักครู่ ระหว่างท่าอย่ากลั้นหายใจ วันพักไม่จำเป็นต้องหยุดเคลื่อนไหวทั้งหมด แต่ไม่ควรฝืนกล้ามเนื้อที่เจ็บ</p>
        <p class="source-link">${sourceLink(data, 'rest')} · ${sourceLink(data, 'mayo')}</p></section>
    </div>
    <section aria-labelledby="sources-title"><p class="eyebrow">READ THE ORIGINALS</p><h2 id="sources-title">ข้อมูลมาจากไหน?</h2>
      <p>${h(data.program.provenance)}</p><p class="source-note">คำอธิบายไทยสรุปจากแหล่งด้านล่าง คลิปสาธิตฝังจาก YouTube พร้อมระบุช่องผู้เผยแพร่ คลิปสอนการเคลื่อนไหว ส่วนเซ็ต–ครั้งให้ดูตัวอย่างของเว็บ ไม่จำเป็นต้องทำตามน้ำหนักหรือปริมาณในคลิป · ตรวจแหล่งข้อมูล <time datetime="${h(data.reviewedAt)}">${h(data.reviewedAt)}</time></p>
      <ul class="source-list">${Object.entries(data.sources).map(([id, source]) => `<li>${sourceLink(data, id)}${source.description ? `<p>${h(source.description)}</p>` : '<p>วิธีจัดท่า การเคลื่อนไหว และข้อควรระวัง</p>'}</li>`).join('')}</ul>
    </section>
    <p class="notice"><strong>เกี่ยวกับวิดีโอ:</strong> ภาพตัวอย่างโหลดจาก YouTube ตัวเล่นจะเชื่อมต่อ YouTube เมื่อกดเล่น ผ่านโหมดลดการติดตาม ไม่ได้แปลว่าไม่มีการส่งข้อมูล ผู้ให้บริการอาจประมวลผลข้อมูลตามนโยบายของตนเอง คลิปอาจถูกลบหรือจำกัดการฝังได้ จึงมีลิงก์เปิดต้นฉบับทุกท่า</p>
    <p class="notice"><strong>ขอบเขตเวอร์ชันนี้:</strong> ${h(data.program.audience)} · ไม่มีบัญชีผู้ใช้ ความคืบหน้าฝึกอยู่เฉพาะหน้านี้ มีตัวเลือกจำข้อมูลแบบฟอร์มในเบราว์เซอร์สำหรับคำนวณอาหาร แต่ไม่ได้ประเมินท่าหรือสุขภาพเฉพาะบุคคล นี่เป็นคู่มือเวท ไม่ใช่แผนกิจกรรมทางกายทั้งหมด</p>
    ${safetyNotice()}`;
}

export function renderView(data, state) {
  if (state.view === 'library') return libraryView(data, state);
  if (state.view === 'guide') return guideView(data);
  if (state.view === 'today') return todayView(data, state);
  if (state.view === 'setup') return setupView(state);
  if (state.view === 'nutrition') return nutritionView(data, state);
  return planView(data, state);
}
