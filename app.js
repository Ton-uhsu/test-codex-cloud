import { DAYS, MUSCLES, localDay, localDateKey, viewFromHash, loadGuide, filterExercises } from './lib/guide.mjs?v=3';
import { renderView } from './lib/views.mjs?v=3';
import { playVideo, stopVideos } from './lib/video.mjs?v=3';

const app = document.querySelector('#app');
const announcement = document.querySelector('#announcement');
const dataURL = new URL('./data/guide.json?v=3', import.meta.url);
const state = { view: viewFromHash(location.hash), today: localDay(), day: localDay(), muscle: 'all' };
let data;
let dateKey = localDateKey();
let loading = false;
let followsToday = true;

function render({ focusHeading = false, focusSelector = null } = {}) {
  if (!data) return;
  app.innerHTML = renderView(data, state);
  for (const link of document.querySelectorAll('.navigation a')) {
    if (link.hash === `#${state.view}`) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  const title = document.querySelector('#page-title');
  document.title = `${title.textContent} — เริ่มเวท`;
  if (focusHeading) title.focus();
  if (focusSelector) app.querySelector(focusSelector)?.focus({ preventScroll: true });
}

async function start() {
  if (loading) return;
  loading = true;
  app.setAttribute('aria-busy', 'true');
  app.innerHTML = '<section class="loading"><h1>กำลังเตรียมคู่มือฝึก…</h1><p>โหลดตารางและคำแนะนำสำหรับผู้เริ่มต้น</p></section>';
  try {
    data = await loadGuide(dataURL);
    // The user may have navigated while the JSON was loading.
    state.view = viewFromHash(location.hash);
    render();
    announcement.textContent = 'คู่มือพร้อมแล้ว เลือกวันฝึกหรือดูคลังท่าได้เลย';
  } catch {
    app.innerHTML = `<section class="loading" role="alert"><h1>ยังโหลดคู่มือไม่ได้</h1>
      <p>ตรวจการเชื่อมต่อแล้วลองอีกครั้ง หากเปิดไฟล์จากเครื่อง ให้เปิดผ่านเว็บเซิร์ฟเวอร์ตาม README</p>
      <button type="button" class="action" data-retry>ลองโหลดอีกครั้ง</button>
      <p class="notice">ระหว่างนี้อ่านคำแนะนำได้ที่ <a href="https://www.nhs.uk/live-well/exercise/how-to-improve-strength-flexibility/">NHS</a></p></section>`;
    announcement.textContent = 'โหลดข้อมูลไม่สำเร็จ กดปุ่มลองโหลดอีกครั้งได้';
  } finally {
    loading = false;
    app.setAttribute('aria-busy', 'false');
  }
}

app.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.hasAttribute('data-retry')) { void start(); return; }
  if (!data) return;
  if (button.hasAttribute('data-play-video')) {
    const exercise = data.exercises.find((item) => item.id === button.dataset.playVideo);
    if (exercise) playVideo(app, exercise, data.exercises);
    return;
  }
  if (button.hasAttribute('data-day')) {
    const day = Number(button.dataset.day);
    if (!Number.isInteger(day) || day < 0 || day > 6) return;
    state.day = day;
    followsToday = day === state.today;
    render({ focusSelector: `.week [data-day="${day}"]` });
    const key = data.program.weekly[day];
    announcement.textContent = `วัน${DAYS[day]} ${key ? `โปรแกรม ${key}` : 'พักเวท'}`;
  }
  if (button.hasAttribute('data-muscle') && Object.hasOwn(MUSCLES, button.dataset.muscle)) {
    state.muscle = button.dataset.muscle;
    render({ focusSelector: `[data-muscle="${state.muscle}"]` });
    announcement.textContent = `${MUSCLES[state.muscle]} ${filterExercises(data, state.muscle).length} ท่า`;
  }
});

app.addEventListener('toggle', (event) => {
  if (data && event.target.matches('details.exercise') && !event.target.open) {
    stopVideos(event.target, data.exercises);
  }
}, true);

app.addEventListener('error', (event) => {
  if (event.target.matches('img[data-video-image]')) event.target.hidden = true;
}, true);

window.addEventListener('hashchange', () => {
  // Preserve the current view when the keyboard skip link targets main.
  if (location.hash === '#main') return;
  state.view = viewFromHash(location.hash);
  render({ focusHeading: true });
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden || localDateKey() === dateKey) return;
  dateKey = localDateKey();
  state.today = localDay();
  if (followsToday) state.day = state.today;
  render();
});

void start();
