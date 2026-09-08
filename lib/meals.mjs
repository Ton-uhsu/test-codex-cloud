// USDA Home and Garden Bulletin 72 (2002), table 9. Values are for
// the listed edible cooked portion, not raw shopping weights.
// Food numbers: rice 634, chicken 876, egg 146, milk 119,
// banana 280, broccoli 1067, olive oil 176. Rounded source values
// are deliberately retained; these are illustrative meals, not lab measurements.
export const FOODS = Object.freeze({
  rice: { name: 'ข้าวกล้องสุก', grams: 195, calories: 216, protein: 5, carbs: 45, fat: 2, foodNumber: 634 },
  chicken: { name: 'อกไก่อบสุก ไม่ติดหนัง', grams: 86, calories: 142, protein: 27, carbs: 0, fat: 3, foodNumber: 876 },
  egg: { name: 'ไข่ต้ม', grams: 50, calories: 78, protein: 6, carbs: 1, fat: 5, foodNumber: 146 },
  milk: { name: 'นมวัวรสจืด ไขมัน 2%', grams: 244, calories: 121, protein: 8, carbs: 12, fat: 5, foodNumber: 119 },
  banana: { name: 'กล้วย (เฉพาะเนื้อ)', grams: 118, calories: 109, protein: 1, carbs: 28, fat: 1, foodNumber: 280 },
  broccoli: { name: 'บรอกโคลีต้ม สะเด็ดน้ำ', grams: 156, calories: 44, protein: 5, carbs: 8, fat: 1, foodNumber: 1067 },
  oil: { name: 'น้ำมันมะกอกสำหรับปรุง', grams: 14, calories: 119, protein: 0, carbs: 0, fat: 14, foodNumber: 176 },
});
const KEYS = ['calories', 'protein', 'carbs', 'fat'];
export function foodNutrients(id, grams) {
  const f = FOODS[id];
  if (!f || !Number.isFinite(grams) || grams < 0) throw new Error('Invalid food portion');
  return Object.fromEntries(KEYS.map((key) => [key, f[key] * grams / f.grams]));
}
function sum(items) {
  return Object.fromEntries(KEYS.map((key) => [key, items.reduce((total, item) => total + foodNutrients(item.id, item.grams)[key], 0)]));
}
const roundTo = (n, step) => Math.round(n / step) * step;

export function buildMeals(target) {
  if (target.status !== 'ready' || KEYS.some((key) => !Number.isFinite(target[key]) || target[key] <= 0)) throw new Error('A supported nutrition target is required');
  const eggGrams = target.protein < 80 ? 50 : 100;
  const milkGrams = target.protein < 70 ? 244 : 488;
  const fixed = [{ id: 'egg', grams: eggGrams }, { id: 'milk', grams: milkGrams }, { id: 'banana', grams: 236 }, { id: 'broccoli', grams: 300 }];
  const base = sum(fixed);
  const ricePerMeal = Math.max(30, roundTo((target.carbs - base.carbs) / foodNutrients('rice', 1).carbs / 3, 10));
  const rice = foodNutrients('rice', ricePerMeal * 3);
  const chickenPerMeal = Math.max(0, roundTo((target.protein - base.protein - rice.protein) / foodNutrients('chicken', 1).protein / 2, 10));
  const chicken = foodNutrients('chicken', chickenPerMeal * 2);
  const oilPerMeal = Math.max(0, roundTo((target.fat - base.fat - rice.fat - chicken.fat) / 2, 5));
  const item = (id, grams) => ({ id, grams, name: FOODS[id].name, portion: id === 'egg' ? `${grams / 50} ฟอง (เนื้อ ${grams} ก.)` : id === 'milk' ? '1 ถ้วย (244 ก.)' : id === 'banana' ? '1 ลูกกลาง (118 ก.)' : `${grams} กรัม` });
  const raw = [
    { name: 'มื้อเช้า', title: 'ข้าว ไข่ต้ม และนม', items: [item('rice', ricePerMeal), item('egg', eggGrams), item('milk', 244), item('banana', 118)] },
    { name: 'มื้อกลางวัน', title: chickenPerMeal ? 'ข้าวกล้องกับอกไก่และผัก' : 'ข้าวกล้องกับผัก', items: [item('rice', ricePerMeal), ...(chickenPerMeal ? [item('chicken', chickenPerMeal)] : []), item('broccoli', 150), ...(oilPerMeal ? [item('oil', oilPerMeal)] : [])] },
    { name: 'มื้อเย็น', title: chickenPerMeal ? 'ข้าว อกไก่อบ และบรอกโคลี' : 'ข้าวและบรอกโคลี', items: [item('rice', ricePerMeal), ...(chickenPerMeal ? [item('chicken', chickenPerMeal)] : []), item('broccoli', 150), ...(oilPerMeal ? [item('oil', oilPerMeal)] : [])] },
    { name: 'ของว่าง · เลือกเวลาที่สะดวก', title: milkGrams > 244 ? 'นมกับกล้วย' : 'กล้วย', items: [...(milkGrams > 244 ? [item('milk', 244)] : []), item('banana', 118)] },
  ];
  const meals = raw.map((meal) => ({ ...meal, ...Object.fromEntries(Object.entries(sum(meal.items)).map(([key, value]) => [key, Math.round(value)])) }));
  return { meals, totals: Object.fromEntries(KEYS.map((key) => [key, meals.reduce((total, meal) => total + meal[key], 0)])) };
}
