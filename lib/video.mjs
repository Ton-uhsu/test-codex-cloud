import { escapeHTML as h } from './guide.mjs?v=3';

export function youtubeLinks(id) {
  if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{11}$/.test(id)) {
    throw new Error('Invalid YouTube video ID');
  }
  return {
    watch: `https://www.youtube.com/watch?v=${id}`,
    embed: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`,
    thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  };
}

export function videoPreview(exercise) {
  const video = exercise.video;
  const links = youtubeLinks(video.youtubeId);
  return `<button type="button" class="video-preview" data-play-video="${h(exercise.id)}" aria-label="เล่นวิดีโอสาธิต ${h(exercise.name)}">
    <img data-video-image src="${links.thumbnail}" alt="" width="480" height="360" loading="lazy" decoding="async">
    <span class="video-play"><span aria-hidden="true">▶</span> เล่นคลิปสาธิต</span>
  </button>`;
}

// A single player at a time; removing its iframe stops playback immediately.
export function stopVideos(root, exercises) {
  for (const frame of root.querySelectorAll('iframe[data-exercise-video]')) {
    const exercise = exercises.find((item) => item.id === frame.dataset.exerciseVideo);
    const container = frame.parentElement;
    frame.remove();
    if (exercise) container.innerHTML = videoPreview(exercise);
  }
}

export function playVideo(root, exercise, exercises, doc = document) {
  const links = youtubeLinks(exercise.video.youtubeId);
  stopVideos(root, exercises);
  const container = root.querySelector(`[data-video-container="${exercise.id}"]`);
  if (!container) return;
  const frame = doc.createElement('iframe');
  frame.src = links.embed;
  frame.title = `วิดีโอสาธิต ${exercise.name} — ${exercise.video.channel}`;
  frame.dataset.exerciseVideo = exercise.id;
  frame.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share';
  frame.allowFullscreen = true;
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  container.replaceChildren(frame);
  frame.focus({ preventScroll: true });
}
