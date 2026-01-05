// ==========================================
// Side Drawer & Theme Logic (script-extra.js)
// ==========================================
const menuBtn = document.getElementById('menu-btn');
const themeOpenBtn = document.getElementById('theme-open-btn'); // New Button
const sideDrawer = document.getElementById('side-drawer');
const closeDrawerBtn = document.getElementById('close-drawer-btn');
const drawerOverlay = document.getElementById('drawer-overlay');

function openDrawer() {
    if (sideDrawer) sideDrawer.style.left = '0';
    if (drawerOverlay) drawerOverlay.style.display = 'block';
}

function closeDrawer() {
    if (sideDrawer) sideDrawer.style.left = '-280px';
    if (drawerOverlay) drawerOverlay.style.display = 'none';
}

if (menuBtn) menuBtn.addEventListener('click', openDrawer);
if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);
if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

// New Theme Modal Logic
if (themeOpenBtn) {
    themeOpenBtn.addEventListener('click', () => {
        document.getElementById('theme-modal').style.display = 'block';
    });
}
// Ensure closing theme modal works by clicking outside (optional, but good UX)
const themeModal = document.getElementById('theme-modal');
if (themeModal) {
    window.addEventListener('click', (e) => {
        if (e.target == themeModal) {
            themeModal.style.display = 'none';
        }
    });
}

// Close drawer when a link is clicked
const drawerItems = document.querySelectorAll('.drawer-item');

drawerItems.forEach(item => {
    item.addEventListener('click', (e) => {
        const target = item.dataset.target;

        // Handle Tutorial Button separately
        if (item.id === 'drawer-tutorial-btn') {
            const tutorialModal = document.getElementById('tutorial-modal');
            if (tutorialModal) tutorialModal.style.display = 'block';
            closeDrawer();
            return;
        }

        // Handle Login Button
        if (item.id === 'drawer-login-btn') {
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            if (isLoggedIn) {
                // Logout Logic
                if (confirm("確定要登出管理員帳號嗎？")) {
                    localStorage.removeItem('isLoggedIn');
                    localStorage.removeItem('username');
                    updateLoginState();
                    alert("已登出");
                }
            } else {
                // Open Login Modal
                document.getElementById('login-modal').style.display = 'block';
            }
            closeDrawer();
            return;
        }

        if (item.classList.contains('theme-option')) {
            return;
        }

        if (target && window.navigateTo) {
            e.preventDefault();
            window.navigateTo(target);
            closeDrawer();
        }
    });
});

// Login Form Logic
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.onsubmit = (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value; // Get password

        // Simple Auth Check
        if (username === 'admin' && password === '1234') {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', username);
            updateLoginState();
            document.getElementById('login-modal').style.display = 'none';
            alert(`管理員 ${username} 登入成功！`);
        } else {
            alert('帳號或密碼錯誤！\n(預設帳號: admin / 密碼: 1234)');
        }
    };
}

function updateLoginState() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const username = localStorage.getItem('username');
    const loginText = document.getElementById('drawer-login-text');
    const userIcon = document.querySelector('.user-icon');

    // Toggle Admin Mode Class
    if (isLoggedIn) {
        document.body.classList.add('is-admin');
    } else {
        document.body.classList.remove('is-admin');
    }

    if (loginText) {
        loginText.innerText = isLoggedIn ? `登出(${username})` : '管理者登入';
        loginText.style.color = isLoggedIn ? '#d32f2f' : '#333';
        loginText.style.fontWeight = isLoggedIn ? 'bold' : 'normal';
    }

    if (userIcon) {
        if (isLoggedIn) {
            userIcon.title = username;
            userIcon.style.color = '#4CAF50';
        } else {
            userIcon.removeAttribute('title');
            userIcon.style.color = '';
        }
    }
}

// Weather Theme Function (Made global via window just in case, though not strictly needed in browser)
window.setWeatherTheme = function (weather) {
    let bgImage = '';
    const body = document.body;

    // Set default standard background properties
    body.style.backgroundSize = "cover";
    body.style.backgroundPosition = "center";
    body.style.backgroundAttachment = "fixed";
    body.style.backgroundRepeat = "no-repeat";

    switch (weather) {
        case 'spring':
            bgImage = 'url("images/theme_spring.png")';
            break;
        case 'summer':
            bgImage = 'url("images/theme_summer.png")';
            break;
        case 'autumn':
            bgImage = 'url("images/theme_autumn.png")';
            break;
        case 'winter':
            bgImage = 'url("images/theme_winter.png")';
            break;
        case 'sunny':
            bgImage = 'url("images/theme_sunny.png")';
            break;
        case 'rainy':
            bgImage = 'url("images/theme_rainy.png")';
            break;
        case 'cloudy':
            bgImage = 'url("images/theme_cloudy.png")';
            break;
        case 'snow':
            bgImage = 'url("images/theme_winter.png")';
            break;
        case 'night':
            bgImage = 'url("images/theme_night.png")';
            break;
        default:
            bgImage = '';
    }

    body.style.backgroundImage = bgImage;

    // Optional: Save preference to localStorage
    localStorage.setItem('farmTheme', weather);

    // Update UI Active State
    document.querySelectorAll('.theme-option').forEach(opt => {
        opt.classList.remove('active');
        opt.style.border = 'none'; // Reset border
        opt.style.transform = 'scale(1)'; // Reset scale

        if (opt.dataset.weather === weather) {
            opt.classList.add('active');
            opt.style.border = '3px solid white'; // Visual cue
            opt.style.transform = 'scale(1.05)'; // Visual cue
            opt.style.boxShadow = '0 0 15px rgba(255,255,255,0.5)';
        }
    });

    // Close drawer after selection for better UX (Legacy)
    if (typeof closeDrawer === 'function') {
        closeDrawer();
    }
    // Close Theme Modal (New)
    const tm = document.getElementById('theme-modal');
    if (tm) tm.style.display = 'none';
};

// Load saved theme and login state on startup
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('farmTheme');
    if (savedTheme) {
        window.setWeatherTheme(savedTheme);
    }
    updateLoginState();
});
