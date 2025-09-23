(function() {
    function $(sel) { return document.querySelector(sel); }

    function initHeader() {
        const headerRight = document.getElementById('headerRight');
        if (!headerRight) return;


        headerRight.innerHTML = '';

        let user = null;
        try { user = JSON.parse(localStorage.getItem('redseam_user')); } catch (e) { user = null; }

        if (user && user.username) {
            // show cart icon
            // cart button (will be handled by assets/js/cart.js)
            const cartBtn = document.createElement('button');
            cartBtn.id = 'cartButton';
            cartBtn.className = 'btn btn-link text-decoration-none me-3 p-0 d-flex align-items-center';
            cartBtn.setAttribute('aria-label', 'Open shopping cart');

            const cartImg = document.createElement('img');
            cartImg.src = 'assets/img/cart.png';
            cartImg.alt = 'Cart';
            cartImg.style.width = '24px';
            cartImg.style.height = '24px';
            cartImg.className = 'cart-icon';

            const badge = document.createElement('span');
            badge.id = 'cartCount';
            badge.className = 'badge ms-2';
            badge.textContent = '0';

            cartBtn.appendChild(cartImg);
            cartBtn.appendChild(badge);
            headerRight.appendChild(cartBtn);

            // show avatar
            const avatarLink = document.createElement('a');
            avatarLink.href = '#';
            avatarLink.className = 'd-flex align-items-center text-decoration-none';

            const avatarImg = document.createElement('img');
            avatarImg.alt = 'User avatar';
            avatarImg.style.width = '40px';
            avatarImg.style.height = '40px';
            avatarImg.style.borderRadius = '50%';
            avatarImg.style.objectFit = 'cover';
            avatarImg.className = 'me-2';

            // use provided avatar data/url or fallback to default image
            if (user.avatar) {
                avatarImg.src = user.avatar;
            } else {
                
                const defaults = ['assets/img/guy.jpg','assets/img/jersey1.png','assets/img/image.png'];
                avatarImg.src = defaults.find(p => {

                    return true;
                }) || 'assets/img/Union.png';
            }


            avatarImg.title = user.username || '';
            avatarLink.appendChild(avatarImg);
            headerRight.appendChild(avatarLink);
        } else {

                const loginLink = document.createElement('a');
                loginLink.href = 'login.html';
                loginLink.className = 'text-dark text-decoration-none d-flex align-items-center';
                const unionImg = document.createElement('img');
                unionImg.src = 'assets/img/Union.png';
                unionImg.alt = 'User';
                unionImg.className = 'me-2 px-1';
                loginLink.appendChild(unionImg);
                const span = document.createElement('span');
                span.className = 'fw-semibold fs-6';
                span.textContent = 'Log in';
                loginLink.appendChild(span);
                headerRight.appendChild(loginLink);
        }
    }


    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHeader);
    } else {
        initHeader();
    }
})();
