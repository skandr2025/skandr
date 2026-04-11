// ===== إعدادات الستوريز - عدّل هنا فقط =====
const STORIES = [
  {
    title: 'كبدة اسكندراني',
    thumb: 'img/WhatsApp Image 2026-01-27 at 7.14.12 PM.jpeg',
    video: 'img/6dbf8460a5c2efe100c11cc650132304.mp4'
  },
  {
    title: 'منتجاتنا',
    thumb: 'img/WhatsApp Image 2026-01-28 at 1.14.45 PM.jpeg',
    video: 'img/6dbf8460a5c2efe100c11cc650132304.mp4'
  },
  {
    title: 'عروض خاصة',
    thumb: 'img/WhatsApp Image 2025-11-07 at 04.42.22_575ad76b.jpg',
    video: 'img/6dbf8460a5c2efe100c11cc650132304.mp4'
  },
  {
    title: 'SKANDR',
    thumb: 'img/icon.JPG',
    video: 'img/6dbf8460a5c2efe100c11cc650132304.mp4'
  },
  {
    title: 'SKANDR',
    thumb: 'img/icon.JPG',
    video: 'img/6dbf8460a5c2efe100c11cc650132304.mp4'
  }
];
// ============================================

(function () {
  // إنشاء الـ CSS
  const style = document.createElement('style');
  style.textContent = `
    .stories-section {
      padding: 16px 0 8px;
      background: #fff;
      border-bottom: 1px solid #f0f0f0;
    }
    .stories-scroll {
      display: flex;
      gap: 14px;
      padding: 4px 16px 8px;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .stories-scroll::-webkit-scrollbar { display: none; }
    .story-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      flex-shrink: 0;
    }
    .story-ring {
      width: 64px; height: 64px;
      border-radius: 50%;
      padding: 3px;
      background: linear-gradient(135deg, #004f49, #00897b, #c9a84c);
      transition: transform .2s;
      flex-shrink: 0;
    }
    .story-ring:hover { transform: scale(1.08); }
    .story-ring.seen {
      background: linear-gradient(135deg, #ccc, #aaa);
    }
    .story-ring img {
      width: 58px; height: 58px;
      border-radius: 50%;
      object-fit: cover;
      object-position: center;
      border: 3px solid #fff;
      display: block;
      aspect-ratio: 1/1;
    }
    .story-label {
      font-size: 11px;
      font-weight: 600;
      color: #333;
      font-family: 'Tajawal', sans-serif;
      max-width: 64px;
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Viewer */
    .story-viewer {
      display: none;
      position: fixed;
      inset: 0;
      background: #000;
      z-index: 9999;
      flex-direction: column;
    }
    .story-viewer.open { display: flex; }

    .story-progress-bar {
      display: flex;
      gap: 4px;
      padding: 12px 12px 6px;
      position: absolute;
      top: 0; left: 0; right: 0;
      z-index: 2;
    }
    .story-prog-seg {
      flex: 1;
      height: 3px;
      background: rgba(255,255,255,0.35);
      border-radius: 3px;
      overflow: hidden;
    }
    .story-prog-fill {
      height: 100%;
      background: #fff;
      width: 0%;
      border-radius: 3px;
      transition: none;
    }

    .story-header {
      position: absolute;
      top: 28px; left: 0; right: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 14px;
      z-index: 2;
    }
    .story-user {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .story-user img {
      width: 36px; height: 36px;
      border-radius: 50%;
      border: 2px solid #fff;
      object-fit: cover;
    }
    .story-user span {
      color: #fff;
      font-size: 14px;
      font-weight: 700;
      font-family: 'Tajawal', sans-serif;
      text-shadow: 0 1px 4px rgba(0,0,0,0.5);
    }
    .story-close {
      color: #fff;
      font-size: 28px;
      cursor: pointer;
      background: none;
      border: none;
      line-height: 1;
      text-shadow: 0 1px 4px rgba(0,0,0,0.5);
    }

    .story-video-wrap {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .story-video-wrap video {
      max-width: 100%;
      max-height: 100vh;
      width: 100%;
      object-fit: contain;
    }

    /* tap zones */
    .story-tap-prev, .story-tap-next {
      position: absolute;
      top: 0; bottom: 0;
      width: 35%;
      z-index: 3;
      cursor: pointer;
    }
    .story-tap-prev { left: 0; }
    .story-tap-next { right: 0; }

    /* scroll hint */
    .story-scroll-hint {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      color: rgba(255,255,255,0.7);
      font-size: 12px;
      font-family: 'Tajawal', sans-serif;
      text-align: center;
      animation: bounce 1.5s infinite;
      z-index: 2;
    }
    @keyframes bounce {
      0%,100%{transform:translateX(-50%) translateY(0)}
      50%{transform:translateX(-50%) translateY(-6px)}
    }
  `;
  document.head.appendChild(style);

  // إنشاء الـ HTML
  function buildStories() {
    const section = document.createElement('div');
    section.className = 'stories-section';
    section.id = 'stories-section';

    const title = document.createElement('p');
    title.textContent = '🎬 شاهد قصصنا';
    title.style.cssText = 'font-family:Tajawal,sans-serif;font-size:14px;font-weight:800;color:#004f49;margin:0 0 8px;padding:0 16px;';

    const scroll = document.createElement('div');
    scroll.className = 'stories-scroll';

    STORIES.forEach((s, i) => {
      const item = document.createElement('div');
      item.className = 'story-item';
      item.innerHTML = `
        <div class="story-ring" id="story-ring-${i}">
          <img src="${s.thumb}" alt="${s.title}" onerror="this.src='img/icon.JPG'">
        </div>
        <span class="story-label">${s.title}</span>`;
      item.addEventListener('click', () => openViewer(i));
      scroll.appendChild(item);
    });

    section.appendChild(title);
    section.appendChild(scroll);
    return section;
  }

  // Viewer
  const viewer = document.createElement('div');
  viewer.className = 'story-viewer';
  viewer.innerHTML = `
    <div class="story-progress-bar" id="story-prog-bar"></div>
    <div class="story-header">
      <div class="story-user">
        <img src="img/icon.JPG" alt="SKANDR" id="story-hdr-img">
        <span id="story-hdr-title">SKANDR</span>
      </div>
      <button class="story-close" id="story-close-btn">✕</button>
    </div>
    <div class="story-video-wrap">
      <div class="story-tap-prev" id="story-tap-prev"></div>
      <video id="story-video" playsinline autoplay></video>
      <div class="story-tap-next" id="story-tap-next"></div>
    </div>
    <div class="story-scroll-hint">↓ اسحب للأسفل للمنتجات</div>`;
  document.body.appendChild(viewer);

  let currentIdx = 0;
  let progInterval = null;
  let progVal = 0;

  const video = document.getElementById('story-video');
  const progBar = document.getElementById('story-prog-bar');

  function buildProgressBar() {
    progBar.innerHTML = '';
    STORIES.forEach((_, i) => {
      const seg = document.createElement('div');
      seg.className = 'story-prog-seg';
      seg.innerHTML = '<div class="story-prog-fill" id="prog-fill-' + i + '"></div>';
      progBar.appendChild(seg);
    });
  }

  function openViewer(idx) {
    currentIdx = idx;
    viewer.classList.add('open');
    document.body.style.overflow = 'hidden';
    buildProgressBar();
    loadStory(idx);
  }

  function closeViewer() {
    viewer.classList.remove('open');
    document.body.style.overflow = '';
    video.pause();
    video.src = '';
    clearInterval(progInterval);
  }

  function loadStory(idx) {
    if (idx < 0 || idx >= STORIES.length) { closeViewer(); return; }
    currentIdx = idx;
    clearInterval(progInterval);
    progVal = 0;

    const s = STORIES[idx];
    document.getElementById('story-hdr-title').textContent = s.title;
    document.getElementById('story-hdr-img').src = s.thumb;

    // mark seen
    const ring = document.getElementById('story-ring-' + idx);
    if (ring) ring.classList.add('seen');

    // fill previous
    STORIES.forEach((_, i) => {
      const fill = document.getElementById('prog-fill-' + i);
      if (!fill) return;
      fill.style.transition = 'none';
      fill.style.width = i < idx ? '100%' : '0%';
    });

    video.src = s.video;
    video.load();
    video.play().catch(() => {});

    // progress
    const fill = document.getElementById('prog-fill-' + idx);
    progInterval = setInterval(() => {
      if (video.duration) {
        progVal = (video.currentTime / video.duration) * 100;
        if (fill) fill.style.width = progVal + '%';
      }
    }, 100);

    video.onended = () => {
      clearInterval(progInterval);
      if (fill) fill.style.width = '100%';
      setTimeout(() => loadStory(idx + 1), 300);
    };
  }

  document.getElementById('story-close-btn').addEventListener('click', closeViewer);
  document.getElementById('story-tap-prev').addEventListener('click', () => loadStory(currentIdx - 1));
  document.getElementById('story-tap-next').addEventListener('click', () => loadStory(currentIdx + 1));

  // swipe down to close
  let touchStartY = 0;
  viewer.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; });
  viewer.addEventListener('touchend', e => {
    if (e.changedTouches[0].clientY - touchStartY > 80) closeViewer();
  });

  // inject after slider - في الرئيسية تحت السلايدر
  document.addEventListener('DOMContentLoaded', () => {
    const aboutContent = document.getElementById('about-content');
    if (aboutContent) {
      // أضف بعد stats bar
      const statsBar = aboutContent.querySelector('.about-stats-bar');
      if (statsBar) {
        statsBar.after(buildStories());
      } else {
        aboutContent.insertBefore(buildStories(), aboutContent.firstChild);
      }
    }
  });

})();
