// cart.js - Shopping Cart Off-canvas System
(function() {
    'use strict';
    
    // Cart management functions
    function getCartItems() {
        try {
            return JSON.parse(localStorage.getItem('redseam_cart')) || [];
        } catch (e) {
            return [];
        }
    }
    
    function saveCartItems(items) {
        localStorage.setItem('redseam_cart', JSON.stringify(items));
        updateCartCount();
        
        // Dispatch custom event for cart updates
        window.dispatchEvent(new CustomEvent('cartUpdated', { 
            detail: { items: items, count: getCartCount() } 
        }));
    }
    
    function getCartCount() {
        const cartItems = getCartItems();
        return cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
    }
    
    function updateCartCount() {
        const cartCount = getCartCount();
        
        // Update cart count badge in header
        const cartCountElement = document.getElementById('cartCount');
        if (cartCountElement) {
            cartCountElement.textContent = cartCount;
            cartCountElement.style.display = cartCount > 0 ? 'inline' : 'none';
        }
        
        // Update cart panel header
        const cartHeader = document.querySelector('.cart-header h3');
        if (cartHeader) {
            cartHeader.textContent = `Shopping cart (${cartCount})`;
        }
        
        updateCartDisplay();
    }
    
    function updateCartDisplay() {
        const cartItems = getCartItems();
        const cartBody = document.querySelector('.cart-body');
        
        if (!cartBody) return;
        
        if (cartItems.length === 0) {
            // Show empty cart state
            cartBody.innerHTML = `
                <div class="empty-cart-state">
                    <div class="empty-cart-icon">
                        <svg width="80" height="60" viewBox="0 0 24 24" fill="none" stroke="#ff4000" stroke-width="1.5">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                    </div>
                    <p class="empty-cart-text">Ooops!<br>You've got nothing in your cart just yet…</p>
                    <button class="start-shopping-btn">Start Shopping</button>
                </div>
            `;
            
            // Add event listener to start shopping button
            const startShoppingBtn = cartBody.querySelector('.start-shopping-btn');
            if (startShoppingBtn) {
                startShoppingBtn.addEventListener('click', function() {
                    closeCartPanel();
                    // Redirect to shop or home page
                    window.location.href = 'index.html'; // Adjust URL as needed
                });
            }
        } else {
            // Show cart items
            let cartHTML = '<div class="cart-items">';
            cartItems.forEach(item => {
                cartHTML += `
                    <div class="cart-item" data-item-id="${item.id}">
                        <img src="${item.image || 'assets/img/placeholder.jpg'}" alt="${item.name}" class="cart-item-image">
                        <div class="cart-item-details">
                            <h4>${item.name}</h4>
                            <p>Size: ${item.size || 'N/A'} | Color: ${item.color || 'N/A'}</p>
                            <span class="cart-item-price">$${item.price}</span>
                        </div>
                        <div class="cart-item-quantity">
                            <button class="qty-btn minus" data-id="${item.id}">-</button>
                            <span class="qty-display">${item.quantity}</span>
                            <button class="qty-btn plus" data-id="${item.id}">+</button>
                        </div>
                        <button class="remove-item" data-id="${item.id}">×</button>
                    </div>
                `;
            });
            cartHTML += '</div>';
            cartHTML += `
                <div class="cart-footer">
                    <div class="cart-total">
                        <strong>Total: $${calculateCartTotal()}</strong>
                    </div>
                    <button class="checkout-btn">Proceed to Checkout</button>
                </div>
            `;
            cartBody.innerHTML = cartHTML;
            
            // Add event listeners for quantity buttons and remove buttons
            addCartItemEventListeners();
        }
    }
    
    function addCartItemEventListeners() {
        const cartBody = document.querySelector('.cart-body');
        if (!cartBody) return;
        
        // Quantity buttons
        cartBody.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemId = this.getAttribute('data-id');
                const isPlus = this.classList.contains('plus');
                const currentQty = parseInt(this.parentElement.querySelector('.qty-display').textContent);
                const newQty = isPlus ? currentQty + 1 : currentQty - 1;
                
                updateCartItemQuantity(itemId, newQty);
            });
        });
        
        // Remove buttons
        cartBody.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemId = this.getAttribute('data-id');
                removeCartItem(itemId);
            });
        });
        
        // Checkout button
        const checkoutBtn = cartBody.querySelector('.checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', function() {
                // Handle checkout process
                alert('Checkout functionality would go here!');
                // You can redirect to checkout page
                // window.location.href = 'checkout.html';
            });
        }
    }
    
    function calculateCartTotal() {
        const cartItems = getCartItems();
        return cartItems.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0).toFixed(2);
    }
    
    function openCartPanel() {
        const cartPanel = document.getElementById('cartPanel');
        const overlay = document.getElementById('cartOverlay');
        if (cartPanel && overlay) {
            cartPanel.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            updateCartDisplay();
        }
    }
    
    function closeCartPanel() {
        const cartPanel = document.getElementById('cartPanel');
        const overlay = document.getElementById('cartOverlay');
        if (cartPanel && overlay) {
            cartPanel.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
    
    function updateCartItemQuantity(itemId, newQuantity) {
        let cartItems = getCartItems();
        if (newQuantity <= 0) {
            cartItems = cartItems.filter(item => item.id !== itemId);
        } else {
            cartItems = cartItems.map(item => {
                if (item.id === itemId) {
                    item.quantity = newQuantity;
                }
                return item;
            });
        }
        saveCartItems(cartItems);
    }
    
    function removeCartItem(itemId) {
        let cartItems = getCartItems();
        cartItems = cartItems.filter(item => item.id !== itemId);
        saveCartItems(cartItems);
    }
    
    // Create cart panel HTML and CSS
    function createCartPanel() {
        // Check if cart panel already exists
        if (document.getElementById('cartPanel')) {
            return;
        }
        
        // Add CSS styles
        const style = document.createElement('style');
        style.id = 'cartPanelStyles';
        style.textContent = `
            .cart-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 999;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            
            .cart-overlay.active {
                opacity: 1;
                visibility: visible;
            }
            
            .cart-panel {
                position: fixed;
                top: 0;
                right: -400px;
                width: 400px;
                height: 100%;
                background: white;
                z-index: 1000;
                transition: right 0.3s ease;
                display: flex;
                flex-direction: column;
                box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
            }
            
            .cart-panel.active {
                right: 0;
            }
            
            .cart-header {
                padding: 20px;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: #f8f9fa;
            }
            
            .cart-header h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                color: #333;
            }
            
            .close-btn {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background 0.2s ease;
            }
            
            .close-btn:hover {
                color: #333;
                background: #eee;
            }
            
            .cart-body {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
            }
            
            .empty-cart-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                text-align: center;
            }
            
            .empty-cart-icon {
                margin-bottom: 20px;
            }
            
            .empty-cart-text {
                color: #666;
                font-size: 16px;
                margin-bottom: 30px;
                line-height: 1.5;
            }
            
            .start-shopping-btn {
                background: #ff4000;
                color: white;
                border: none;
                padding: 12px 30px;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.3s ease;
                font-size: 14px;
            }
            
            .start-shopping-btn:hover {
                background: #e63900;
            }
            
            .cart-items {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            
            .cart-item {
                display: flex;
                gap: 12px;
                padding: 15px;
                border: 1px solid #eee;
                border-radius: 8px;
                position: relative;
            }
            
            .cart-item-image {
                width: 60px;
                height: 75px;
                object-fit: cover;
                border-radius: 4px;
                flex-shrink: 0;
            }
            
            .cart-item-details {
                flex: 1;
                min-width: 0;
            }
            
            .cart-item-details h4 {
                font-size: 14px;
                margin: 0 0 5px 0;
                color: #333;
                font-weight: 600;
            }
            
            .cart-item-details p {
                font-size: 12px;
                color: #666;
                margin: 0 0 8px 0;
            }
            
            .cart-item-price {
                font-weight: 600;
                color: #333;
                font-size: 14px;
            }
            
            .cart-item-quantity {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 5px;
                flex-shrink: 0;
            }
            
            .qty-btn {
                width: 28px;
                height: 28px;
                border: 1px solid #ddd;
                background: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                font-size: 14px;
                transition: all 0.2s ease;
            }
            
            .qty-btn:hover {
                background: #f5f5f5;
                border-color: #ccc;
            }
            
            .qty-display {
                font-size: 14px;
                font-weight: 600;
                min-width: 20px;
                text-align: center;
            }
            
            .remove-item {
                position: absolute;
                top: 8px;
                right: 8px;
                background: none;
                border: none;
                font-size: 18px;
                color: #999;
                cursor: pointer;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s ease;
            }
            
            .remove-item:hover {
                color: #ff4000;
                background: #fff5f5;
            }
            
            .cart-footer {
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #eee;
            }
            
            .cart-total {
                text-align: center;
                margin-bottom: 15px;
                font-size: 18px;
                color: #333;
            }
            
            .checkout-btn {
                width: 100%;
                background: #ff4000;
                color: white;
                border: none;
                padding: 15px;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
                font-size: 16px;
                transition: background 0.3s ease;
            }
            
            .checkout-btn:hover {
                background: #e63900;
            }
            
            @media (max-width: 480px) {
                .cart-panel {
                    width: 100%;
                    right: -100%;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Create cart panel HTML
        const cartHTML = `
            <div id="cartOverlay" class="cart-overlay"></div>
            <div id="cartPanel" class="cart-panel">
                <div class="cart-header">
                    <h3>Shopping cart (0)</h3>
                    <button class="close-btn" id="closeCartBtn">&times;</button>
                </div>
                <div class="cart-body">
                    <!-- Cart content will be dynamically inserted here -->
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', cartHTML);
        
        // Add event listeners
        const closeBtn = document.getElementById('closeCartBtn');
        const overlay = document.getElementById('cartOverlay');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', closeCartPanel);
        }
        
        if (overlay) {
            overlay.addEventListener('click', closeCartPanel);
        }
        
        // Close on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeCartPanel();
            }
        });
    }
    
    // Public API
    window.CartSystem = {
        // Add item to cart
        addToCart: function(product) {
            let cartItems = getCartItems();
            const existingItem = cartItems.find(item => 
                item.id === product.id && 
                item.size === product.size && 
                item.color === product.color
            );
            
            if (existingItem) {
                existingItem.quantity += product.quantity || 1;
            } else {
                cartItems.push({
                    id: product.id || Date.now().toString(),
                    name: product.name,
                    price: product.price,
                    size: product.size,
                    color: product.color,
                    image: product.image,
                    quantity: product.quantity || 1
                });
            }
            
            saveCartItems(cartItems);
            
            // Show success feedback
            this.showCartFeedback('Item added to cart!');
        },
        
        // Open cart panel
        openCart: function() {
            openCartPanel();
        },
        
        // Close cart panel
        closeCart: function() {
            closeCartPanel();
        },
        
        // Get cart items
        getCartItems: function() {
            return getCartItems();
        },
        
        // Get cart count
        getCartCount: function() {
            return getCartCount();
        },
        
        // Clear cart
        clearCart: function() {
            saveCartItems([]);
        },
        
        // Show feedback message
        showCartFeedback: function(message) {
            // Create or update feedback element
            let feedback = document.getElementById('cartFeedback');
            if (!feedback) {
                feedback = document.createElement('div');
                feedback.id = 'cartFeedback';
                feedback.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #28a745;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 6px;
                    z-index: 10000;
                    font-size: 14px;
                    font-weight: 600;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                `;
                document.body.appendChild(feedback);
            }
            
            feedback.textContent = message;
            feedback.style.opacity = '1';
            
            setTimeout(() => {
                feedback.style.opacity = '0';
            }, 2000);
        },
        
        // Initialize cart system
        init: function() {
            createCartPanel();
            updateCartCount();
        }
    };
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            window.CartSystem.init();
        });
    } else {
        window.CartSystem.init();
    }
    
    // Listen for cart icon clicks (assuming cart icon has class 'cart-icon' or similar)
    document.addEventListener('click', function(e) {
        // Check if clicked element or its parent is a cart trigger
        const cartTrigger = e.target.closest('[id*="cart"], .cart-icon, .cart-trigger');
        if (cartTrigger && cartTrigger.tagName === 'A') {
            e.preventDefault();
            openCartPanel();
        }
    });
    
})();