(function() {
    function $(sel) { return document.querySelector(sel); }

    function initHeader() {
        const headerRight = document.getElementById('headerRight');
        if (!headerRight) return;


        headerRight.innerHTML = '';

        let user = null;
        try { user = JSON.parse(localStorage.getItem('redseam_user')); } catch (e) { user = null; }

        // Only show cart button when user is logged in. Cart is tied to registered users.
        if (user && user.username) {
            // create cart button
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
        }

        if (user && user.username) {
            // show avatar when available; otherwise show an upload button so user can add one
            const avatarContainer = document.createElement('div');
            avatarContainer.className = 'd-flex align-items-center';

            // hidden file input for avatar uploads (re-created each render so listeners/refs stay local)
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.style.display = 'none';
            fileInput.id = 'avatarUploadInput';

            fileInput.addEventListener('change', function (e) {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                if (!file.type || !file.type.startsWith('image/')) {
                    alert('Please select an image file.');
                    return;
                }
                const maxSize = 500 * 1024; // 500KB soft limit
                if (file.size > maxSize) {
                    if (!confirm('Selected image is larger than 500KB and may not be saved. Continue?')) return;
                }
                const reader = new FileReader();
                reader.onload = function (ev) {
                    try {
                        const dataUrl = ev.target.result;
                        user.avatar = dataUrl;
                        localStorage.setItem('redseam_user', JSON.stringify(user));
                        // re-render header to show new avatar
                        initHeader();
                    } catch (err) {
                        console.error('Failed to save avatar:', err);
                    }
                };
                reader.readAsDataURL(file);
            });

            if (user.avatar) {
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
                avatarImg.src = user.avatar;
                avatarImg.title = user.username || '';

                // clicking avatar opens file picker to change avatar
                avatarImg.style.cursor = 'pointer';
                avatarImg.addEventListener('click', function (e) {
                    e.preventDefault();
                    fileInput.click();
                });

                avatarLink.appendChild(avatarImg);
                avatarContainer.appendChild(avatarLink);
            } else {
                // show upload icon/button when no avatar set (icon-only, circular)
                const uploadBtn = document.createElement('button');
                uploadBtn.type = 'button';
                uploadBtn.className = 'btn btn-light p-0 d-flex align-items-center justify-content-center';
                uploadBtn.setAttribute('aria-label', 'Upload avatar');
                // size and shape
                uploadBtn.style.width = '40px';
                uploadBtn.style.height = '40px';
                uploadBtn.style.borderRadius = '50%';
                uploadBtn.style.overflow = 'hidden';
                uploadBtn.style.border = '1px solid transparent';
                uploadBtn.style.padding = '0';

                const camImg = document.createElement('img');
                camImg.src = 'assets/img/camera.png';
                camImg.alt = 'Upload avatar';
                // smaller icon centered inside circle
                camImg.style.width = '20px';
                camImg.style.height = '20px';
                camImg.style.objectFit = 'contain';

                uploadBtn.appendChild(camImg);

                uploadBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    fileInput.click();
                });

                avatarContainer.appendChild(uploadBtn);
            }

            avatarContainer.appendChild(fileInput);
            headerRight.appendChild(avatarContainer);
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
