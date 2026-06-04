// عرض منتجات الحجز في الصفحة الرئيسية (about section)
fetch('productsالخديوي.json')
  .then(response => response.json())
  .then(data => {
    const container = document.getElementById('reservation-products-grid');
    if (!container) return;

    const reservationProducts = data.filter(p => p.type === 'reservation');

    if (reservationProducts.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">لا توجد منتجات متاحة للحجز حالياً</p>';
      return;
    }

    container.innerHTML = reservationProducts.map((product, pi) => {
      const imgs    = (product.images && product.images.length > 1) ? product.images : [product.img];
      const hasMany = imgs.length > 1;
      const productDataAttr = `data-product='${JSON.stringify(product).replace(/'/g, "&#39;")}'`;

      // صور المعرض
      const slides = imgs.map((src, i) => `
        <div class="rg-slide ${i === 0 ? 'rg-active' : ''}" style="display:${i === 0 ? 'block' : 'none'};">
          <img src="${src}" alt="${product.name}" loading="lazy">
        </div>
      `).join('');

      // نقاط التنقل
      const dots = hasMany ? `
        <div class="rg-dots">
          ${imgs.map((_, i) => `<span class="rg-dot ${i === 0 ? 'rg-dot-active' : ''}" data-i="${i}" data-pi="${pi}"></span>`).join('')}
        </div>` : '';

      // أسهم التنقل
      const arrows = hasMany ? `
        <button class="rg-arrow rg-prev" data-pi="${pi}">&#8249;</button>
        <button class="rg-arrow rg-next" data-pi="${pi}">&#8250;</button>` : '';

      return `
        <div class="reservation-product-card">
          <div class="res-prod-gallery" data-pi="${pi}" data-total="${imgs.length}" data-current="0">
            ${slides}
            ${arrows}
            ${dots}
          </div>
          <div class="res-prod-content">
            <h4>${product.name}</h4>
            <p class="res-prod-price">EGP ${product.price}</p>
            ${product.description ? `<p class="res-prod-desc">${product.description}</p>` : ''}
            <button class="btn_reserve_home" ${productDataAttr}>
              <i class="fa-solid fa-bookmark"></i>
              احجز الآن
            </button>
          </div>
        </div>
      `;
    }).join('');

    // ===== منطق التنقل بين الصور =====
    function goToSlide(pi, idx) {
      const gallery = document.querySelector(`.res-prod-gallery[data-pi="${pi}"]`);
      if (!gallery) return;
      const slides = gallery.querySelectorAll('.rg-slide');
      const dots   = gallery.querySelectorAll('.rg-dot');
      const total  = parseInt(gallery.dataset.total);
      idx = ((idx % total) + total) % total;

      slides.forEach((s, i) => {
        s.style.display = i === idx ? 'block' : 'none';
        s.classList.toggle('rg-active', i === idx);
      });
      dots.forEach((d, i) => d.classList.toggle('rg-dot-active', i === idx));
      gallery.dataset.current = idx;
    }

    container.addEventListener('click', function(e) {
      // أسهم
      const arrow = e.target.closest('.rg-arrow');
      if (arrow) {
        const pi  = parseInt(arrow.dataset.pi);
        const gallery = container.querySelector(`.res-prod-gallery[data-pi="${pi}"]`);
        const cur = parseInt(gallery.dataset.current);
        goToSlide(pi, arrow.classList.contains('rg-next') ? cur + 1 : cur - 1);
        return;
      }
      // نقاط
      const dot = e.target.closest('.rg-dot');
      if (dot) {
        goToSlide(parseInt(dot.dataset.pi), parseInt(dot.dataset.i));
        return;
      }
      // زر الحجز
      const btn = e.target.closest('.btn_reserve_home');
      if (btn) {
        try {
          const product = JSON.parse(btn.dataset.product.replace(/&#39;/g, "'"));
          if (typeof openReservationModal === 'function') openReservationModal(product);
        } catch(err) { console.error(err); }
      }
    });

    // Swipe للموبايل
    container.querySelectorAll('.res-prod-gallery').forEach(gallery => {
      let startX = 0;
      gallery.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
      gallery.addEventListener('touchend', e => {
        const diff = startX - e.changedTouches[0].clientX;
        const pi   = parseInt(gallery.dataset.pi);
        const cur  = parseInt(gallery.dataset.current);
        if (Math.abs(diff) > 40) goToSlide(pi, diff > 0 ? cur + 1 : cur - 1);
      });
    });

    // ===== Auto-play - تغيير الصورة تلقائياً كل 3 ثواني =====
    container.querySelectorAll('.res-prod-gallery').forEach(gallery => {
      const total = parseInt(gallery.dataset.total);
      if (total <= 1) return; // لو صورة واحدة بس مش محتاج

      const pi = parseInt(gallery.dataset.pi);

      setInterval(() => {
        const cur = parseInt(gallery.dataset.current);
        goToSlide(pi, cur + 1);
      }, 3000);
    });
  });
