/* ! Fixed: Runtime color/size injector for dashboard
   - يحافظ على الأكواد (code / code_new) في النص وفي data-attributes
   - لا يمس أي أكواد قديمة، فقط يعيد بناء <ul> بشكل غني
   - متوافق مع “لزّاقة” الأكواد الموجودة مسبقًا في dashboardالخديوي.js
*/
(function(){
  var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwkjtVUxJxrSCMZecAXjy_RFKEWCnol_twlgxVmlcnevo6FizBjAUJQ3KAnKQDgulBK/exec';

  var ordersMap = {}; // row -> products[]

  async function loadOrdersOnce(){
    try {
      const res = await fetch(SCRIPT_URL);
      const data = await res.json();
      ordersMap = {};
      if (Array.isArray(data)){
        data.forEach(function(o){
          try {
            var prods = JSON.parse(o.Products || '[]');
            ordersMap[String(o.row)] = Array.isArray(prods) ? prods : [];
          } catch(e){}
        });
      }
    } catch(e){}
  }

  // يبني <ul> ويضيف الأكواد + اللون/المقاس + data-attrs
  function renderUL(ul, products){
    if (!ul || !Array.isArray(products) || !products.length) return;
    ul.innerHTML = '';
    products.forEach(function(p){
      var name  = p.name || '---';
      var qty   = p.quantity || 1;
      var price = (p.price!=null ? p.price : 0);

      var bits = [];
      if (p.selectedColorLabel || p.selectedColor) bits.push('اللون: '+(p.selectedColorLabel || p.selectedColor));
      if (p.selectedSizeLabel  || p.selectedSize)  bits.push('المقاس: '+(p.selectedSizeLabel  || p.selectedSize));
      var extra = bits.length ? ' — ' + bits.join(' | ') : '';

      // الأكواد
      var oldCode = p.code || '';
      var newCode = p.code_new || p.code_new === 0 ? String(p.code_new) : '';
      var codeOldTxt = oldCode ? (' - الكود: ' + oldCode) : '';
      var codeNewTxt = newCode ? (' - الكود الجديد: ' + newCode) : '';

      var li = document.createElement('li');
      // نحافظ على الأكواد في النص
      li.innerHTML = `
        ${name}${extra}${codeOldTxt}${codeNewTxt}
        (الكمية: ${qty}) - السعر: ${price}
      `.trim();

      // ونحطهم كمان في data-attributes
      if (oldCode) li.setAttribute('data-code', oldCode);
      if (newCode) li.setAttribute('data-newcode', newCode);

      ul.appendChild(li);
    });
  }

  function tryEnhanceCard(card){
    if (!card) return;
    var row = card.getAttribute('data-row');
    if (!row) return;
    var products = ordersMap[String(row)];
    if (!products || !products.length) return;

    // حاول نلاقي <ul> اللي فيها المنتجات
    var ul = card.querySelector('.order-details ul, .order-products');
    if (!ul) return;

    renderUL(ul, products);
  }

  // نراقب ظهور الكروت ونحسّنها
  var observer = new MutationObserver(function(muts){
    muts.forEach(function(m){
      m.addedNodes && m.addedNodes.forEach(function(node){
        if (node.nodeType === 1){
          if (node.classList && node.classList.contains('order-card')) {
            tryEnhanceCard(node);
          } else if (node.querySelectorAll) {
            node.querySelectorAll('.order-card').forEach(tryEnhanceCard);
          }
        }
      });
    });
  });

  function startObserver(){
    var list = document.getElementById('order-list');
    if (!list) return false;
    observer.observe(list, { childList: true, subtree: true });
    list.querySelectorAll('.order-card').forEach(tryEnhanceCard);
    return true;
  }

  async function init(){
    await loadOrdersOnce();
    var ok = startObserver();
    if (!ok){
      var tries = 0, id = setInterval(function(){
        tries++;
        if (startObserver()){
          clearInterval(id);
        }
        if (tries > 40) clearInterval(id);
      }, 250);
    }
    // تحديث دوري للبيانات وإعادة حقن الأكواد والألوان/المقاسات في العناصر الظاهرة
    setInterval(async function(){
      await loadOrdersOnce();
      document.querySelectorAll('.order-card').forEach(tryEnhanceCard);
    }, 10000);
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
