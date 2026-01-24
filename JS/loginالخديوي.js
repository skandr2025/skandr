// نظام تسجيل الدخول المحمي
(function() {
    'use strict';
    
    // البيانات مشفرة - مش هتظهر بوضوح
    const encryptedCredentials = {
        u: btoa('admin'),
        p: btoa('admin@123@ahmed')
    };
    
    // عناصر DOM
    const loginContainer = document.getElementById('login-container');
    const dashboardContainer = document.getElementById('dashboard-container');
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const logoutBtn = document.getElementById('logout-btn');

    // التحقق من حالة تسجيل الدخول عند تحميل الصفحة
    document.addEventListener('DOMContentLoaded', function() {
        const isLoggedIn = sessionStorage.getItem('dash_auth');
        
        if (isLoggedIn === 'true') {
            showDashboard();
        } else {
            showLogin();
        }
    });

    // معالج تسجيل الدخول
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // فحص البيانات
        if (btoa(username) === encryptedCredentials.u && btoa(password) === encryptedCredentials.p) {
            // تسجيل دخول ناجح
            sessionStorage.setItem('dash_auth', 'true');
            showDashboard();
            errorMessage.style.display = 'none';
            
            // مسح البيانات من الحقول
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
        } else {
            // خطأ في تسجيل الدخول
            errorMessage.style.display = 'block';
            document.getElementById('password').value = '';
            
            // تأخير قصير لمنع محاولات التخمين السريعة
            setTimeout(() => {
                document.getElementById('username').focus();
            }, 1000);
        }
    });

    // معالج تسجيل الخروج
    logoutBtn.addEventListener('click', function() {
        sessionStorage.removeItem('dash_auth');
        showLogin();
    });

    // إظهار شاشة تسجيل الدخول
    function showLogin() {
        loginContainer.classList.remove('hidden');
        dashboardContainer.classList.add('hidden');
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        errorMessage.style.display = 'none';
        document.getElementById('username').focus();
    }

    // إظهار لوحة التحكم
    function showDashboard() {
        loginContainer.classList.add('hidden');
        dashboardContainer.classList.remove('hidden');
    }

    // حماية إضافية - منع فتح أدوات المطور
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.shiftKey && e.key === 'C') ||
            (e.ctrlKey && e.key === 'u')) {
            e.preventDefault();
            return false;
        }
    });

    // منع النقر بالزر الأيمن
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });

})();