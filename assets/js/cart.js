/* Off-canvas cart panel behavior */
(function() {
    function qs(sel) { return document.querySelector(sel); }

    function getCart() {
        try {
            const raw = localStorage.getItem('redseam_cart');
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function setCart(items) {
        localStorage.setItem('redseam_cart', JSON.stringify(items));
        renderCartCount();
    }

    function renderCartCount() {
        const countEl = qs('#cartCount');
        if (!countEl) return;
        const items = getCart();
        const total = items.reduce((s, it) => s + (it.quantity || 0), 0) || items.length || 0;
        countEl.textContent = total;
    }

    function createPanel() {
        if (qs('#cartPanel')) return;

        const overlay = document.createElement('div');
        overlay.id = 'cartOverlay';
        overlay.className = 'cart-overlay';

        const panel = document.createElement('aside');
        panel.id = 'cartPanel';
        panel.className = 'cart-panel';

        panel.innerHTML = `
            <div class="cart-header">
                <h3>Shopping cart (<span id="cartTotal">0</span>)</h3>
                <button class="close-btn" aria-label="Close cart">&times;</button>
            </div>
            <div class="cart-body" id="cartBody">
                <div class="empty-state">
                    <img src="assets/img/cartRed.png" alt="Empty cart" class="empty-img">
                    <p>Ooops! You’ve got nothing in your cart just yet…</p>
                    <button class="start-shopping">Start shopping</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(panel);

        // event listeners
        overlay.addEventListener('click', closePanel);
        panel.querySelector('.close-btn').addEventListener('click', closePanel);
        panel.querySelector('.start-shopping').addEventListener('click', closePanel);
    }

    function openPanel() {
        createPanel();
        document.body.classList.add('cart-open');
        const panel = qs('#cartPanel');
        const overlay = qs('#cartOverlay');
        if (panel) panel.classList.add('visible');
        if (overlay) overlay.classList.add('visible');
        renderCart();
    }

    function closePanel() {
        const panel = qs('#cartPanel');
        const overlay = qs('#cartOverlay');
        if (panel) panel.classList.remove('visible');
        if (overlay) overlay.classList.remove('visible');
        document.body.classList.remove('cart-open');
    }

    function renderCart() {
        const items = getCart();
        const body = qs('#cartBody');
        const totalEl = qs('#cartTotal');
        if (!body) return;

        if (!items || items.length === 0) {
            body.innerHTML = `
                <div class="empty-state">
                    <img src="assets/img/cartRed.png" alt="Empty cart" class="empty-img">
                    <p>Ooops! You’ve got nothing in your cart just yet…</p>
                    <button class="start-shopping">Start shopping</button>
                </div>
            `;
            if (totalEl) totalEl.textContent = '0';
        } else {
            // render list
            const lines = items.map((it, idx) => `
                <div class="cart-item" data-idx="${idx}">
                    <img src="${it.image || 'assets/img/jersey1.png'}" alt="${it.product}" class="item-img">
                    <div class="item-meta">
                        <div class="item-title">${it.product}</div>
                        <div class="item-opts">${it.color || ''} • ${it.size || ''}</div>
                        <div class="item-qty">Qty: ${it.quantity || 1}</div>
                    </div>
                    <div class="item-price">${it.price || ''}</div>
                </div>
            `).join('');

            body.innerHTML = `<div class="items-list">${lines}</div>`;
            if (totalEl) totalEl.textContent = items.reduce((s, it) => s + (it.quantity || 0), 0);

            // attach click handlers for potential future actions
        }

        // rebind start shopping button if present
        const startBtn = qs('.start-shopping');
        if (startBtn) startBtn.addEventListener('click', closePanel);
    }

    // attach button
    document.addEventListener('DOMContentLoaded', function() {
        const cartButton = qs('#cartButton');
        if (cartButton) {
            cartButton.addEventListener('click', function(e) {
                e.preventDefault();
                openPanel();
            });
        }

        // initial render
        renderCartCount();
    });

    // expose for debugging
    window._redseam_cart = {
        getCart, setCart, openPanel, closePanel, renderCart
    };

})();
