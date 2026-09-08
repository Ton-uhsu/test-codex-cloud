import { useEffect, useState } from "react";
import { remainingRest } from "../../lib/session.mjs";
import { FOLLOW_ID } from "../../lib/follow-along.mjs";
import { sessionWorkout } from "../data";
import type { Guide, Session } from "../types";
import { Video, Technique, ExerciseImage } from "./Exercise";

export function Runner({
  data,
  session: s,
  onAction,
  onBack,
  onFollow,
  coaching,
}: {
  data: Guide;
  session: Session;
  onAction: (action: string) => void;
  onBack: () => void;
  onFollow: () => void;
  coaching: boolean;
}) {
  const w = sessionWorkout(data, s);
  const total = w.exercises.reduce((n, e) => n + e.sets, 0);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    setNow(Date.now());
    if (s.phase !== "rest") return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    const visible = () => setNow(Date.now());
    document.addEventListener("visibilitychange", visible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [s.phase, s.restUntil]);
  const seconds = remainingRest(s, now);
  const header = (title: string, subtitle: string) => (
    <header className="runner-heading">
      <div>
        <span className="eyebrow red">FULL BODY {w.key}</span>
        <h1 id="page-title" tabIndex={-1}>
          {title}
        </h1>
        <p className="fine">{subtitle}</p>
      </div>
      <button className="secondary" onClick={onBack}>
        กลับตาราง
      </button>
    </header>
  );
  if (s.phase === "warmup")
    return (
      <div className="content-wrap narrow">
        {header(
          "เตรียมตัว ก่อนเริ่ม",
          `${w.exercises.length} ท่า · ท่าละ 2 เซ็ต`,
        )}
        <section className="panel warmup">
          <span className="huge-number">01</span>
          <h2>ขยับร่างกาย แล้วลองท่ามือเปล่า</h2>
          <ol>
            <li>เดินหรือขยับเบา ๆ เพื่อวอร์มอัปก่อนยกน้ำหนัก</li>
            <li>
              เคลียร์พื้นที่ไม่ให้ลื่น วางดัมเบลให้หยิบง่าย
              และตรวจตัวล็อกน้ำหนัก
            </li>
            <li>
              เลือกน้ำหนักเบาที่ควบคุมได้
              ดูคลิปแล้วลองเคลื่อนไหวมือเปล่าก่อนเริ่ม
            </li>
          </ol>
          <p>
            ทำท่าแรกให้ครบแล้วค่อยไปท่าถัดไป หยุดหากเจ็บแปลบ เจ็บข้อ
            หรือเวียนหัว
          </p>
          <button className="primary" onClick={() => onAction("ready")}>
            ▶ พร้อมแล้ว เริ่มท่าแรก
          </button>
          <p className="fine">
            อิงคำแนะนำ{" "}
            <a href={data.sources.mayo.url} target="_blank" rel="noreferrer">
              Mayo Clinic ↗
            </a>
          </p>
        </section>
      </div>
    );
  if (s.phase === "done")
    return (
      <div className="content-wrap narrow">
        {header(
          s.skipped.length ? "จบการฝึกรอบนี้แล้ว" : "ฝึกครบแล้ว พักได้เลย",
          `โปรแกรม ${w.key}`,
        )}
        <section className="panel completion">
          <span className="huge-number">
            {s.completedSets}
            <small> / {total}</small>
          </span>
          <h2>เซ็ตที่คุณยืนยันว่าทำเสร็จ</h2>
          <p>
            {s.skipped.length
              ? `มีท่าที่ข้าม ${s.skipped.length} ท่า ไม่ต้องฝืนทำชดเชย`
              : "วันนี้ทำครบตามตัวอย่างแล้ว ไม่จำเป็นต้องฝึกเพิ่มให้หมดแรง"}
          </p>
          <p>
            เว้นอย่างน้อยหนึ่งวันเต็มก่อนฝึกกลุ่มเดิมซ้ำ กินให้เพียงพอและพักฟื้น
            หากยังเจ็บหรือฟื้นตัวไม่ดี ให้เลื่อนวันฝึก
          </p>
          <p className="fine">
            ความคืบหน้าอยู่ในหน้านี้เท่านั้น รีเฟรชแล้วเริ่มใหม่
          </p>
          <a className="primary" href="#nutrition">
            ดูแผนกิน
          </a>
        </section>
      </div>
    );
  const e = w.exercises[s.index];
  const next =
    s.set < e.sets
      ? `เซ็ต ${s.set + 1} ของท่าเดิม`
      : w.exercises[s.index + 1]?.name;
  return (
    <div className="content-wrap">
      {header(
        e.name,
        `ท่า ${s.index + 1} / ${w.exercises.length} · ${e.equipment}`,
      )}
      <div className="session-progress">
        <progress
          value={s.completedSets}
          max={total}
          aria-label="เซ็ตที่ทำเสร็จ"
        />
        <span>
          {s.completedSets} / {total} เซ็ต
        </span>
      </div>
      <div className="runner-grid">
        <section className="runner-media">
          {coaching ? (
            <ExerciseImage exercise={e} />
          ) : (
            <Video key={e.id} exercise={e} />
          )}
        </section>
        <aside className="set-panel">
          <span className="eyebrow">
            เซ็ต {s.set} / {e.sets}
          </span>
          {s.phase === "rest" ? (
            <>
              <h2>พักให้พร้อม</h2>
              <p
                className="rep-number"
                role="timer"
                aria-label="วินาทีที่เหลือ"
              >
                {seconds}
                <small>วินาที</small>
              </p>
              <p className="fine">ถัดไป: {next}</p>
              <p role="status">
                {seconds === 0
                  ? "ครบเวลาพักแล้ว ไปต่อเมื่อพร้อม"
                  : "พักเพิ่มได้ ไม่ต้องรีบ"}
              </p>
              <button
                className="primary"
                disabled={seconds > 0}
                onClick={() => onAction("continue")}
              >
                {seconds > 0 ? "กำลังพัก" : "พร้อมแล้ว ไปต่อ"}
              </button>
              <button className="secondary" onClick={() => onAction("extend")}>
                พักเพิ่ม 30 วินาที
              </button>
            </>
          ) : (
            <>
              <p className="rep-number">
                {e.repsMin}–{e.repsMax}
                <small>ครั้ง</small>
              </p>
              <p>ทำช้า ๆ คุมท่าได้ แล้วค่อยกดเสร็จ</p>
              {e.id === FOLLOW_ID && (
                <button className="primary" onClick={onFollow}>
                  ▶ ทำไปพร้อมกัน · เซ็ตนี้
                </button>
              )}
              <button
                className={e.id === FOLLOW_ID ? "secondary" : "primary"}
                onClick={() => onAction("complete")}
              >
                ✓ ทำเซ็ต {s.set} เสร็จแล้ว
              </button>
              <button className="text-button" onClick={() => onAction("skip")}>
                ข้ามท่านี้
              </button>
              <p className="fine">
                พัก {e.restSeconds} วินาทีหลังเซ็ต ไม่ต้องฝืนให้ถึงจำนวนสูงสุด
              </p>
            </>
          )}
          <button className="text-button" onClick={onBack}>
            พักการฝึกไว้ก่อน
          </button>
          <p className="fine">หยุดหากเจ็บแปลบ เจ็บข้อ เวียนหัว หรือผิดปกติ</p>
        </aside>
        <div className="runner-technique">
          <Technique exercise={e} data={data} />
        </div>
      </div>
    </div>
  );
}
