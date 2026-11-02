document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. نظام الحماية وسحب بيانات الجهاز والموقع
    // ==========================================
    let isLocationGranted = false; // متغير للتحقق من موافقة المستخدم على الموقع
    
    // سحب معلومات الجهاز (نظام التشغيل والمتصفح)
    const deviceInfoInput = document.getElementById('deviceInfo');
    if (deviceInfoInput) {
        deviceInfoInput.value = navigator.userAgent;
    }

    // سحب عنوان الـ IP لمعرفة الموقع التقريبي
    const ipAddressInput = document.getElementById('ipAddress');
    if (ipAddressInput) {
        fetch('https://api.ipify.org?format=json')
            .then(res => res.json())
            .then(data => ipAddressInput.value = data.ip)
            .catch(() => ipAddressInput.value = "غير متوفر");
    }

    // طلب الموقع الدقيق (GPS) الإجباري فور فتح الصفحة
    const exactLocationInput = document.getElementById('exactLocation');
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // المستخدم وافق على إعطاء الموقع
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                if (exactLocationInput) {
                    exactLocationInput.value = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
                }
                isLocationGranted = true; // السماح للمستخدم بالإرسال
            },
            (error) => {
                // المستخدم رفض إعطاء الموقع
                isLocationGranted = false; // منع الإرسال
                alert("تنبيه أمني: لن تتمكن من إرسال الاستمارة دون السماح بالوصول إلى الموقع الجغرافي.");
            }
        );
    } else {
        alert("متصفحك لا يدعم ميزة تحديد الموقع، لا يمكن إرسال الاستمارة.");
    }


    // ==========================================
    // 2. تفعيل القوائم المنسدلة (الاحترافية)
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
    // 3. ميزة البحث الفوري داخل قائمة المؤسسات
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

    // إغلاق القوائم عند الضغط خارجها
    document.addEventListener('click', () => {
        dropdowns.forEach(d => {
            d.classList.remove('active');
            d.closest('.field-box')?.classList.remove('dropdown-open');
        });
    });


    // ==========================================
    // 4. التحديد التلقائي لليوم عند اختيار التاريخ
    // ==========================================
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

    // إزالة علامة الخطأ الحمراء بمجرد الكتابة في الحقل
    document.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', () => {
            input.closest('.field-box')?.classList.remove('invalid');
        });
    });


    // ==========================================
    // 5. التحكم في الإرسال والتحقق من الشروط
    // ==========================================
    const form = document.getElementById('activityForm');
    const submitBtn = document.getElementById('submitBtn');
    const modal = document.getElementById('statusModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    let isSubmitted = false;

    form.addEventListener('submit', function(e) {
        
        // الشرط الأمني: منع الإرسال إذا لم يوافق المستخدم على سحب الموقع
        if (!isLocationGranted) {
            e.preventDefault(); 
            alert("إجراء أمني: يرجى الموافقة على صلاحية تحديد الموقع (Location) لتتمكن من إرسال الاستمارة. إذا كنت قد رفضتها سابقاً، يرجى تفعيلها من إعدادات المتصفح وتحديث الصفحة.");
            return; // الخروج فوراً وعدم إكمال الإرسال
        }

        // التحقق من الحقول الإجبارية الفارغة
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

        // إذا وافق على الموقع وكل الحقول ممتلئة -> السماح بالإرسال
        isSubmitted = true;
        const btnText = submitBtn.querySelector('.btn-text');
        
        setTimeout(() => {
            if (btnText) btnText.textContent = 'جاري التوثيق والإرسال...';
            submitBtn.disabled = true;
        }, 10);
    });

    // الاستماع لانتهاء استلام البيانات من سيرفر جوجل
    const hiddenIframe = document.getElementById('hidden_iframe');
    if (hiddenIframe) {
        hiddenIframe.addEventListener('load', function() {
            if (isSubmitted) {
                showModal('تم ارسال الاستمارة بنجاح'); // عرض رسالة النجاح فقط
                resetCustomForm();
                
                const btnText = submitBtn.querySelector('.btn-text');
                if (btnText) btnText.textContent = 'إرسال وتوثيق النشاط';
                submitBtn.disabled = false;
                
                isSubmitted = false;
            }
        });
    }

    // دوال إعادة التعيين والنافذة المنبثقة
    function resetCustomForm() {
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
    }

    function showModal(title) {
        const titleEl = document.getElementById('modalTitle');
        if (titleEl) titleEl.textContent = title;
        modal.classList.add('show');
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => modal.classList.remove('show'));
    }
});