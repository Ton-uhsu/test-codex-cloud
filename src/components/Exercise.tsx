import { useEffect, useRef, useState } from "react";
import type { Exercise, Guide } from "../types";
import { MUSCLES } from "../../lib/guide.mjs";
import { youtubeLinks } from "../../lib/video.mjs";
import { openFollow } from "../../lib/follow-along.mjs";
import { hasFollowMedia } from "../../lib/follow-media.mjs";
import { mediaBase } from "../data";

export function ExerciseImage({
  exercise,
  className = "",
}: {
  exercise: Exercise;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div className={`image-fallback ${className}`}>{exercise.englishName}</div>
  ) : (
    <img
      className={className}
      src={youtubeLinks(exercise.video.youtubeId).thumbnail}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
export function Video({ exercise }: { exercise: Exercise }) {
  const [playing, setPlaying] = useState(false);
  const links = youtubeLinks(exercise.video.youtubeId);
  useEffect(() => {
    setPlaying(false);
    const hide = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, [exercise.id]);
  return (
    <div className="video-block">
      {playing ? (
        <iframe
          className="video-frame"
          src={links.embed}
          title={`สาธิต ${exercise.name}`}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button
          className="video-preview"
          onClick={() => setPlaying(true)}
          aria-label={`เล่นคลิป ${exercise.name}`}
        >
          <ExerciseImage exercise={exercise} />
          <span className="play-disc" aria-hidden="true">
            ▶
          </span>
          <span className="video-label">ดูวิธีเล่น</span>
        </button>
      )}
      <p className="fine">
        {exercise.video.channel} · คลิปภาษาอังกฤษ ·{" "}
        <a href={links.watch} target="_blank" rel="noreferrer">
          เปิด YouTube ↗
        </a>
      </p>
    </div>
  );
}
export function Technique({
  exercise: e,
  data,
}: {
  exercise: Exercise;
  data: Guide;
}) {
  return (
    <section className="technique">
      <h2>วิธีเล่น</h2>
      <p className="fine">{e.equipment} · กล้ามเนื้อที่ใช้: {e.target}</p>
      <ol>
        {e.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      {e.learningNote && <p className="notice">{e.learningNote}</p>}
      <p className="notice">{e.caution}</p>
      <p className="fine">
        <a
          href={data.sources[e.techniqueSource].url}
          target="_blank"
          rel="noreferrer"
        >
          วิธีทำต้นฉบับ · {data.sources[e.techniqueSource].name} ↗
        </a>
      </p>
    </section>
  );
}
export function FollowPlayer({
  exercise,
  onClose,
  onComplete,
}: {
  exercise: Exercise;
  onClose: () => void;
  onComplete?: () => void;
}) {
  // Keep the reviewed media lifecycle engine behind a React-owned adapter.
  const callbacks = useRef({ onClose, onComplete });
  callbacks.current = { onClose, onComplete };
  useEffect(() => {
    let disposed = false;
    const close = openFollow(exercise, {
      assetBase: mediaBase,
      onClose: () => {
        if (!disposed) callbacks.current.onClose();
      },
      onComplete: callbacks.current.onComplete
        ? () => callbacks.current.onComplete?.()
        : null,
    });
    return () => {
      disposed = true;
      close();
    };
  }, [exercise]);
  return null;
}
export function ExerciseDetail({
  exercise,
  data,
  onClose,
  onFollow,
}: {
  exercise: Exercise;
  data: Guide;
  onClose: () => void;
  onFollow: (e: Exercise) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      className="detail-dialog"
      aria-labelledby="exercise-title"
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="dialog-top">
        <div>
          <span className="eyebrow">{MUSCLES[exercise.muscle]}</span>
          <h2 id="exercise-title">{exercise.name}</h2>
          <p className="fine" lang="en">{exercise.englishName}</p>
        </div>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="ปิดรายละเอียด"
        >
          ×
        </button>
      </div>
      <Video exercise={exercise} />
      <div className="dose-line">
        {exercise.sets} เซ็ต <span>×</span> {exercise.repsMin}–
        {exercise.repsMax} ครั้ง <span>·</span> พัก {exercise.restSeconds}{" "}
        วินาที
      </div>
      {hasFollowMedia(exercise.id) && (
        <button className="primary" onClick={() => onFollow(exercise)}>
          ▶ ทำไปพร้อมกัน
        </button>
      )}
      <Technique exercise={exercise} data={data} />
      <p className="fine">
        เซ็ต–ครั้งเป็นตัวอย่างของเว็บ อิง{" "}
        <a
          href={data.sources[exercise.doseSource].url}
          target="_blank"
          rel="noreferrer"
        >
          {data.sources[exercise.doseSource].name}
        </a>{" "}
        · ตรวจแหล่งข้อมูล {data.reviewedAt}
      </p>
    </dialog>
  );
}
export function ExerciseCard({
  exercise: e,
  onClick,
  index,
}: {
  exercise: Exercise;
  onClick: () => void;
  index?: number;
}) {
  return (
    <button className="exercise-card" onClick={onClick}>
      <div className="card-art">
        <ExerciseImage exercise={e} />
        <span className="card-play" aria-hidden="true">
          ▶
        </span>
        {hasFollowMedia(e.id) && <span className="card-badge">ทำไปพร้อมกัน</span>}
      </div>
      <div className="card-copy">
        {index !== undefined && (
          <span className="card-index">
            {String(index + 1).padStart(2, "0")}
          </span>
        )}
        <div>
          <span className="eyebrow">{MUSCLES[e.muscle]}</span>
          <h3>{e.name}</h3>
          <p>
            {e.sets} เซ็ต · {e.repsMin}–{e.repsMax} ครั้ง
          </p>
        </div>
      </div>
    </button>
  );
}
export function Safety() {
  return (
    <p className="safety">
      สำหรับมือใหม่ทั่วไป หยุดหากเจ็บแปลบ เจ็บข้อ หรือเวียนหัว
      หากมีอาการบาดเจ็บหรือข้อจำกัด ควรปรึกษาผู้เชี่ยวชาญก่อนฝึก ·{" "}
      <a href="#guide">หลักการและแหล่งข้อมูล</a>
    </p>
  );
}
