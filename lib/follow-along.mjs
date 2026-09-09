import { escapeHTML as h } from './guide.mjs';
import { createFollow, stepFollow, followRemaining } from './follow-state.mjs';

import { getFollowMedia } from './follow-media.mjs';
// A native dialog keeps keyboard focus inside the player and restores it on close.
export function openFollow(exercise, { onComplete = null, onClose = () => {}, assetBase = './assets/exercises/' } = {}) {
  const media = getFollowMedia(exercise.id);
  if (!media) throw new Error('No reviewed looping media for this exercise');
  const dialog = document.createElement('dialog');
  dialog.className = 'follow-dialog';
  dialog.setAttribute('aria-labelledby', 'follow-title');
  dialog.innerHTML = `<div class="follow-top"><div><p class="eyebrow">ทำไปพร้อมกัน</p><h2 id="follow-title">${h(exercise.name)}</h2></div><button type="button" class="secondary" data-close aria-label="ปิดโหมดทำไปพร้อมกัน">ปิด ×</button></div>
    <video data-loop playsinline muted preload="none" poster="${h(assetBase)}${h(media.id)}.jpg" aria-label="ภาพสาธิต ${h(exercise.name)}"><source src="${h(assetBase)}${h(media.id)}.mp4" type="video/mp4"></video>
    <div class="follow-readout"><span data-count>0 / 8 จังหวะ</span><strong data-cue role="status" aria-live="polite">ดูวิธีเล่น แล้วเลือกจำนวนครั้ง</strong></div>
    <p class="small-note">1 รอบภาพ ≈ ${media.seconds.toFixed(1)} วินาที เป็นจังหวะตัวอย่าง ปรับตามความพร้อม เว็บไม่ตรวจว่าคุณยกจริงหรือท่าถูกต้อง</p>
    <div class="follow-options"><label>จังหวะต่อเซ็ต <select data-reps><option value="8">8 ครั้ง</option><option value="10">10 ครั้ง</option><option value="12">12 ครั้ง</option></select></label><button type="button" class="secondary" data-voice-test>ทดลองเสียงไทย</button><button type="button" class="text-button" data-mute aria-pressed="false">ปิดเสียง</button></div>
    <p class="small-note" data-voice-status></p>
    <div class="button-row"><button type="button" class="action" data-start>เตรียมตัว 5 วินาที แล้วเริ่ม</button><button type="button" class="secondary" data-pause hidden>หยุดพัก</button><button type="button" class="action" data-confirm hidden>ฉันทำครบเซ็ตแล้ว → พัก</button><button type="button" class="secondary" data-extend hidden>พักเพิ่ม 30 วินาที</button></div>
    ${exercise.learningNote ? `<p class="caution">${h(exercise.learningNote)}</p>` : ''}<p class="caution">${h(exercise.caution)} หยุดได้ทุกเมื่อ ไม่ต้องฝืนตามภาพ หากพักกลางครั้ง ระบบจะเริ่มครั้งนั้นใหม่โดยไม่เพิ่มตัวนับ</p>
    <details><summary>วิธีเล่นและเครดิตภาพ</summary><ol class="steps">${exercise.steps.map(s => `<li>${h(s)}</li>`).join('')}</ol><p>ภาพ: ${h(media.author)} · <a href="${h(media.source)}" target="_blank" rel="noopener noreferrer">ต้นฉบับ ↗</a> · <a href="${h(media.licenseUrl)}" target="_blank" rel="noopener noreferrer">${h(media.license)}</a> ${h(media.changes)}</p>${media.disclaimer ? `<p lang="en">${h(media.disclaimer)}</p>` : ''}</details>`;
  document.body.append(dialog);
  const q = selector => dialog.querySelector(selector);
  const video = q('video');
  video.muted = true;
  const synth = window.speechSynthesis;
  let s = createFollow(), muted = false, closed = false, generation = 0, clock, audio;
  let lastCue = '', lastPrep = -1;
  const thaiVoice = () => synth?.getVoices().find(v => /^th(?:-|_|$)/i.test(v.lang));
  function voiceStatus() {
    q('[data-voice-status]').textContent = thaiVoice() ? 'ใช้เสียงไทยของเครื่อง · คุณภาพเสียงขึ้นกับอุปกรณ์ บางเสียงอาจใช้การเชื่อมต่ออินเทอร์เน็ต' : 'ยังไม่พบเสียงไทยในเครื่อง ใช้ข้อความและเสียงจังหวะแทนได้ หรือติดตั้งเสียงไทยในการตั้งค่าอุปกรณ์';
  }
  function beep() {
    if (!audio || muted || closed) return;
    try {
      const oscillator = audio.createOscillator(), gain = audio.createGain();
      oscillator.connect(gain); gain.connect(audio.destination);
      oscillator.frequency.value = 660; gain.gain.value = .06;
      oscillator.start(); oscillator.stop(audio.currentTime + .1);
    } catch { /* Visual cues always remain available. */ }
  }
  function say(text) {
    if (muted || closed) return;
    const voice = thaiVoice();
    if (!voice || !window.SpeechSynthesisUtterance) { beep(); return; }
    synth.cancel();
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = 'th-TH'; utterance.voice = voice; utterance.rate = 1;
    utterance.onerror = event => { if (!['canceled', 'interrupted'].includes(event.error) && !closed && !muted) q('[data-voice-status]').textContent = 'เสียงพูดเล่นไม่ได้ ใช้ข้อความบนหน้าจอช่วยนับจังหวะได้'; };
    synth.speak(utterance);
  }
  function cue(text, spoken = text) {
    q('[data-cue]').textContent = text;
    if (text !== lastCue) { lastCue = text; if (spoken) say(spoken); }
  }
  function paint() {
    q('[data-count]').textContent = `${s.completed} / ${s.reps} จังหวะ`;
    q('[data-reps]').disabled = s.phase !== 'idle';
    q('[data-start]').hidden = !['idle', 'paused', 'error', 'done'].includes(s.phase);
    q('[data-start]').textContent = s.phase === 'done' ? 'เริ่มเซ็ตใหม่' : ['paused', 'error'].includes(s.phase) ? 'พร้อมแล้ว เตรียม 5 วินาทีเพื่อทำต่อ' : 'เตรียมตัว 5 วินาที แล้วเริ่ม';
    q('[data-pause]').hidden = !['prep', 'playing', 'loading'].includes(s.phase);
    q('[data-confirm]').hidden = s.phase !== 'confirm';
    q('[data-extend]').hidden = s.phase !== 'rest';
  }
  function pause(message = 'หยุดพักแล้ว · กดเริ่มเมื่อพร้อม', failed = false) {
    generation++;
    s = stepFollow(s, failed ? 'error' : 'pause');
    video.pause();
    synth?.cancel();
    lastCue = ''; cue(message, ''); paint();
  }
  async function playCycle() {
    if (closed || s.phase !== 'loading') return;
    const token = ++generation;
    video.currentTime = 0;
    try {
      await video.play();
      if (closed || token !== generation || document.hidden || s.phase !== 'loading') return;
      s = stepFollow(s, 'playing'); lastCue = ''; paint();
      cue(`ครั้งที่ ${s.completed + 1} · ${media.cues[0].text}`, `${s.completed + 1} ${media.cues[0].text}`);
    } catch {
      if (!closed && token === generation) pause('วิดีโอเล่นไม่ได้ · ตรวจเน็ตแล้วลองใหม่ หรือปิดเพื่อใช้คลิปสอนเดิม', true);
    }
  }
  video.addEventListener('timeupdate', () => {
    if (s.phase !== 'playing') return;
    const phase = media.cues.findLast(c => video.currentTime >= c.at);
    if (phase) cue(`ครั้งที่ ${s.completed + 1} · ${phase.text}`, phase.text);
  });
  video.addEventListener('ended', () => {
    if (closed || document.hidden || s.phase !== 'playing') return;
    s = stepFollow(s, 'ended'); paint();
    if (s.phase === 'confirm') cue('จังหวะครบแล้ว · ยืนยันเมื่อคุณทำครบเซ็ต', 'จังหวะครบแล้ว พักก่อน แล้วกดยืนยันถ้าทำครบเซ็ต');
    else void playCycle();
  });
  video.addEventListener('waiting', () => {
    // A stalled demonstration must not keep coaching someone to move.
    if (s.phase === 'playing') pause('ภาพสะดุด · หยุดพักก่อน แล้วกดเริ่มเมื่อพร้อม');
  });
  video.addEventListener('error', () => pause('โหลดภาพไม่ได้ · ลองใหม่ หรือปิดเพื่อใช้คลิปสอนเดิม', true));
  function unlockAudio() {
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!audio && Audio) audio = new Audio();
      void audio?.resume().catch(() => {});
    } catch { /* Optional sound; no external service is required. */ }
  }
  dialog.addEventListener('change', event => {
    if (event.target.matches('[data-reps]') && s.phase === 'idle') { s = createFollow(Number(event.target.value)); paint(); }
  });
  dialog.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    if (button.hasAttribute('data-close')) { dispose(); return; }
    if (button.hasAttribute('data-mute')) {
      muted = !muted; synth?.cancel(); button.setAttribute('aria-pressed', String(muted));
      button.textContent = muted ? 'เปิดเสียง' : 'ปิดเสียง'; return;
    }
    if (button.hasAttribute('data-voice-test')) { unlockAudio(); voiceStatus(); say(`เตรียมตัว ${media.cues.map(c => c.text).join(' ')}`); return; }
    if (button.hasAttribute('data-pause')) { pause(); return; }
    if (button.hasAttribute('data-start')) {
      if (!['idle', 'paused', 'error', 'done'].includes(s.phase)) return;
      if (s.phase === 'done') s = createFollow(s.reps);
      unlockAudio(); video.load(); lastPrep = -1;
      s = stepFollow(s, 'start'); paint(); return;
    }
    if (button.hasAttribute('data-confirm') && s.phase === 'confirm') {
      s = stepFollow(s, 'confirm');
      if (onComplete) { dispose(); onComplete(); return; }
      cue('พัก 90 วินาที', 'พักเก้าสิบวินาที'); paint();
    }
    if (button.hasAttribute('data-extend')) { s = stepFollow(s, 'extend'); paint(); }
  });
  function visibility() {
    if (document.hidden && ['prep', 'loading', 'playing'].includes(s.phase)) pause('พักอัตโนมัติเมื่อออกจากหน้า · กดเริ่มเมื่อกลับมาพร้อม');
  }
  function dispose() {
    if (closed) return;
    closed = true; generation++; clearInterval(clock); video.pause(); video.removeAttribute('src');
    video.querySelector('source')?.remove(); video.load();
    synth?.cancel(); void audio?.close().catch(() => {});
    synth?.removeEventListener('voiceschanged', voiceStatus);
    document.removeEventListener('visibilitychange', visibility);
    dialog.close(); dialog.remove(); onClose();
  }
  dialog.addEventListener('cancel', event => { event.preventDefault(); dispose(); });
  document.addEventListener('visibilitychange', visibility);
  synth?.addEventListener('voiceschanged', voiceStatus);
  clock = setInterval(() => {
    if (closed) return;
    const previous = s.phase;
    s = stepFollow(s, 'tick');
    if (s.phase === 'prep') {
      const seconds = followRemaining(s, Date.now());
      if (seconds !== lastPrep) { lastPrep = seconds; cue(`เตรียมตัว ${seconds}`, String(seconds)); }
    }
    if (previous === 'prep' && s.phase === 'loading') { cue('กำลังเริ่มภาพ…', ''); void playCycle(); }
    if (s.phase === 'rest') {
      const restText = `พักอีก ${followRemaining(s, Date.now())} วินาที`;
      if (q('[data-cue]').textContent !== restText) q('[data-cue]').textContent = restText;
    }
    if (previous === 'rest' && s.phase === 'done') { cue('ครบเวลาพักแล้ว · เริ่มเซ็ตใหม่เมื่อพร้อม', 'ครบเวลาพักแล้ว'); paint(); }
  }, 100);
  voiceStatus(); paint(); dialog.showModal();
  return dispose;
}
