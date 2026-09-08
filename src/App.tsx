import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { localDay, localDateKey, viewFromHash } from "../lib/guide.mjs";
import {
  readProfile,
  writeProfile,
  personalizedData,
} from "../lib/nutrition.mjs";
import { createSession, advanceSession } from "../lib/session.mjs";
import { FOLLOW_ID } from "../lib/follow-along.mjs";
import { guide, sessionWorkout } from "./data";
import type { Profile, Route, Session, Exercise, Workout } from "./types";
import { Home, Library, Schedule } from "./components/Browse";
import {
  ProfileForm,
  NutritionPage,
  profileDraft,
} from "./components/Nutrition";
import { ExerciseDetail, FollowPlayer } from "./components/Exercise";
import { Runner } from "./components/Runner";
import { GuidePage } from "./components/Guide";
function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
const links: { route: Route; name: string; icon: string }[] = [
  { route: "home", name: "หน้าหลัก", icon: "M3 10 12 3l9 7v11h-6v-7H9v7H3Z" },
  {
    route: "today",
    name: "ฝึก",
    icon: "M3 8v8m4-11v14m10-14v14m4-11v8M7 12h10",
  },
  {
    route: "nutrition",
    name: "อาหาร",
    icon: "M4 3v6a3 3 0 0 0 6 0V3M7 3v18M19 3c-4 3-4 9 0 9V3v18",
  },
  {
    route: "plan",
    name: "แผนของฉัน",
    icon: "M8 4H4v17h16V4h-4M8 3h8v4H8ZM8 12h8M8 16h5",
  },
];
export function App() {
  const [route, setRoute] = useState<Route>(() => viewFromHash(location.hash));
  const [profile, setProfile] = useState<Profile | null>(() =>
    readProfile(storage()),
  );
  const [today, setToday] = useState(localDay);
  const [day, setDay] = useState(localDay);
  const [draft, setDraft] = useState(() => profileDraft(profile, today));
  const [remember, setRemember] = useState(Boolean(profile));
  const [notice, setNotice] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [showRunner, setShowRunner] = useState(false);
  const [detail, setDetail] = useState<Exercise | null>(null);
  const [follow, setFollow] = useState<{
    exercise: Exercise;
    snapshot: Session | null;
  } | null>(null);
  const data = useMemo(() => personalizedData(guide, profile), [profile]);
  useEffect(() => {
    const change = () => {
      if (location.hash === "#main") return;
      setRoute(viewFromHash(location.hash));
      setDetail(null);
      setFollow(null);
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    const title = document.getElementById("page-title");
    document.title = `${title?.textContent || "เริ่มเวท"} — เริ่มเวท`;
    title?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [route, showRunner, session?.phase, session?.index, session?.set]);
  useEffect(() => {
    let key = localDateKey();
    const visible = () => {
      if (document.hidden || localDateKey() === key) return;
      key = localDateKey();
      const nextDay = localDay();
      setDay((old) => (old === today ? nextDay : old));
      setToday(nextDay);
      setSession((s) => (s?.phase === "done" ? null : s));
    };
    const leave = () => {
      setDetail(null);
      setFollow(null);
    };
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("pagehide", leave);
    return () => {
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("pagehide", leave);
    };
  }, [today]);
  function navigate(next: Route) {
    setRoute(next);
    if (location.hash !== `#${next}`) location.hash = next;
  }
  function save(next: Profile) {
    const saved = writeProfile(storage(), next, remember);
    setNotice(
      saved
        ? remember
          ? "จำข้อมูลไว้ในเบราว์เซอร์เครื่องนี้แล้ว"
          : "ใช้ข้อมูลเฉพาะหน้านี้ รีเฟรชแล้วต้องกรอกใหม่"
        : remember
          ? "ยังจำข้อมูลไม่ได้ แผนยังใช้ได้ในหน้านี้ แต่รีเฟรชแล้วต้องกรอกใหม่"
          : "ยังล้างข้อมูลที่เคยจำไว้ไม่ได้ กรุณาล้างข้อมูลเว็บไซต์จากการตั้งค่าเบราว์เซอร์",
    );
    setProfile(next);
    setDay(today);
    navigate("plan");
  }
  function reset() {
    const removed = writeProfile(storage(), null, false);
    setProfile(null);
    setDraft(profileDraft(null, today));
    setRemember(false);
    setSession(null);
    setShowRunner(false);
    setFollow(null);
    setNotice(
      removed
        ? "ล้างข้อมูลของคุณแล้ว"
        : "ยังล้างข้อมูลที่จำไว้ไม่ได้ กรุณาล้างข้อมูลเว็บไซต์ในการตั้งค่าเบราว์เซอร์",
    );
    navigate("setup");
  }
  function start(workout: Workout) {
    if (!session || session.phase === "done")
      setSession(createSession(workout));
    setShowRunner(true);
    navigate("today");
  }
  const resume = () => {
    setShowRunner(true);
    navigate("today");
  };
  const action = (event: string) =>
    setSession((s) =>
      s ? advanceSession(s, sessionWorkout(data, s), event) : s,
    );
  const practice = () => {
    setDetail(null);
    setFollow({
      exercise: data.exercises.find((e) => e.id === FOLLOW_ID)!,
      snapshot: null,
    });
  };
  const followSet = () => {
    if (session?.phase === "exercise")
      setFollow({
        exercise: sessionWorkout(data, session).exercises[session.index],
        snapshot: session,
      });
  };
  const setup = (
    <ProfileForm
      profile={profile}
      draft={draft}
      setDraft={setDraft}
      remember={remember}
      setRemember={setRemember}
      onSave={save}
      onReset={reset}
      notice={notice}
    />
  );
  let page: ReactNode;
  if (route === "setup" || (!profile && ["plan", "nutrition"].includes(route)))
    page = setup;
  else if (route === "plan" || route === "nutrition")
    page = (
      <NutritionPage
        profile={profile!}
        data={data}
        summaryOnly={route === "plan"}
        notice={notice}
      />
    );
  else if (route === "library")
    page = <Library data={data} onSelect={setDetail} />;
  else if (route === "guide") page = <GuidePage data={data} />;
  else if (route === "today")
    page =
      session && showRunner ? (
        <Runner
          data={data}
          session={session}
          onAction={action}
          onBack={() => setShowRunner(false)}
          onFollow={followSet}
          coaching={Boolean(follow)}
        />
      ) : (
        <Schedule
          data={data}
          today={today}
          day={day}
          setDay={setDay}
          session={session}
          onStart={start}
          onResume={resume}
          onDiscard={() => {
            setSession(null);
            setShowRunner(false);
          }}
          onSelect={setDetail}
          onFollow={practice}
        />
      );
  else
    page = (
      <Home
        data={data}
        profile={profile}
        today={today}
        session={session}
        onStart={start}
        onResume={resume}
        onSelect={setDetail}
        onFollow={practice}
      />
    );
  const active = (r: Route) =>
    route === r ||
    (r === "today" && route === "library") ||
    (r === "plan" && route === "setup");
  return (
    <>
      <a className="skip-link" href="#main">
        ข้ามไปเนื้อหา
      </a>
      <header className="site-header">
        <a className="brand" href="#home">
          เริ่มเวท<small>BEGINNER STRENGTH</small>
        </a>
        <nav className="desktop-nav" aria-label="เมนูหลัก">
          {links.map((l) => (
            <a
              key={l.route}
              href={`#${l.route}`}
              aria-current={
                route === l.route || (l.route === "plan" && route === "setup")
                  ? "page"
                  : undefined
              }
            >
              {l.name}
            </a>
          ))}
          <a
            href="#library"
            aria-current={route === "library" ? "page" : undefined}
          >
            คลังท่า
          </a>
        </nav>
        <span className="header-label">ดัมเบลคู่เดียว ก็เริ่มได้</span>
      </header>
      <main id="main" tabIndex={-1}>
        {page}
      </main>
      <nav className="bottom-nav" aria-label="เมนูมือถือ">
        {links.map((l) => (
          <a
            key={l.route}
            href={`#${l.route}`}
            aria-current={active(l.route) ? "page" : undefined}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d={l.icon} />
            </svg>
            {l.name}
          </a>
        ))}
      </nav>
      <footer className="site-footer">
        <span>เริ่มเวท / เรียนรู้ทีละท่า</span>
        <a href="#library">คลังท่าฝึก</a>
        <a href="#guide">หลักการและแหล่งข้อมูล</a>
        <a
          href="https://github.com/Ton-uhsu/test-codex-cloud"
          target="_blank"
          rel="noreferrer"
        >
          GitHub ↗
        </a>
      </footer>
      {detail && (
        <ExerciseDetail
          exercise={detail}
          data={data}
          onClose={() => setDetail(null)}
          onFollow={practice}
        />
      )}
      {follow && (
        <FollowPlayer
          exercise={follow.exercise}
          onClose={() => setFollow(null)}
          onComplete={
            follow.snapshot
              ? () => {
                  const snapshot = follow.snapshot;
                  setSession((current) =>
                    current === snapshot && current
                      ? advanceSession(
                          current,
                          sessionWorkout(data, current),
                          "complete",
                        )
                      : current,
                  );
                }
              : undefined
          }
        />
      )}
    </>
  );
}
