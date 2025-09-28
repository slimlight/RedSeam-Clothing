
	document.addEventListener('DOMContentLoaded', () => {

		// api endpoint for products
		const API_PRODUCTS = 'https://api.redseam.redberryinternship.ge/api/products';
		const $productsRow = document.getElementById('productsRow');
		const $pagination = document.querySelector('.custom-pagination');

		let currentPage = 1;
		// cached page results to allow client-side filtering & sorting without re-fetching
		const pageCache = new Map(); // page -> items[]

		// UI elements for filter/sort
		const filterFromInput = document.querySelector('.filter-input[aria-label="price from"]');
		const filterToInput = document.querySelector('.filter-input[aria-label="price to"]');
		const filterApplyBtn = document.querySelector('.filter-btn');
		const sortMenu = document.querySelectorAll('[data-sort]');

		let activeSort = null; // 'new' | 'low' | 'high' | null

		// safely stringify values for html output
		const safe = v => (v === null || v === undefined) ? '' : String(v);
		// escape user content before inserting into html
		const escapeHtml = s => safe(s)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');

		// pick first existing key from object
		const pick = (obj, ...keys) => keys.reduce((acc, k) => acc ?? obj?.[k], null);
		const normalizeList = (data) => {
			if (Array.isArray(data)) return data;
			if (Array.isArray(data?.data)) return data.data;
			if (Array.isArray(data?.items)) return data.items;
			if (Array.isArray(data?.products)) return data.products;
			if (Array.isArray(data?.result)) return data.result;
			return [];
		};

		function createProductCard(product) {
			const imgUrl = pick(product, 'image', 'image_url', 'imageUrl')
				|| (Array.isArray(product?.images) && product.images[0])
				|| product?.photo
				|| 'assets/img/jersey1.png';

			const title = pick(product, 'title', 'name', 'product_name', 'productName') || 'Untitled product';
			const priceVal = Number(pick(product, 'price', 'cost', 'unit_price', 'price_value', 'amount'));
			const price = (!Number.isNaN(priceVal)) ? `$ ${priceVal}` : '';

			const col = document.createElement('div');
			col.className = 'col-12 col-sm-6 col-md-3';

			const anchor = document.createElement('a');
			// link to product detail page when product id exists
			const id = pick(product, 'id', '_id', 'product_id');
			anchor.href = id ? `product.html?id=${encodeURIComponent(id)}` : '#';
			anchor.className = 'text-decoration-none text-dark';

			const card = document.createElement('div');
			card.className = 'card h-100 border-0 shadow-none';

			const img = document.createElement('img');
			img.className = 'card-img-top rounded-3';
			img.src = imgUrl;
			img.alt = escapeHtml(title);

			const body = document.createElement('div');
			body.className = 'card-body px-1 py-1';

			const h5 = document.createElement('h5');
			h5.className = 'card-title mb-1 fs-6';
			h5.textContent = title;

			const p = document.createElement('p');
			p.className = 'card-text';
			p.textContent = price;

			body.appendChild(h5);
			body.appendChild(p);
			card.appendChild(img);
			card.appendChild(body);
			anchor.appendChild(card);
			col.appendChild(anchor);
			return col;
		}

		function showLoading() {
			$productsRow.innerHTML = '<div class="col-12 text-center py-5">Loading products...</div>';
		}

		function showError(message) {
			$productsRow.innerHTML = `<div class="col-12 text-center text-danger py-5">${escapeHtml(message)}</div>`;
		}

		// apply client-side filter & sort to an array of items
		function applyFilterAndSort(items) {
			let list = Array.from(items || []);
			// price filter
			const fromRaw = filterFromInput?.value?.trim();
			const toRaw = filterToInput?.value?.trim();
			const from = fromRaw === '' ? null : Number(fromRaw);
			const to = toRaw === '' ? null : Number(toRaw);
			if ((fromRaw !== '' && Number.isNaN(from)) || (toRaw !== '' && Number.isNaN(to))) {
				// invalid number input - ignore filtering
			} else {
				if (from !== null) list = list.filter(it => {
					const p = Number(pick(it, 'price', 'cost', 'unit_price', 'price_value', 'amount'));
					return !Number.isNaN(p) && p >= from;
				});
				if (to !== null) list = list.filter(it => {
					const p = Number(pick(it, 'price', 'cost', 'unit_price', 'price_value', 'amount'));
					return !Number.isNaN(p) && p <= to;
				});
			}

			// sort
			if (activeSort === 'low') {
				list.sort((a, b) => {
					const pa = Number(pick(a, 'price', 'cost', 'unit_price', 'price_value', 'amount')) || 0;
					const pb = Number(pick(b, 'price', 'cost', 'unit_price', 'price_value', 'amount')) || 0;
					return pa - pb;
				});
			} else if (activeSort === 'high') {
				list.sort((a, b) => {
					const pa = Number(pick(a, 'price', 'cost', 'unit_price', 'price_value', 'amount')) || 0;
					const pb = Number(pick(b, 'price', 'cost', 'unit_price', 'price_value', 'amount')) || 0;
					return pb - pa;
				});
			} else if (activeSort === 'new') {
				// try to sort by created_at, date or id fallback
				list.sort((a, b) => {
					const da = new Date(pick(a, 'created_at', 'createdAt', 'date') || 0).getTime() || 0;
					const db = new Date(pick(b, 'created_at', 'createdAt', 'date') || 0).getTime() || 0;
					if (da === db) return 0;
					return db - da;
				});
			}

			return list;
		}

		async function fetchProducts(page = 1) {
			showLoading();
			try {
				// if cached reuse
				if (pageCache.has(page)) {
					const items = pageCache.get(page);
					renderItems(items);
					return;
				}
				const url = new URL(API_PRODUCTS);
				url.searchParams.set('page', page);
				const res = await fetch(url.toString());
				if (!res.ok) throw new Error('API ' + res.status);
				const data = await res.json();
				const items = normalizeList(data);
				pageCache.set(page, items);
				if (!items.length) {
					$productsRow.innerHTML = '<div class="col-12 text-center py-5">No products found.</div>';
					return;
				}
				renderItems(items);
			} catch (err) {
				console.error('fetchProducts error', err);
				const hint = err instanceof TypeError
					? 'API request failed (CORS or network). Ensure API allows cross-origin requests.'
					: 'Failed to load products.';
				showError(hint);
			}
		}

		function renderItems(items) {
			const list = applyFilterAndSort(items);
			if (!list.length) {
				$productsRow.innerHTML = '<div class="col-12 text-center py-5">No products match the filters.</div>';
				return;
			}
			$productsRow.innerHTML = '';
			const fragment = document.createDocumentFragment();
			list.forEach(item => fragment.appendChild(createProductCard(item)));
			$productsRow.appendChild(fragment);
		}

		// Pagination 
		function setActivePageUI() {
			if (!$pagination) return;
			$pagination.querySelectorAll('.page-item').forEach(i => i.classList.remove('active'));
			const node = Array.from($pagination.querySelectorAll('.page-item')).find(it => (it.querySelector('.page-link')?.textContent || '').trim() === String(currentPage));
			if (node) node.classList.add('active');
		}

		if ($pagination) {
			$pagination.addEventListener('click', (e) => {
				const link = e.target.closest('.page-link');
				if (!link) return;
				e.preventDefault();
				const label = link.getAttribute('aria-label');
				if (label === 'Previous') {
					if (currentPage > 1) currentPage -= 1;
					setActivePageUI();
					fetchProducts(currentPage);
					return;
				}
				if (label === 'Next') {
					currentPage += 1;
					setActivePageUI();
					fetchProducts(currentPage);
					return;
				}
				const num = parseInt(link.textContent, 10);
				if (!isNaN(num)) {
					currentPage = num;
					setActivePageUI();
					fetchProducts(currentPage);
				}
			});
		}

		// wire filter apply
		if (filterApplyBtn) {
			filterApplyBtn.addEventListener('click', () => {
				// re-render current page using cached items or re-fetch
				if (pageCache.has(currentPage)) {
					renderItems(pageCache.get(currentPage));
				} else {
					fetchProducts(currentPage);
				}
			});
		}

		// wire sort links
		sortMenu.forEach(node => {
			node.addEventListener('click', (e) => {
				e.preventDefault();
				const key = node.getAttribute('data-sort');
				if (activeSort === key) {
					activeSort = null; // toggle off
				} else {
					activeSort = key;
				}
				// update active class on menu
				sortMenu.forEach(n => n.classList.toggle('active', n.getAttribute('data-sort') === activeSort));
				if (pageCache.has(currentPage)) {
					renderItems(pageCache.get(currentPage));
				} else {
					fetchProducts(currentPage);
				}
			});
		});

		// initial load
		fetchProducts(currentPage);
	});
