import { hasFollowMedia } from "../lib/follow-media.mjs";
import React from "react";
import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup as render } from "react-dom/server";
import { readFile } from "node:fs/promises";
import { guide } from "../src/data";
import { Home, Schedule, Library } from "../src/components/Browse";
import {
  ProfileForm,
  NutritionPage,
  profileDraft,
} from "../src/components/Nutrition";
import { ExerciseDetail, Video } from "../src/components/Exercise";
import { Runner } from "../src/components/Runner";
import { GuidePage } from "../src/components/Guide";
import { createSession, advanceSession } from "../lib/session.mjs";
import { workoutForDay } from "../lib/guide.mjs";
import type { Profile, Session } from "../src/types";
const noop = () => {};
const profile: Profile = {
  goal: "maintain",
  weight: 70,
  height: 175,
  age: 25,
  sex: "male",
  activity: "light",
  needsAdvice: false,
  startDay: 2,
};

test("React home exposes onboarding, actual training/rest days and session resume without fake progress", () => {
  for (let today = 0; today < 7; today++) {
    const html = render(
      <Home
        data={guide}
        profile={null}
        today={today}
        session={null}
        onStart={noop}
        onResume={noop}
        onSelect={noop}
        onFollow={noop}
      />,
    );
    assert.match(html, /ตั้งเป้าหมาย/);
    assert.match(html, /id="page-title"/);
    assert.equal(
      html.includes("เริ่มฝึกวันนี้"),
      Boolean(guide.program.weekly[today]),
    );
    assert.match(
      html,
      /\/test-codex-cloud\/assets\/exercises\/lateral-raise.jpg/,
    );
    assert.doesNotMatch(html, /undefined|NaN/);
  }
  const session = createSession(workoutForDay(guide, 1)!);
  const html = render(
    <Home
      data={guide}
      profile={profile}
      today={1}
      session={session}
      onStart={noop}
      onResume={noop}
      onSelect={noop}
      onFollow={noop}
    />,
  );
  assert.match(html, /ฝึกต่อจากเซ็ตเดิม/);
  assert.match(html, /2,300 kcal/);
});

test("all seven schedules preserve selected days, recovery, workout counts and active-session guard", () => {
  for (let day = 0; day < 7; day++) {
    const html = render(
      <Schedule
        data={guide}
        today={1}
        day={day}
        setDay={noop}
        session={null}
        onStart={noop}
        onResume={noop}
        onDiscard={noop}
        onSelect={noop}
        onFollow={noop}
      />,
    );
    assert.equal((html.match(/aria-pressed="true"/g) || []).length, 1);
    assert.equal(
      (html.match(/class="exercise-card"/g) || []).length,
      guide.program.weekly[day] ? 5 : 0,
    );
    if (!guide.program.weekly[day]) assert.match(html, /ดูวันฝึกถัดไป/);
  }
  const active = createSession(workoutForDay(guide, 1)!);
  const html = render(
    <Schedule
      data={guide}
      today={1}
      day={1}
      setDay={noop}
      session={active}
      onStart={noop}
      onResume={noop}
      onDiscard={noop}
      onSelect={noop}
      onFollow={noop}
    />,
  );
  assert.match(html, /disabled=""/);
});

test("React forms render restored v1 profile values, opt-in storage and no script injection", () => {
  const html = render(
    <ProfileForm
      profile={profile}
      draft={profileDraft(profile, 1)}
      setDraft={noop}
      remember={true}
      setRemember={noop}
      onSave={noop}
      onReset={noop}
      notice=""
    />,
  );
  assert.match(html, /name="weight"[^>]*value="70"/);
  assert.match(html, /name="remember"[^>]*checked=""/);
  assert.match(html, /ล้างข้อมูลของฉัน/);
  const unsafe = render(
    <ProfileForm
      profile={null}
      draft={{
        ...profileDraft(null, 1),
        weight: '"><script>alert(1)</script>',
      }}
      setDraft={noop}
      remember={false}
      setRemember={noop}
      onSave={noop}
      onReset={noop}
      notice=""
    />,
  );
  assert.doesNotMatch(unsafe, /<script>/);
});

test("React nutrition preserves targets, cooked portions, references and unsupported-profile safeguards", () => {
  const html = render(
    <NutritionPage profile={profile} data={guide} notice="" />,
  );
  assert.match(html, /2,300/);
  assert.equal((html.match(/class="meal-card"/g) || []).length, 4);
  assert.match(html, /ชั่งหลังทำสุก/);
  assert.match(html, /hg72_2002.pdf/);
  for (const summaryOnly of [true, false]) {
    const blocked = render(
      <NutritionPage
        profile={{ ...profile, needsAdvice: true }}
        data={guide}
        notice=""
        summaryOnly={summaryOnly}
      />,
    );
    assert.doesNotMatch(blocked, /class="energy-card"|class="meal-card"/);
    assert.match(blocked, /ผู้เชี่ยวชาญ/);
  }
});

test("React exercise details retain steps, sources, fallback video links and only supported reviewed follow exercises", () => {
  const list = render(<Library data={guide} onSelect={noop} />);
  assert.equal((list.match(/class="exercise-card"/g) || []).length, 10);
  for (const e of guide.exercises) {
    const html = render(
      <ExerciseDetail
        exercise={e}
        data={guide}
        onClose={noop}
        onFollow={noop}
      />,
    );
    assert.match(html, /<dialog/);
    assert.ok(html.includes(e.caution));
    assert.ok(
      html.includes(
        guide.sources[e.techniqueSource].url.replaceAll("&", "&amp;"),
      ),
    );
    assert.ok(html.includes(`watch?v=${e.video.youtubeId}`));
    assert.equal(html.includes("▶ ทำไปพร้อมกัน"), hasFollowMedia(e.id));
    assert.doesNotMatch(render(<Video exercise={e} />), /<iframe/);
  }
  const sources = render(<GuidePage data={guide} />);
  for (const s of Object.values(guide.sources))
    assert.ok(sources.includes(s.url.replaceAll("&", "&amp;")));
});

test("React runner retains warmup, guarded rest, skipping summary and supported follow entry", () => {
  const w = workoutForDay(guide, 1)!;
  let session = createSession(w);
  const view = (s: Session) =>
    render(
      <Runner
        data={guide}
        session={s}
        onAction={noop}
        onBack={noop}
        onFollow={noop}
        coaching={false}
      />,
    );
  assert.match(view(session), /พร้อมแล้ว เริ่มท่าแรก/);
  session = advanceSession(session, w, "ready");
  assert.match(view(session), /ทำเซ็ต 1 เสร็จแล้ว/);
  session = advanceSession(session, w, "complete");
  assert.match(view(session), /disabled=""/);
  assert.match(
    view({ ...session, phase: "exercise", index: 4 }),
    /ทำไปพร้อมกัน · เซ็ตนี้/,
  );
  assert.match(
    view({ ...session, phase: "done", skipped: ["wall-pushup"] }),
    /มีท่าที่ข้าม 1 ท่า/,
  );
});

test("Vite and Pages deploy only built assets; PRs cannot deploy", async () => {
  const config = await readFile(
    new URL("../vite.config.ts", import.meta.url),
    "utf8",
  );
  assert.match(config, /base: ["']\/test-codex-cloud\/["']/);
  const workflow = await readFile(
    new URL("../.github/workflows/pages.yml", import.meta.url),
    "utf8",
  );
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /path: dist/);
  assert.match(
    workflow,
    /github.ref == 'refs\/heads\/main' && github.event_name != 'pull_request'/,
  );
});
