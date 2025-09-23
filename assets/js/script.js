
document.addEventListener('DOMContentLoaded', () => {

	const API_PRODUCTS = 'https://api.redseam.redberryinternship.ge/api/products';
	const $productsRow = document.getElementById('productsRow');
	const $pagination = document.querySelector('.custom-pagination');

	
	let currentPage = 1;

	
	const safe = v => (v === null || v === undefined) ? '' : String(v);
	const escapeHtml = s => safe(s)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');

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
		const priceVal = pick(product, 'price', 'cost', 'unit_price', 'price_value', 'amount');
		const price = (priceVal !== undefined && priceVal !== null) ? `$ ${priceVal}` : '';

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

	
	async function fetchProducts(page = 1) {
		showLoading();
		try {
			const url = new URL(API_PRODUCTS);
			url.searchParams.set('page', page);
			const res = await fetch(url.toString());
			if (!res.ok) throw new Error('API ' + res.status);
			const data = await res.json();
			const items = normalizeList(data);
			if (!items.length) {
				$productsRow.innerHTML = '<div class="col-12 text-center py-5">No products found.</div>';
				return;
			}
			
			$productsRow.innerHTML = '';
			const fragment = document.createDocumentFragment();
			items.forEach(item => fragment.appendChild(createProductCard(item)));
			$productsRow.appendChild(fragment);
		} catch (err) {
			console.error('fetchProducts error', err);
			const hint = err instanceof TypeError
				? 'API request failed (CORS or network). Ensure API allows cross-origin requests.'
				: 'Failed to load products.';
			showError(hint);
		}
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

	
	fetchProducts(currentPage);
});
