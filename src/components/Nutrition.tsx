import { useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  GOALS,
  ACTIVITIES,
  validateProfile,
  calculateNutrition,
  NUTRITION_SOURCES,
  NUTRITION_REVIEWED_AT,
} from "../../lib/nutrition.mjs";
import { buildMeals } from "../../lib/meals.mjs";
import { DAYS } from "../../lib/guide.mjs";
import type { Guide, Profile, ReadyNutrition } from "../types";

export type Draft = Record<string, string | boolean>;
export function profileDraft(p: Profile | null, today: number): Draft {
  return {
    goal: p?.goal || "",
    weight: p ? String(p.weight) : "",
    height: p ? String(p.height) : "",
    age: p ? String(p.age) : "",
    sex: p?.sex || "",
    activity: p?.activity || "",
    startDay: String(p?.startDay ?? today),
    needsAdvice: p?.needsAdvice || false,
  };
}
export function ProfileForm({
  profile,
  draft,
  setDraft,
  remember,
  setRemember,
  onSave,
  onReset,
  notice,
}: {
  profile: Profile | null;
  draft: Draft;
  setDraft: (d: Draft) => void;
  remember: boolean;
  setRemember: (r: boolean) => void;
  onSave: (p: Profile) => void;
  onReset: () => void;
  notice: string;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const update = (key: string, value: string | boolean) =>
    setDraft({ ...draft, [key]: value });
  const attrs = (key: string) => ({
    "aria-invalid": Boolean(errors[key]),
    "aria-describedby": errors[key] ? `error-${key}` : undefined,
  });
  const error = (key: string) =>
    errors[key] ? (
      <span className="field-error" id={`error-${key}`}>
        {errors[key]}
      </span>
    ) : null;
  function submit(event: FormEvent) {
    event.preventDefault();
    const candidate = {
      ...draft,
      weight: draft.weight === "" ? null : Number(draft.weight),
      height: draft.height === "" ? null : Number(draft.height),
      age: draft.age === "" ? null : Number(draft.age),
      startDay: Number(draft.startDay),
    };
    const next = validateProfile(candidate);
    setErrors(next);
    if (Object.keys(next).length) {
      requestAnimationFrame(() =>
        form.current
          ?.querySelector<HTMLElement>(`[name="${Object.keys(next)[0]}"]`)
          ?.focus(),
      );
      return;
    }
    onSave(candidate as unknown as Profile);
  }
  return (
    <div className="content-wrap narrow">
      <header className="page-heading">
        <span className="eyebrow red">YOUR PLAN STARTS HERE</span>
        <h1 id="page-title" tabIndex={-1}>
          {profile ? "ปรับแผนของคุณ" : "เป้าหมายของคุณ"}
        </h1>
        <p>กรอกข้อมูล แล้วดูแผนกินและวันฝึกที่เหมาะกับตารางของคุณ</p>
      </header>
      <ol className="journey">
        <li className="red">01 ข้อมูลของคุณ</li>
        <li>02 แผนกิน</li>
        <li>03 เริ่มฝึก</li>
      </ol>
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      <form id="profile-form" ref={form} onSubmit={submit} noValidate>
        {Object.keys(errors).length > 0 && (
          <p className="notice" role="alert">
            กรุณาตรวจข้อมูลในช่องที่ระบุ ก่อนคำนวณแผน
          </p>
        )}
        <fieldset>
          <legend>อยากเริ่มจากอะไร?</legend>
          <div className="goal-options">
            {Object.entries(GOALS).map(([id, goal]) => (
              <label className="goal-option" key={id}>
                <input
                  type="radio"
                  name="goal"
                  value={id}
                  checked={draft.goal === id}
                  onChange={() => update("goal", id)}
                  {...attrs("goal")}
                />
                <span>
                  <strong>{goal.name}</strong>
                  <small>{goal.hint}</small>
                </span>
              </label>
            ))}
          </div>
          {error("goal")}
        </fieldset>
        <div className="form-columns">
          <section className="panel">
            <h2>ข้อมูลร่างกาย</h2>
            <div className="body-fields">
              {[
                {
                  name: "weight",
                  label: "น้ำหนัก (กก.)",
                  min: 30,
                  max: 250,
                  step: 0.1,
                },
                {
                  name: "height",
                  label: "ส่วนสูง (ซม.)",
                  min: 120,
                  max: 220,
                  step: 0.1,
                },
                { name: "age", label: "อายุ (ปี)", min: 18, max: 80, step: 1 },
              ].map((f) => (
                <label className="field" key={f.name}>
                  <span>{f.label}</span>
                  <input
                    name={f.name}
                    type="number"
                    inputMode={f.step === 1 ? "numeric" : "decimal"}
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    required
                    value={String(draft[f.name])}
                    onChange={(e) => update(f.name, e.target.value)}
                    {...attrs(f.name)}
                  />
                  {error(f.name)}
                </label>
              ))}
              <label className="field">
                <span>ตัวแปรเพศในสูตร</span>
                <select
                  name="sex"
                  value={String(draft.sex)}
                  onChange={(e) => update("sex", e.target.value)}
                  {...attrs("sex")}
                  required
                >
                  <option value="">เลือกสูตร</option>
                  <option value="male">ชาย (+5)</option>
                  <option value="female">หญิง (−161)</option>
                </select>
                {error("sex")}
              </label>
            </div>
            <p className="fine">
              สูตรต้นฉบับมีตัวแปรเพศ 2 ค่า หากไม่แน่ใจว่าสูตรไหนเหมาะกับคุณ
              สามารถข้ามไปดูท่าฝึกได้
            </p>
          </section>
          <section className="panel">
            <h2>กิจกรรมและวันฝึก</h2>
            <label className="field">
              <span>กิจกรรมที่ทำอยู่จริง</span>
              <select
                name="activity"
                value={String(draft.activity)}
                onChange={(e) => update("activity", e.target.value)}
                {...attrs("activity")}
                required
              >
                <option value="">เลือกระดับกิจกรรม</option>
                {Object.entries(ACTIVITIES).map(([id, a]) => (
                  <option key={id} value={id}>
                    {a.name}
                  </option>
                ))}
              </select>
              {error("activity")}
            </label>
            <p className="fine">
              รวมงาน การเดิน และการออกกำลังที่ทำอยู่
              ไม่ใช่กิจกรรมที่ตั้งใจจะเริ่ม และไม่ต้องบวกแคลอรี่จากเวทซ้ำ
            </p>
            <label className="field">
              <span>วันฝึกแรกในแต่ละสัปดาห์</span>
              <select
                name="startDay"
                value={String(draft.startDay)}
                onChange={(e) => update("startDay", e.target.value)}
                {...attrs("startDay")}
              >
                {DAYS.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </select>
              {error("startDay")}
            </label>
            <p className="fine">
              ฝึก 2 วันต่อสัปดาห์ วันที่สองห่างจากวันแรก 3 วัน มีวันพักคั่น
            </p>
          </section>
        </div>
        <label className="check-line">
          <input
            name="needsAdvice"
            type="checkbox"
            checked={Boolean(draft.needsAdvice)}
            onChange={(e) => update("needsAdvice", e.target.checked)}
          />
          <span>
            ฉันตั้งครรภ์ ให้นม
            หรือมีเงื่อนไขสุขภาพที่ต้องวางแผนอาหารกับผู้เชี่ยวชาญ เช่น โรคไต
            หรือปัญหาด้านการกิน
          </span>
        </label>
        <p className="fine">
          หากเลือก เว็บจะไม่ตั้งเป้าแคลอรี่อัตโนมัติ
          เครื่องคำนวณนี้สำหรับผู้ใหญ่สุขภาพทั่วไป อายุ 18–80 ปี
        </p>
        <label className="check-line">
          <input
            name="remember"
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <span>จำข้อมูลในเบราว์เซอร์เครื่องนี้</span>
        </label>
        <p className="fine">
          ข้อมูลแบบฟอร์มไม่ส่งไปเซิร์ฟเวอร์ หากไม่เลือก
          ข้อมูลจะหายเมื่อรีเฟรชหรือปิดหน้าเว็บ
        </p>
        <div className="button-row">
          <button className="primary" type="submit">
            {profile ? "คำนวณแผนใหม่" : "ดูแผนของฉัน"}
          </button>
          <a href={profile ? "#plan" : "#today"}>
            {profile ? "กลับแผนเดิม" : "ดูการฝึกก่อน"}
          </a>
        </div>
        {profile && (
          <div className="reset-area">
            {confirm ? (
              <>
                <p>ล้างข้อมูลที่จำไว้ และความคืบหน้าการฝึกในหน้านี้?</p>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setErrors({});
                    setConfirm(false);
                    onReset();
                  }}
                >
                  ล้างข้อมูลของฉัน
                </button>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setConfirm(false)}
                >
                  ยกเลิก
                </button>
              </>
            ) : (
              <button
                type="button"
                className="text-button"
                onClick={() => setConfirm(true)}
              >
                ล้างข้อมูลของฉัน
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
export function MacroSummary({ result: r }: { result: ReadyNutrition }) {
  return (
    <>
      <div className="nutrition-summary">
        <section className="energy-card">
          <span className="eyebrow">DAILY ENERGY</span>
          <p>พลังงานเริ่มต้นต่อวัน · ประมาณ</p>
          <div>
            <strong>{r.calories.toLocaleString()}</strong>
            <span>kcal</span>
          </div>
          <p className="fine">รวมอาหาร เครื่องดื่ม และเครื่องปรุง</p>
        </section>
        <dl className="macro-cards">
          {[
            {
              label: "โปรตีน",
              value: r.protein,
              hint: "ซ่อมแซมและสร้างกล้ามเนื้อ",
            },
            {
              label: "คาร์บ",
              value: r.carbs,
              hint: "พลังงานสำหรับชีวิตและการฝึก",
            },
            { label: "ไขมัน", value: r.fat, hint: "รวมไขมันในอาหารและน้ำมัน" },
          ].map((m) => (
            <div key={m.label}>
              <dt>{m.label}</dt>
              <dd>
                {m.value}
                <small> กรัม</small>
              </dd>
              <p className="fine">{m.hint}</p>
            </div>
          ))}
        </dl>
      </div>
      <p className="fine">
        ค่าประมาณสำหรับเริ่มต้น ไม่ต้องกินให้ตรงทุกกรัม
        และไม่ใช่ผลวัดการเผาผลาญจริง
        ใช้แนวโน้มหลายสัปดาห์และความพร้อมในการฝึกประกอบการปรับแผน
      </p>
    </>
  );
}
export function Method({
  profile: p,
  result: r,
}: {
  profile: Profile;
  result: ReadyNutrition;
}) {
  return (
    <details className="method">
      <summary>วิธีคำนวณและแหล่งอ้างอิง</summary>
      <p>
        พลังงานขณะพัก = 10 × น้ำหนัก + 6.25 × ส่วนสูง − 5 × อายุ +{" "}
        {p.sex === "male" ? "5" : "(−161)"} ≈ {r.resting} kcal
      </p>
      <p>
        พลังงานคงน้ำหนัก = พลังงานขณะพัก × {r.activityFactor} ≈ {r.maintenance}{" "}
        kcal ต่อวัน จากนั้น
        {p.goal === "lose"
          ? "ลดลง 10%"
          : p.goal === "gain"
            ? "เพิ่มขึ้น 10%"
            : "ใช้เท่าเดิม"}{" "}
        ตามเป้าหมาย และปัดใกล้ 10 kcal
      </p>
      <p>
        โปรตีน = น้ำหนัก × 1.6 กรัม/กก./วัน อยู่ในช่วง 1.4–2.0 ของ ISSN
        สำหรับผู้ใหญ่สุขภาพดีที่ออกกำลัง ไขมันใช้ 30% ของพลังงาน
        คาร์บใช้พลังงานที่เหลือ โปรตีน/คาร์บคิด 4 kcal ต่อกรัม ไขมัน 9 kcal
        ต่อกรัม
      </p>
      <p>
        การปรับ ±10% และไขมัน 30% เป็นค่าเริ่มต้นที่เว็บเลือก
        ไม่ใช่ข้อกำหนดจากงานวิจัยหรือสูตรเฉพาะบุคคล
        ไม่ใช้ทำนายน้ำหนักในกำหนดเวลา
      </p>
      <p>
        เว็บไม่แสดงเป้าเมื่อ BMI ต่ำกว่า 18.5, พลังงานต่ำกว่า 1,500 หรือสูงกว่า
        4,000 kcal, โปรตีนเกิน 35% ของพลังงาน หรือคาร์บต่ำกว่า 130 กรัม
        นี่เป็นข้อจำกัดเครื่องมือ
        ไม่ใช่เกณฑ์รับรองว่าตัวเลขอื่นปลอดภัยสำหรับทุกคน
      </p>
      <ul>
        {Object.entries(NUTRITION_SOURCES).map(([id, s]) => (
          <li key={id}>
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.name} ↗
            </a>
          </li>
        ))}
      </ul>
      <p className="fine">
        ตรวจแหล่งข้อมูล {NUTRITION_REVIEWED_AT} · ไม่ใช่การรับรองทางคลินิก
      </p>
    </details>
  );
}
export function NutritionPage({
  profile,
  data,
  summaryOnly = false,
  notice,
}: {
  profile: Profile;
  data: Guide;
  summaryOnly?: boolean;
  notice: string;
}) {
  const result = calculateNutrition(profile);
  const ready = result.status === "ready";
  const plan = ready ? buildMeals(result) : null;
  return (
    <div className="content-wrap">
      <header className="page-heading">
        <span className="eyebrow red">
          {summaryOnly ? "YOUR PERSONAL PLAN" : "EAT. TRAIN. RECOVER."}
        </span>
        <h1 id="page-title" tabIndex={-1}>
          {summaryOnly ? "แผนของฉัน" : "กินให้พร้อมสำหรับการฝึก"}
        </h1>
        <p>
          {GOALS[profile.goal].name} · {profile.weight} กก. · {profile.height}{" "}
          ซม. · อายุ {profile.age} ปี · <a href="#setup">แก้ข้อมูล</a>
        </p>
      </header>
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {ready ? (
        <MacroSummary result={result} />
      ) : (
        <section className="panel">
          <h2>ให้ผู้เชี่ยวชาญช่วยตั้งเป้าอาหาร</h2>
          <p>
            {result.status === "unsupported"
              ? result.message
              : "กรุณาตรวจข้อมูลในแบบฟอร์มอีกครั้ง"}
          </p>
          <a className="secondary" href="#setup">
            กลับไปตรวจข้อมูล
          </a>
        </section>
      )}
      {summaryOnly ? (
        <>
          <div className="plan-actions">
            <a className="panel" href="#nutrition">
              <span className="eyebrow red">01 / EAT</span>
              <h2>วันนี้ กินอะไรดี?</h2>
              <p>ตัวอย่างอาหาร 3 มื้อและของว่าง พร้อมปริมาณ</p>
            </a>
            <a className="panel" href="#today">
              <span className="eyebrow red">02 / TRAIN</span>
              <h2>เริ่มฝึกทีละท่า</h2>
              <p>
                {data.program.weekly
                  .map((key, day) => (key ? `วัน${DAYS[day]} ${key}` : null))
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </a>
          </div>
          <p className="fine">
            เป้าหมายอาหารปรับตามข้อมูล ส่วนชุดท่าเป็นโปรแกรมมือใหม่ทั่วไป
          </p>
        </>
      ) : (
        plan && (
          <>
            <div className="section-heading">
              <div>
                <h2>3 มื้อ + ของว่าง</h2>
                <p className="fine">
                  น้ำหนักส่วนที่กินได้ ข้าว เนื้อ และผักชั่งหลังทำสุก
                  ไม่รวมกระดูก เปลือก ซอสหรือเครื่องดื่มที่เติมเอง
                </p>
              </div>
            </div>
            <div className="meal-grid">
              {plan.meals.map((meal, i) => (
                <article className="meal-card" key={meal.name}>
                  <span className="meal-index">0{i + 1}</span>
                  <p className="eyebrow red">{meal.name}</p>
                  <h2>{meal.title}</h2>
                  <ul>
                    {meal.items.map((item) => (
                      <li key={item.id}>
                        <span>{item.name}</span>
                        <strong>{item.portion}</strong>
                      </li>
                    ))}
                  </ul>
                  <p className="meal-total">
                    ≈ {meal.calories.toLocaleString()} kcal
                  </p>
                  <p className="fine">
                    โปรตีน {meal.protein} ก. · คาร์บ {meal.carbs} ก. · ไขมัน{" "}
                    {meal.fat} ก.
                  </p>
                </article>
              ))}
            </div>
            <div className="daily-strip">
              <strong>
                รวมตัวอย่าง ≈ {plan.totals.calories.toLocaleString()} kcal
              </strong>
              <span>
                โปรตีน {plan.totals.protein} ก. · คาร์บ {plan.totals.carbs} ก. ·
                ไขมัน {plan.totals.fat} ก.
              </span>
            </div>
            <p className="fine">
              ตัวอย่างปรับตามเป้าและปัดให้ง่ายต่อการชั่ง
              ยอดจริงจึงต่างจากเป้าได้ ค่าจาก USDA เป็นค่าเฉลี่ยปี 2002
              ฉลากสินค้า วัตถุดิบ และวิธีปรุงอาจต่างกัน
              กรัมโปรตีนไม่ใช่น้ำหนักเนื้อสัตว์
            </p>
            <p className="fine">
              ตัวอย่างหนึ่งวัน
              ไม่ใช่เมนูที่ต้องกินซ้ำหรือแผนสารอาหารครบถ้วนเฉพาะบุคคล สลับผัก
              ผลไม้ ธัญพืช และโปรตีนให้หลากหลาย หากเปลี่ยนวัตถุดิบหรือนมทางเลือก
              ให้คำนวณจากฉลากใหม่ ตัวอย่างมีไข่และนมวัว เลี่ยงวัตถุดิบที่แพ้
            </p>
            <p className="fine">
              ที่มาค่าอาหาร:{" "}
              <a
                href={NUTRITION_SOURCES.foods.url}
                target="_blank"
                rel="noreferrer"
              >
                USDA ↗
              </a>
            </p>
          </>
        )
      )}
      {ready && <Method profile={profile} result={result} />}
    </div>
  );
}
