document.addEventListener('DOMContentLoaded', () => {

    // 1. تفعيل القوائم المنسدلة الحصرية (المؤسسة واليوم)
    const dropdowns = document.querySelectorAll('.custom-dropdown');

    dropdowns.forEach(dropdown => {
        const trigger = dropdown.querySelector('.dropdown-trigger');
        const selectedText = dropdown.querySelector('.selected-text');
        const hiddenInput = dropdown.querySelector('input[type="hidden"]');
        const items = dropdown.querySelectorAll('.dropdown-list li');
        const parentCard = dropdown.closest('.form-card');

        // فتح وإغلاق القائمة
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdowns.forEach(d => {
                if (d !== dropdown) {
                    d.classList.remove('active');
                    d.closest('.form-card').classList.remove('dropdown-open');
                }
            });
            dropdown.classList.toggle('active');
            parentCard.classList.toggle('dropdown-open');
        });

        // اختيار عنصر من القائمة
        items.forEach(item => {
            item.addEventListener('click', () => {
                const value = item.getAttribute('data-value');
                hiddenInput.value = value;
                selectedText.textContent = value;
                selectedText.classList.remove('placeholder');

                items.forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');

                dropdown.classList.remove('active');
                parentCard.classList.remove('dropdown-open', 'invalid');
            });
        });
    });

    // 2. ميزة البحث الفوري داخل قائمة المؤسسات
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

        // منع إغلاق القائمة عند النقر داخل مربع البحث
        orgSearch.addEventListener('click', (e) => e.stopPropagation());
    }

    // إغلاق القوائم عند النقر في أي مكان فارغ في الصفحة
    document.addEventListener('click', () => {
        dropdowns.forEach(d => {
            d.classList.remove('active');
            d.closest('.form-card').classList.remove('dropdown-open');
        });
    });

    // 3. ميزة ذكية: تحديد اليوم تلقائياً عند اختيار التاريخ
    const dateInput = document.getElementById('date');
    const dayDropdown = document.getElementById('dayDropdown');
    const daysArabic = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    dateInput.addEventListener('change', function() {
        if (this.value) {
            const selectedDate = new Date(this.value);
            const dayName = daysArabic[selectedDate.getDay()];
            const targetItem = dayDropdown.querySelector(`li[data-value="${dayName}"]`);
            if (targetItem) targetItem.click();
        }
    });

    // إزالة التنبيه الأحمر عند البدء في الكتابة
    document.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', () => {
            input.closest('.form-card')?.classList.remove('invalid');
        });
    });

    // 4. الإرسال الفعلي للبيانات إلى جوجل إكسل
    const form = document.getElementById('activityForm');
    const submitBtn = document.getElementById('submitBtn');
    const modal = document.getElementById('statusModal');
    const closeModalBtn = document.getElementById('closeModalBtn');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        let isValid = true;

        // التحقق من الحقول المطلوبة
        const requiredInputs = form.querySelectorAll('[required]');
        requiredInputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                input.closest('.form-card').classList.add('invalid');
            }
        });

        // إذا كان هناك خطأ، قم بالتمرير لأول حقل فارغ
        if (!isValid) {
            const firstInvalid = form.querySelector('.form-card.invalid');
            firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        const formData = new FormData(form);
        const btnText = submitBtn.querySelector('.btn-text');
        const originalText = btnText.textContent;
        
        // تغيير حالة الزر أثناء الإرسال
        btnText.textContent = 'جاري التوثيق والإرسال...';
        submitBtn.disabled = true;

        // الرابط الخاص بك
        const scriptURL = 'https://script.google.com/macros/s/AKfycbwtfIxokucYjPISX9Xgk3YS_OHZnW6XMB9OF8THqJz5_YwTAR3jKyvOSvIsSBcYFEXt/exec';

        // التغليف بـ URLSearchParams ضروري جداً لنجاح الاتصال مع جوجل
        fetch(scriptURL, { 
            method: 'POST', 
            body: new URLSearchParams(formData) 
        })
            .then(response => response.json())
            .then(data => {
                if (data.result === 'success') {
                    showModal('تم الحفظ بنجاح!', 'تم ترحيل بيانات النشاط إلى صفحة (التجمع) في الإكسل بنجاح.');
                    resetCustomForm();
                } else {
                    throw new Error(data.error || 'حدث خطأ غير معروف');
                }
            })
            .catch(error => {
                showModal('خطأ في الاتصال!', 'تعذر إرسال البيانات. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.');
                console.error('Error!', error);
            })
            .finally(() => {
                // إعادة الزر لحالته الطبيعية
                btnText.textContent = originalText;
                submitBtn.disabled = false;
            });
    });

    // دالة لتفريغ الحقول وإعادة القوائم لوضعها الافتراضي بعد نجاح الإرسال
    function resetCustomForm() {
        form.reset();
        dropdowns.forEach(d => {
            d.querySelector('input[type="hidden"]').value = '';
            const txt = d.querySelector('.selected-text');
            txt.textContent = d.id === 'orgDropdown' ? 'اختر المؤسسة من القائمة...' : 'اختر اليوم...';
            txt.classList.add('placeholder');
            d.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
        });
    }

    // دالة لإظهار النافذة المنبثقة
    function showModal(title, message) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalMessage').textContent = message;
        modal.classList.add('show');
    }

    // إغلاق النافذة المنبثقة
    closeModalBtn.addEventListener('click', () => modal.classList.remove('show'));
});