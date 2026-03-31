(function () {
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwkjtVUxJxrSCMZecAXjy_RFKEWCnol_twlgxVmlcnevo6FizBjAUJQ3KAnKQDgulBK/exec';

  // ===== التبويبات =====
  document.querySelectorAll('.main-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.main-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.main-tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
      if (btn.dataset.tab === 'reports-tab') renderReports();
    });
  });

  function getOrders() { return window.allOrders || []; }
  function getSalesOrders() {
    return getAllFiltered().filter(o => (o.Status||'').trim() === 'تم الاستلام');
  }

  // مبيعات "تم الاستلام" فقط - للـ PDF
  function getCompletedOrders() {
    return getAllFiltered().filter(o => (o.Status||'').trim() === 'تم الاستلام');
  }

  function getAllFiltered() {
    const start  = document.getElementById('report-start-date').value;
    const end    = document.getElementById('report-end-date').value;
    const area   = document.getElementById('report-area-select').value;
    return getOrders().filter(o => {
      const d  = o.Date ? new Date(o.Date) : null;
      const ds = d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : '';
      if (start && ds < start) return false;
      if (end   && ds > end)   return false;
      if (area  && (o.Area||'').trim() !== area) return false;
      return true;
    });
  }

  function populateReportArea() {
    const sel = document.getElementById('report-area-select');
    const cur = sel.value;
    const areas = [...new Set(getOrders().map(o => o.Area).filter(Boolean))].sort();
    sel.innerHTML = '<option value="">كل المناطق</option>';
    areas.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a; opt.textContent = a;
      if (a === cur) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  function fmt(n) { return Number(n).toLocaleString('ar-EG', {minimumFractionDigits:2, maximumFractionDigits:2}); }

  // ===== رسم شريط =====
  function renderBars(containerId, data, maxVal, colorFn) {
    const el = document.getElementById(containerId);
    if (!data.length) { el.innerHTML = '<div class="rpt-no-data">لا توجد بيانات</div>'; return; }
    el.innerHTML = data.map(([label, val, sub]) => {
      const pct = maxVal ? Math.max(4, Math.round((val / maxVal) * 100)) : 4;
      const color = colorFn ? colorFn(label) : 'linear-gradient(90deg,#5c16ff,#a855f7)';
      return `<div class="rpt-bar-row">
        <div class="rpt-bar-label" title="${label}">${label}</div>
        <div class="rpt-bar-track">
          <div class="rpt-bar-fill" style="width:${pct}%;background:${color}"></div>
        </div>
        <div class="rpt-bar-val">${typeof val==='number'&&val%1!==0?fmt(val):val}${sub?`<span class="rpt-bar-sub">${sub}</span>`:''}</div>
      </div>`;
    }).join('');
  }

  // ===== التقرير الرئيسي =====
  function renderReports() {
    if (!getOrders().length) {
      document.getElementById('report-stats-grid').innerHTML = '<p style="color:#aaa;text-align:center;padding:20px;">جاري تحميل البيانات... اضغط "عرض التقرير" بعد ثوانٍ</p>';
      return;
    }
    populateReportArea();
    const sales   = getSalesOrders();
    const allFilt = getAllFiltered();

    const totalRevenue = sales.reduce((s,o)=>s+(parseFloat(o.Totalprice)||0),0);
    const totalService = sales.reduce((s,o)=>s+(parseFloat(o.Service)||0),0);
    const netRevenue   = totalRevenue - totalService;
    const avgOrder     = sales.length ? totalRevenue / sales.length : 0;

    // كروت الإحصائيات
    document.getElementById('stat-total-orders').textContent   = allFilt.length;
    document.getElementById('stat-total-revenue').textContent  = fmt(totalRevenue);
    document.getElementById('stat-total-service').textContent  = fmt(totalService);
    document.getElementById('stat-net-revenue').textContent    = fmt(netRevenue);
    document.getElementById('stat-completed').textContent      = sales.length;
    document.getElementById('stat-new').textContent            = allFilt.filter(o=>(o.Status||'').trim()==='جديد').length;
    document.getElementById('stat-inprogress').textContent     = allFilt.filter(o=>(o.Status||'').trim()==='قيد التحضير').length;
    document.getElementById('stat-avg-order').textContent      = fmt(avgOrder);

    // ===== مبيعات حسب المنطقة =====
    const byArea = {};
    sales.forEach(o => {
      const a = o.Area||'غير محدد';
      if (!byArea[a]) byArea[a] = {rev:0, count:0};
      byArea[a].rev   += parseFloat(o.Totalprice)||0;
      byArea[a].count += 1;
    });
    const areaData = Object.entries(byArea).sort((a,b)=>b[1].rev-a[1].rev);
    const maxArea  = areaData[0]?.[1].rev||1;
    renderBars('report-by-area',
      areaData.map(([k,v])=>[k, v.rev, ` (${v.count} طلب)`]),
      maxArea
    );

    // ===== المنتجات الأكثر مبيعاً =====
    const byProduct = {};
    sales.forEach(o => {
      let prods=[]; try{prods=JSON.parse(o.Products||'[]');}catch(e){}
      prods.forEach(p => {
        const n = p.name||'غير معروف';
        if (!byProduct[n]) byProduct[n] = {qty:0, rev:0};
        byProduct[n].qty += parseInt(p.quantity)||1;
        byProduct[n].rev += (parseFloat(p.price)||0)*(parseInt(p.quantity)||1);
      });
    });
    const prodData = Object.entries(byProduct).sort((a,b)=>b[1].qty-a[1].qty).slice(0,10);
    const maxProd  = prodData[0]?.[1].qty||1;
    renderBars('report-top-products',
      prodData.map(([k,v])=>[k, v.qty, ` | ${fmt(v.rev)} LE`]),
      maxProd,
      ()=>'linear-gradient(90deg,#f59e0b,#ef4444)'
    );

    // ===== توزيع الحالات =====
    const statusColors = {'جديد':'#f59e0b','قيد التحضير':'#3b82f6','تم الاستلام':'#22c55e','مؤرشف':'#9ca3af'};
    const byStatus = {};
    allFilt.forEach(o=>{ byStatus[o.Status||'غير محدد']=(byStatus[o.Status||'غير محدد']||0)+1; });
    const statusData = Object.entries(byStatus).sort((a,b)=>b[1]-a[1]);
    const maxStatus  = statusData[0]?.[1]||1;
    renderBars('report-by-status', statusData.map(([k,v])=>[k,v,null]), maxStatus, lbl=>statusColors[lbl]||'#5c16ff');

    // ===== المبيعات اليومية =====
    const byDay = {};
    sales.forEach(o => {
      if (!o.Date) return;
      const d   = new Date(o.Date);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      if (!byDay[key]) byDay[key] = {count:0, revenue:0, service:0};
      byDay[key].count++;
      byDay[key].revenue += parseFloat(o.Totalprice)||0;
      byDay[key].service += parseFloat(o.Service)||0;
    });
    const days = Object.entries(byDay).sort((a,b)=>b[0].localeCompare(a[0]));
    const dailyTbody = document.querySelector('#report-daily-table tbody');

    if (!days.length) {
      dailyTbody.innerHTML = '<tr><td colspan="5" class="rpt-no-data">لا توجد بيانات</td></tr>';
    } else {
      let grandRev=0, grandSrv=0, grandCnt=0;
      days.forEach(([,v])=>{ grandRev+=v.revenue; grandSrv+=v.service; grandCnt+=v.count; });
      dailyTbody.innerHTML = days.map(([day,v], i) => {
        const net = v.revenue - v.service;
        const pct = grandRev ? Math.round((v.revenue/grandRev)*100) : 0;
        return `<tr class="${i%2===0?'':'rpt-row-alt'}">
          <td><strong>${day}</strong></td>
          <td><span class="rpt-badge rpt-badge-blue">${v.count} طلب</span></td>
          <td><strong style="color:#22c55e">${fmt(v.revenue)} LE</strong></td>
          <td style="color:#ef4444">${fmt(v.service)} LE</td>
          <td><strong style="color:#5c16ff">${fmt(net)} LE</strong>
            <div class="rpt-mini-bar"><div style="width:${pct}%;background:linear-gradient(90deg,#5c16ff,#a855f7);height:100%;border-radius:4px;"></div></div>
          </td>
        </tr>`;
      }).join('') + `<tr class="rpt-total-row">
        <td><strong>الإجمالي</strong></td>
        <td><strong>${grandCnt} طلب</strong></td>
        <td><strong style="color:#22c55e">${fmt(grandRev)} LE</strong></td>
        <td><strong style="color:#ef4444">${fmt(grandSrv)} LE</strong></td>
        <td><strong style="color:#5c16ff">${fmt(grandRev-grandSrv)} LE</strong></td>
      </tr>`;
    }

    // ===== العملاء =====
    renderCustomers(allFilt);

    // ===== تفاصيل الطلبات =====
    const ordersTbody = document.querySelector('#report-orders-table tbody');    const statusBadge = s => {
      const cls = {'جديد':'rpt-badge-yellow','قيد التحضير':'rpt-badge-blue','تم الاستلام':'rpt-badge-green','مؤرشف':'rpt-badge-gray'};
      return `<span class="rpt-badge ${cls[s]||''}">${s||'-'}</span>`;
    };
    ordersTbody.innerHTML = allFilt.length
      ? allFilt.map((o,i) => `<tr class="${i%2===0?'':'rpt-row-alt'}">
          <td><strong>#${o.row-1}</strong></td>
          <td>${o.Name||'-'}</td>
          <td dir="ltr">${o.Phone||'-'}</td>
          <td>${o.Area||'-'}</td>
          <td>${statusBadge(o.Status)}</td>
          <td>${o.Date?new Date(o.Date).toLocaleDateString('ar-EG'):'-'}</td>
          <td><strong style="color:#5c16ff">${fmt(parseFloat(o.Totalprice||0))} LE</strong></td>
        </tr>`).join('')
      : '<tr><td colspan="7" class="rpt-no-data">لا توجد طلبات</td></tr>';
  }

  // ===== العملاء =====
  function renderCustomers(orders) {
    const byPhone = {};
    orders.forEach(o => {
      // تنظيف رقم الهاتف - لازم يكون على الأقل 7 أرقام
      const rawPhone = (o.Phone || o.phone || '').toString().trim().replace(/\s+/g, '');
      const phone = rawPhone.length >= 7 ? rawPhone : null;
      if (!phone) return; // تجاهل الطلبات بدون رقم هاتف صحيح

      const name = (o.Name || o.name || '').toString().trim() || 'غير معروف';
      if (!byPhone[phone]) byPhone[phone] = { name, phone, orders:[], total:0, lastDate:'' };

      // لو الاسم الجديد أطول من المحفوظ، استخدمه
      if (name.length > byPhone[phone].name.length) byPhone[phone].name = name;

      byPhone[phone].orders.push(o);
      byPhone[phone].total += parseFloat(o.Totalprice)||0;
      const ds = o.Date ? new Date(o.Date).toLocaleDateString('ar-EG') : '';
      if (ds > byPhone[phone].lastDate) byPhone[phone].lastDate = ds;
    });

    let customers = Object.values(byPhone).sort((a,b) => b.orders.length - a.orders.length || b.total - a.total);

    const searchInput = document.getElementById('customer-report-search');
    const q = (searchInput ? searchInput.value : '').trim().toLowerCase();
    if (q) customers = customers.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q));

    const tbody = document.querySelector('#report-customers-table tbody');
    if (!customers.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="rpt-no-data">لا توجد بيانات</td></tr>';
      return;
    }

    const maxTotal = customers[0]?.total || 1;
    const maxOrders = customers[0]?.orders.length || 1;

    const medals = ['🥇','🥈','🥉'];
    const rankStyles = [
      'background:linear-gradient(135deg,#fffbeb,#fef3c7);border:2px solid #f59e0b;',
      'background:linear-gradient(135deg,#f8fafc,#e2e8f0);border:2px solid #94a3b8;',
      'background:linear-gradient(135deg,#fff7f0,#ffedd5);border:2px solid #f97316;',
    ];

    tbody.innerHTML = customers.map((c, i) => {
      const pct = maxOrders ? Math.round((c.orders.length / maxOrders) * 100) : 0;
      const completedCount = c.orders.filter(o => o.Status === 'تم الاستلام').length;
      const rankStyle = i < 3 ? rankStyles[i] : '';
      const medal = i < 3 ? `<span style="font-size:18px;margin-left:6px;">${medals[i]}</span>` : `<span style="color:#aaa;font-size:12px;margin-left:6px;">#${i+1}</span>`;
      return `<tr style="cursor:pointer;${rankStyle}" onclick="window.__showCustomerDetail('${c.phone}')">
        <td>${medal}<strong>${c.name}</strong></td>
        <td dir="ltr">${c.phone}</td>
        <td>
          <span class="rpt-badge rpt-badge-blue">${c.orders.length} طلب</span>
          <span class="rpt-badge rpt-badge-green" style="margin-right:4px;">${completedCount} مكتمل</span>
          <div class="rpt-mini-bar" style="height:6px;margin-top:5px;">
            <div style="width:${pct}%;background:${i===0?'linear-gradient(90deg,#f59e0b,#fbbf24)':i===1?'linear-gradient(90deg,#94a3b8,#cbd5e1)':i===2?'linear-gradient(90deg,#f97316,#fb923c)':'linear-gradient(90deg,#5c16ff,#a855f7)'};height:100%;border-radius:4px;"></div>
          </div>
        </td>
        <td><strong style="color:#5c16ff">${fmt(c.total)} LE</strong></td>
        <td style="color:#888;font-size:12px;">${c.lastDate||'-'}</td>
        <td><button class="rpt-detail-btn" onclick="event.stopPropagation();window.__showCustomerDetail('${c.phone}')">عرض الطلبات</button></td>
      </tr>`;
    }).join('');
  }

  window.__showCustomerDetail = function(phone) {
    const allOrds = getOrders();
    const customerOrders = allOrds
      .filter(o => (o.Phone||o.phone||'').toString().trim().replace(/\s+/g,'') === phone)
      .sort((a,b) => new Date(b.Date||0) - new Date(a.Date||0));

    if (!customerOrders.length) return;

    const name           = customerOrders[0].Name || customerOrders[0].name || 'غير معروف';
    const totalAll       = customerOrders.reduce((s,o)=>s+(parseFloat(o.Totalprice)||0),0);
    const totalService   = customerOrders.reduce((s,o)=>s+(parseFloat(o.Service)||0),0);
    const totalCompleted = customerOrders.filter(o=>o.Status==='تم الاستلام').reduce((s,o)=>s+(parseFloat(o.Totalprice)||0),0);
    const completedCount = customerOrders.filter(o=>o.Status==='تم الاستلام').length;
    document.getElementById('cmodal-title').textContent    = `👤 ${name}`;
    document.getElementById('cmodal-subtitle').textContent = `📞 ${phone}`;

    document.getElementById('cmodal-stats').innerHTML = `
      <div class="cms-card"><div class="cv">${customerOrders.length}</div><div class="cl">إجمالي الطلبات</div></div>
      <div class="cms-card"><div class="cv" style="color:#22c55e">${completedCount}</div><div class="cl">طلبات مكتملة</div></div>
      <div class="cms-card"><div class="cv" style="color:#7c3aed">${fmt(totalAll)}</div><div class="cl">إجمالي المشتريات (LE)</div></div>
      <div class="cms-card"><div class="cv" style="color:#ef4444">${fmt(totalService)}</div><div class="cl">إجمالي الشحن (LE)</div></div>
      <div class="cms-card"><div class="cv" style="color:#0891b2">${fmt(customerOrders.length ? totalAll/customerOrders.length : 0)}</div><div class="cl">متوسط الطلب (LE)</div></div>`;

    const statusBadge = s => {
      const cls = {'جديد':'rpt-badge-yellow','قيد التحضير':'rpt-badge-blue','تم الاستلام':'rpt-badge-green','مؤرشف':'rpt-badge-gray'};
      return `<span class="rpt-badge ${cls[s]||''}">${s||'-'}</span>`;
    };

    document.getElementById('cmodal-orders').innerHTML = customerOrders.map((o, i) => {
      let prods=[]; try{prods=JSON.parse(o.Products||'[]');}catch(e){}
      const srv = parseFloat(o.Service||0);
      const tot = parseFloat(o.Totalprice||0);
      const net = tot - srv;

      const prodsRows = prods.length
        ? prods.map(p => `<tr>
            <td>${p.name||'-'}</td>
            <td>${p.selectedColorLabel||p.color||'-'}</td>
            <td>${p.selectedSizeLabel||p.size||'-'}</td>
            <td style="text-align:center">${p.quantity||1}</td>
            <td style="text-align:center">${fmt(parseFloat(p.price||0))} LE</td>
          </tr>`).join('')
        : '<tr><td colspan="5" style="text-align:center;color:#aaa;">لا توجد منتجات</td></tr>';

      return `<div class="order-detail-card">
        <div class="order-detail-card-header">
          <h4>الطلب #${o.row-1}</h4>
          <div style="display:flex;gap:8px;align-items:center;">
            ${statusBadge(o.Status)}
            <span style="color:#999;font-size:12px;">${o.Date?new Date(o.Date).toLocaleString('ar-EG'):'-'}</span>
          </div>
        </div>
        <div class="order-detail-info">
          <div><span>العنوان: </span><strong>${o.Address||'-'}</strong></div>
          <div><span>المنطقة: </span><strong>${o.Area||'-'}</strong></div>
          <div><span>ملاحظات: </span><strong>${o.Notes||o.notes||'لا يوجد'}</strong></div>
          ${o.Shift_Number?`<div><span>رقم الوردية: </span><strong>${o.Shift_Number}</strong></div>`:''}
        </div>
        <table class="order-products-table">
          <thead><tr><th>المنتج</th><th>اللون</th><th>المقاس</th><th>الكمية</th><th>السعر</th></tr></thead>
          <tbody>${prodsRows}</tbody>
        </table>
        <div class="order-totals">
          <div class="order-total-item"><div class="tv" style="color:#3b82f6">${fmt(srv)} LE</div><div class="tl">رسوم الشحن</div></div>
          <div class="order-total-item"><div class="tv" style="color:#22c55e">${fmt(tot)} LE</div><div class="tl">إجمالي الطلب</div></div>
          <div class="order-total-item"><div class="tv" style="color:#5c16ff">${fmt(net)} LE</div><div class="tl">الصافي</div></div>
        </div>
      </div>`;
    }).join('');

    document.getElementById('customer-modal-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  document.getElementById('customer-modal-close').addEventListener('click', () => {
    document.getElementById('customer-modal-overlay').classList.remove('open');
    document.body.style.overflow = '';
  });

  document.getElementById('customer-modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) {
      e.currentTarget.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  // بحث العملاء live
  document.getElementById('customer-report-search').addEventListener('input', () => {
    renderCustomers(getAllFiltered());
  });

  document.getElementById('run-report-btn').addEventListener('click', renderReports);

  // ===== تصدير Excel =====
  document.getElementById('export-report-excel-btn').addEventListener('click', () => {
    const sales = getSalesOrders();
    if (!sales.length) { alert('لا توجد بيانات للتصدير'); return; }
    const rows = [['رقم الطلب','العميل','الهاتف','العنوان','المنطقة','التاريخ','رسوم الشحن','الإجمالي','صافي','المنتجات']];
    sales.forEach(o => {
      let prods=[]; try{prods=JSON.parse(o.Products||'[]');}catch(e){}
      const srv = parseFloat(o.Service||0);
      const tot = parseFloat(o.Totalprice||0);
      rows.push([o.row-1, o.Name||'', o.Phone||'', o.Address||'', o.Area||'',
        o.Date?new Date(o.Date).toLocaleDateString('ar-EG'):'',
        srv.toFixed(2), tot.toFixed(2), (tot-srv).toFixed(2),
        prods.map(p=>`${p.name}(${p.quantity})`).join(' | ')]);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = rows[0].map(()=>({wch:18}));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المبيعات');
    const area = document.getElementById('report-area-select').value||'كل-المناطق';
    const date = document.getElementById('report-start-date').value||new Date().toISOString().slice(0,10);
    XLSX.writeFile(wb, `تقرير_${area}_${date}.xlsx`);
  });

  // ===== تصدير PDF =====
  document.getElementById('export-report-pdf-btn').addEventListener('click', () => {
    const sales  = getCompletedOrders();
    const allF   = getAllFiltered();
    if (!allF.length) { alert('لا توجد بيانات للتصدير'); return; }
    const area   = document.getElementById('report-area-select').value||'كل المناطق';
    const start  = document.getElementById('report-start-date').value||'';
    const end    = document.getElementById('report-end-date').value||'';
    const totRev = sales.reduce((s,o)=>s+(parseFloat(o.Totalprice)||0),0);
    const totSrv = sales.reduce((s,o)=>s+(parseFloat(o.Service)||0),0);

    // مبيعات يومية
    const byDay={};
    sales.forEach(o=>{
      if(!o.Date)return;
      const d=new Date(o.Date);
      const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      if(!byDay[k])byDay[k]={count:0,rev:0,srv:0};
      byDay[k].count++; byDay[k].rev+=parseFloat(o.Totalprice)||0; byDay[k].srv+=parseFloat(o.Service)||0;
    });
    const dailyRows = Object.entries(byDay).sort((a,b)=>b[0].localeCompare(a[0]))
      .map(([day,v])=>`<tr><td>${day}</td><td>${v.count}</td><td>${v.rev.toFixed(2)}</td><td>${v.srv.toFixed(2)}</td><td>${(v.rev-v.srv).toFixed(2)}</td></tr>`).join('');

    const orderRows = allF.map(o=>`<tr>
      <td>${o.row-1}</td><td>${o.Name||'-'}</td><td>${o.Phone||'-'}</td>
      <td>${o.Area||'-'}</td><td>${o.Status||'-'}</td>
      <td>${o.Date?new Date(o.Date).toLocaleDateString('ar-EG'):'-'}</td>
      <td>${parseFloat(o.Totalprice||0).toFixed(2)}</td>
    </tr>`).join('');

    const win = window.open('','_blank');
    win.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
    <title>تقرير ${area}</title>
    <style>
      *{box-sizing:border-box;} body{font-family:Arial,sans-serif;direction:rtl;padding:24px;font-size:12px;background:#fff;color:#222;}
      h1{text-align:center;color:#5c16ff;margin-bottom:4px;font-size:20px;}
      .meta{text-align:center;color:#888;margin-bottom:20px;font-size:12px;}
      .summary{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px;}
      .scard{background:#f8f8ff;border:1px solid #ddd;border-radius:8px;padding:14px;text-align:center;}
      .scard .sv{font-size:18px;font-weight:700;color:#5c16ff;} .scard .sl{font-size:11px;color:#888;margin-top:4px;}
      h2{font-size:14px;color:#333;border-right:4px solid #5c16ff;padding-right:8px;margin:20px 0 10px;}
      table{width:100%;border-collapse:collapse;margin-bottom:20px;}
      th{background:#5c16ff;color:#fff;padding:8px;font-size:12px;}
      td{border:1px solid #eee;padding:7px;} tr:nth-child(even){background:#f9f9f9;}
      .total-row{background:#f0ebff!important;font-weight:700;}
      @media print{button{display:none!important;} body{padding:10px;}}
    </style></head><body>
    <h1>تقرير المبيعات - ${area}</h1>
    <div class="meta">${start?'من: '+start:''} ${end?'إلى: '+end:''} | تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}</div>
    <div class="summary">
      <div class="scard"><div class="sv">${sales.length}</div><div class="sl">طلبات مكتملة</div></div>
      <div class="scard"><div class="sv">${totRev.toFixed(2)} LE</div><div class="sl">إجمالي الإيرادات</div></div>
      <div class="scard"><div class="sv">${totSrv.toFixed(2)} LE</div><div class="sl">رسوم الشحن</div></div>
      <div class="scard"><div class="sv">${(totRev-totSrv).toFixed(2)} LE</div><div class="sl">صافي الأرباح</div></div>
    </div>
    <h2>المبيعات اليومية (تم الاستلام فقط)</h2>
    <table><thead><tr><th>التاريخ</th><th>عدد الطلبات</th><th>الإيرادات (LE)</th><th>الشحن (LE)</th><th>الصافي (LE)</th></tr></thead>
    <tbody>${dailyRows}<tr class="total-row"><td>الإجمالي</td><td>${sales.length}</td><td>${totRev.toFixed(2)}</td><td>${totSrv.toFixed(2)}</td><td>${(totRev-totSrv).toFixed(2)}</td></tr></tbody></table>
    <h2>تفاصيل جميع الطلبات</h2>
    <table><thead><tr><th>رقم الطلب</th><th>العميل</th><th>الهاتف</th><th>المنطقة</th><th>الحالة</th><th>التاريخ</th><th>الإجمالي</th></tr></thead>
    <tbody>${orderRows}</tbody></table>
    <button onclick="window.print()" style="display:block;margin:20px auto;padding:12px 30px;background:#5c16ff;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;">طباعة / حفظ PDF</button>
    </body></html>`);
    win.document.close();
  });

})();
