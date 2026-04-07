document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("form_contact");
    const addressInput = document.getElementById("Address");
    const areaSelect = document.getElementById("Area");
    const subtotalPriceElement = document.querySelector(".subtotal_chekout");
    const servicePriceElement = document.querySelector(".service_price");
    const finalTotalPriceElement = document.querySelector(".total_chekout");

    // الحقول المخفية
    const serviceChargeInput = document.getElementById("service_charge_input");
    const productsInput = document.getElementById("products_input");
    const totalPriceInput = document.getElementById("total_price_input");

    function getDeliveryFee() {
        const selectedOption = areaSelect.options[areaSelect.selectedIndex];
        return selectedOption ? parseFloat(selectedOption.dataset.fee || 0) : 0;
    }

    function updateFinalPrice() {
        const subtotalText = subtotalPriceElement.textContent.replace('LE:', '').replace('$', '').trim();
        const subtotal = parseFloat(subtotalText) || 0;

        const deliveryFee = getDeliveryFee();
        servicePriceElement.textContent = `LE:${deliveryFee.toFixed(2)}`;

        const finalTotal = subtotal + deliveryFee;
        finalTotalPriceElement.textContent = `LE:${finalTotal.toFixed(2)}`;

        if (serviceChargeInput) serviceChargeInput.value = deliveryFee.toFixed(2);
        if (totalPriceInput) totalPriceInput.value = finalTotal.toFixed(2);
    }

    // تحديث عند تغيير المنطقة
    areaSelect.addEventListener('change', updateFinalPrice);
    updateFinalPrice();

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        // منع الإرسال المزدوج
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn.disabled) return;
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ جاري الإرسال...';

        const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
        const productsData = JSON.stringify(cartItems);

        productsInput.value = productsData;
        serviceChargeInput.value = getDeliveryFee();
        totalPriceInput.value = (
            parseFloat(subtotalPriceElement.textContent.replace('LE:', '').replace('$', '')) + getDeliveryFee()
        ).toFixed(2);

        const formData = new FormData(form);
        formData.append('action', 'addOrder');

        const scriptURL = "https://script.google.com/macros/s/AKfycbyfyDuJQeTVaS1pEJQOl1RA6Yy6CvPodSoVWtP8B0nNnI6h00MMKZpVSmx8yRqrSg9r/exec";

        fetch(scriptURL, {
            method: "POST",
            body: formData,
        })
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            if (data.result === 'success') {
                // إخفاء الفورم وإظهار رسالة النجاح
                const cart = JSON.parse(localStorage.getItem('cart')) || [];
                const total = document.querySelector('.total_chekout')?.textContent || '0';
                const orderNum = data.row ? data.row - 1 : Math.floor(Math.random()*90000+10000);
                const now = new Date().toLocaleDateString('ar-EG', {year:'numeric',month:'long',day:'numeric'});

                let productsRows = '';
                cart.forEach(item => {
                    productsRows += `<tr>
                        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${item.name}</td>
                        <td style="padding:10px;border-bottom:1px solid #eee;text-align:left;">EGP ${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>`;
                });

                const modal = document.createElement('div');
                modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);';
                modal.innerHTML = `
                <div style="background:#fff;border-radius:24px;max-width:400px;width:100%;max-height:90vh;overflow-y:auto;font-family:Tajawal,sans-serif;direction:rtl;box-shadow:0 24px 60px rgba(0,0,0,0.3);">

                    <!-- Header -->
                    <div style="background:linear-gradient(135deg,#004f49,#006b63);padding:28px 20px;text-align:center;border-radius:24px 24px 0 0;position:relative;">
                        <div style="width:64px;height:64px;background:rgba(255,255,255,0.15);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;font-size:32px;">✅</div>
                        <h2 style="color:#fff;font-size:20px;font-weight:900;margin:0 0 6px;">تم استلام طلبك!</h2>
                        <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:0;">شكرًا لتسوقك مع SKANDR</p>
                    </div>

                    <!-- Order Number Badge -->
                    <div style="margin:-18px 24px 0;background:#fff;border-radius:14px;padding:14px 20px;box-shadow:0 4px 20px rgba(0,0,0,0.1);text-align:center;position:relative;z-index:1;">
                        <p style="color:#888;font-size:12px;margin:0 0 4px;font-weight:600;">رقم الطلب</p>
                        <p style="color:#004f49;font-size:24px;font-weight:900;margin:0;letter-spacing:2px;">#${orderNum}</p>
                    </div>

                    <!-- Details -->
                    <div style="padding:20px 20px 8px;">
                        <div style="background:#f8fffe;border-radius:14px;overflow:hidden;border:1px solid #e0eeec;">
                            <div style="padding:14px 16px;border-bottom:1px solid #e0eeec;">
                                <p style="color:#999;font-size:11px;font-weight:700;margin:0 0 3px;text-transform:uppercase;letter-spacing:.5px;">التاريخ</p>
                                <p style="color:#222;font-size:15px;font-weight:700;margin:0;">${now}</p>
                            </div>
                            <div style="padding:14px 16px;border-bottom:1px solid #e0eeec;">
                                <p style="color:#999;font-size:11px;font-weight:700;margin:0 0 3px;text-transform:uppercase;letter-spacing:.5px;">وسيلة الدفع</p>
                                <p style="color:#222;font-size:15px;font-weight:700;margin:0;">💵 كاش عند الاستلام</p>
                            </div>
                            <div style="padding:14px 16px;">
                                <p style="color:#999;font-size:11px;font-weight:700;margin:0 0 3px;text-transform:uppercase;letter-spacing:.5px;">الإجمالي</p>
                                <p style="color:#004f49;font-size:20px;font-weight:900;margin:0;">${total}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Products -->
                    <div style="padding:8px 20px 20px;">
                        <p style="font-size:14px;font-weight:800;color:#333;margin:0 0 10px;">🛒 تفاصيل الطلب</p>
                        <div style="background:#f8fffe;border-radius:14px;overflow:hidden;border:1px solid #e0eeec;">
                            ${cart.map((item,i)=>`
                            <div style="padding:12px 16px;${i<cart.length-1?'border-bottom:1px solid #e0eeec;':''}">
                                <p style="color:#333;font-size:13px;font-weight:600;margin:0 0 4px;">${item.name}</p>
                                <p style="color:#004f49;font-size:14px;font-weight:800;margin:0;">EGP ${(item.price*item.quantity).toFixed(2)} <span style="color:#aaa;font-size:12px;font-weight:400;">× ${item.quantity}</span></p>
                            </div>`).join('')}
                        </div>
                    </div>

                    <!-- Button -->
                    <div style="padding:0 20px 24px;">
                        <button onclick="this.closest('[style*=fixed]').remove();localStorage.removeItem('cart');window.location.href='index.html';"
                            style="width:100%;background:linear-gradient(135deg,#004f49,#006b63);color:#fff;border:none;border-radius:14px;padding:16px;font-size:16px;font-weight:800;cursor:pointer;font-family:Tajawal,sans-serif;box-shadow:0 6px 20px rgba(0,79,73,0.3);">
                            العودة للرئيسية 🏠
                        </button>
                    </div>

                </div>`;
                document.body.appendChild(modal);
                form.reset();
                localStorage.removeItem('cart');
            } else {
                alert("حدث خطأ في إرسال طلبك. يرجى المحاولة مرة أخرى. رسالة الخطأ: " + data.error);
                console.error('Error from server:', data.error);
            }
        })
        .catch(error => {
            console.error("Error!", error.message);
            alert("حدث خطأ في الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.");
            submitBtn.disabled = false;
            submitBtn.textContent = 'اضغط للدفع';
        });
    });
});


