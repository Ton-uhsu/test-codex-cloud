import { useState } from "react";
import {
  DAYS,
  MUSCLES,
  WEEK_ORDER,
  nextTrainingDay,
  workoutForDay,
  filterExercises,
} from "../../lib/guide.mjs";
import { GOALS, calculateNutrition } from "../../lib/nutrition.mjs";
import { hasFollowMedia } from "../../lib/follow-media.mjs";
import { mediaBase } from "../data";
import type { Guide, Profile, Session, Exercise, Workout } from "../types";
import { ExerciseCard, Safety } from "./Exercise";

export function Shelf({
  title,
  subtitle,
  exercises,
  onSelect,
}: {
  title: string;
  subtitle?: string;
  exercises: Exercise[];
  onSelect: (e: Exercise) => void;
}) {
  return (
    <section className="shelf">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          {subtitle && <p className="fine">{subtitle}</p>}
        </div>
        <span className="fine">{exercises.length} ท่า</span>
      </div>
      <div
        className="card-rail"
        tabIndex={0}
        aria-label={`${title} เลื่อนเพื่อดูทุกท่า`}
      >
        {exercises.map((e, i) => (
          <ExerciseCard
            key={e.id}
            exercise={e}
            index={i}
            onClick={() => onSelect(e)}
          />
        ))}
      </div>
    </section>
  );
}
export function Home({
  data,
  profile,
  today,
  session,
  onStart,
  onResume,
  onSelect,
  onFollow,
}: {
  data: Guide;
  profile: Profile | null;
  today: number;
  session: Session | null;
  onStart: (w: Workout) => void;
  onResume: () => void;
  onSelect: (e: Exercise) => void;
  onFollow: (e: Exercise) => void;
}) {
  const workout = workoutForDay(data, today);
  const nextDay = nextTrainingDay(data, today);
  const next = workoutForDay(data, nextDay)!;
  const selected = workout || next;
  const active = session && session.phase !== "done";
  const nutrition = profile ? calculateNutrition(profile) : null;
  return (
    <>
      <section className="cinema-hero">
        <img
          className="hero-art"
          src={`${mediaBase}lateral-raise.jpg`}
          alt=""
        />
        <div className="hero-shade" />
        <div className="hero-content">
          <p className="eyebrow red">YOUR STRENGTH. YOUR PACE.</p>
          <p className="hero-kicker">
            วัน{DAYS[today]} · {workout ? "โปรแกรมวันนี้" : "วันพักเวท"}
          </p>
          <h1 id="page-title" tabIndex={-1}>
            {workout ? (
              <>
                FULL BODY<span>{workout.key}</span>
              </>
            ) : (
              <>
                REST.
                <br />
                RECOVER.
              </>
            )}
          </h1>
          <p className="hero-description">
            {workout
              ? "ดัมเบลคู่เดียว เริ่มได้ทั้งตัว"
              : `พักให้พร้อม แล้วเจอกันวัน${DAYS[nextDay]}`}
          </p>
          <div className="hero-meta">
            <span>ผู้เริ่มต้น</span>
            <span>
              {workout ? "5 ท่า · ท่าละ 2 เซ็ต" : `ถัดไป โปรแกรม ${next.key}`}
            </span>
            <span>ดัมเบล + น้ำหนักตัว</span>
          </div>
          <div className="button-row">
            {active ? (
              <button className="primary" onClick={onResume}>
                ▶ ฝึกต่อจากเซ็ตเดิม
              </button>
            ) : workout ? (
              <button className="primary" onClick={() => onStart(workout)}>
                ▶ เริ่มฝึกวันนี้
              </button>
            ) : (
              <a className="primary" href="#today">
                ดูตารางฝึก
              </a>
            )}
            <a className="secondary" href="#plan">
              แผนของฉัน
            </a>
          </div>
        </div>
      </section>
      <div className="content-wrap home-content">
        {!profile ? (
          <section className="onboard-banner">
            <div>
              <h2>เริ่มจากเป้าหมายของคุณ</h2>
              <p>กรอกน้ำหนัก ส่วนสูง และกิจกรรม เพื่อดูแผนกินและเลือกวันฝึก</p>
            </div>
            <a className="primary" href="#setup">
              ตั้งเป้าหมาย
            </a>
          </section>
        ) : (
          <div className="daily-strip">
            <span>{GOALS[profile.goal].name}</span>
            {nutrition?.status === "ready" ? (
              <>
                <strong>
                  ≈ {nutrition.calories.toLocaleString()} kcal / วัน
                </strong>
                <span>โปรตีน {nutrition.protein} กรัม</span>
                <a href="#nutrition">ดูแผนกิน ↗</a>
              </>
            ) : (
              <a href="#nutrition">ตรวจแผนกินของคุณ ↗</a>
            )}
          </div>
        )}
        {active && (
          <section className="continue-card">
            <div>
              <p className="eyebrow red">CONTINUE TRAINING</p>
              <h2>โปรแกรม {session.key} · ฝึกค้างไว้</h2>
              <p>
                ยืนยันแล้ว {session.completedSets} เซ็ต ·
                ความคืบหน้าอยู่ในหน้านี้
              </p>
            </div>
            <button className="secondary" onClick={onResume}>
              ฝึกต่อ ▶
            </button>
          </section>
        )}
        <Shelf
          title={
            workout
              ? "ลำดับท่าของวันนี้"
              : `เตรียมรู้จักท่า · โปรแกรม ${selected.key}`
          }
          subtitle="เปิดดูวิธีเล่นก่อนเริ่ม แล้วฝึกตามลำดับในโปรแกรม"
          exercises={selected.exercises}
          onSelect={onSelect}
        />
        <FollowShelf data={data} onFollow={onFollow} />
        <Shelf
          title="คลังท่าดัมเบลและน้ำหนักตัว"
          subtitle="เลือกดูวิธีทำ ไม่จำเป็นต้องฝึกครบทุกท่าในวันเดียว"
          exercises={data.exercises}
          onSelect={onSelect}
        />
        <Safety />
      </div>
    </>
  );
}
export function Library({
  data,
  onSelect,
}: {
  data: Guide;
  onSelect: (e: Exercise) => void;
}) {
  const [muscle, setMuscle] = useState("all");
  const exercises = filterExercises(data, muscle);
  return (
    <div className="content-wrap">
      <header className="page-heading">
        <span className="eyebrow red">THE EXERCISE COLLECTION</span>
        <h1 id="page-title" tabIndex={-1}>
          คลังท่าฝึก
        </h1>
        <p>ดัมเบลและน้ำหนักตัว · มีคลิปทุกท่า</p>
      </header>
      <div className="filters" role="group" aria-label="เลือกกล้ามเนื้อ">
        {Object.entries(MUSCLES).map(([id, name]) => (
          <button
            key={id}
            className={muscle === id ? "chip selected" : "chip"}
            aria-pressed={muscle === id}
            onClick={() => setMuscle(id)}
          >
            {name}
          </button>
        ))}
      </div>
      <p className="fine">
        {exercises.length} ท่า · เปิดการ์ดเพื่อดูคลิปและวิธีเล่น
      </p>
      <div className="catalog-grid">
        {exercises.map((e) => (
          <ExerciseCard key={e.id} exercise={e} onClick={() => onSelect(e)} />
        ))}
      </div>
      <Safety />
    </div>
  );
}
export function Schedule({
  data,
  today,
  day,
  setDay,
  session,
  onStart,
  onResume,
  onDiscard,
  onSelect,
  onFollow,
}: {
  data: Guide;
  today: number;
  day: number;
  setDay: (d: number) => void;
  session: Session | null;
  onStart: (w: Workout) => void;
  onResume: () => void;
  onDiscard: () => void;
  onSelect: (e: Exercise) => void;
  onFollow: (e: Exercise) => void;
}) {
  const workout = workoutForDay(data, day);
  const active = session && session.phase !== "done";
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="content-wrap">
      <header className="page-heading">
        <span className="eyebrow red">YOUR TRAINING WEEK</span>
        <h1 id="page-title" tabIndex={-1}>
          เลือกวัน แล้วเริ่มฝึก
        </h1>
        <p>ฝึกทั้งตัว 2 วันต่อสัปดาห์ มีวันพักคั่น</p>
      </header>
      {active && (
        <section className="continue-card">
          <div>
            <h2>โปรแกรม {session.key} ที่ค้างไว้</h2>
            <p>ทำเสร็จ {session.completedSets} เซ็ต</p>
          </div>
          <div className="button-row">
            <button className="primary" onClick={onResume}>
              ฝึกต่อ
            </button>
            <button className="text-button" onClick={() => setConfirm(true)}>
              จบรอบนี้
            </button>
          </div>
          {confirm && (
            <div role="group" aria-label="ยืนยันจบการฝึก">
              <p>ล้างความคืบหน้ารอบที่ค้างไว้?</p>
              <button
                className="secondary"
                onClick={() => {
                  onDiscard();
                  setConfirm(false);
                }}
              >
                ยืนยันจบรอบนี้
              </button>
              <button className="text-button" onClick={() => setConfirm(false)}>
                ยกเลิก
              </button>
            </div>
          )}
        </section>
      )}
      <div className="week" role="group" aria-label="วันฝึก">
        {WEEK_ORDER.map((d) => (
          <button
            key={d}
            className={day === d ? "day selected" : "day"}
            aria-pressed={day === d}
            onClick={() => setDay(d)}
          >
            <span>{DAYS[d]}</span>
            <strong>{data.program.weekly[d] || "พัก"}</strong>
            <small>{d === today ? "วันนี้" : "\u00a0"}</small>
          </button>
        ))}
      </div>
      {workout ? (
        <>
          <section className="workout-heading">
            <div>
              <span className="eyebrow">วัน{DAYS[day]}</span>
              <h2>
                FULL BODY <span className="red">{workout.key}</span>
              </h2>
              <p>{workout.exercises.length} ท่า · ท่าละ 2 เซ็ต · ฝึกทีละท่า</p>
            </div>
            <button
              className="primary"
              disabled={Boolean(active)}
              onClick={() => onStart(workout)}
            >
              ▶ เริ่มโปรแกรม {workout.key}
            </button>
          </section>
          <Shelf
            title="ลำดับการฝึก"
            exercises={workout.exercises}
            onSelect={onSelect}
          />
        </>
      ) : (
        <section className="panel rest-day">
          <span className="eyebrow">RECOVERY DAY</span>
          <h2>วันนี้ ให้ร่างกายได้พัก</h2>
          <p>เดินสบาย ๆ หรือขยับเบา ๆ ตามความพร้อม ไม่ต้องฝึกชดเชยติดกัน</p>
          <button
            className="secondary"
            onClick={() => setDay(nextTrainingDay(data, day))}
          >
            ดูวันฝึกถัดไป
          </button>
        </section>
      )}
      <p className="fine">
        เลือกวันเพื่อดูโปรแกรม ไม่ใช่บันทึกว่าฝึกเสร็จ ·{" "}
        <a href="#setup">เปลี่ยนวันฝึกประจำ</a>
      </p>
      <FollowShelf data={data} onFollow={onFollow} />
      <p className="fine">{data.program.equipmentNote}</p>
      <Safety />
    </div>
  );
}

export function FollowShelf({ data, onFollow }: {data: Guide; onFollow: (e: Exercise) => void}) {
  const exercises = data.exercises.filter(e => hasFollowMedia(e.id));
  return <section className="shelf"><div className="section-heading"><div><h2>ทำไปพร้อมกัน</h2><p className="fine">เลือกท่า วางจอ แล้วเริ่มตามภาพและเสียงไทยเมื่อเครื่องรองรับ</p></div><span className="fine">{exercises.length} ท่า</span></div>
    <div className="card-rail" tabIndex={0} aria-label="เลือกท่าทำไปพร้อมกัน">{exercises.map(e => <button key={e.id} className="follow-card" onClick={() => onFollow(e)}><div className="card-art"><img src={`${mediaBase}${e.id}.jpg`} alt="" loading="lazy" /></div><div className="card-copy"><div><h3>{e.name}</h3><p>{e.englishName}</p><strong className="red">▶ เริ่มทำพร้อมกัน</strong></div></div></button>)}</div>
    <p className="fine">ฝึกแยกจากโปรแกรม · ไม่เพิ่มเซ็ตในตาราง · ไม่ต้องฝึกเพิ่มในวันพัก</p>
  </section>;
}
