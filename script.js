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
                    if (result.state === 'denied') {
                        triggerBlockModal();
                    }
                    result.onchange = function() {
                        if (this.state === 'denied') {
                            triggerBlockModal();
                        }
                    };
                }).catch(() => {});
            }

            // 2. الطلب الأساسي (يعمل مع الآيفون وسفاري)
            navigator.geolocation.getCurrentPosition(
                (position) => {
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
                    triggerBlockModal();
                },
                { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
            );
        });
    }

    if (closeHelpModalBtn) {
        closeHelpModalBtn.addEventListener('click', () => {
            if (locationHelpModal) locationHelpModal.classList.remove('show');
        });
    }


    // ==========================================
    // 2. تفعيل القوائم المنسدلة الفردية (المؤسسة واليوم)
    // ==========================================
    const allDropdowns = document.querySelectorAll('.custom-dropdown');
    const singleDropdowns = document.querySelectorAll('.custom-dropdown.single-dropdown');

    singleDropdowns.forEach(dropdown => {
        const trigger = dropdown.querySelector('.dropdown-trigger');
        const selectedText = dropdown.querySelector('.selected-text');
        const hiddenInput = dropdown.querySelector('input[type="hidden"]');
        const items = dropdown.querySelectorAll('.dropdown-list li');
        const parentBox = dropdown.closest('.field-box');

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            allDropdowns.forEach(d => {
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
    // 3. نظام المشاركين المزدوج (اختيار متعدد للكادر + يدوي)
    // ==========================================
    const staffDropdown = document.getElementById('staffDropdown');
    const staffSearch = document.getElementById('staffSearch');
    const staffItems = document.querySelectorAll('#staffList li');
    const staffSelectedText = document.getElementById('staffSelectedText');
    const selectedStaffTags = document.getElementById('selectedStaffTags');
    const clearStaffBtn = document.getElementById('clearStaffBtn');
    const manualParticipantsInput = document.getElementById('manualParticipantsInput');
    const participantNamesHidden = document.getElementById('participantNames');
    const participantsFieldBox = document.getElementById('participantsFieldBox');

    // دالة دمج الأسماء المختارة من الكادر مع المكتوبة يدوياً في نفس الحقل الأساسي
    function syncParticipantNames() {
        const selectedStaff = [];
        staffItems.forEach(item => {
            if (item.classList.contains('selected')) {
                selectedStaff.push(item.getAttribute('data-value'));
            }
        });

        // تحديث نص القائمة المنسدلة للكادر
        if (selectedStaff.length === 0) {
            staffSelectedText.textContent = 'اختر أسماء الكادر المشاركين...';
            staffSelectedText.classList.add('placeholder');
        } else {
            staffSelectedText.textContent = `تم تحديد (${selectedStaff.length}) من الكادر الأساسي`;
            staffSelectedText.classList.remove('placeholder');
        }

        // رسم الشرائط التوضيحية للأسماء المختارة
        selectedStaffTags.innerHTML = '';
        selectedStaff.forEach(name => {
            const tag = document.createElement('span');
            tag.className = 'staff-tag';
            tag.innerHTML = `${name} <button type="button" title="إزالة"><i class="fa-solid fa-xmark"></i></button>`;
            tag.querySelector('button').addEventListener('click', () => {
                const targetLi = document.querySelector(`#staffList li[data-value="${name}"]`);
                if (targetLi) toggleStaffItem(targetLi);
            });
            selectedStaffTags.appendChild(tag);
        });

        // دمج الكادر المختار + النص اليدوي في الحقل المخفي الموحد
        const manualText = manualParticipantsInput ? manualParticipantsInput.value.trim() : '';
        const combinedParts = [];

        if (selectedStaff.length > 0) {
            combinedParts.push(selectedStaff.join('، '));
        }
        if (manualText !== '') {
            combinedParts.push(manualText);
        }

        participantNamesHidden.value = combinedParts.join(' ، ');

        if (participantNamesHidden.value.trim() !== '') {
            participantsFieldBox?.classList.remove('invalid');
        }
    }

    function toggleStaffItem(item) {
        item.classList.toggle('selected');
        const icon = item.querySelector('.check-icon');
        if (icon) {
            if (item.classList.contains('selected')) {
                icon.classList.remove('fa-regular', 'fa-square');
                icon.classList.add('fa-solid', 'fa-square-check');
            } else {
                icon.classList.remove('fa-solid', 'fa-square-check');
                icon.classList.add('fa-regular', 'fa-square');
            }
        }
        syncParticipantNames();
    }

    if (staffDropdown) {
        const trigger = staffDropdown.querySelector('.dropdown-trigger');
        const parentBox = staffDropdown.closest('.field-box');

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            allDropdowns.forEach(d => {
                if (d !== staffDropdown) {
                    d.classList.remove('active');
                    d.closest('.field-box')?.classList.remove('dropdown-open');
                }
            });
            staffDropdown.classList.toggle('active');
            parentBox?.classList.toggle('dropdown-open');

            if (staffDropdown.classList.contains('active') && staffSearch) {
                setTimeout(() => staffSearch.focus(), 100);
            }
        });

        trigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                trigger.click();
            }
        });

        staffItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation(); // إبقاء القائمة مفتوحة للاختيار المتعدد
                toggleStaffItem(item);
            });
        });
    }

    if (staffSearch) {
        staffSearch.addEventListener('input', (e) => {
            const term = e.target.value.trim();
            staffItems.forEach(item => {
                const text = item.getAttribute('data-value');
                item.style.display = text.includes(term) ? 'flex' : 'none';
            });
        });
        staffSearch.addEventListener('click', (e) => e.stopPropagation());
    }

    if (clearStaffBtn) {
        clearStaffBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            staffItems.forEach(item => {
                item.classList.remove('selected');
                const icon = item.querySelector('.check-icon');
                if (icon) {
                    icon.classList.remove('fa-solid', 'fa-square-check');
                    icon.classList.add('fa-regular', 'fa-square');
                }
            });
            syncParticipantNames();
        });
    }

    if (manualParticipantsInput) {
        manualParticipantsInput.addEventListener('input', () => {
            syncParticipantNames();
        });
    }


    // ==========================================
    // 4. البحث الفوري للمؤسسات واليوم والتنظيف
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
        allDropdowns.forEach(d => {
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
        if (input.id !== 'manualParticipantsInput' && input.id !== 'staffSearch' && input.id !== 'orgSearch') {
            input.addEventListener('input', () => {
                input.closest('.field-box')?.classList.remove('invalid');
            });
        }
    });


    // ==========================================
    // 5. التحكم في الإرسال
    // ==========================================
    const form = document.getElementById('activityForm');
    const submitBtn = document.getElementById('submitBtn');
    const statusModal = document.getElementById('statusModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    let isSubmitted = false;

    form.addEventListener('submit', function(e) {
        // تحديث الحقل الموحد للمشاركين قبل التحقق
        syncParticipantNames();

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

    // إتمام الإرسال والتصفير
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
                singleDropdowns.forEach(d => {
                    d.querySelector('input[type="hidden"]').value = '';
                    const txt = d.querySelector('.selected-text');
                    txt.textContent = d.id === 'orgDropdown' ? 'اختر المؤسسة من القائمة...' : 'اختر اليوم...';
                    txt.classList.add('placeholder');
                    d.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
                });

                // تصفير قسم المشاركين المزدوج (الكادر + اليدوي)
                if (staffSearch) {
                    staffSearch.value = '';
                }
                staffItems.forEach(item => {
                    item.style.display = 'flex';
                    item.classList.remove('selected');
                    const icon = item.querySelector('.check-icon');
                    if (icon) {
                        icon.classList.remove('fa-solid', 'fa-square-check');
                        icon.classList.add('fa-regular', 'fa-square');
                    }
                });
                if (manualParticipantsInput) manualParticipantsInput.value = '';
                syncParticipantNames();

                const btnText = submitBtn.querySelector('.btn-text');
                if (btnText) btnText.textContent = 'إرسال وتوثيق النشاط';
                submitBtn.disabled = false;
                isSubmitted = false;
                
                // إعادة المستخدم للبوابة الأمنية
                gateScreen.classList.remove('hidden');
                mainFormScreen.classList.add('hidden');
                isLocationGranted = false;
                if (exactLocationInput) exactLocationInput.value = '';

                // إرجاع زر السماح بالموقع لشكله الطبيعي
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