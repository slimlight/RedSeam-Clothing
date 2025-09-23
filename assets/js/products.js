document.addEventListener('DOMContentLoaded', function() {
            const thumbnails = document.querySelectorAll('.thumbnail-img');
            const mainImage = document.getElementById('mainImage');
            
            thumbnails.forEach(thumb => {
                thumb.addEventListener('click', function() {
        
                    thumbnails.forEach(t => t.classList.remove('active'));
                 
                    this.classList.add('active');
                    
                    const newImageSrc = this.getAttribute('data-main');
                    mainImage.src = newImageSrc;
                });
            });
            
            const colorOptions = document.querySelectorAll('.color-option');
            const colorLabel = document.querySelector('label[for="color"]');
            
            colorOptions.forEach(color => {
                color.addEventListener('click', function() {
                    colorOptions.forEach(c => c.classList.remove('active'));
                    
                    this.classList.add('active');
                    
                    const colorName = this.getAttribute('data-color');
                    const colorLabelElement = document.querySelector('.mb-4:nth-child(3) .form-label');
                    if (colorLabelElement) {
                        colorLabelElement.textContent = `Color: ${colorName}`;
                    }
                });
            });
            
            // size selection
            const sizeOptions = document.querySelectorAll('.size-option');
            
            sizeOptions.forEach(size => {
                size.addEventListener('click', function() {
                    sizeOptions.forEach(s => s.classList.remove('active'));
                    
                    this.classList.add('active');

                    const sizeName = this.getAttribute('data-size');
                    const sizeLabelElement = document.querySelector('.mb-4:nth-child(4) .form-label');
                    if (sizeLabelElement) {
                        sizeLabelElement.textContent = `Size: ${sizeName}`;
                    }
                });
            });
            
            // cart
            const addToCartBtn = document.getElementById('addToCartBtn');
            
            addToCartBtn.addEventListener('click', function() {
              
                const selectedColor = document.querySelector('.color-option.active')?.getAttribute('data-color') || 'Baby pink';
                const selectedSize = document.querySelector('.size-option.active')?.getAttribute('data-size') || 'L';
                const selectedQuantity = document.getElementById('quantity').value;
                
                const originalText = this.innerHTML;
                this.innerHTML = '✓ Added to Cart!';
                this.style.backgroundColor = '#28a745';
                
                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.style.backgroundColor = '#FF4000';
                }, 2000);
                
                console.log('Added to cart:', {
                    product: "Kids' Curved Hilfiger Graphic T-shirt",
                    color: selectedColor,
                    size: selectedSize,
                    quantity: selectedQuantity,
                    price: '$25'
                });
            });
        });