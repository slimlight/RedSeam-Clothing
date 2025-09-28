document.addEventListener('DOMContentLoaded', () => {
	const API_BASE = 'https://api.redseam.redberryinternship.ge/api'; 

	// shorthand for document.querySelector
	const $ = sel => document.querySelector(sel);
	// shorthand for document.querySelectorAll as an array
	const $$ = sel => Array.from(document.querySelectorAll(sel));
	// escape user-provided text to safe html
	const escapeHtml = (s) => {
		if (s === null || s === undefined) return '';
		return String(s)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	};

	const CART_KEY = 'redseam_cart';

	function readCart() {
		try { const raw = localStorage.getItem(CART_KEY); return raw ? JSON.parse(raw) : []; } 
        catch (e) 
        { return []; }
	}
	function writeCart(items) { 
        try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } 
        catch (e) { /* ignore */ } }

	const container = $('#checkoutCart');
	if (!container) return; // nothing to do on pages without the checkout container

	const subtotalEl = $('.col-12.col-lg-4 .d-flex.justify-content-between.mb-2 span:last-child');
	const deliveryEl = $('.col-12.col-lg-4 .d-flex.justify-content-between.mb-3 span:last-child');
	const totalEl = $('.col-12.col-lg-4 .d-flex.justify-content-between.mb-3 .fw-bold.fs-5:last-child');

	const formatPrice = (n) => '$ ' + (Number(n) || 0);

	// render
	function renderEmpty() {
		container.innerHTML = '<div class="text-center py-5 text-muted">Your cart is empty.</div>';
		if (subtotalEl) subtotalEl.textContent = '$ 0';
		if (deliveryEl) deliveryEl.textContent = '$ 0';
		if (totalEl) totalEl.textContent = '$ 0';
	}

	function buildItemNode(item, idx) {
		const price = Number(item.price) || 0;
		const qty = Number(item.quantity) || 1;

		const el = document.createElement('div');
		el.className = 'd-flex align-items-start mb-4';
		el.innerHTML = `
			<div class="radius-3 p-3 me-3 d-flex align-items-center justify-content-center" style="width: 100px; height: 134px;">
				<img src="${escapeHtml(item.image || 'assets/img/jersey1.png')}" alt="${escapeHtml(item.product||'')}" style="max-width:100%; max-height:100%; object-fit:contain;">
			</div>
			<div class="flex-grow-1">
				<h6 class="mb-1 fw-normal">${escapeHtml(item.product||'')}</h6>
				<small class="text-muted">${escapeHtml(item.color||'')}</small>
				<div class="d-flex align-items-center mt-2">
					<span class="me-2">${escapeHtml(item.size||'')}</span>
					<div class="d-flex align-items-center border rounded">
						<button class="btn btn-sm p-1 d-flex align-items-center justify-content-center qty-decrease" style="width: 30px; height: 30px;">-</button>
						<span class="px-2 qty-count">${escapeHtml(String(qty))}</span>
						<button class="btn btn-sm p-1 d-flex align-items-center justify-content-center qty-increase" style="width: 30px; height: 30px;">+</button>
					</div>
				</div>
			</div>
			<div class="text-end">
				<div class="fw-bold item-price">${formatPrice(price)}</div>
				<button class="btn btn-link p-0 text-muted small text-decoration-none mt-2 btn-remove">Remove</button>
			</div>
		`;

		// attach handlers 
		const dec = el.querySelector('.qty-decrease');
		const inc = el.querySelector('.qty-increase');
		const rem = el.querySelector('.btn-remove');

		if (dec) dec.addEventListener('click', () => changeQty(idx, -1));
		if (inc) inc.addEventListener('click', () => changeQty(idx, +1));
		if (rem) rem.addEventListener('click', (e) => { e.preventDefault(); removeItem(idx); });

		return el;
	}

	function render() {
		const items = readCart();
		container.innerHTML = '';
		if (!items || items.length === 0) {
			renderEmpty();
			return;
		}

		let subtotal = 0;
		items.forEach((it, idx) => {
			subtotal += (Number(it.price) || 0) * (Number(it.quantity) || 1);
			container.appendChild(buildItemNode(it, idx));
		});

		const delivery = subtotal > 0 ? 5 : 0;
		const total = subtotal + delivery;
		if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
		if (deliveryEl) deliveryEl.textContent = formatPrice(delivery);
		if (totalEl) totalEl.textContent = formatPrice(total);
	}

	// math +/-
	function changeQty(idx, delta) {
		const items = readCart();
		if (!items[idx]) return;
		const cur = Number(items[idx].quantity) || 1;
		items[idx].quantity = Math.max(1, cur + delta);
		writeCart(items);
		render();
	}

	function removeItem(idx) {
		const items = readCart();
		if (!items[idx]) return;
		items.splice(idx, 1);
		writeCart(items);
		render();
	}

	
	render();

	// modal
	(function setupModal() {
		const payBtn = document.getElementById('payButton');
		const successModal = document.getElementById('orderSuccessModal');
		const continueBtn = document.getElementById('continueShopping');
		const closeSuccess = successModal ? successModal.querySelector('.close-success') : null;

		if (!successModal) return; // nothing to do

			function validateForm() {
				const form = document.getElementById('checkoutForm') || document.querySelector('#orderSuccessModal') && document.querySelector('#orderSuccessModal').closest('form');
				const candidateForm = form || document.querySelector('form');
				if (!candidateForm) return true;

				const requiredSelectors = [
					'input[name="first_name"]',
					'input[name="last_name"]',
					'input[name="email"]',
					'input[name="address"]',
					'input[name="zip_code"]'
				];
				requiredSelectors.forEach(sel => {
					const el = candidateForm.querySelector(sel);
					if (el) el.required = true;
				});

				//validation
				if (typeof candidateForm.checkValidity === 'function') {
					const valid = candidateForm.checkValidity();
					if (!valid) {
							// show custom message(s) under invalid fields
							const invalids = Array.from(candidateForm.querySelectorAll(':invalid'));
							invalids.forEach(inv => {
								const name = inv.getAttribute('name') || inv.id;
								const msgEl = candidateForm.querySelector('.field-error[data-for="' + (inv.id || name) + '"]') || candidateForm.querySelector('.field-error[data-for="' + name + '"]');
								if (msgEl) msgEl.textContent = 'Fill this field';
							});
							// show the native validation UI by focusing the first invalid element
							const firstInvalid = candidateForm.querySelector(':invalid');
							if (firstInvalid && typeof firstInvalid.focus === 'function') firstInvalid.focus();
						}
					return valid;
				}

				// ensure required inputs are non-empty
				const requiredEls = Array.from(candidateForm.querySelectorAll('[required]'));
				for (const el of requiredEls) {
					if (!el.value || String(el.value).trim() === '') {
						const name = el.getAttribute('name') || el.id;
						const msgEl = candidateForm.querySelector('.field-error[data-for="' + (el.id || name) + '"]') || candidateForm.querySelector('.field-error[data-for="' + name + '"]');
						if (msgEl) msgEl.textContent = 'Fill this field';
						if (typeof el.focus === 'function') el.focus();
						return false;
					}
				}
				return true;
			}

			function showSuccess() {
				// validate before showing success
				if (!validateForm()) return; // don't proceed if invalid

				try { localStorage.removeItem(CART_KEY); } catch (e) { /* ignore */ }
				render();
				successModal.classList.add('show');
				// move focus for accessibility
				const primary = successModal.querySelector('button, a');
				if (primary && typeof primary.focus === 'function') primary.focus();
			}

		function hideSuccess() {
			successModal.classList.remove('show');
		}

		if (payBtn) payBtn.addEventListener('click', function (e) { e.preventDefault(); showSuccess(); });

		// clear error messages as user types or changes fields
		(function attachClearHandlers(){
			const form = document.getElementById('checkoutForm');
			if (!form) return;
			const fields = ['first_name','last_name','email','address','zip_code'];
			fields.forEach(name => {
				const el = form.querySelector('[name="' + name + '"]');
				const msgEl = form.querySelector('.field-error[data-for="' + name + '"]');
				if (el && msgEl) {
					const clear = () => { if (msgEl) msgEl.textContent = ''; };
					el.addEventListener('input', clear);
					el.addEventListener('change', clear);
				}
			});
		})();
		if (continueBtn) continueBtn.addEventListener('click', function () { hideSuccess(); window.location.href = 'index.html'; });
		if (closeSuccess) closeSuccess.addEventListener('click', hideSuccess);

		// optional: close on overlay click
		successModal.addEventListener('click', function (ev) {
			if (ev.target === successModal) hideSuccess();
		});

		// optional: close on Escape
		document.addEventListener('keydown', function (ev) {
			if (ev.key === 'Escape' && successModal.classList.contains('show')) hideSuccess();
		});
	})();
});
