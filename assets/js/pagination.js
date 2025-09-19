document.addEventListener('DOMContentLoaded', function(){
    
const pagination = document.querySelector('.custom-pagination');

           if(!pagination) return;
            pagination.addEventListener('click', function(e){
                const link = e.target.closest('.page-link');
                if(!link) return;
                e.preventDefault();
                
                if(link.getAttribute('aria-label') === 'Previous'){
                    const current = pagination.querySelector('.page-item.active');
                    if(current && current.previousElementSibling && current.previousElementSibling.classList.contains('page-item')){
                        current.classList.remove('active');
                        current.previousElementSibling.classList.add('active');
                    }
                    return;
                }
                if(link.getAttribute('aria-label') === 'Next'){
                    const current = pagination.querySelector('.page-item.active');
                    if(current && current.nextElementSibling && current.nextElementSibling.classList.contains('page-item')){
                        current.classList.remove('active');
                        current.nextElementSibling.classList.add('active');
                    }
                    return;
                }

                
                const item = link.closest('.page-item');
                if(!item) return;
                pagination.querySelectorAll('.page-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                link.focus();
            });
        });