export const GOALS = Object.freeze({
  lose: { name: 'ลดไขมัน', hint: 'ลดพลังงานลงเล็กน้อย พร้อมฝึกเวท', factor: 0.9 },
  maintain: { name: 'แข็งแรงขึ้น / คงน้ำหนัก', hint: 'เริ่มฝึกและกินให้เพียงพอ', factor: 1 },
  gain: { name: 'เพิ่มกล้ามเนื้อ', hint: 'เพิ่มพลังงานเล็กน้อย พร้อมฝึกสม่ำเสมอ', factor: 1.1 },
});

export const ACTIVITIES = Object.freeze({
  sedentary: { name: 'นั่งเป็นหลัก · แทบไม่ได้ออกกำลัง', factor: 1.2 },
  light: { name: 'กิจกรรมเบา / ออกกำลัง 1–3 วันต่อสัปดาห์', factor: 1.375 },
  moderate: { name: 'ออกกำลังปานกลาง 3–5 วันต่อสัปดาห์', factor: 1.55 },
  active: { name: 'ออกกำลังหนัก 6–7 วันต่อสัปดาห์', factor: 1.725 },
});

export const NUTRITION_SOURCES = Object.freeze({
  mifflin: { name: 'Mifflin–St Jeor · สูตรพลังงานขณะพัก', url: 'https://pubmed.ncbi.nlm.nih.gov/2305711/' },
  activity: { name: 'ACE · ตัวคูณระดับกิจกรรม', url: 'https://www.acefitness.org/certifiednewsarticle/2882/resting-metabolic-rate-best-ways-to-measure-it-and-raise-it-too/' },
  protein: { name: 'ISSN · โปรตีนสำหรับผู้ที่ออกกำลังกาย', url: 'https://pubmed.ncbi.nlm.nih.gov/28642676/' },
  planner: { name: 'NIDDK · ขอบเขตเครื่องคำนวณสำหรับผู้ใหญ่', url: 'https://www.niddk.nih.gov/bwp' },
  weight: { name: 'NHLBI · น้ำหนักและข้อจำกัดของ BMI', url: 'https://www.nhlbi.nih.gov/health/heart-healthy-living/healthy-weight' },
  foods: { name: 'USDA · Nutritive Value of Foods (2002)', url: 'https://www.ars.usda.gov/ARSUserFiles/80400525/Data/hg72/hg72_2002.pdf' },
});
export const NUTRITION_REVIEWED_AT = '2026-09-08';
export const PROFILE_KEY = 'beginner-strength.profile.v1';

export function validateProfile(input) {
  const errors = {};
  const p = input && typeof input === 'object' ? input : {};
  if (!Object.hasOwn(GOALS, p.goal)) errors.goal = 'เลือกเป้าหมายก่อนครับ';
  for (const [field, min, max, label] of [['age', 18, 80, 'อายุ 18–80 ปี'], ['weight', 30, 250, 'น้ำหนัก 30–250 กก.'], ['height', 120, 220, 'ส่วนสูง 120–220 ซม.']]) {
    if (typeof p[field] !== 'number' || !Number.isFinite(p[field]) || p[field] < min || p[field] > max || (field === 'age' && !Number.isInteger(p[field]))) {
      errors[field] = `เครื่องคำนวณนี้รองรับ${label} กรุณาตรวจข้อมูล`;
    }
  }
  if (!['male', 'female'].includes(p.sex)) errors.sex = 'เลือกตัวแปรเพศที่ใช้ในสูตร';
  if (!Object.hasOwn(ACTIVITIES, p.activity)) errors.activity = 'เลือกระดับกิจกรรมในช่วงนี้';
  if (typeof p.needsAdvice !== 'boolean') errors.needsAdvice = 'กรุณาตรวจตัวเลือกเงื่อนไขสุขภาพ';
  if (!Number.isInteger(p.startDay) || p.startDay < 0 || p.startDay > 6) errors.startDay = 'เลือกวันเริ่มฝึก';
  return errors;
}

export function calculateNutrition(profile) {
  const errors = validateProfile(profile);
  if (Object.keys(errors).length) return { status: 'invalid', errors };
  if (profile.needsAdvice) return { status: 'unsupported', message: 'กรณีตั้งครรภ์ ให้นม หรือมีเงื่อนไขสุขภาพที่ต้องดูแลเรื่องอาหาร ควรวางแผนพลังงานและโปรตีนกับแพทย์หรือนักกำหนดอาหาร เครื่องคำนวณทั่วไปนี้จึงไม่แสดงเป้าตัวเลขให้' };
  const bmi = profile.weight / (profile.height / 100) ** 2;
  if (bmi < 18.5) return { status: 'unsupported', message: 'น้ำหนักเทียบส่วนสูงอยู่ต่ำกว่าช่วงอ้างอิงของผู้ใหญ่ (BMI ต่ำกว่า 18.5) ควรให้นักกำหนดอาหารช่วยประเมินก่อนตั้งเป้าพลังงาน โดยเฉพาะการลดน้ำหนัก ทั้งนี้ BMI เพียงอย่างเดียวไม่ใช่การวินิจฉัยสุขภาพ' };
  const resting = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + (profile.sex === 'male' ? 5 : -161);
  const maintenance = resting * ACTIVITIES[profile.activity].factor;
  // ±10% and 30% fat are transparent starter choices made by this app,
  // not a personalized prescription or percentages mandated by the sources.
  const calories = Math.round(maintenance * GOALS[profile.goal].factor / 10) * 10;
  const protein = Math.round(profile.weight * 1.6);
  const fat = Math.round(calories * 0.3 / 9);
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
  if (calories < 1500 || calories > 4000 || carbs < 130 || protein * 4 > calories * 0.35) {
    return { status: 'unsupported', message: 'ผลคำนวณอยู่นอกขอบเขตแผนอาหารอัตโนมัติของเว็บนี้ กรุณาตรวจอายุ น้ำหนัก ส่วนสูง และกิจกรรมอีกครั้ง ถ้าข้อมูลถูกต้อง ควรให้นักกำหนดอาหารช่วยตั้งเป้าที่เหมาะกับคุณ เว็บจะไม่ปรับตัวเลขขึ้นหรือลงเงียบ ๆ' };
  }
  return { status: 'ready', resting: Math.round(resting), maintenance: Math.round(maintenance), calories, protein, carbs, fat, activityFactor: ACTIVITIES[profile.activity].factor, goalFactor: GOALS[profile.goal].factor };
}

export function readProfile(storage) {
  try {
    const record = JSON.parse(storage.getItem(PROFILE_KEY));
    if (record?.version !== 1 || Object.keys(validateProfile(record.profile)).length) return null;
    return record.profile;
  } catch { return null; }
}

export function writeProfile(storage, profile, remember) {
  try {
    if (!remember) storage.removeItem(PROFILE_KEY);
    else {
      if (Object.keys(validateProfile(profile)).length) return false;
      const { goal, age, weight, height, sex, activity, needsAdvice, startDay } = profile;
      storage.setItem(PROFILE_KEY, JSON.stringify({ version: 1, profile: { goal, age, weight, height, sex, activity, needsAdvice, startDay } }));
    }
    return true;
  } catch { return false; }
}

export function personalizedData(data, profile) {
  if (!profile) return data;
  const weekly = Array(7).fill(null);
  weekly[profile.startDay] = 'A';
  weekly[(profile.startDay + 3) % 7] = 'B';
  return { ...data, program: { ...data.program, weekly } };
}
