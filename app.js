import { FOLLOW_ID, openFollow } from './lib/follow-along.mjs?v=5';
import { DAYS, MUSCLES, localDay, localDateKey, viewFromHash, loadGuide, filterExercises, workoutForDay } from './lib/guide.mjs?v=5';
import { renderView } from './lib/views.mjs?v=5';
import { playVideo, stopVideos } from './lib/video.mjs?v=5';
import { validateProfile, readProfile, writeProfile, personalizedData } from './lib/nutrition.mjs?v=5';
import { createSession, advanceSession, remainingRest } from './lib/session.mjs?v=5';
import { sessionWorkout } from './lib/workout-views.mjs?v=5';

const app = document.querySelector('#app');
const announcement = document.querySelector('#announcement');
const dataURL = new URL('./data/guide.json?v=5', import.meta.url);
let storage;
try { storage = window.localStorage; } catch { storage = null; }
const profile = readProfile(storage);
const state = { view: viewFromHash(location.hash), today: localDay(), day: localDay(), muscle: 'all', profile,
  remember: Boolean(profile), draft: null, errors: {}, session: null, showRunner: false, scheduleOpen: false,
  confirmReset: false, confirmEnd: false, storageNotice: '' };
let data;
let dateKey = localDateKey();
let loading = false;
let followsToday = true;
let timer;
let lastRestSeconds;
let closeFollow;
const guide = () => personalizedData(data, state.profile);

function updateRestClock() {
  const clock = app.querySelector('[data-rest-clock]');
  if (!clock || state.session?.phase !== 'rest') return;
  const remaining = remainingRest(state.session);
  if (lastRestSeconds > 0 && remaining === 0) announcement.textContent = 'ครบเวลาพักแล้ว หากพร้อม กดปุ่มไปต่อได้ หรือพักเพิ่ม';
  lastRestSeconds = remaining;
  clock.textContent = String(remaining);
  const button = app.querySelector('[data-session-action="continue"]');
  button.disabled = remaining > 0;
  button.textContent = remaining > 0 ? 'พักให้พร้อมก่อน' : 'พร้อมแล้ว ไปต่อ →';
}

function render({ focusHeading = false, focusSelector = null } = {}) {
  if (!data) return;
  closeFollow?.();
  closeFollow = null;
  clearInterval(timer);
  app.innerHTML = renderView(guide(), state);
  for (const link of document.querySelectorAll('.navigation a')) {
    const active = link.hash === `#${state.view}` || (state.view === 'setup' && link.hash === '#plan');
    if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  }
  const title = app.querySelector('#page-title');
  document.title = `${title.textContent} — เริ่มเวท`;
  if (focusHeading) title.focus();
  if (focusSelector) app.querySelector(focusSelector)?.focus({ preventScroll: true });
  if (state.view === 'today' && state.showRunner && state.session?.phase === 'rest') {
    lastRestSeconds = remainingRest(state.session);
    updateRestClock();
    timer = setInterval(updateRestClock, 250);
  }
}

function navigate(view) {
  if (viewFromHash(location.hash) === view) { state.view = view; render({ focusHeading: true }); }
  else location.hash = view;
}

function profileFromForm(form) {
  const fields = new FormData(form);
  const numeric = (key) => fields.get(key) === '' ? null : Number(fields.get(key));
  return { goal: fields.get('goal') || '', weight: numeric('weight'), height: numeric('height'),
    age: numeric('age'), sex: fields.get('sex'), activity: fields.get('activity'),
    startDay: Number(fields.get('startDay')), needsAdvice: fields.has('needsAdvice') };
}

async function start() {
  if (loading) return;
  loading = true;
  app.setAttribute('aria-busy', 'true');
  app.innerHTML = '<section class="loading"><h1>กำลังเตรียมแผนกินและฝึก…</h1><p>อีกสักครู่ก็เริ่มได้แล้ว</p></section>';
  try {
    data = await loadGuide(dataURL);
    state.view = viewFromHash(location.hash);
    render();
    announcement.textContent = state.profile ? 'แผนพร้อมแล้ว' : 'เริ่มจากเลือกเป้าหมายและกรอกข้อมูลของคุณ';
  } catch {
    app.innerHTML = `<section class="loading" role="alert"><h1>ยังโหลดข้อมูลไม่ได้</h1><p>ตรวจการเชื่อมต่อแล้วลองอีกครั้ง</p>
      <button type="button" class="action" data-retry>ลองโหลดอีกครั้ง</button></section>`;
  } finally { loading = false; app.setAttribute('aria-busy', 'false'); }
}

app.addEventListener('input', (event) => {
  const form = event.target.closest('#profile-form');
  if (form) { state.draft = profileFromForm(form); state.remember = form.elements.remember.checked; }
});

app.addEventListener('submit', (event) => {
  if (event.target.id !== 'profile-form') return;
  event.preventDefault();
  const nextProfile = profileFromForm(event.target);
  state.remember = event.target.elements.remember.checked;
  state.draft = nextProfile;
  state.errors = validateProfile(nextProfile);
  if (Object.keys(state.errors).length) {
    render({ focusSelector: `[name="${Object.keys(state.errors)[0]}"]` });
    announcement.textContent = 'กรุณาตรวจข้อมูลที่ระบุ ก่อนคำนวณแผน';
    return;
  }
  const saved = writeProfile(storage, nextProfile, state.remember);
  state.storageNotice = saved ? (state.remember ? 'จำข้อมูลไว้ในเบราว์เซอร์เครื่องนี้แล้ว' : 'ใช้ข้อมูลเฉพาะหน้านี้ รีเฟรชแล้วต้องกรอกใหม่')
    : state.remember ? 'เบราว์เซอร์ไม่อนุญาตให้จำข้อมูล ยังใช้แผนในหน้านี้ได้ แต่รีเฟรชแล้วต้องกรอกใหม่'
      : 'ยังล้างข้อมูลที่เคยจำไว้ไม่ได้ หากเคยเลือกให้จำข้อมูล ให้ล้างข้อมูลเว็บไซต์จากการตั้งค่าเบราว์เซอร์ด้วย';
  state.profile = nextProfile; state.draft = null; state.errors = {}; state.confirmReset = false;
  state.day = state.today; followsToday = true;
  navigate('plan');
  announcement.textContent = 'คำนวณแผนแล้ว ดูอาหารและตารางฝึกได้เลย';
});

app.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  if (button.hasAttribute('data-retry')) { void start(); return; }
  if (!data) return;
  if (button.hasAttribute('data-follow')) {
    const exercise = data.exercises.find(e => e.id === FOLLOW_ID);
    const inSession = button.dataset.follow === 'session';
    const original = state.session;
    if (inSession && (original?.phase !== 'exercise' || sessionWorkout(data, original).exercises[original.index]?.id !== FOLLOW_ID)) return;
    stopVideos(app, data.exercises);
    closeFollow?.();
    closeFollow = openFollow(exercise, { onClose: () => { closeFollow = null; }, onComplete: inSession ? () => {
      if (state.session !== original) return;
      state.session = advanceSession(original, sessionWorkout(data, original), 'complete');
      render({ focusHeading: true });
      announcement.textContent = state.session.phase === 'done' ? 'จบการฝึกรอบนี้แล้ว' : 'ยืนยันทำเซ็ตเสร็จแล้ว เริ่มพักได้';
    } : null });
    return;
  }
  if (button.hasAttribute('data-play-video')) {
    const exercise = data.exercises.find((e) => e.id === button.dataset.playVideo);
    if (exercise) playVideo(app, exercise, data.exercises);
    return;
  }
  if (button.hasAttribute('data-day')) {
    const day = Number(button.dataset.day);
    if (!Number.isInteger(day) || day < 0 || day > 6) return;
    state.day = day; followsToday = day === state.today; state.scheduleOpen = true;
    render({ focusHeading: true });
    announcement.textContent = `วัน${DAYS[day]} ${guide().program.weekly[day] || 'พักเวท'}`;
    return;
  }
  if (button.hasAttribute('data-muscle') && Object.hasOwn(MUSCLES, button.dataset.muscle)) {
    state.muscle = button.dataset.muscle;
    render({ focusSelector: `[data-muscle="${state.muscle}"]` });
    announcement.textContent = `${MUSCLES[state.muscle]} ${filterExercises(data, state.muscle).length} ท่า`;
    return;
  }
  if (button.hasAttribute('data-session-start')) {
    if (state.session && state.session.phase !== 'done') return;
    const workout = workoutForDay(guide(), state.day);
    if (!workout) return;
    state.session = createSession(workout); state.showRunner = true;
    render({ focusHeading: true }); return;
  }
  if (button.hasAttribute('data-session-action') && state.session) {
    state.session = advanceSession(state.session, sessionWorkout(data, state.session), button.dataset.sessionAction);
    // Replace only session states; timer ticks never recreate the video player.
    render({ focusHeading: true });
    announcement.textContent = state.session.phase === 'rest' ? 'ทำเซ็ตเสร็จแล้ว เริ่มพักได้' : state.session.phase === 'done' ? 'จบการฝึกรอบนี้แล้ว' : `ท่า ${state.session.index + 1} เซ็ต ${state.session.set}`;
    return;
  }
  if (button.hasAttribute('data-session-pause')) { state.showRunner = false; render({ focusHeading: true }); return; }
  if (button.hasAttribute('data-session-resume') && state.session) { state.showRunner = true; render({ focusHeading: true }); return; }
  if (button.hasAttribute('data-session-discard')) { state.confirmEnd = true; render(); return; }
  if (button.hasAttribute('data-session-discard-cancel')) { state.confirmEnd = false; render(); return; }
  if (button.hasAttribute('data-session-discard-confirm')) { state.session = null; state.showRunner = false; state.confirmEnd = false; render({ focusHeading: true }); return; }
  if (button.hasAttribute('data-reset')) { state.confirmReset = true; render(); return; }
  if (button.hasAttribute('data-reset-cancel')) { state.confirmReset = false; render(); return; }
  if (button.hasAttribute('data-reset-confirm')) {
    const removed = writeProfile(storage, null, false);
    Object.assign(state, { profile: null, draft: null, errors: {}, remember: false, session: null, showRunner: false, confirmReset: false, confirmEnd: false, storageNotice: removed ? '' : 'ยังล้างข้อมูลที่เคยจำไว้ไม่ได้ กรุณาล้างข้อมูลเว็บไซต์จากการตั้งค่าเบราว์เซอร์ด้วย', day: state.today });
    followsToday = true;
    navigate('setup');
    announcement.textContent = removed ? 'ล้างข้อมูลของคุณแล้ว' : 'ล้างข้อมูลในหน้านี้แล้ว แต่ยังล้างข้อมูลที่จำไว้ไม่ได้ กรุณาล้างข้อมูลเว็บไซต์จากการตั้งค่าเบราว์เซอร์';
  }
});

app.addEventListener('toggle', (event) => {
  if (event.target.matches('details.schedule-details')) state.scheduleOpen = event.target.open;
  if (data && event.target.matches('details.exercise') && !event.target.open) stopVideos(event.target, data.exercises);
}, true);
app.addEventListener('error', (event) => { if (event.target.matches('img[data-video-image]')) event.target.hidden = true; }, true);
window.addEventListener('hashchange', () => {
  if (location.hash === '#main') return;
  state.view = viewFromHash(location.hash);
  render({ focusHeading: true });
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  updateRestClock();
  if (localDateKey() === dateKey) return;
  dateKey = localDateKey(); state.today = localDay();
  if (followsToday) state.day = state.today;
  if (state.session?.phase === 'done') { state.session = null; state.showRunner = false; }
  // Preserve an in-progress form and exercise when crossing local midnight.
  if (!app.querySelector('#profile-form') && !(state.showRunner && state.session?.phase !== 'done')) render();
});

window.addEventListener('pagehide', () => closeFollow?.());

void start();
