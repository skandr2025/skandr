/*! Ad Popup (الخديوي) — v2
    - يظهر عند كل Refresh (لا يعتمد على LocalStorage)
    - يحاول تشغيل الفيديو بصوت تلقائيًا (لو المتصفح رفض، يشغّله Muted تلقائيًا)
    - يُظهر العدّاد 3 ثواني (أو حسب الإعداد) وبعدها يفعّل الإغلاق اليدوي
    - يمكن الإغلاق يدويًا بزر "إغلاق" أو علامة × أو الضغط خارج المودال بعد العدّاد
    - (اختياري) يقفل تلقائيًا عند نهاية الفيديو autoCloseOnEnd:true
    إعدادات اختيارية قبل استدعاء الملف:
      window.AD_POPUP_CONFIG = {
        mediaType: 'video',                 // 'video' | 'image'
        src: 'assets/ads/intro.mp4',        // مسار الفيديو/الصورة
        poster: '',                         // اختياري للفيديو
        autoplay: true,                     // يفضّل true للفيديو
        muted: true,                        // للبداية الصامتة عند الحاجة
        controls: true,                     // إظهار أدوات التحكم
        countdownSeconds: 3,                // بعده يُسمح بالإغلاق اليدوي
        autoCloseOnEnd: true                // يقفل الإعلان عند انتهاء الفيديو
      }
*/
(function () {
  const CFG = Object.assign({
    mediaType: 'video',
    src: 'assets/ads/intro.mp4',
    poster: '',
    autoplay: true,
    muted: true,
    controls: true,
    countdownSeconds: 3,
    autoCloseOnEnd: true
  }, (window.AD_POPUP_CONFIG || {}));

  const makeEl = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };

  function buildPopup() {
    if (document.querySelector('.ad-overlay')) return;

    const overlay   = makeEl('div','ad-overlay');
    const modal     = makeEl('div','ad-modal');
    const mediaWrap = makeEl('div','ad-media-wrap');

    // ===== media =====
    let mediaEl;
    if (CFG.mediaType === 'video') {
      const v = document.createElement('video');
      v.setAttribute('playsinline',''); v.setAttribute('webkit-playsinline','');
      v.preload  = 'auto';
      v.autoplay = !!CFG.autoplay;
      v.muted    = !!CFG.muted;     // قد يبدّل لاحقًا حسب السماحية
      v.controls = !!CFG.controls;
      v.loop     = false;
      if (CFG.poster) v.poster = CFG.poster;

      const s = document.createElement('source');
      s.src  = CFG.src;
      s.type = 'video/mp4';
      v.appendChild(s);
      mediaEl = v;
      mediaWrap.appendChild(v);

      // محاولة التشغيل بصوت أولًا — إن فشلت، نرجع لميوت تلقائي
      async function startVideoWithSoundIfPossible() {
        try {
          v.muted = false;
          v.volume = 1;
          await v.play();                 // يسمح الصوت تلقائيًا؟ ممتاز.
        } catch (e) {
          try {
            v.muted = true;
            await v.play();               // تشغيل صامت تلقائيًا
          } catch (_) {
            const tryAgain = () => { v.play().catch(()=>{}); };
            v.addEventListener('canplay', tryAgain, { once: true });
          }
        }
      }

      // جدولة بدء التشغيل
      if (CFG.autoplay) {
        if (document.visibilityState === 'visible') {
          startVideoWithSoundIfPossible();
        } else {
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') startVideoWithSoundIfPossible();
          }, { once: true });
        }
      }

      // إغلاق عند نهاية الفيديو (اختياري)
      if (CFG.autoCloseOnEnd) v.addEventListener('ended', () => destroy());

      // fallback لصورة لو الفيديو فشل
      v.addEventListener('error', () => {
        mediaWrap.innerHTML = '';
        const img = document.createElement('img');
        img.src = CFG.poster || CFG.src.replace(/\.(mp4|webm|ogg)$/i,'.jpg');
        img.alt = 'إعلان';
        mediaWrap.appendChild(img);
      });
    } else {
      const img = document.createElement('img');
      img.src = CFG.src;
      img.alt = 'إعلان';
      img.loading = 'eager';
      img.decoding = 'async';
      mediaEl = img;
      mediaWrap.appendChild(img);
    }

    // ===== footer / countdown / close =====
    const footer   = makeEl('div', 'ad-footer');
    const msg      = makeEl('div', 'ad-countdown', `سيتم تفعيل زر الإغلاق بعد <b id="ad-count">${CFG.countdownSeconds}</b> ثانية`);
    const closeBtn = makeEl('button', 'ad-close', 'إغلاق الإعلان');
    const xBadge   = makeEl('div', 'ad-x', '&times;');

    footer.appendChild(msg);
    footer.appendChild(closeBtn);
    modal.appendChild(mediaWrap);
    modal.appendChild(footer);
    modal.appendChild(xBadge);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    requestAnimationFrame(()=> overlay.classList.add('ad-show'));

    // عدّاد يسمح بالإغلاق (بدون إغلاق تلقائي بالعدّاد)
    let remain = Math.max(0, parseInt(CFG.countdownSeconds,10) || 3);
    const countEl = msg.querySelector('#ad-count');

    const enableClose = () => {
      closeBtn.classList.add('ad-enabled');
      xBadge.classList.add('ad-enabled');
      closeBtn.style.cursor = 'pointer';
      const doClose = (e) => { e && e.preventDefault(); destroy(); };
      closeBtn.addEventListener('click', doClose);
      xBadge.addEventListener('click', doClose);
      overlay.addEventListener('click', (e) => { if (!modal.contains(e.target)) destroy(); });
    };

    const timer = setInterval(() => {
      remain--;
      if (remain <= 0) {
        clearInterval(timer);
        if (countEl) countEl.textContent = '0';
        msg.textContent = 'يمكنك إغلاق الإعلان الآن';
        enableClose(); // يسمح بالإغلاق — لا يغلق ذاتياً بالعدّاد
      } else {
        if (countEl) countEl.textContent = String(remain);
      }
    }, 1000);

    function destroy() {
      try { clearInterval(timer); } catch {}
      overlay.classList.remove('ad-show');
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 200);
      try {
        if (mediaEl && mediaEl.tagName === 'VIDEO') {
          mediaEl.pause();
          mediaEl.removeAttribute('src');
          while (mediaEl.firstChild) mediaEl.removeChild(mediaEl.firstChild);
        }
      } catch {}
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildPopup);
  } else {
    buildPopup();
  }
})();