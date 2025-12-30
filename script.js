document.addEventListener('DOMContentLoaded', () => {

    // Navigation Logic
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.page-section');

    function navigateTo(targetId) {
        // Remove active class from buttons
        navBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.target === targetId) {
                btn.classList.add('active');
            }
        });

        // Hide all sections and show target
        sections.forEach(section => {
            section.classList.remove('active');
            if (section.id === targetId) {
                section.classList.add('active');
            }
        });

        // Scroll to top
        window.scrollTo(0, 0);
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
    const productCards = document.querySelectorAll('.product-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            productCards.forEach(card => {
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
    const addToCartBtns = document.querySelectorAll('.add-cart-btn');

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

    // Open Purchase Modal
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            const imgSrc = card.querySelector('img').src;
            const name = card.querySelector('h3').innerText;
            const priceText = card.querySelector('.price').innerText;
            const price = parseInt(priceText.replace(/[^\d]/g, ''));

            // Populate Modal
            purchaseImg.src = imgSrc;
            purchaseTitle.innerText = name;
            purchasePrice.innerText = priceText;
            qtyVal.innerText = '1'; // Reset quantity
            shippingMethod.value = 'delivery'; // Reset shipping

            currentProduct = { name, price, imgSrc };
            purchaseModal.style.display = "block";
        });
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

        cartTotalElement.innerText = `NT$ ${total}`;
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
        } else {
            alert(`結帳成功！總金額為 NT$ ${cartTotalElement.innerText.replace('NT$ ', '')}。\n感謝您的購買！`);
            cart = [];
            updateCartUI();
            updateCartCount();
            cartModal.style.display = "none";
        }
    });

    // --- Simple Farm Game Interaction ---
    const plots = document.querySelectorAll('.plot');
    plots.forEach(plot => {
        plot.addEventListener('click', () => {
            if (plot.innerHTML === '🌱') {
                plot.innerHTML = '🌿'; // Grow
            } else if (plot.innerHTML === '🌿') {
                plot.innerHTML = '🍎'; // Fruit
            } else if (plot.innerHTML === '🍎') {
                plot.innerHTML = '🌱'; // Reset
                alert('收成成功！獲得 10 點積分！');
            }
        });
    });

});
