import { escapeHTML as h, DAYS, workoutForDay, nextTrainingDay } from './guide.mjs?v=5';
import { GOALS, ACTIVITIES, calculateNutrition, NUTRITION_SOURCES, NUTRITION_REVIEWED_AT } from './nutrition.mjs?v=5';
import { buildMeals } from './meals.mjs?v=5';

const number = (n) => n.toLocaleString('th-TH');
const title = (eyebrow, text, subtitle = '') => `<div class="page-heading"><div><p class="eyebrow">${h(eyebrow)}</p><h1 id="page-title" tabindex="-1">${h(text)}</h1>${subtitle ? `<p>${h(subtitle)}</p>` : ''}</div></div>`;
const ref = (id) => `<a href="${h(NUTRITION_SOURCES[id].url)}" target="_blank" rel="noopener noreferrer">${h(NUTRITION_SOURCES[id].name)} ↗</a>`;

export function setupView(state) {
  const p = state.draft || state.profile || {};
  const errors = state.errors || {};
  const err = (name) => errors[name] ? `<span class="field-error" id="error-${name}">${h(errors[name])}</span>` : '';
  const attrs = (name) => errors[name] ? ` aria-invalid="true" aria-describedby="error-${name}"` : '';
  const input = (name, label, min, max, step, example) => `<label class="field" for="${name}"><span>${label}</span><input id="${name}" name="${name}" type="number" inputmode="${step === 1 ? 'numeric' : 'decimal'}" min="${min}" max="${max}" step="${step}" required value="${h(p[name] ?? '')}" placeholder="${example}"${attrs(name)}>${err(name)}</label>`;
  return title('01 / YOUR START', state.profile ? 'ปรับแผนของคุณ' : 'เริ่มจากเป้าหมายของคุณ', 'กรอกข้อมูลสั้น ๆ แล้วดูแผนกินและเริ่มฝึกด้วยดัมเบลได้เลย') + `
    <ol class="journey" aria-label="ขั้นตอนเริ่มใช้งาน"><li aria-current="step"><b>1</b> ข้อมูลของคุณ</li><li><b>2</b> แผนกินต่อวัน</li><li><b>3</b> ฝึกทีละท่า</li></ol>
    ${state.storageNotice ? `<p class="notice" role="status">${h(state.storageNotice)}</p>` : ''}
    <form id="profile-form" class="setup-form" novalidate>
      ${Object.keys(errors).length ? '<p class="form-error" role="alert">ยังคำนวณไม่ได้ กรุณาตรวจช่องที่มีข้อความด้านล่าง</p>' : ''}
      <fieldset class="goal-fieldset"><legend>อยากเริ่มจากอะไร?</legend><div class="goal-options">
        ${Object.entries(GOALS).map(([id, goal]) => `<label class="goal-option"><input type="radio" name="goal" value="${id}" required${p.goal === id ? ' checked' : ''}${attrs('goal')}><span><strong>${h(goal.name)}</strong><small>${h(goal.hint)}</small></span></label>`).join('')}
      </div>${err('goal')}</fieldset>
      <div class="setup-columns"><section class="form-panel"><h2>ข้อมูลร่างกาย</h2><div class="body-fields">
        ${input('weight', 'น้ำหนัก (กก.)', 30, 250, 0.1, 'เช่น 70')}${input('height', 'ส่วนสูง (ซม.)', 120, 220, 0.1, 'เช่น 170')}${input('age', 'อายุ (ปี)', 18, 80, 1, 'เช่น 25')}
        <label class="field" for="sex"><span>ตัวแปรเพศในสูตร</span><select id="sex" name="sex" required${attrs('sex')}><option value="">เลือกสูตร</option><option value="male"${p.sex === 'male' ? ' selected' : ''}>ชาย (+5)</option><option value="female"${p.sex === 'female' ? ' selected' : ''}>หญิง (−161)</option></select>${err('sex')}</label>
      </div><p class="small-note">สูตรต้นฉบับมีตัวแปรเพศ 2 ค่า ใช้ประมาณพลังงานขณะพัก หากไม่แน่ใจว่าสูตรไหนเหมาะกับคุณ สามารถข้ามไปดูท่าฝึกได้</p></section>
      <section class="form-panel"><h2>กิจกรรมและวันฝึก</h2>
        <label class="field" for="activity"><span>กิจกรรมที่ทำอยู่จริงในช่วงนี้</span><select id="activity" name="activity" required${attrs('activity')}><option value="">เลือกระดับกิจกรรม</option>${Object.entries(ACTIVITIES).map(([id, a]) => `<option value="${id}"${p.activity === id ? ' selected' : ''}>${h(a.name)}</option>`).join('')}</select>${err('activity')}</label>
        <p class="small-note">เลือกจากทั้งงาน การเดิน และการออกกำลังที่ทำอยู่ ไม่ใช่เป้าหมายที่ตั้งใจจะเริ่ม และไม่ต้องบวกแคลอรี่จากเวทซ้ำ</p>
        <label class="field" for="startDay"><span>วันฝึกแรกในแต่ละสัปดาห์</span><select id="startDay" name="startDay"${attrs('startDay')}>${DAYS.map((day, i) => `<option value="${i}"${(p.startDay ?? state.today) === i ? ' selected' : ''}>${day}${i === state.today ? ' (วันนี้)' : ''}</option>`).join('')}</select>${err('startDay')}</label>
        <p class="small-note">ฝึก 2 วันต่อสัปดาห์ วันที่สองห่างจากวันแรก 3 วัน มีวันพักคั่น</p>
      </section></div>
      <label class="check-line"><input type="checkbox" name="needsAdvice"${p.needsAdvice ? ' checked' : ''}><span>ฉันตั้งครรภ์ ให้นม หรือมีเงื่อนไขสุขภาพที่ต้องวางแผนอาหารกับผู้เชี่ยวชาญ เช่น โรคไต หรือปัญหาด้านการกิน</span></label>
      <p class="small-note">หากเลือกข้อนี้ เว็บจะไม่ตั้งเป้าแคลอรี่และสารอาหารอัตโนมัติ เครื่องคำนวณนี้สำหรับผู้ใหญ่สุขภาพทั่วไป อายุ 18–80 ปี</p>
      <label class="check-line"><input type="checkbox" name="remember"${state.remember ? ' checked' : ''}><span>จำข้อมูลในเบราว์เซอร์เครื่องนี้ เพื่อกลับมาใช้แผนเดิม</span></label>
      <p class="small-note">ข้อมูลแบบฟอร์มไม่ส่งไปเซิร์ฟเวอร์ หากไม่เลือก ข้อมูลจะหายเมื่อรีเฟรชหรือปิดหน้าเว็บ แก้ไขหรือล้างข้อมูลที่จำไว้ได้ภายหลัง</p>
      <div class="button-row"><button type="submit" class="action">${state.profile ? 'คำนวณแผนใหม่' : 'ดูแผนของฉัน'} →</button><a href="${state.profile ? '#plan' : '#today'}">${state.profile ? 'กลับไปแผนเดิม' : 'ดูการฝึกก่อน'}</a></div>
      ${state.profile ? `<div class="reset-area">${state.confirmReset ? '<p>ล้างข้อมูลร่างกาย แผนที่จำไว้ และความคืบหน้าการฝึกในหน้านี้?</p><button type="button" class="secondary" data-reset-confirm>ล้างข้อมูลของฉัน</button> <button type="button" class="text-button" data-reset-cancel>ยกเลิก</button>' : '<button type="button" class="text-button" data-reset>ล้างข้อมูลของฉัน</button>'}</div>` : ''}
    </form>`;
}

export function macroSummary(result) {
  return `<div class="nutrition-summary"><section class="energy-card"><p>พลังงานเริ่มต้นต่อวัน · ประมาณ</p><div><strong>${number(result.calories)}</strong> <span>kcal</span></div><p>รวมทั้งอาหาร เครื่องดื่ม และเครื่องปรุง</p></section>
    <dl class="macro-cards"><div><dt><span class="macro-dot protein-dot"></span>โปรตีน</dt><dd>${number(result.protein)} <small>กรัม</small></dd><p>ช่วยซ่อมแซมและสร้างกล้ามเนื้อ</p></div><div><dt><span class="macro-dot carb-dot"></span>คาร์บ</dt><dd>${number(result.carbs)} <small>กรัม</small></dd><p>พลังงานสำหรับชีวิตและการฝึก</p></div><div><dt><span class="macro-dot fat-dot"></span>ไขมัน</dt><dd>${number(result.fat)} <small>กรัม</small></dd><p>รวมไขมันในอาหารและน้ำมัน</p></div></dl></div>
    <p class="small-note">เป็นค่าประมาณสำหรับเริ่มต้น ไม่ต้องกินให้ตรงทุกกรัม และไม่ใช่ผลวัดการเผาผลาญจริง ใช้แนวโน้มหลายสัปดาห์และความพร้อมในการฝึกประกอบการปรับแผน</p>`;
}

function methodView(p, r) {
  return `<details class="method-details"><summary>ดูวิธีคำนวณและแหล่งอ้างอิง</summary><div>
    <p>พลังงานขณะพัก = 10 × น้ำหนัก (กก.) + 6.25 × ส่วนสูง (ซม.) − 5 × อายุ + ${p.sex === 'male' ? '5' : '(−161)'} = ประมาณ ${number(r.resting)} kcal</p>
    <p>พลังงานคงน้ำหนัก = พลังงานขณะพัก × ${r.activityFactor} ≈ ${number(r.maintenance)} kcal ต่อวัน จากนั้น${p.goal === 'lose' ? 'ลดลง 10%' : p.goal === 'gain' ? 'เพิ่มขึ้น 10%' : 'ใช้เท่าเดิม'} ตามเป้าหมาย และปัดใกล้ 10 kcal</p>
    <p>โปรตีน = น้ำหนัก × 1.6 กรัม/กก./วัน ซึ่งอยู่ในช่วง 1.4–2.0 ของ ISSN สำหรับผู้ใหญ่สุขภาพดีที่ออกกำลัง ไขมันใช้ 30% ของพลังงาน ส่วนคาร์บใช้พลังงานที่เหลือ โปรตีน/คาร์บคิด 4 kcal ต่อกรัม และไขมัน 9 kcal ต่อกรัม ตัวเลขอาจต่างเล็กน้อยจากการปัดเศษ</p>
    <p>การปรับ ±10% และไขมัน 30% เป็นค่าเริ่มต้นที่เว็บเลือก ไม่ใช่สูตรเฉพาะบุคคลหรือข้อกำหนดจากงานวิจัย ไม่ใช้ทำนายน้ำหนักที่จะลดหรือเพิ่มในกำหนดเวลา</p>
    <p>ขอบเขตของเว็บ: ไม่แสดงเป้าเมื่อ BMI ต่ำกว่า 18.5, ผลพลังงานต่ำกว่า 1,500 หรือสูงกว่า 4,000 kcal, โปรตีนเกิน 35% ของพลังงาน หรือคาร์บต่ำกว่า 130 กรัม ขอบเขตนี้เป็นข้อจำกัดเครื่องมือ ไม่ใช่เกณฑ์รับรองว่าตัวเลขอื่นปลอดภัยสำหรับทุกคน</p>
    <ul class="compact-sources">${Object.keys(NUTRITION_SOURCES).map((id) => `<li>${ref(id)}</li>`).join('')}</ul><p class="small-note">ตรวจแหล่งข้อมูล ${NUTRITION_REVIEWED_AT} · ไม่ใช่การรับรองจากผู้เชี่ยวชาญทางคลินิก</p>
  </div></details>`;
}

function unavailable(result) {
  return `<section class="form-panel"><h2>ให้ผู้เชี่ยวชาญช่วยตั้งเป้าอาหาร</h2><p>${h(result.message || 'กรุณาตรวจข้อมูลในแบบฟอร์มอีกครั้ง')}</p><div class="button-row"><a class="action" href="#setup">กลับไปตรวจข้อมูล</a><a href="#guide">อ่านหลักการฝึก</a></div></section>`;
}

export function planView(data, state) {
  if (!state.profile) return setupView(state);
  const result = calculateNutrition(state.profile);
  const workout = workoutForDay(data, state.today);
  const nextDay = nextTrainingDay(data, state.today);
  const sessionActive = state.session && state.session.phase !== 'done';
  return title('YOUR DAILY PLAN', 'แผนของคุณ พร้อมเริ่มแล้ว', `${GOALS[state.profile.goal].name} · ดัมเบล + น้ำหนักตัว · ไม่ต้องมีแมชชีน`) + `
    <div class="plan-meta"><span>${h(state.profile.weight)} กก. · ${h(state.profile.height)} ซม. · อายุ ${state.profile.age} ปี</span><a href="#setup">แก้ข้อมูลและเป้าหมาย</a></div>
    ${state.storageNotice ? `<p class="notice" role="status">${h(state.storageNotice)}</p>` : ''}
    ${result.status === 'ready' ? macroSummary(result) : unavailable(result)}
    <div class="next-actions"><section class="next-card"><span class="step-label">01 · กินให้พอ</span><h2>รู้แล้วว่ามื้อนี้กินอะไร</h2><p>ตัวอย่าง 3 มื้อและของว่าง พร้อมน้ำหนักอาหารและสารอาหารรวม</p><a class="secondary" href="${result.status === 'ready' ? '#nutrition' : '#setup'}">${result.status === 'ready' ? 'ดูตัวอย่างอาหารวันนี้' : 'ตรวจข้อมูลอาหาร'} →</a></section>
    <section class="next-card highlighted"><span class="step-label">02 · ขยับไปทีละท่า</span><h2>${sessionActive ? 'ฝึกต่อจากเซ็ตเดิม' : workout ? `วันนี้ฝึกโปรแกรม ${workout.key}` : 'วันนี้เป็นวันพักเวท'}</h2><p>${sessionActive ? 'เซ็ตที่กดเสร็จแล้วยังอยู่ในหน้านี้' : workout ? '5 ท่า · มีคลิปทุกท่า · เว็บพาไปทีละเซ็ต' : `วันฝึกถัดไปคือวัน${DAYS[nextDay]} ระหว่างนี้เดินหรือขยับเบา ๆ ตามความพร้อม`}</p><a class="action" href="#today">${sessionActive ? 'ฝึกต่อ' : workout ? 'ไปเริ่มฝึก' : 'ดูตารางฝึก'} →</a></section></div>
    <p class="small-note">ตารางฝึก: ${data.program.weekly.map((key, day) => key ? `วัน${DAYS[day]} ${key}` : null).filter(Boolean).join(' · ')} · เป้าหมายอาหารปรับตามข้อมูลที่กรอก ส่วนชุดท่าเป็นโปรแกรมมือใหม่ทั่วไป</p>
    ${result.status === 'ready' ? methodView(state.profile, result) : ''}`;
}

export function nutritionView(data, state) {
  if (!state.profile) return setupView(state);
  const r = calculateNutrition(state.profile);
  if (r.status !== 'ready') return title('FOOD PLAN', 'แผนกินของคุณ') + unavailable(r);
  const plan = buildMeals(r);
  return title('02 / EAT & RECOVER', 'วันนี้ กินประมาณนี้', 'ตัวอย่างหนึ่งวันเพื่อเห็นปริมาณจริง ปรับเมนูได้ตามความชอบและอาหารที่แพ้') + macroSummary(r) + `
    <div class="section-heading"><div><h2>3 มื้อ + ของว่าง</h2><p class="small-note">น้ำหนักส่วนที่กินได้ ข้าว เนื้อ และผักชั่งหลังทำสุก ไม่รวมกระดูก เปลือก ซอสหรือเครื่องดื่มที่เติมเอง</p></div><a href="#setup">ปรับเป้าหมาย</a></div>
    <div class="meal-grid">${plan.meals.map((meal, i) => `<article class="meal-card"><div class="meal-heading"><span class="meal-index">0${i + 1}</span><div><span class="step-label">${h(meal.name)}</span><h3>${h(meal.title)}</h3></div></div><ul class="food-portions">${meal.items.map((item) => `<li><span>${h(item.name)}</span><strong>${h(item.portion)}</strong></li>`).join('')}</ul><p class="meal-total">≈ ${number(meal.calories)} kcal · โปรตีน ${meal.protein} ก. · คาร์บ ${meal.carbs} ก. · ไขมัน ${meal.fat} ก.</p></article>`).join('')}</div>
    <div class="food-total"><strong>รวมตัวอย่างวันนี้ ≈ ${number(plan.totals.calories)} kcal</strong><span>โปรตีน ${plan.totals.protein} ก. · คาร์บ ${plan.totals.carbs} ก. · ไขมัน ${plan.totals.fat} ก.</span></div>
    <p class="small-note">ปริมาณตัวอย่างปรับตามเป้าคุณและปัดให้ง่ายต่อการชั่ง ยอดจริงจึงต่างจากเป้าได้ ค่าจาก USDA เป็นค่าเฉลี่ยของอาหารที่ระบุในปี 2002 ฉลากสินค้า ชนิดวัตถุดิบ และวิธีปรุงอาจต่างกัน กรัมโปรตีนไม่ใช่กรัมน้ำหนักเนื้อสัตว์</p>
    <p class="small-note">นี่เป็นตัวอย่างจัดปริมาณหนึ่งวัน ไม่ใช่เมนูที่ต้องกินซ้ำทุกวันหรือแผนสารอาหารครบถ้วนเฉพาะบุคคล สลับผัก ผลไม้ ธัญพืช และแหล่งโปรตีนให้หลากหลาย หากเปลี่ยนวัตถุดิบหรือใช้นมทางเลือก ให้ดูฉลากคำนวณใหม่ ไม่ถือว่าแทนกันได้เท่ากันทุกกรัม</p>
    <p class="source-link">ที่มาค่าของอาหาร: ${ref('foods')} · ตัวอย่างมีไข่และนมวัว เลี่ยงวัตถุดิบที่แพ้</p>
    <div class="button-row"><a class="action" href="#today">ไปหน้าฝึก →</a><a href="#plan">กลับแผนของฉัน</a></div>${methodView(state.profile, r)}`;
}
