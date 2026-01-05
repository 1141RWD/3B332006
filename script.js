document.addEventListener('DOMContentLoaded', () => {

    // Navigation Logic
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.page-section');

    // Global State for Coupons (Persisted)
    let globalCouponCount = parseInt(localStorage.getItem('globalCouponCount')) || 0;


    function navigateTo(targetId) {
        // Update Nav
        navBtns.forEach(btn => {
            if (btn.dataset.target === targetId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Show Section
        sections.forEach(sec => {
            if (sec.id === targetId) {
                sec.classList.add('active');
            } else {
                sec.classList.remove('active');
            }
        });

        // Marquee Logic Pausing
        if (targetId === 'home') {
            marqueeTrack.style.animationPlayState = 'running';
        } else {
            marqueeTrack.style.animationPlayState = 'paused';
        }
    }

    // Bind click events to nav buttons
    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const target = btn.dataset.target;
            navigateTo(target);
        });
    });

    // Expose navigateTo globally for onclick handlers in HTML
    window.navigateTo = navigateTo;

    // --- Interactive Marquee Logic ---
    const marqueeTrack = document.getElementById('marquee-track');
    const marqueeWrapper = document.querySelector('.marquee-wrapper');
    const marqueeLeftBtn = document.getElementById('marquee-left');
    const marqueeRightBtn = document.getElementById('marquee-right');
    const originalItems = Array.from(marqueeTrack.children);

    // Clone items for seamless scrolling
    // Creating minimal clones to fill screen + buffer
    originalItems.forEach(item => {
        const clone = item.cloneNode(true);
        marqueeTrack.appendChild(clone);
    });

    let scrollPos = 0;
    let isPaused = false;
    const speed = 1; // Pixels per frame
    let animationId;

    function animateMarquee() {
        if (!isPaused) {
            scrollPos += speed;
            // If scrolled past half (original width), reset to 0
            if (scrollPos >= marqueeTrack.scrollWidth / 2) {
                scrollPos = 0;
            }
            marqueeTrack.scrollLeft = scrollPos;
        }
        animationId = requestAnimationFrame(animateMarquee);
    }

    // Start Animation
    animationId = requestAnimationFrame(animateMarquee);

    // Pause on Hover (Wrapper covers both track and buttons)
    marqueeWrapper.addEventListener('mouseenter', () => {
        isPaused = true;
    });

    marqueeWrapper.addEventListener('mouseleave', () => {
        isPaused = false;
        // Sync scrollPos with current scrollLeft in case manual scroll happened
        scrollPos = marqueeTrack.scrollLeft;
    });

    // Manual Navigation Buttons
    const manualScrollAmount = 300;

    marqueeLeftBtn.addEventListener('click', () => {
        // Ensure we have a valid baseline
        let currentLeft = marqueeTrack.scrollLeft;
        const limit = marqueeTrack.scrollWidth / 2;

        // Wrapped Loop Logic: If moving left goes < 0, jump forward to the cloned set first
        if (currentLeft - manualScrollAmount < 0) {
            currentLeft += limit;
            marqueeTrack.scrollLeft = currentLeft;
        }

        const target = currentLeft - manualScrollAmount;

        marqueeTrack.scrollTo({
            left: target,
            behavior: 'smooth'
        });

        // Update global scrollPos to match
        scrollPos = target;
    });

    marqueeRightBtn.addEventListener('click', () => {
        const limit = marqueeTrack.scrollWidth / 2;
        let target = marqueeTrack.scrollLeft + manualScrollAmount;

        marqueeTrack.scrollTo({
            left: target,
            behavior: 'smooth'
        });

        scrollPos = target;

        // Check for reset need after animation (approx 500ms)
        setTimeout(() => {
            if (marqueeTrack.scrollLeft >= limit) {
                marqueeTrack.scrollLeft -= limit;
                scrollPos = marqueeTrack.scrollLeft;
            }
        }, 600);
    });

    // --- Modal / Lightbox Logic ---
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');
    const closeBtn = document.querySelector('.close-btn');

    // Attach click event to ALL marquee images (originals and clones)
    // We delegate this to the track to handle future clones if needed
    marqueeTrack.addEventListener('click', (e) => {
        const itemImg = e.target.closest('.marquee-item img');
        if (itemImg) {
            modal.style.display = "block";
            modalImg.src = itemImg.src;
            isPaused = true; // Ensure paused when modal open
        }
    });

    // Close Modal
    closeBtn.addEventListener('click', () => {
        modal.style.display = "none";
        isPaused = false;
    });

    // Close on click outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
            isPaused = false;
        }
    });


    // --- Market Item Filtering ---
    const filterBtns = document.querySelectorAll('.filter-btn');
    const productGrid = document.querySelector('.product-grid'); // Parent container

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');
            // Query fresh list of cards
            const currentCards = document.querySelectorAll('.product-card');

            currentCards.forEach(card => {
                if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
                    card.style.display = 'flex'; // Restore display
                } else {
                    card.style.display = 'none'; // Hide
                }
            });
        });
    });

    // --- Shopping Cart Logic ---
    let cart = [];
    const cartBtn = document.getElementById('cart-btn');
    const cartModal = document.getElementById('cart-modal');
    const closeCartBtn = document.querySelector('.close-cart');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total-price');
    const cartCountElement = document.getElementById('cart-count');
    const checkoutBtn = document.getElementById('checkout-btn');
    // const addToCartBtns = document.querySelectorAll('.add-cart-btn'); // REMOVED: Using delegation

    // Open Cart Modal
    cartBtn.addEventListener('click', () => {
        cartModal.style.display = "block";
        updateCartUI();
    });

    // Close Cart Modal
    closeCartBtn.addEventListener('click', () => {
        cartModal.style.display = "none";
    });

    // Close on click outside (same as image modal)
    window.addEventListener('click', (e) => {
        if (e.target === cartModal) {
            cartModal.style.display = "none";
        }
    });

    // --- Purchase Modal & Animation Logic ---
    const purchaseModal = document.getElementById('purchase-modal');
    const closePurchaseBtn = document.querySelector('.close-purchase');
    const confirmAddBtn = document.getElementById('confirm-add-btn');
    const purchaseImg = document.getElementById('purchase-img');
    const purchaseTitle = document.getElementById('purchase-title');
    const purchasePrice = document.getElementById('purchase-price');
    const qtyMinus = document.getElementById('qty-minus');
    const qtyPlus = document.getElementById('qty-plus');
    const qtyVal = document.getElementById('qty-val');
    const shippingMethod = document.getElementById('shipping-method');

    let currentProduct = {}; // Store currently selected product data

    // Open Purchase Modal (Event Delegation for Dynamic Items)
    productGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-cart-btn')) {
            const card = e.target.closest('.product-card');
            const imgSrc = card.querySelector('img').src;
            const name = card.querySelector('h3').innerText;
            const priceText = card.querySelector('.price').innerText;
            // Extract number from price string
            const price = parseInt(priceText.replace(/[^\d]/g, ''));

            // Populate Modal
            purchaseImg.src = imgSrc;
            purchaseTitle.innerText = name;
            purchasePrice.innerText = priceText;
            qtyVal.innerText = '1'; // Reset quantity
            shippingMethod.value = 'delivery'; // Reset shipping

            currentProduct = { name, price, imgSrc };
            purchaseModal.style.display = "block";
        }
    });

    closePurchaseBtn.addEventListener('click', () => {
        purchaseModal.style.display = "none";
    });

    window.addEventListener('click', (e) => {
        if (e.target === purchaseModal) {
            purchaseModal.style.display = "none";
        }
    });

    // Quantity Logic
    qtyMinus.addEventListener('click', () => {
        let val = parseInt(qtyVal.innerText);
        if (val > 1) qtyVal.innerText = val - 1;
    });

    qtyPlus.addEventListener('click', () => {
        let val = parseInt(qtyVal.innerText);
        qtyVal.innerText = val + 1;
    });

    // Confirm Add & Animation
    confirmAddBtn.addEventListener('click', () => {
        const quantity = parseInt(qtyVal.innerText);
        const shipping = shippingMethod.options[shippingMethod.selectedIndex].text;

        // 1. Close Modal
        purchaseModal.style.display = "none";

        // 2. Fly Animation
        flyToCart(currentProduct.imgSrc);

        // 3. Add to Cart Logic (Wait slightly for animation start visual)
        setTimeout(() => {
            addToCart(currentProduct.name, currentProduct.price, quantity, shipping);
        }, 800); // Sync with animation duration roughly
    });

    function flyToCart(imgSrc) {
        const cartRect = cartBtn.getBoundingClientRect();
        // Since modal is closed, we need a source point. 
        // We can use the center of screen or the last known position of modal image.
        // For simplicity, let's spawn it from center screen where modal was.

        const flyingImg = document.createElement('img');
        flyingImg.src = imgSrc;
        flyingImg.classList.add('flying-img');

        // Start position (Center of screen approx)
        flyingImg.style.top = '50%';
        flyingImg.style.left = '50%';
        flyingImg.style.transform = 'translate(-50%, -50%)';

        document.body.appendChild(flyingImg);

        // Force reflow
        void flyingImg.offsetWidth;

        // End position (Cart Icon)
        flyingImg.style.top = `${cartRect.top + cartRect.height / 2}px`;
        flyingImg.style.left = `${cartRect.left + cartRect.width / 2}px`;
        flyingImg.style.width = '20px';
        flyingImg.style.height = '20px';
        flyingImg.style.opacity = '0';

        // Cleanup
        setTimeout(() => {
            flyingImg.remove();
        }, 800);
    }

    function addToCart(name, price, quantity = 1, shipping = '宅配到府') {
        const existingItem = cart.find(item => item.name === name && item.shipping === shipping);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({ name, price, quantity, shipping });
        }
        updateCartUI();
        updateCartCount();
    }

    function updateCartCount() {
        const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountElement.innerText = totalCount;

        // Bump animation for badge
        cartCountElement.style.transform = "scale(1.5)";
        setTimeout(() => cartCountElement.style.transform = "scale(1)", 200);
    }

    function updateCartUI() {
        cartItemsContainer.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart-msg">購物車目前是空的</p>';
        } else {
            cart.forEach((item, index) => {
                total += item.price * item.quantity;
                const itemEl = document.createElement('div');
                itemEl.classList.add('cart-item');
                itemEl.innerHTML = `
                    <div class="item-info">
                        <h4>${item.name} <span style="font-size:0.8em; color:#888;">(${item.shipping})</span></h4>
                        <p>NT$ ${item.price} x ${item.quantity}</p>
                    </div>
                    <button class="remove-btn" data-index="${index}">移除</button>
                `;
                cartItemsContainer.appendChild(itemEl);
            });

            // Bind remove buttons
            const removeBtns = document.querySelectorAll('.remove-btn');
            removeBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    removeFromCart(index);
                });
            });
        }

        // Coupon Logic in Cart
        const couponToggle = document.getElementById('coupon-toggle');
        const couponWarning = document.getElementById('coupon-warning');
        const cartCouponCount = document.getElementById('cart-coupon-count');
        const MIN_SPEND = 300;

        // Update Coupon Count Display
        if (cartCouponCount) cartCouponCount.innerText = globalCouponCount;

        // Visual Logic for Toggle
        if (couponToggle) {
            let isDisabled = false;

            // Condition 1: Minimum Spend
            if (total < MIN_SPEND) {
                isDisabled = true;
                couponWarning.style.display = 'block';
            } else {
                couponWarning.style.display = 'none';
            }

            // Condition 2: Must have coupons
            if (globalCouponCount <= 0) {
                isDisabled = true;
                // If disabled due to count, we might want a different message or just disable
            }

            couponToggle.disabled = isDisabled;

            // Auto-uncheck if disabled
            if (isDisabled && couponToggle.checked) {
                couponToggle.checked = false;
            }

            // Update Label Style (Optional visual cue)
            const label = document.querySelector('label[for="coupon-toggle"]');
            if (label) {
                label.style.opacity = isDisabled ? '0.5' : '1';
                label.style.cursor = isDisabled ? 'not-allowed' : 'pointer';
            }
        }

        let displayTotal = total;
        if (couponToggle && couponToggle.checked) {
            displayTotal = Math.max(0, total - 100);
        }

        cartTotalElement.innerText = `NT$ ${displayTotal}`;

        // Listener for toggle to update price immediately without re-rendering items
        // We need to attach this only once ideally, but here simplicity prevails.
        // To avoid multiple listeners, we can handle it via a named function or check existence.
        // A cleaner way in this structure is simply updating the text here based on state.
        if (couponToggle) {
            couponToggle.onchange = () => {
                let dTotal = total;
                if (couponToggle.checked) {
                    dTotal = Math.max(0, total - 100);
                }
                cartTotalElement.innerText = `NT$ ${dTotal}`;
            };
        }
    }

    function removeFromCart(index) {
        cart.splice(index, 1);
        updateCartUI();
        updateCartCount();
    }

    // Checkout
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('購物車是空的，無法結帳！');
            return;
        }

        // Recalculate basic total
        let total = 0;
        cart.forEach(item => total += item.price * item.quantity);

        const couponToggle = document.getElementById('coupon-toggle');
        let useCoupon = couponToggle && couponToggle.checked;
        let discount = 0;

        // Validation & Prompt
        if (useCoupon) {
            if (total >= 300 && globalCouponCount > 0) {
                discount = 100;
                globalCouponCount--;
                updateCouponUI();
            } else {
                // Should not happen if UI is consistent, but safety check
                alert("無法使用抵用券：金額不足或無券可用");
                return;
            }
        } else {
            // "Forgot Coupon?" Check
            if (total >= 300 && globalCouponCount > 0) {
                const wantToUse = confirm(`您達到低消且持有 ${globalCouponCount} 張抵用券，忘記使用了嗎？\n\n按「確定」立即折抵 NT$ 100\n按「取消」維持原價結帳`);
                if (wantToUse) {
                    discount = 100;
                    globalCouponCount--;
                    updateCouponUI();
                }
            }
        }

        const finalTotal = Math.max(0, total - discount);

        let msg = `結帳成功！\n\n小計: NT$ ${total}\n`;
        if (discount > 0) {
            msg += `折扣: NT$ ${discount} (抵用券)\n`;
        }
        msg += `實付金額: NT$ ${finalTotal}\n\n感謝您的購買！`;

        alert(msg);

        cart = [];
        updateCartUI();
        updateCartCount();
        cartModal.style.display = "none";
        // Reset toggle for next time
        if (couponToggle) couponToggle.checked = false;
    });

    // --- Farm Game Phase 1 Logic ---

    // Game State
    // Global Coupon State (Persists across game resets until page reload)
    // Coupon count now initialized at top with localStorage persistence

    function updateCouponUI() {
        const couponEl = document.getElementById('coupon-count');
        if (couponEl) {
            couponEl.textContent = globalCouponCount;
        }
    }

    const farmState = {
        day: 1,
        money: 1000,
        stamina: 3,
        progress: 0, // 0-100
        health: 100,
        water: 100, // New: Water Level
        inventory: {
            fertilizer: 0,
            pesticide: 0
        },
        isProtected: false,
        dailyFertilizerUse: 0, // NEW: Limit 5
        activeDisaster: null, // 'typhoon', 'pest', 'market'
        nextDisaster: null, // Forecast for tomorrow
        pendingEvents: []
    };

    // DOM Elements
    const farmDayEl = document.getElementById('farm-day');
    const farmMoneyEl = document.getElementById('farm-money');
    const farmStaminaEl = document.getElementById('farm-stamina');
    const farmProgressEl = document.getElementById('farm-progress');
    const farmWaterEl = document.getElementById('farm-water'); // New
    const farmSceneEl = document.getElementById('farm-scene');

    // Inventory Elements
    const invFertilizerEl = document.getElementById('inv-fertilizer');
    const invPesticideEl = document.getElementById('inv-pesticide');

    // Controls
    const actionBtn = document.getElementById('farm-action-btn');
    const forceHarvestBtn = document.getElementById('farm-force-harvest-btn'); // New
    const waterBtn = document.getElementById('farm-water-btn');
    const shopBtn = document.getElementById('farm-shop-btn');
    const endTurnBtn = document.getElementById('farm-end-btn');

    // Tutorial
    const tutorialBtn = document.getElementById('tutorial-btn');
    if (tutorialBtn) {
        tutorialBtn.addEventListener('click', () => {
            document.getElementById('tutorial-modal').style.display = 'flex';
        });
    }

    // Modals
    const situationModal = document.getElementById('situation-modal');
    const shopModal = document.getElementById('shop-modal');

    const situationImg = document.getElementById('situation-img');
    const situationDesc = document.getElementById('situation-desc');
    const situationConfirmBtn = document.getElementById('situation-confirm-btn');

    // 1. Update Visuals
    function updateFarmUI() {
        if (!farmDayEl) return; // Guard clause if elements not found

        // Stats
        farmDayEl.textContent = farmState.day;
        farmMoneyEl.textContent = farmState.money;
        farmStaminaEl.textContent = farmState.stamina;
        farmProgressEl.textContent = farmState.progress;
        if (farmWaterEl) farmWaterEl.textContent = farmState.water; // Update Water

        // Inventory
        if (invFertilizerEl) invFertilizerEl.textContent = farmState.inventory.fertilizer;
        if (invPesticideEl) invPesticideEl.textContent = farmState.inventory.pesticide;

        // Background Logic
        let bg = 'back1.png'; // Default / Empty
        if (farmState.progress > 0 && farmState.progress < 100) {
            bg = 'back2.png'; // Growing
        } else if (farmState.progress >= 100) {
            bg = 'back3.png'; // Harvest Ready
        }
        farmSceneEl.style.backgroundImage = `url('images/${bg}')`;

        // Button State
        actionBtn.disabled = farmState.stamina <= 0;
        if (farmState.progress >= 100) {
            actionBtn.textContent = "收穫 (+$1000)";
            actionBtn.classList.add('harvest-mode');
        } else {
            actionBtn.textContent = "播種/照料 (水-20% | ⚡-1)";
            actionBtn.classList.remove('harvest-mode');
        }

        if (waterBtn) waterBtn.disabled = farmState.water >= 100; // Disable if full
    }

    // 2. Action Handlers
    if (actionBtn) {
        actionBtn.addEventListener('click', () => {
            if (farmState.stamina > 0) {
                // Logic: Harvest or Grow
                if (farmState.progress >= 100) {
                    // Harvest
                    // Check for Market Boom
                    let reward = 1000;
                    if (farmState.activeDisaster === 'market') {
                        reward = 1500;
                        alert('市場行情大好！農產品價格飆升！');
                    }

                    farmState.money += reward; // New Reward
                    farmState.progress = 0; // Reset to back1
                    farmState.stamina--;
                    farmState.isProtected = false; // Reset protection
                    alert(`大豐收！獲得 $${reward}`);
                } else {
                    // Grow logic with Water
                    if (farmState.water >= 20) {
                        farmState.stamina--;
                        farmState.water -= 20; // Reduce Water
                        farmState.progress = Math.min(100, farmState.progress + 34);
                    } else {
                        alert('水分不足！請補充水分。');
                        return; // Exit
                    }
                }
                updateFarmUI();
            } else {
                alert('體力不足，請結束這一天！');
            }
        });
    }

    // Force Harvest Logic
    if (forceHarvestBtn) {
        forceHarvestBtn.addEventListener('click', () => {
            if (confirm('確定要強制收成嗎？收益將減半 ($500)，且生長進度歸零。')) {
                farmState.money += 500;
                farmState.progress = 0;
                farmState.stamina--;
                farmState.activeDisaster = null; // Clear disaster risk (field empty)
                alert('已強制收成！獲得 $500。');
                updateFarmUI();
                forceHarvestBtn.style.display = 'none'; // Hide after use
            }
        });
    }

    if (shopBtn) {
        shopBtn.addEventListener('click', () => {
            shopModal.style.display = 'flex';
        });
    }

    if (waterBtn) {
        waterBtn.addEventListener('click', () => {
            if (farmState.water >= 100) {
                alert('水分已滿，無需補水！');
                return;
            }
            if (farmState.money >= 500) {
                farmState.money -= 500;
                farmState.water = 100;
                alert('水分已補滿！');
                updateFarmUI();
            } else {
                alert('資金不足 ($500)！');
            }
        });
    }

    // Global Functions for HTML onclick
    window.closeShop = function () {
        shopModal.style.display = 'none';
    };

    window.buyItem = function (type, unitCost) {
        // Get quantity
        const qtyInput = document.getElementById(`qty-${type}`);
        let quantity = 1;
        if (qtyInput) {
            quantity = parseInt(qtyInput.value);
            if (isNaN(quantity) || quantity < 1) quantity = 1;
        }

        const totalCost = unitCost * quantity;

        if (farmState.money >= totalCost) {
            farmState.money -= totalCost;
            farmState.inventory[type] += quantity;
            alert(`購買成功！ ${quantity} 個 ${type === 'fertilizer' ? '肥料' : '除蟲劑'} (花費 $${totalCost})`);
            updateFarmUI();
        } else {
            alert(`資金不足！需要 $${totalCost}`);
        }
    };

    window.useItem = function (type) {
        if (farmState.inventory[type] > 0) {
            if (type === 'fertilizer') {
                if (farmState.dailyFertilizerUse >= 5) {
                    alert('今日肥料使用次數已達上限 (5次)！');
                    return;
                }
                farmState.progress = Math.min(100, farmState.progress + 5); // Nerf: +5
                farmState.dailyFertilizerUse++; // Inc Counter
                alert(`使用了肥料！作物生長加速 (+5)。今日已用: ${farmState.dailyFertilizerUse}/5`);
            } else if (type === 'pesticide') {
                farmState.isProtected = true;
                alert('使用了除蟲劑！作物獲得保護，可抵禦蟲害。');
            }
            farmState.inventory[type]--;
            updateFarmUI();
        } else {
            alert('物品不足！');
        }
    };


    if (endTurnBtn) {
        endTurnBtn.addEventListener('click', () => {
            // 1. Resolve Active Disaster (End of Day Damage)
            if (farmState.activeDisaster === 'pest') {
                if (!farmState.isProtected) {
                    farmState.progress = 0;
                    alert('蟲災來襲！您未及時使用除蟲劑，作物已被啃食殆盡 (進度歸零)！');
                } else {
                    alert('除蟲劑發揮了作用，作物安然無恙！');
                    farmState.isProtected = false; // Consume protection
                }
            } else if (farmState.activeDisaster === 'typhoon') {
                // If it was typhoon day and we are ending turn, check damage
                if (farmState.progress > 0) {
                    farmState.progress = 0;
                    alert('颱風過境！田地一片狼藉 (進度歸零)。');
                }
            }

            updateFarmUI();
            showSituation(); // Forecast Next
        });
    }

    // 3. Situation / Omen Logic (Forecast)
    function showSituation() {
        // Random 1-3
        const rand = Math.floor(Math.random() * 3) + 1;
        const imgName = `situation${rand}.png`;

        let desc = "未知的預兆...";
        let type = 'market';

        if (rand === 1) {
            desc = "氣象預報顯示，近期可能有強烈颱風接近...";
            type = 'typhoon';
        } else if (rand === 2) {
            desc = "在田間發現了蟲卵，似乎是蟲災的前兆...";
            type = 'pest';
        } else if (rand === 3) {
            desc = "市場消息指出，近期農產品價格將大幅波動...";
            type = 'market';
        }

        farmState.nextDisaster = type; // Store Forecast

        situationImg.src = `images/${imgName}`;
        situationDesc.textContent = desc;

        situationModal.style.display = 'flex'; // Use flex to center
    }

    if (situationConfirmBtn) {
        situationConfirmBtn.addEventListener('click', () => {
            situationModal.style.display = 'none';
            startNewDay();
        });
    }

    // 4. New Day Logic
    function startNewDay() {
        if (farmState.day >= 10) {
            endGame();
            return;
        }

        farmState.day++;
        farmState.stamina = 3;
        // Water does not reset (must refill manually)

        // Reset Logic
        farmState.dailyFertilizerUse = 0;

        // Disaster Transition
        farmState.activeDisaster = farmState.nextDisaster;
        farmState.nextDisaster = null;

        updateFarmUI();

        // UI Handling for Disasters
        if (forceHarvestBtn) forceHarvestBtn.style.display = 'none'; // Default Hide

        if (farmState.activeDisaster === 'typhoon') {
            alert('注意！颱風警報生效中！您可以選擇「強制收成」以減少損失。');
            if (forceHarvestBtn) forceHarvestBtn.style.display = 'inline-block';
        } else if (farmState.activeDisaster === 'pest') {
            alert('注意！蟲災爆發！請務必使用除蟲劑！');
        }

        alert(`第 ${farmState.day} 天開始了！`);
    }

    function endGame() {
        const modal = document.getElementById('game-end-modal');
        const scoreEl = document.getElementById('end-score');
        const rankEl = document.getElementById('end-rank');
        const commentEl = document.getElementById('end-comment');

        const finalMoney = farmState.money;
        scoreEl.textContent = `$${finalMoney}`;

        let rank = 'C';
        let comment = '再接再厲...';

        if (finalMoney >= 5000) {
            rank = 'S';
            comment = '傳說級農夫！太神啦！🏆';
        } else if (finalMoney >= 3000) {
            rank = 'A';
            comment = '專業農夫！收益驚人！🥇';
        } else if (finalMoney >= 1500) {
            rank = 'B';
            comment = '合格農夫，表現不錯！🥈';
        }

        rankEl.textContent = rank;
        commentEl.textContent = comment;

        // Color coding
        if (rank === 'S') rankEl.style.color = '#E91E63';
        else if (rank === 'A') rankEl.style.color = '#FF9800';
        else if (rank === 'B') rankEl.style.color = '#2196F3';
        else rankEl.style.color = '#9E9E9E';

        // Award Coupon
        globalCouponCount++;
        localStorage.setItem('globalCouponCount', globalCouponCount); // Save persistence
        updateCouponUI();

        // Show Message on UI instead of Alert
        const giftMsgEl = document.getElementById('end-gift-msg');
        if (giftMsgEl) giftMsgEl.textContent = '感謝你的遊玩贈與你100元抵用卷一張';

        modal.style.display = 'flex';
    }


    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            resetGame();
        });
    }

    const endCloseBtn = document.getElementById('end-close-btn');
    if (endCloseBtn) {
        endCloseBtn.addEventListener('click', () => {
            document.getElementById('game-end-modal').style.display = 'none';
        });
    }

    function resetGame() {
        // Reset State
        farmState.day = 1;
        farmState.money = 1000;
        farmState.stamina = 3;
        farmState.progress = 0;
        farmState.water = 100;
        farmState.inventory.fertilizer = 0;
        farmState.inventory.pesticide = 0;
        farmState.isProtected = false;
        farmState.dailyFertilizerUse = 0;
        farmState.activeDisaster = null;
        farmState.nextDisaster = null;

        // Reset UI
        document.getElementById('game-end-modal').style.display = 'none';

        // Reset Scene
        updateFarmUI();
        alert('新的挑戰開始了！ (第 1 天)');
    }

    // Init
    updateFarmUI();
    updateCouponUI(); // Init Coupon UI

    // --- Admin Panel Logic ---
    const addProductForm = document.getElementById('add-product-form');
    const adminProductList = document.getElementById('admin-product-list');
    const adminNavBtn = document.querySelector('[data-target="admin"]');

    if (adminNavBtn) {
        adminNavBtn.addEventListener('click', () => {
            renderAdminProductList();
        });
    }

    function renderAdminProductList() {
        // We need to re-query cards every time as they might change
        const cards = document.querySelectorAll('.product-card');
        if (!adminProductList) return;

        adminProductList.innerHTML = '';

        if (cards.length === 0) {
            adminProductList.innerHTML = '<p class="empty-msg">目前沒有商品</p>';
            return;
        }

        cards.forEach((card, index) => {
            const name = card.querySelector('h3') ? card.querySelector('h3').innerText : 'Unknown';
            const img = card.querySelector('img');
            const imgSrc = img ? img.src : '';

            const item = document.createElement('div');
            item.classList.add('admin-list-item');

            item.innerHTML = `
                <div class="admin-item-info">
                    <img src="${imgSrc}" alt="${name}">
                    <span>${name}</span>
                </div>
                <button class="admin-remove-btn" data-index="${index}">下架</button>
            `;
            adminProductList.appendChild(item);
        });

        // Attach event listeners
        document.querySelectorAll('.admin-remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index);
                removeProduct(idx);
            });
        });
    }

    function removeProduct(index) {
        const cards = document.querySelectorAll('.product-card');
        if (cards[index]) {
            if (confirm('確定要下架此商品嗎？')) {
                cards[index].remove();
                renderAdminProductList(); // Refresh list
                alert('商品已下架');
            }
        }
    }

    // Add Product Form Logic
    if (addProductForm) {
        addProductForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('new-prod-name').value;
            const imgInput = document.getElementById('new-prod-img');
            const price = document.getElementById('new-prod-price').value;
            const cat = document.getElementById('new-prod-cat').value;

            // Basic validation
            if (!name || imgInput.files.length === 0 || !price) {
                alert('請填寫完整資訊並上傳圖片');
                return;
            }

            const file = imgInput.files[0];
            const reader = new FileReader();

            reader.onload = function (e) {
                const imgUrl = e.target.result; // Base64 string
                addProductToDOM(name, imgUrl, price, cat);

                // Reset form
                addProductForm.reset();
                alert('上架成功！');

                // If we serve the list immediately
                renderAdminProductList();
            };

            reader.readAsDataURL(file);
        });
    }

    function addProductToDOM(name, imgUrl, price, category) {
        const productGrid = document.querySelector('.product-grid');
        if (!productGrid) return;

        const newCard = document.createElement('div');
        newCard.classList.add('product-card');
        newCard.setAttribute('data-category', category);

        const html = `
            <div class="card-img">
                <img src="${imgUrl}" alt="${name}" onerror="this.src='https://via.placeholder.com/200?text=No+Image'">
                <span class="tag" style="background:var(--secondary-color)">新品</span>
            </div>
            <div class="card-info">
                <h3>${name}</h3>
                <p class="price">NT$ ${price}</p>
                <button class="add-cart-btn">加入購物車</button>
            </div>
        `;

        newCard.innerHTML = html;
        productGrid.appendChild(newCard);
    }

}); // End DOMContentLoaded
