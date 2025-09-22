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
            const cartLink = document.createElement('a');
            cartLink.href = '#';
            cartLink.className = 'me-3';
            const cartImg = document.createElement('img');
            cartImg.src = 'assets/img/cart.png';
            cartImg.alt = 'Cart';
            cartImg.style.width = '24px';
            cartImg.style.height = '24px';
            cartLink.appendChild(cartImg);
            headerRight.appendChild(cartLink);

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
