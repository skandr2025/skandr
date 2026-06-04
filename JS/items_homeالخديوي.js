// دالة مساعدة لبناء كارت المنتج (مع زر سلة عادي)
function buildProductCard(product) {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const isInCart = cart.some(cartItem => cartItem.id === product.id);
  
  const old_price_html = product.old_price ? `<p class="old_price">LE:${product.old_price}</p>` : "";
  const discount_html = product.old_price
    ? `<span class="sale_present">%${Math.floor((product.old_price - product.price) / product.old_price * 100)}</span>`
    : "";

  return `
    <div class="swiper-slide product" id="product-${product.id}">
      ${discount_html}
      <div class="img_product">
        <img src="${product.img}" alt="${product.name}">
      </div>
      <p class="name_product">${product.name}</p>
      <div class="price">
        <p><span>EGP ${product.price}</span></p>
        ${old_price_html}
      </div>
      <div class="icons">
        <span class="btn_add_cart ${isInCart ? 'active' : ''}" data-id="${product.id}">
          <i class="fa-solid fa-cart-shopping"></i>${isInCart ? 'Item in cart' : 'أضف للسلة'}
        </span>
      </div>
    </div>
  `;
}

fetch('productsالخديوي.json')
  .then(response => response.json())
  .then(data => {
    const swiper_items_sale = document.getElementById("swiper_items_sale");
    const swiper_kashri    = document.getElementById("swiper_kashri");
    const swiper_kabida    = document.getElementById("swiper_kabida");
    const swiper_mix       = document.getElementById("swiper_mix");
    const swiper_sweet     = document.getElementById("swiper_sweet");
    const swiper_add       = document.getElementById("swiper_add");
    const swiper_top       = document.getElementById("swiper_top");

    data.forEach(product => {
      const card = buildProductCard(product);

      if (product.old_price && swiper_items_sale)   swiper_items_sale.innerHTML += card;
      if (product.catetory === "kashri" && swiper_kashri) swiper_kashri.innerHTML += card;
      if (product.catetory === "kabida" && swiper_kabida) swiper_kabida.innerHTML += card;
      if (product.catetory === "mix"    && swiper_mix)    swiper_mix.innerHTML    += card;
      if (product.catetory === "sweet"  && swiper_sweet)  swiper_sweet.innerHTML  += card;
      if (product.catetory === "add"    && swiper_add)    swiper_add.innerHTML    += card;
      if (product.catetory === "top"    && swiper_top)    swiper_top.innerHTML    += card;
    });
  });
