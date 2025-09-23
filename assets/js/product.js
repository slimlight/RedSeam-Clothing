document.addEventListener('DOMContentLoaded', function() {
    const API_BASE = 'https://api.redseam.redberryinternship.ge/api';
    const root = document.getElementById('productRoot');
    const loading = document.getElementById('loading');

    function getIdFromQuery() {
        const q = new URLSearchParams(window.location.search);
        return q.get('id');
    }

    function escapeHtml(s) {
        if (s === null || s === undefined) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function renderError(msg) {
        root.innerHTML = `<div class="text-center text-danger py-5">${escapeHtml(msg)}</div>`;
    }

    function renderProduct(p) {
        const title = p.name || p.title || 'Untitled product';
        const price = (p.price !== undefined && p.price !== null) ? `$ ${p.price}` : '';

        // choose images array or single image
        const images = Array.isArray(p.images) && p.images.length ? p.images : (p.image ? [p.image] : (p.image_url ? [p.image_url] : []));

        const thumbnailsHtml = (images.length ? images : ['assets/img/jersey1.png']).map((src, i) => {
            const cls = i === 0 ? 'thumbnail-img border border-2 rounded active' : 'thumbnail-img border border-2 rounded';
            return `<img src="${escapeHtml(src)}" class="img-fluid ${cls}" data-main="${escapeHtml(src)}">`;
        }).join('\n');

        const mainImage = images[0] || 'assets/img/jersey1.png';

        const html = `
        <div class="row">
            <div class="col-lg-6">
                <div class="row">
                    <div class="col-2">
                        <div class="d-flex flex-column gap-3">${thumbnailsHtml}</div>
                    </div>
                    <div class="col-10">
                        <img id="mainImage" src="${escapeHtml(mainImage)}" class="main-image rounded" alt="${escapeHtml(title)}">
                    </div>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="ps-lg-4">
                    <h1 class="fs-4 fw-bold mb-3">${escapeHtml(title)}</h1>
                    <h2 class="fs-4 fw-bold mb-4">${escapeHtml(price)}</h2>

                    <div class="mb-4">
                        <label class="form-label fw-medium text-muted small mb-2">Color: ${escapeHtml(p.color || p.colour || '')}</label>
                        <div class="d-flex gap-2">
                            <!-- colors rendered from API if available -->
                            ${(Array.isArray(p.colors) ? p.colors.map(c => `<div class="color-option" style="background-color:${escapeHtml(c.hex||c)}" data-color="${escapeHtml(c.name||c)}"></div>`).join('') : '')}
                        </div>
                    </div>

                    <div class="mb-4">
                        <label class="form-label fw-medium text-muted small mb-2">Size: ${escapeHtml((p.size || p.sizes || [])[0] || p.size || '')}</label>
                        <div class="d-flex gap-2">
                            ${(Array.isArray(p.sizes) ? p.sizes.map(s => `<div class="size-option border rounded px-3 py-2 text-center" data-size="${escapeHtml(s)}">${escapeHtml(s)}</div>`).join('') : '<div class="size-option border rounded px-3 py-2 text-center">S</div><div class="size-option border rounded px-3 py-2 text-center active">M</div>')}
                        </div>
                    </div>

                    <div class="mb-4">
                        <label class="form-label fw-medium text-muted small mb-2">Quantity</label>
                        <select class="form-select w-auto" id="quantity">
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3" selected>3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                        </select>
                    </div>

                    <button class="btn text-white fw-light mb-4 w-100 py-3 d-flex align-items-center justify-content-center" style="background-color: #FF4000;" id="addToCartBtn">
                       <img src="assets/img/cart2.png" alt="cart" class="me-2">Add to cart
                    </button>

                    <div class="border-bottom border-light-subtle mb-4"></div>

                    <div class="p-3">
                        <h3 class="fs-6 fw-semibold mb-3 d-flex align-items-center justify-content-between">Details
                           <img src="assets/img/tommy.png" alt="brand" width="109" height="61">
                        </h3>
                        <div>
                            <p class="mb-2 text-muted">Brand: ${escapeHtml(p.brand || '')}</p>
                            <p class="text-muted mb-0 small">${escapeHtml(p.description || p.details || '')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
        root.innerHTML = html;

        // wire thumbnails
        const thumbnails = root.querySelectorAll('.thumbnail-img');
        const mainImg = root.querySelector('#mainImage');
        thumbnails.forEach(t => t.addEventListener('click', function() {
            thumbnails.forEach(x => x.classList.remove('active'));
            this.classList.add('active');
            const nm = this.getAttribute('data-main');
            if (nm) mainImg.src = nm;
        }));

        // wire color/size selection (basic)
        root.querySelectorAll('.color-option').forEach(c => c.addEventListener('click', function() {
            root.querySelectorAll('.color-option').forEach(x => x.classList.remove('active'));
            this.classList.add('active');
            const label = root.querySelector('.form-label');
            if (label) label.textContent = `Color: ${this.getAttribute('data-color') || ''}`;
        }));

        root.querySelectorAll('.size-option').forEach(s => s.addEventListener('click', function() {
            root.querySelectorAll('.size-option').forEach(x => x.classList.remove('active'));
            this.classList.add('active');
            const sizeLabel = root.querySelector('.form-label:nth-of-type(2)');
            // fallback: update first size label
        }));

        const addToCartBtn = root.querySelector('#addToCartBtn');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', function() {
                const selectedColor = root.querySelector('.color-option.active')?.getAttribute('data-color') || '';
                const selectedSize = root.querySelector('.size-option.active')?.getAttribute('data-size') || '';
                const quantity = root.querySelector('#quantity')?.value || '1';
                this.innerHTML = '✓ Added to Cart!';
                this.style.backgroundColor = '#28a745';
                setTimeout(() => { this.innerHTML = '<img src="assets/img/cart2.png" alt="cart" class="me-2">Add to cart'; this.style.backgroundColor = '#FF4000'; }, 2000);
                console.log('Add to cart', { id: p.id, title: p.name, selectedColor, selectedSize, quantity });
            });
        }
    }

    async function fetchAndRender(id) {
        if (!id) {
            renderError('No product id provided.');
            return;
        }
        try {
            const resp = await fetch(`${API_BASE}/products/${encodeURIComponent(id)}`);
            if (!resp.ok) throw new Error('API ' + resp.status);
            const data = await resp.json();
            // API may return object or {data: {...}}
            const product = data?.data ?? data;
            renderProduct(product);
        } catch (err) {
            console.error('fetch product error', err);
            const hint = err instanceof TypeError ? 'Network or CORS error while fetching product.' : 'Failed to load product.';
            renderError(hint + ' ' + err.message);
        }
    }

    const id = getIdFromQuery();
    fetchAndRender(id);
});
