/* Off-canvas cart panel behavior */
(function() {
    function qs(sel) { return document.querySelector(sel); }
    const API_BASE = 'https://api.redseam.redberryinternship.ge/api';

    function escapeHtml(s) {
        if (s === null || s === undefined) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

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
            <div class="cart-summary p-3 border-top bg-white" id="cartSummary" style="display:none">
                <div class="d-flex justify-content-between mb-2"><div>Items subtotal</div><div id="cartSubtotal">$0</div></div>
                <div class="d-flex justify-content-between mb-2"><div>Delivery</div><div id="cartDelivery">$0</div></div>
                <div class="d-flex justify-content-between fw-bold mb-3"><div>Total</div><div id="cartTotalPrice">$0</div></div>
                <button id="goToCheckout" class="btn w-100" style="background-color:#FF4000;color:#fff">Go to checkout</button>
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
        console.debug('Opening cart, current items=', getCart());
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
            const summary = qs('#cartSummary'); if (summary) summary.style.display = 'none';
        } else {
            // render list with detailed rows. We will try to enrich each item with latest product data
            const listContainer = document.createElement('div');
            listContainer.className = 'items-list';

            // helper to render a single row (when product data known)
            const renderRow = (it, idx, prodData) => `
                <div class="cart-item d-flex align-items-center justify-content-between mb-3" data-idx="${idx}">
                    <div class="d-flex align-items-center">
                        <img src="${escapeHtml((prodData && prodData.image) || it.image || 'assets/img/jersey1.png')}" alt="${escapeHtml(it.product || (prodData && prodData.name) || '')}" class="item-img" style="width:64px;height:64px;object-fit:cover;border-radius:8px">
                        <div class="item-meta ms-3">
                            <div class="item-title">${escapeHtml(it.product || (prodData && prodData.name) || '')}</div>
                            <div class="item-opts text-muted small">${escapeHtml(it.color || '')} • ${escapeHtml(it.size || '')}</div>
                            <div class="d-flex align-items-center mt-2">
                                <button class="qty-decrease btn btn-sm btn-light">-</button>
                                <input class="qty-input form-control form-control-sm mx-2" type="number" value="${escapeHtml(String(it.quantity || 1))}" style="width:56px">
                                <button class="qty-increase btn btn-sm btn-light">+</button>
                                <a href="#" class="ms-3 remove-item text-danger">Remove</a>
                            </div>
                        </div>
                    </div>
                    <div class="item-price fw-semibold">${escapeHtml(it.price ? ('$ ' + it.price) : (prodData && prodData.price ? ('$ ' + prodData.price) : ''))}</div>
                </div>
            `;

            // synchronous placeholder rendering, we'll enrich lines after fetching product data
            items.forEach((it, idx) => {
                const wrapper = document.createElement('div');
                wrapper.innerHTML = renderRow(it, idx, null);
                listContainer.appendChild(wrapper.firstElementChild);
            });

            body.innerHTML = '';
            body.appendChild(listContainer);

            if (totalEl) totalEl.textContent = items.reduce((s, it) => s + (it.quantity || 0), 0);

            // show summary
            const summary = qs('#cartSummary'); if (summary) summary.style.display = '';

            // function to recalc totals
            const recalcTotals = (itemsList) => {
                const subtotal = itemsList.reduce((s, it) => s + ((Number(it.price) || 0) * (Number(it.quantity) || 1)), 0);
                const delivery = subtotal > 0 ? 5 : 0; // simple flat delivery
                const total = subtotal + delivery;
                qs('#cartSubtotal').textContent = `$ ${subtotal}`;
                qs('#cartDelivery').textContent = `$ ${delivery}`;
                qs('#cartTotalPrice').textContent = `$ ${total}`;
            };

            // enrich each item by fetching product details from the API endpoint
            items.forEach((it, idx) => {
                // prefer cart-specific endpoint then fallback to /products/{id}
                const productId = it.id || it.product_id || it.productId || it.sku || it.code || it.id;
                const endpoint = `${API_BASE}/cart/products/${encodeURIComponent(productId)}`;
                fetch(endpoint).then(r => { if (!r.ok) throw new Error('api ' + r.status); return r.json(); })
                    .then(data => {
                        const pd = data?.data ?? data;
                        // update UI row
                        const row = body.querySelector(`.cart-item[data-idx="${idx}"]`);
                        if (row) {
                            const img = row.querySelector('.item-img');
                            const title = row.querySelector('.item-title');
                            const priceEl = row.querySelector('.item-price');
                            if (img && (pd.image || pd.image_url || pd.photo)) img.src = pd.image || pd.image_url || pd.photo;
                            if (title && (pd.name || pd.title)) title.textContent = pd.name || pd.title;
                            if (priceEl && (pd.price || pd.unit_price)) priceEl.textContent = `$ ${pd.price ?? pd.unit_price}`;
                        }
                        // store fetched price back to items array for accurate total
                        if (pd.price || pd.unit_price) { items[idx].price = pd.price ?? pd.unit_price; }
                        setCart(items);
                        recalcTotals(items);
                    })
                    .catch(err => {
                        // fallback: try products endpoint
                        const fallback = `${API_BASE}/products/${encodeURIComponent(productId)}`;
                        fetch(fallback).then(r => { if (!r.ok) throw new Error('api ' + r.status); return r.json(); })
                            .then(data2 => {
                                const pd2 = data2?.data ?? data2;
                                const row = body.querySelector(`.cart-item[data-idx="${idx}"]`);
                                if (row) {
                                    const img = row.querySelector('.item-img');
                                    const title = row.querySelector('.item-title');
                                    const priceEl = row.querySelector('.item-price');
                                    if (img && (pd2.image || pd2.image_url || pd2.photo)) img.src = pd2.image || pd2.image_url || pd2.photo;
                                    if (title && (pd2.name || pd2.title)) title.textContent = pd2.name || pd2.title;
                                    if (priceEl && (pd2.price || pd2.unit_price)) priceEl.textContent = `$ ${pd2.price ?? pd2.unit_price}`;
                                }
                                if (pd2.price || pd2.unit_price) { items[idx].price = pd2.price ?? pd2.unit_price; }
                                setCart(items);
                                recalcTotals(items);
                            })
                            .catch(() => {
                                // ignore
                            });
                    });
            });

            // wire quantity change and remove handlers
            body.querySelectorAll('.cart-item').forEach(row => {
                const idx = Number(row.getAttribute('data-idx'));
                const dec = row.querySelector('.qty-decrease');
                const inc = row.querySelector('.qty-increase');
                const input = row.querySelector('.qty-input');
                const remove = row.querySelector('.remove-item');

                function updateQty(newQty) {
                    newQty = Math.max(1, Number(newQty) || 1);
                    items[idx].quantity = newQty;
                    input.value = newQty;
                    setCart(items);
                    recalcTotals(items);
                    if (totalEl) totalEl.textContent = items.reduce((s, it) => s + (it.quantity || 0), 0);
                }

                if (dec) dec.addEventListener('click', () => updateQty((Number(input.value) || 1) - 1));
                if (inc) inc.addEventListener('click', () => updateQty((Number(input.value) || 1) + 1));
                if (input) input.addEventListener('change', () => updateQty(input.value));
                if (remove) remove.addEventListener('click', (e) => { e.preventDefault(); items.splice(idx, 1); setCart(items); renderCart(); });
            });

            // checkout button
            const cta = qs('#goToCheckout');
            if (cta) cta.addEventListener('click', () => {
                // navigate to a checkout page (placeholder)
                window.location.href = 'checkout.html';
            });
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
