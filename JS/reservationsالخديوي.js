// ===== نظام الحجوزات =====

const RESERVATIONS_KEY = 'skandr_reservations';
const SCRIPT_URL_RES   = 'https://script.google.com/macros/s/AKfycbybbx621W9PQAYmgXgoTTQyTij0aa8rmeUfxq-n0tI5OwWUY5V8tWZI_9p9joeFoAlU/exec';

// قائمة المناطق مع رسوم التوصيل (مأخوذة من checkout)
const AREAS = [
  { value: "وسط البلد", fee: 60 }, { value: "الزمالك", fee: 60 },
  { value: "جاردن سيتي", fee: 60 }, { value: "المنيل", fee: 60 },
  { value: "مدينة نصر", fee: 70 }, { value: "زهراء مدينة نصر", fee: 70 },
  { value: "مصر الجديدة", fee: 60 }, { value: "النزهة", fee: 60 },
  { value: "شيراتون", fee: 60 }, { value: "التجمع الخامس", fee: 70 },
  { value: "التجمع الأول", fee: 70 }, { value: "الرحاب", fee: 70 },
  { value: "العبور", fee: 70 }, { value: "المهندسين", fee: 70 },
  { value: "الدقي", fee: 60 }, { value: "العجوزة", fee: 60 },
  { value: "بولاق الدكرور", fee: 60 }, { value: "الهرم", fee: 60 },
  { value: "فيصل", fee: 60 }, { value: "٦ أكتوبر", fee: 70 },
  { value: "الشيخ زايد", fee: 70 }, { value: "المعادي", fee: 70 },
  { value: "عين شمس", fee: 60 }, { value: "المطرية", fee: 60 },
  { value: "شبرا", fee: 60 }, { value: "الشرابية", fee: 60 },
  { value: "الساحل", fee: 60 }, { value: "إمبابة", fee: 60 },
  { value: "بولاق أبو العلا", fee: 60 }, { value: "بين السرايات", fee: 60 },
  { value: "حدائق الأهرام", fee: 70 }, { value: "الطالبية", fee: 60 },
  { value: "العمرانية", fee: 60 }, { value: "الكيت كات", fee: 60 },
  { value: "صفط اللبن", fee: 60 }, { value: "جزيرة الدهب", fee: 60 },
  { value: "المريوطية", fee: 60 }, { value: "بشتيل", fee: 60 },
  { value: "ناهيا", fee: 60 }, { value: "اكتوبر الجديده", fee: 80 }
];

function getReservations() {
  return JSON.parse(localStorage.getItem(RESERVATIONS_KEY)) || [];
}

function saveReservation(data) {
  const reservations = getReservations();
  const reservation = {
    id: Date.now(),
    date: new Date().toLocaleString('ar-EG'),
    ...data,
    status: 'جديد'
  };
  reservations.push(reservation);
  localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(reservations));
  return reservation.id;
}

function deleteReservation(id) {
  let reservations = getReservations();
  reservations = reservations.filter(r => r.id !== id);
  localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(reservations));
}

// ===== Modal الحجز =====
function openReservationModal(product) {
  // إزالة أي modal قديم
  const old = document.getElementById('reservation-modal-overlay');
  if (old) old.remove();

  const areasOptions = AREAS.map(a =>
    `<option value="${a.value}" data-fee="${a.fee}">${a.value} – ${a.fee} LE</option>`
  ).join('');

  const overlay = document.createElement('div');
  overlay.id = 'reservation-modal-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:20px;max-width:420px;width:100%;font-family:Tajawal,sans-serif;direction:rtl;box-shadow:0 20px 60px rgba(0,0,0,.25);overflow:hidden;">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#004f49,#006b63);padding:20px;display:flex;align-items:center;gap:14px;">
        <img src="${product.img}" style="width:56px;height:56px;border-radius:12px;object-fit:cover;border:2px solid rgba(255,255,255,.3);" alt="">
        <div style="flex:1;">
          <p style="color:rgba(255,255,255,.7);font-size:12px;margin:0 0 3px;">حجز منتج</p>
          <h3 style="color:#fff;font-size:15px;font-weight:800;margin:0;">${product.name}</h3>
          <p style="color:#a8e6df;font-size:13px;margin:4px 0 0;font-weight:700;">EGP ${product.price}</p>
        </div>
        <button onclick="document.getElementById('reservation-modal-overlay').remove()"
          style="background:rgba(255,255,255,.15);border:none;border-radius:50%;width:32px;height:32px;color:#fff;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>
      </div>
      <!-- Form -->
      <div style="padding:20px;">
        <div style="margin-bottom:14px;">
          <label style="font-size:13px;font-weight:700;color:#333;display:block;margin-bottom:6px;">الاسم *</label>
          <input id="res-name" type="text" placeholder="ادخل اسمك" required
            style="width:100%;padding:10px 12px;border:1.5px solid #ddd;border-radius:10px;font-size:14px;font-family:Tajawal,sans-serif;box-sizing:border-box;outline:none;transition:border-color .2s;"
            onfocus="this.style.borderColor='#004f49'" onblur="this.style.borderColor='#ddd'">
        </div>
        <div style="margin-bottom:14px;">
          <label style="font-size:13px;font-weight:700;color:#333;display:block;margin-bottom:6px;">رقم الهاتف *</label>
          <input id="res-phone" type="tel" placeholder="01xxxxxxxxx" required
            style="width:100%;padding:10px 12px;border:1.5px solid #ddd;border-radius:10px;font-size:14px;font-family:Tajawal,sans-serif;box-sizing:border-box;outline:none;transition:border-color .2s;"
            onfocus="this.style.borderColor='#004f49'" onblur="this.style.borderColor='#ddd'">
        </div>
        <div style="margin-bottom:14px;">
          <label style="font-size:13px;font-weight:700;color:#333;display:block;margin-bottom:6px;">العنوان التفصيلي *</label>
          <input id="res-address" type="text" placeholder="شارع / عمارة / شقة ..." required
            style="width:100%;padding:10px 12px;border:1.5px solid #ddd;border-radius:10px;font-size:14px;font-family:Tajawal,sans-serif;box-sizing:border-box;outline:none;transition:border-color .2s;"
            onfocus="this.style.borderColor='#004f49'" onblur="this.style.borderColor='#ddd'">
        </div>
        <div style="margin-bottom:20px;">
          <label style="font-size:13px;font-weight:700;color:#333;display:block;margin-bottom:6px;">المنطقة *</label>
          <select id="res-area" required
            style="width:100%;padding:10px 12px;border:1.5px solid #ddd;border-radius:10px;font-size:13px;font-family:Tajawal,sans-serif;box-sizing:border-box;outline:none;background:#fff;transition:border-color .2s;"
            onfocus="this.style.borderColor='#004f49'" onblur="this.style.borderColor='#ddd'">
            <option value="">-- اختر المنطقة --</option>
            ${areasOptions}
          </select>
        </div>
        <div id="res-error" style="display:none;background:#fee2e2;color:#dc2626;padding:10px 14px;border-radius:8px;font-size:13px;margin-bottom:14px;"></div>
        <button id="res-submit-btn" onclick="submitReservation(${JSON.stringify(product).replace(/"/g,'&quot;')})"
          style="width:100%;background:linear-gradient(135deg,#004f49,#006b63);color:#fff;border:none;border-radius:12px;padding:14px;font-size:15px;font-weight:800;cursor:pointer;font-family:Tajawal,sans-serif;transition:opacity .2s;">
          تأكيد الحجز 📌
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  // إغلاق بالنقر خارج الـ modal
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

function submitReservation(product) {
  const name    = document.getElementById('res-name').value.trim();
  const phone   = document.getElementById('res-phone').value.trim();
  const address = document.getElementById('res-address').value.trim();
  const areaSelect = document.getElementById('res-area');
  const area    = areaSelect.value;
  const errorDiv = document.getElementById('res-error');

  if (!name || !phone || !address || !area) {
    errorDiv.style.display = 'block';
    errorDiv.textContent = 'يرجى ملء جميع الحقول المطلوبة';
    return;
  }
  if (!/^01[0125]\d{8}$/.test(phone)) {
    errorDiv.style.display = 'block';
    errorDiv.textContent = 'رقم الهاتف غير صحيح';
    return;
  }

  const fee = parseFloat(areaSelect.options[areaSelect.selectedIndex].dataset.fee || 0);

  const btn = document.getElementById('res-submit-btn');
  btn.disabled = true;
  btn.textContent = '⏳ جاري الحجز...';

  // حفظ محلي فوراً
  const resData = { name, phone, address, area, deliveryFee: fee, product };
  saveReservation(resData);

  // إرسال إلى Google Sheet
  const formData = new FormData();
  formData.append('action',       'addReservation');
  formData.append('name',         name);
  formData.append('phone',        phone);
  formData.append('address',      address);
  formData.append('area',         area);
  formData.append('deliveryFee',  fee);
  formData.append('productName',  product.name);
  formData.append('productPrice', product.price);

  fetch(SCRIPT_URL_RES, { method: 'POST', body: formData })
    .then(r => r.json())
    .then(data => {
      console.log('✅ Reservation response:', data);
    })
    .catch(err => {
      console.warn('⚠️ Reservation sheet error (saved locally):', err);
    })
    .finally(() => {
      const overlay = document.getElementById('reservation-modal-overlay');
      if (overlay) overlay.remove();
      showReservationSuccess(name, product);
    });
}

function showReservationSuccess(name, product) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:20px;max-width:360px;width:100%;font-family:Tajawal,sans-serif;direction:rtl;text-align:center;padding:32px 24px;box-shadow:0 20px 60px rgba(0,0,0,.25);">
      <div style="width:70px;height:70px;background:linear-gradient(135deg,#004f49,#006b63);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:32px;margin-bottom:16px;">✅</div>
      <h2 style="color:#004f49;font-size:20px;font-weight:900;margin:0 0 8px;">تم الحجز بنجاح!</h2>
      <p style="color:#555;font-size:14px;margin:0 0 6px;">أهلاً <strong>${name}</strong></p>
      <p style="color:#888;font-size:13px;margin:0 0 24px;">سيتم التواصل معك قريباً لتأكيد طلب <strong>${product.name}</strong></p>
      <button onclick="this.closest('[style*=fixed]').remove()"
        style="background:linear-gradient(135deg,#004f49,#006b63);color:#fff;border:none;border-radius:12px;padding:12px 32px;font-size:15px;font-weight:800;cursor:pointer;font-family:Tajawal,sans-serif;">
        حسناً 👍
      </button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

// ===== عرض الحجوزات في Dashboard (بشكل كروت مثل الطلبات) =====
function renderReservationsDashboard() {
  const container = document.getElementById('order-list');
  if (!container) return;

  container.innerHTML = '<p style="text-align:center;color:#999;padding:30px;">⏳ جاري تحميل الحجوزات...</p>';

  // حاول تجيب من Google Sheet أولاً
  fetch(SCRIPT_URL_RES + '?action=getReservations')
    .then(r => r.json())
    .then(sheetData => {
      console.log('📋 Reservations from sheet:', sheetData);
      if (Array.isArray(sheetData) && sheetData.length > 0) {
        _displayReservationCards(sheetData, 'sheet');
      } else {
        _displayReservationCards(getReservations(), 'local');
      }
    })
    .catch(err => {
      console.warn('⚠️ Sheet fetch failed, using localStorage:', err);
      _displayReservationCards(getReservations(), 'local');
    });
}

function _displayReservationCards(reservations, source) {
  const container = document.getElementById('order-list');
  if (!container) return;

  if (!reservations || reservations.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#999;padding:30px;">لا توجد حجوزات حتى الآن</p>';
    return;
  }

  container.innerHTML = reservations.map(r => {
    // دعم كلا الصيغتين (Sheet أو localStorage)
    const name         = r.name        || '';
    const phone        = r.phone       || '';
    const address      = r.address     || '';
    const area         = r.area        || '';
    const date         = r.date        || '';
    const status       = r.status      || 'جديد';
    const productName  = source === 'sheet' ? (r.productName  || '') : (r.product?.name  || '');
    const productImg   = source === 'sheet' ? ''                      : (r.product?.img   || '');
    const productPrice = parseFloat(source === 'sheet' ? r.productPrice : r.product?.price) || 0;
    const deliveryFee  = parseFloat(r.deliveryFee) || 0;
    const totalPrice   = parseFloat(r.totalPrice)  || (productPrice + deliveryFee);
    const cardId       = r.row || r.id || 0;
    const resNum       = r.reservationNumber || (source === 'local' ? String(r.id).slice(-5) : cardId);

    const imgHtml = productImg
      ? `<img src="${productImg}" style="width:56px;height:56px;border-radius:8px;object-fit:cover;border:1px solid #ddd;flex-shrink:0;">`
      : '';

    return `
      <div class="order-card" style="border-right:4px solid #004f49;">
        <div class="order-header">
          <h3 style="color:#004f49;">
            <i class="fa-solid fa-bookmark" style="margin-left:6px;font-family:'Font Awesome 6 Free'!important;"></i>
            حجز #${resNum}
          </h3>
          <span class="order-status status-new">${status}</span>
        </div>
        <div class="order-details">
          <p><strong>الاسم:</strong> ${name}</p>
          <p><strong>رقم الهاتف:</strong> ${phone}</p>
          <p><strong>العنوان:</strong> ${address}</p>
          <p><strong>المنطقة:</strong> ${area}</p>
          <p><strong>تاريخ الحجز:</strong> ${date}</p>
          <p><strong>رسوم التوصيل:</strong> LE:${deliveryFee.toFixed(2)}</p>
          <p><strong>الإجمالي:</strong> LE:${totalPrice.toFixed(2)}</p>
          <h4>تفاصيل الطلب:</h4>
          <ul>
            <li style="display:flex;align-items:center;gap:10px;padding:8px;background:#f0faf9;border-radius:8px;list-style:none;">
              ${imgHtml}
              <div style="flex:1;">
                <strong>${productName}</strong><br>
                <span style="color:#004f49;font-weight:700;font-size:15px;">EGP ${productPrice.toFixed(2)}</span>
              </div>
            </li>
          </ul>
        </div>
        <div class="action-btns">
          <button onclick="convertReservationToOrder('${name}','${phone}','${address}','${area}','${productName}',${productPrice},${deliveryFee},${totalPrice},${source === 'local' ? r.id : 0},${source === 'sheet' ? r.row : 0})"
            class="action-btn" style="background:#16a34a;border-color:#16a34a;color:#fff;">
            ✅ تحويل لطلب
          </button>
          ${source === 'local' ? `
          <button onclick="deleteReservation(${r.id});showReservationsInOrderList();"
            class="action-btn" style="background:#ef4444;border-color:#ef4444;color:#fff;">
            🗑️ حذف
          </button>` : `
          <button onclick="deleteSheetReservation(${r.row});showReservationsInOrderList();"
            class="action-btn" style="background:#ef4444;border-color:#ef4444;color:#fff;">
            🗑️ حذف
          </button>`}
        </div>
      </div>
    `;
  }).join('');

  updateReservationBadges(reservations.length);
}

// دالة لعرض الحجوزات في order-list عند الضغط على زر الفلتر
function showReservationsInOrderList() {
  // إلغاء active من كل أزرار الفلتر
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  const resvBtn = document.getElementById('reservations-filter-btn');
  if (resvBtn) resvBtn.classList.add('active');
  // عرض الحجوزات
  renderReservationsDashboard();
}

// دالة لتحديث عدادات الحجوزات
function updateReservationBadges(count) {
  if (count === undefined) {
    count = getReservations().length;
  }
  const tabBadge    = document.getElementById('reservations-count-badge');
  const filterBadge = document.getElementById('reservations-filter-count');
  if (tabBadge)    tabBadge.textContent    = count;
  if (filterBadge) filterBadge.textContent = count;
}

// تحويل حجز إلى طلب عادي وإرساله للـ Google Sheet
function convertReservationToOrder(name, phone, address, area, productName, productPrice, deliveryFee, totalPrice, reservationId, reservationRow) {
  if (!confirm(`تحويل حجز "${name}" إلى طلب؟`)) return;

  const formData = new FormData();
  formData.append('action',      'addOrder');
  formData.append('Name',        name);
  formData.append('Phone',       phone);
  formData.append('Address',     address);
  formData.append('Area',        area);
  formData.append('Service',     deliveryFee);
  formData.append('Subtotal',    productPrice);
  formData.append('Totalprice',  totalPrice);
  formData.append('items',       productName + ' — السعر: ' + productPrice);
  formData.append('total price', totalPrice);
  formData.append('count items', 1);
  formData.append('Products',    JSON.stringify([{ name: productName, price: productPrice, quantity: 1 }]));
  formData.append('notes',       'تحويل من حجز');

  fetch(SCRIPT_URL_RES, { method: 'POST', body: formData })
    .then(r => r.json())
    .then(data => {
      if (data.result === 'success') {
        // حذف من localStorage لو موجود
        if (reservationId) {
          deleteReservation(reservationId);
        }
        // حذف من Google Sheet لو موجود
        if (reservationRow) {
          const fd = new FormData();
          fd.append('action',          'deleteReservation');
          fd.append('row',             reservationRow);
          fetch(SCRIPT_URL_RES, { method: 'POST', body: fd }).catch(() => {});
        }
        alert('✅ تم تحويل الحجز إلى طلب بنجاح!');
        showReservationsInOrderList();
      } else {
        alert('حدث خطأ: ' + (data.error || data.message || 'غير معروف'));
      }
    })
    .catch(() => alert('⚠️ خطأ في الاتصال، تحقق من الإنترنت'));
}

// حذف حجز من Google Sheet
function deleteSheetReservation(row) {
  const fd = new FormData();
  fd.append('action', 'deleteReservation');
  fd.append('row',    row);
  fetch(SCRIPT_URL_RES, { method: 'POST', body: fd })
    .catch(() => {});
}

// دالة قديمة للتوافقية
function markReservationAsCompleted(id) {
  const r = getReservations().find(res => res.id === id);
  if (!r) return;
  convertReservationToOrder(
    r.name, r.phone, r.address, r.area,
    r.product?.name || '', r.product?.price || 0,
    r.deliveryFee || 0,
    (parseFloat(r.product?.price || 0) + parseFloat(r.deliveryFee || 0)),
    r.id, 0
  );
}

// جعل الدوال متاحة globally
window.openReservationModal      = openReservationModal;
window.submitReservation         = submitReservation;
window.deleteReservation         = deleteReservation;
window.deleteSheetReservation    = deleteSheetReservation;
window.renderReservationsDashboard  = renderReservationsDashboard;
window.showReservationsInOrderList  = showReservationsInOrderList;
window.markReservationAsCompleted   = markReservationAsCompleted;
window.updateReservationBadges      = updateReservationBadges;
window.convertReservationToOrder    = convertReservationToOrder;
