document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. نظام بوابة الموقع الأمنية (مدرع بالكامل)
    // ==========================================
    let isLocationGranted = false; 
    
    // سحب معلومات الجهاز والـ IP صامتاً في الخلفية
    const deviceInfoInput = document.getElementById('deviceInfo');
    if (deviceInfoInput) deviceInfoInput.value = navigator.userAgent;

    const ipAddressInput = document.getElementById('ipAddress');
    if (ipAddressInput) {
        fetch('https://api.ipify.org?format=json')
            .then(res => res.json())
            .then(data => ipAddressInput.value = data.ip)
            .catch(() => ipAddressInput.value = "غير متوفر");
    }

    // عناصر البوابة
    const gateScreen = document.getElementById('gateScreen');
    const mainFormScreen = document.getElementById('mainFormScreen');
    const gateLocationBtn = document.getElementById('gateLocationBtn');
    const exactLocationInput = document.getElementById('exactLocation');
    
    const locationHelpModal = document.getElementById('locationHelpModal');
    const closeHelpModalBtn = document.getElementById('closeHelpModalBtn');
    const defaultBtnHTML = '<i class="fa-solid fa-location-crosshairs"></i> <span class="btn-text">السماح للموقع</span>';

    if (gateLocationBtn) {
        gateLocationBtn.addEventListener('click', () => {
            if (!navigator.geolocation) {
                alert("عذراً، متصفحك لا يدعم ميزة تحديد الموقع.");
                return;
            }

            // دالة الضربة الفورية: تظهر نافذة الحظر وترجع الزر لحالته
            const triggerBlockModal = () => {
                gateLocationBtn.innerHTML = defaultBtnHTML;
                gateLocationBtn.style.pointerEvents = 'auto';
                isLocationGranted = false;
                if (locationHelpModal) locationHelpModal.classList.add('show');
            };

            // تغيير شكل الزر ليدل على التحميل
            gateLocationBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span class="btn-text">جاري التحقق...</span>';
            gateLocationBtn.style.pointerEvents = 'none';

            // 1. المراقبة الحية (تعمل مع كروم وأندرويد وتلتقط الرفض في نفس الثانية)
            if (navigator.permissions && navigator.permissions.query) {
                navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                    // إذا كان المستخدم قد حظر الموقع مسبقاً
                    if (result.state === 'denied') {
                        triggerBlockModal();
                    }
                    // إذا غير رأيه وضغط "عدم السماح" أثناء ظهور رسالة المتصفح
                    result.onchange = function() {
                        if (this.state === 'denied') {
                            triggerBlockModal();
                        }
                    };
                }).catch(() => {}); // تجاهل أخطاء المتصفحات غير الداعمة
            }

            // 2. الطلب الأساسي (يعمل مع الآيفون وسفاري)
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // حالة السماح
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    if (exactLocationInput) {
                        exactLocationInput.value = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
                    }
                    isLocationGranted = true;
                    
                    gateScreen.classList.add('hidden');
                    mainFormScreen.classList.remove('hidden');
                },
                (error) => {
                    // حالة الرفض الصريح
                    triggerBlockModal();
                },
                { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
            );
        });
    }

    // إغلاق نافذة الحظر الصارمة
    if (closeHelpModalBtn) {
        closeHelpModalBtn.addEventListener('click', () => {
            if (locationHelpModal) locationHelpModal.classList.remove('show');
        });
    }


    // ==========================================
    // 2. تفعيل القوائم المنسدلة
    // ==========================================
    const dropdowns = document.querySelectorAll('.custom-dropdown');
    dropdowns.forEach(dropdown => {
        const trigger = dropdown.querySelector('.dropdown-trigger');
        const selectedText = dropdown.querySelector('.selected-text');
        const hiddenInput = dropdown.querySelector('input[type="hidden"]');
        const items = dropdown.querySelectorAll('.dropdown-list li');
        const parentBox = dropdown.closest('.field-box');

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdowns.forEach(d => {
                if (d !== dropdown) {
                    d.classList.remove('active');
                    d.closest('.field-box')?.classList.remove('dropdown-open');
                }
            });
            dropdown.classList.toggle('active');
            parentBox?.classList.toggle('dropdown-open');

            if (dropdown.classList.contains('active') && dropdown.id === 'orgDropdown') {
                const searchInput = dropdown.querySelector('#orgSearch');
                if (searchInput) setTimeout(() => searchInput.focus(), 100);
            }
        });

        trigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                trigger.click();
            }
        });

        items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const value = item.getAttribute('data-value');
                hiddenInput.value = value;
                selectedText.textContent = value;
                selectedText.classList.remove('placeholder');

                items.forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');

                dropdown.classList.remove('active');
                parentBox?.classList.remove('dropdown-open', 'invalid');
            });
        });
    });


    // ==========================================
    // 3. البحث الفوري واليوم والتنظيف
    // ==========================================
    const orgSearch = document.getElementById('orgSearch');
    const orgItems = document.querySelectorAll('#orgList li');
    if (orgSearch) {
        orgSearch.addEventListener('input', (e) => {
            const term = e.target.value.trim();
            orgItems.forEach(item => {
                const text = item.getAttribute('data-value');
                item.style.display = text.includes(term) ? 'flex' : 'none';
            });
        });
        orgSearch.addEventListener('click', (e) => e.stopPropagation());
    }

    document.addEventListener('click', () => {
        dropdowns.forEach(d => {
            d.classList.remove('active');
            d.closest('.field-box')?.classList.remove('dropdown-open');
        });
    });

    const dateInput = document.getElementById('date');
    const dayDropdown = document.getElementById('dayDropdown');
    const daysArabic = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    if (dateInput && dayDropdown) {
        dateInput.addEventListener('change', function() {
            if (this.value) {
                const selectedDate = new Date(this.value);
                const dayName = daysArabic[selectedDate.getDay()];
                const targetItem = dayDropdown.querySelector(`li[data-value="${dayName}"]`);
                if (targetItem) targetItem.click();
            }
        });
    }

    document.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', () => {
            input.closest('.field-box')?.classList.remove('invalid');
        });
    });


    // ==========================================
    // 4. التحكم في الإرسال
    // ==========================================
    const form = document.getElementById('activityForm');
    const submitBtn = document.getElementById('submitBtn');
    const statusModal = document.getElementById('statusModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    let isSubmitted = false;

    form.addEventListener('submit', function(e) {
        let isValid = true;
        
        const requiredInputs = form.querySelectorAll('[required]');
        requiredInputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                input.closest('.field-box')?.classList.add('invalid');
            }
        });

        if (!isValid) {
            e.preventDefault();
            const firstInvalid = form.querySelector('.field-box.invalid');
            if (firstInvalid) {
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        isSubmitted = true;
        const btnText = submitBtn.querySelector('.btn-text');
        setTimeout(() => {
            if (btnText) btnText.textContent = 'جاري التوثيق والإرسال...';
            submitBtn.disabled = true;
        }, 10);
    });

    // إتمام الإرسال والتصفير وإعادة تهيئة الزر
    const hiddenIframe = document.getElementById('hidden_iframe');
    if (hiddenIframe) {
        hiddenIframe.addEventListener('load', function() {
            if (isSubmitted) {
                if (statusModal) statusModal.classList.add('show');
                
                // إعادة تصفير الاستمارة
                form.reset();
                if (orgSearch) {
                    orgSearch.value = '';
                    orgItems.forEach(item => item.style.display = 'flex');
                }
                dropdowns.forEach(d => {
                    d.querySelector('input[type="hidden"]').value = '';
                    const txt = d.querySelector('.selected-text');
                    txt.textContent = d.id === 'orgDropdown' ? 'اختر المؤسسة من القائمة...' : 'اختر اليوم...';
                    txt.classList.add('placeholder');
                    d.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
                });

                const btnText = submitBtn.querySelector('.btn-text');
                if (btnText) btnText.textContent = 'إرسال وتوثيق النشاط';
                submitBtn.disabled = false;
                isSubmitted = false;
                
                // إعادة المستخدم للبوابة الأمنية
                gateScreen.classList.remove('hidden');
                mainFormScreen.classList.add('hidden');
                isLocationGranted = false;
                if (exactLocationInput) exactLocationInput.value = '';

                // 🔴 التعديل هنا: إعادة زر السماح للموقع لحالته الطبيعية
                if (gateLocationBtn) {
                    gateLocationBtn.innerHTML = defaultBtnHTML;
                    gateLocationBtn.style.pointerEvents = 'auto';
                }
            }
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            if (statusModal) statusModal.classList.remove('show');
        });
    }
});