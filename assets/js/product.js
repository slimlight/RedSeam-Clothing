document.addEventListener('DOMContentLoaded', function() {
    const API_BASE = 'https://api.redseam.redberryinternship.ge/api';
    const root = document.getElementById('productRoot');
    const loading = document.getElementById('loading');

    // get product id from query string
    function getIdFromQuery() {
        const q = new URLSearchParams(window.location.search);
        return q.get('id');
    }

    // escape user-provided text to safe html
    function escapeHtml(s) {
        if (s === null || s === undefined) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // render an error message in the product root
    function renderError(msg) {
        root.innerHTML = `<div class="text-center text-danger py-5">${escapeHtml(msg)}</div>`;
    }

    // render product details, thumbnails, colors, sizes and add-to-cart
    function renderProduct(p) {
        const title = p.name || p.title || 'Untitled product';
        const price = (p.price !== undefined && p.price !== null) ? `$ ${p.price}` : '';

        // Map colors and images. API sometimes provides colors with images, or a standalone images array.
        let colors = Array.isArray(p.colors) ? p.colors.map(c => ({
            name: (c && (c.name || c.color)) || String(c || ''),
            hex: c && (c.hex || c.color_hex) || '',
            image: c && (c.image || c.image_url || c.src) || null
        })) : [];

        let imageEntries = [];
        if (colors.length) {
            // Use color images when available. If a color lacks an image, it will be ignored here.
            imageEntries = colors.map(c => ({ src: c.image || 'assets/img/jersey1.png', color: c.name || '' }));
        }

        if (!imageEntries.length) {
            if (Array.isArray(p.images) && p.images.length) {
                imageEntries = p.images.map(src => ({ src, color: null }));
            } else if (p.image || p.image_url) {
                imageEntries = [{ src: p.image || p.image_url, color: null }];
            } else {
                imageEntries = [{ src: 'assets/img/jersey1.png', color: null }];
            }
        }

        // If API doesn't provide colors, derive color options from available images so
        // color swatches are still rendered and synchronized with thumbnails.
        if (!colors.length) {
            colors = imageEntries.map((it, idx) => ({
                name: `Color ${idx + 1}`,
                hex: '',
                image: it.src
            }));
            // attach color names to image entries so thumbnails can notify color selection
            imageEntries = imageEntries.map((it, idx) => ({ src: it.src, color: colors[idx] ? colors[idx].name : null }));
        } else {
            // if colors were provided but imageEntries were created from colors, ensure imageEntries include names
            imageEntries = imageEntries.map((it, idx) => ({ src: it.src, color: it.color || (colors[idx] ? colors[idx].name : null) }));
        }

        const thumbnailsHtml = imageEntries.map((it, i) => {
            const cls = i === 0 ? 'thumbnail-img border border-2 rounded active' : 'thumbnail-img border border-2 rounded';
            const dataColor = it.color ? `data-color="${escapeHtml(it.color)}"` : '';
            return `<img src="${escapeHtml(it.src)}" class="img-fluid ${cls}" data-main="${escapeHtml(it.src)}" ${dataColor}>`;
        }).join('\n');

        const mainImage = imageEntries[0].src || 'assets/img/jersey1.png';

        // determine sizes from API using several possible keys
        const sizeKeys = ['sizes','available_sizes','availableSizes','availableSizesList','size_options','available_size'];
        let sizes = [];
        for (const k of sizeKeys) {
            if (Array.isArray(p[k]) && p[k].length) { sizes = p[k]; break; }
        }
        // fallback: single size value
        if (!sizes.length && p.size) sizes = [p.size];

        // determine brand info (may be string, object or id)
        let brandName = '';
        let brandImage = 'assets/img/tommy.png';
        if (p.brand && typeof p.brand === 'object') {
            brandName = p.brand.name || p.brand.title || p.brand.brand_name || '';
            brandImage = p.brand.image || p.brand.logo || p.brand.image_url || p.brand.photo || brandImage;
        } else if (p.brand && typeof p.brand === 'string') {
            brandName = p.brand;
        } else if (p.brand_id || p.brandId) {
            // will try to fetch brand details after initial render
            brandName = '';
        } else if (p.brand_name) {
            brandName = p.brand_name;
        }

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
                        <label class="form-label color-label fw-medium text-muted small mb-2">Color: ${escapeHtml(p.color || p.colour || '')}</label>
                        <div class="d-flex gap-2">
                            <!-- colors rendered from API if available -->
                            ${(colors.length ? colors.map(c => {

                                const styleParts = ['width:36px', 'height:36px', 'border:2px solid #ddd', 'border-radius:50%', 'display:inline-block', 'cursor:pointer', 'overflow:hidden'];
                                if (c.hex) {
                                    styleParts.push(`background-color:${escapeHtml(c.hex)}`);
                                } else {
                                    // no hex provided — use a neutral light background so the swatch is visible
                                    styleParts.push('background-color:#f5f5f5');
                                }
                                const styleAttr = styleParts.length ? `style="${styleParts.join(';')}"` : '';
                                const dataImg = c.image ? `data-image="${escapeHtml(c.image)}"` : '';
                                const title = escapeHtml(c.name || 'color');

                                return `<div class="color-option" ${styleAttr} title="${title}" data-color="${escapeHtml(c.name)}" ${dataImg}></div>`;
                            }).join('') : '')}
                        </div>
                    </div>

                    <div class="mb-4">
                        <label class="form-label size-label fw-medium text-muted small mb-2">Size: ${escapeHtml(sizes[0] || p.size || '')}</label>
                        <div class="d-flex gap-2">
                            ${(sizes.length ? sizes.map(s => `<div class="size-option border rounded px-3 py-2 text-center" data-size="${escapeHtml(s)}">${escapeHtml(s)}</div>`).join('') : '<div class="size-option border rounded px-3 py-2 text-center">S</div><div class="size-option border rounded px-3 py-2 text-center active">M</div>')}
                        </div>
                    </div>

                    <div class="mb-4">
                        <label class="form-label fw-medium text-muted small mb-2">Quantity</label>
                        <select class="form-select w-auto" id="quantity">
                            <option value="1" selected>1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                            <option value="6">6</option>
                            <option value="7">7</option>
                            <option value="8">8</option>
                            <option value="9">9</option>
                            <option value="10">10</option>
                        </select>
                    </div>

                    <button class="btn text-white fw-light mb-4 w-100 py-3 d-flex align-items-center justify-content-center" style="background-color: #FF4000;" id="addToCartBtn">
                       <img src="assets/img/cart2.png" alt="cart" class="me-2">Add to cart
                    </button>

                    <div class="border-bottom border-light-subtle mb-4"></div>

                    <div class="p-3">
                                <h3 class="fs-6 fw-semibold mb-3 d-flex align-items-center justify-content-between">Details
                                    <img id="brandImage" src="${escapeHtml(brandImage)}" alt="brand" width="109" height="61">
                                </h3>
                        <div>
                            <p class="mb-2 text-muted">Brand: <span id="brandName">${escapeHtml(brandName || p.brand || '')}</span></p>
                            <p class="text-muted mb-0 small">${escapeHtml(p.description || p.details || '')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
        root.innerHTML = html;

        // wire thumbnails
        const thumbnails = Array.from(root.querySelectorAll('.thumbnail-img'));
        const mainImg = root.querySelector('#mainImage');
        thumbnails.forEach(t => t.addEventListener('click', function() {
            thumbnails.forEach(x => x.classList.remove('active'));
            this.classList.add('active');
            const nm = this.getAttribute('data-main');
            if (nm) mainImg.src = nm;

            // if this thumbnail belongs to a color, update the color selection
            const thumbColor = this.getAttribute('data-color');
            if (thumbColor) {
                const colorEl = root.querySelector(`.color-option[data-color="${CSS.escape(thumbColor)}"]`);
                if (colorEl) {
                    root.querySelectorAll('.color-option').forEach(c => c.classList.remove('active'));
                    colorEl.classList.add('active');
                }
            }
        }));

        // If thumbnails correspond to colors and a color exists, ensure color selection matches the first image
        if (imageEntries[0] && imageEntries[0].color) {
            const initialColorEl = root.querySelector(`.color-option[data-color="${CSS.escape(imageEntries[0].color)}"]`);
            if (initialColorEl) initialColorEl.classList.add('active');
        }

        // wire color/size selection (basic) — clicking a color updates main image and thumbnails
        root.querySelectorAll('.color-option').forEach(c => c.addEventListener('click', function() {
            root.querySelectorAll('.color-option').forEach(x => x.classList.remove('active'));
            this.classList.add('active');
            const colorName = this.getAttribute('data-color') || '';
            const colorImage = this.getAttribute('data-image');
            const label = root.querySelector('.form-label');
            if (label) label.textContent = `Color: ${colorName}`;

            // update main image to this color's image when available
            if (colorImage) {
                mainImg.src = colorImage;
                // mark the corresponding thumbnail active if present
                thumbnails.forEach(t => t.classList.remove('active'));
                const thumb = thumbnails.find(t => t.getAttribute('data-main') === colorImage || t.getAttribute('data-color') === colorName);
                if (thumb) thumb.classList.add('active');
            } else {
                // fallback: find thumbnail flagged with this color
                const thumb = thumbnails.find(t => t.getAttribute('data-color') === colorName);
                if (thumb) {
                    thumbnails.forEach(t => t.classList.remove('active'));
                    thumb.classList.add('active');
                    mainImg.src = thumb.getAttribute('data-main');
                }
            }
        }));

        // size selection: update active class and the visible size label
        root.querySelectorAll('.size-option').forEach(s => s.addEventListener('click', function() {
            root.querySelectorAll('.size-option').forEach(x => x.classList.remove('active'));
            this.classList.add('active');
            const sizeLabel = root.querySelector('.size-label');
            const sizeVal = this.getAttribute('data-size') || this.textContent;
            if (sizeLabel) sizeLabel.textContent = `Size: ${sizeVal}`;
        }));

        // set default active size (first one)
        const firstSize = root.querySelector('.size-option');
        if (firstSize) firstSize.classList.add('active');

        const addToCartBtn = root.querySelector('#addToCartBtn');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', function() {
                const selectedColor = root.querySelector('.color-option.active')?.getAttribute('data-color') || '';
                const selectedSize = root.querySelector('.size-option.active')?.getAttribute('data-size') || '';
                const quantity = Number(root.querySelector('#quantity')?.value || '1') || 1;

                // visual feedback
                this.innerHTML = '✓ Added to Cart!';
                this.style.backgroundColor = '#28a745';
                setTimeout(() => { this.innerHTML = '<img src="assets/img/cart2.png" alt="cart" class="me-2">Add to cart'; this.style.backgroundColor = '#FF4000'; }, 1500);

                // build cart item
                const productId = p.id ?? p._id ?? p.product_id ?? p.productId ?? null;
                const image = root.querySelector('#mainImage')?.src || (Array.isArray(p.images) && p.images[0]) || p.image || p.image_url || 'assets/img/jersey1.png';
                const name = p.name || p.title || p.product_name || p.productName || 'Untitled product';
                const priceNum = Number(p.price ?? p.unit_price ?? p.cost ?? p.price_value ?? 0) || 0;

                const newItem = {
                    id: productId,
                    product: name,
                    image: image,
                    price: priceNum,
                    color: selectedColor,
                    size: selectedSize,
                    quantity: quantity
                };

                // read existing cart
                let cart = [];
                try { cart = JSON.parse(localStorage.getItem('redseam_cart')) || []; } catch (e) { cart = []; }

                // merge: same product id + color + size
                const matchIdx = cart.findIndex(it => String(it.id) === String(newItem.id) && (it.color || '') === (newItem.color || '') && (it.size || '') === (newItem.size || ''));
                if (matchIdx >= 0) {
                    cart[matchIdx].quantity = (Number(cart[matchIdx].quantity) || 0) + Number(newItem.quantity);
                    // ensure price/image/title updated
                    cart[matchIdx].price = newItem.price;
                    cart[matchIdx].image = newItem.image;
                    cart[matchIdx].product = newItem.product;
                } else {
                    cart.push(newItem);
                }

                try {
                    localStorage.setItem('redseam_cart', JSON.stringify(cart));
                } catch (e) {
                    console.error('Failed to save cart', e);
                }

                // if cart helper exposed, call setCart to refresh UI/count; otherwise update badge directly
                try {
                    if (window._redseam_cart && typeof window._redseam_cart.setCart === 'function') {
                        window._redseam_cart.setCart(cart);
                    } else {
                        const badge = document.getElementById('cartCount');
                        if (badge) badge.textContent = String(cart.reduce((s, it) => s + (Number(it.quantity) || 0), 0));
                    }
                } catch (e) {
                    console.debug('cart refresh failed', e);
                }

                console.log('Add to cart', newItem);
            });
        }

        // If product contains only a brand id, try to fetch brand details
        const brandId = p.brand_id || p.brandId || (typeof p.brand === 'number' ? p.brand : null) || (typeof p.brand === 'string' && /^\\d+$/.test(p.brand) ? p.brand : null);
        if (!brandName && brandId) {
            // best-effort fetch - API path assumed as /brands/{id}
            fetch(`${API_BASE}/brands/${encodeURIComponent(brandId)}`)
                .then(r => { if (!r.ok) throw new Error('brand api ' + r.status); return r.json(); })
                .then(bdata => {
                    const brandObj = bdata?.data ?? bdata;
                    const name = brandObj?.name || brandObj?.title || brandObj?.brand_name || '';
                    const img = brandObj?.image || brandObj?.logo || brandObj?.image_url || brandObj?.photo || null;
                    const nameEl = root.querySelector('#brandName');
                    const imgEl = root.querySelector('#brandImage');
                    if (nameEl && name) nameEl.textContent = name;
                    if (imgEl && img) imgEl.src = img;
                })
                .catch(err => {
                    // silently ignore brand fetch errors
                    console.debug('brand fetch failed', err);
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
