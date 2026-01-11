// Create animated stars
function createStars() {
    const starsContainer = document.getElementById('stars');
    const starCount = 100;
    
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        
        // Random position
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        
        // Random size
        const size = Math.random() * 3 + 1;
        
        // Random animation delay
        const delay = Math.random() * 3;
        
        star.style.left = `${left}%`;
        star.style.top = `${top}%`;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.animationDelay = `${delay}s`;
        
        starsContainer.appendChild(star);
    }
}

// Zoom functionality variables
let currentScale = 1;
let minScale = 0.5;
let maxScale = 5;
let scaleStep = 0.2;
let isDragging = false;
let startX, startY, translateX = 0, translateY = 0;
let startTouches = [];

// Initialize stars and other functionality
document.addEventListener('DOMContentLoaded', function() {
    createStars();
    
    // Category filtering
    const categoryButtons = document.querySelectorAll('.category-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            const category = this.getAttribute('data-category');
            
            // Filter gallery items
            galleryItems.forEach(item => {
                if (category === 'all' || item.getAttribute('data-category') === category) {
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, 10);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
    
    // Lightbox functionality
    const lightboxModal = document.getElementById('lightboxModal');
    const lightboxContainer = document.getElementById('lightboxContainer');
    const lightboxContent = document.getElementById('lightboxContent');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    const imageCounter = document.getElementById('imageCounter');
    const zoomInfo = document.getElementById('zoomInfo');
    const zoomIn = document.getElementById('zoomIn');
    const zoomOut = document.getElementById('zoomOut');
    const zoomReset = document.getElementById('zoomReset');
    const zoomInstructions = document.getElementById('zoomInstructions');
    
    let currentImageIndex = 0;
    const images = Array.from(galleryItems).map(item => item.querySelector('img').src);
    
    // Open lightbox when clicking on gallery item
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', function() {
            currentImageIndex = index;
            resetZoom();
            updateLightboxImage();
            lightboxModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Show instructions temporarily
            zoomInstructions.style.display = 'block';
            setTimeout(() => {
                zoomInstructions.style.display = 'none';
            }, 4000);
        });
    });
    
    // Close lightbox
    lightboxClose.addEventListener('click', function() {
        lightboxModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
    
    // Close lightbox when clicking outside the image (but not on controls)
    lightboxModal.addEventListener('click', function(e) {
        if (e.target === lightboxModal || e.target === lightboxContainer) {
            lightboxModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
    
    // Navigate lightbox
    lightboxPrev.addEventListener('click', function(e) {
        e.stopPropagation();
        currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
        resetZoom();
        updateLightboxImage();
    });
    
    lightboxNext.addEventListener('click', function(e) {
        e.stopPropagation();
        currentImageIndex = (currentImageIndex + 1) % images.length;
        resetZoom();
        updateLightboxImage();
    });
    
    // Zoom controls
    zoomIn.addEventListener('click', function(e) {
        e.stopPropagation();
        zoomImage(scaleStep);
    });
    
    zoomOut.addEventListener('click', function(e) {
        e.stopPropagation();
        zoomImage(-scaleStep);
    });
    
    zoomReset.addEventListener('click', function(e) {
        e.stopPropagation();
        resetZoom();
    });
    
    // Mouse wheel zoom
    lightboxContainer.addEventListener('wheel', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Determine zoom direction based on wheel delta
        const delta = e.deltaY > 0 ? -scaleStep : scaleStep;
        zoomImage(delta, e.clientX, e.clientY);
    }, { passive: false });
    
    // Mouse drag to pan image
    lightboxContainer.addEventListener('mousedown', startDrag);
    lightboxContainer.addEventListener('mousemove', dragImage);
    lightboxContainer.addEventListener('mouseup', endDrag);
    lightboxContainer.addEventListener('mouseleave', endDrag);
    
    // Touch events for mobile
    lightboxContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
    lightboxContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    lightboxContainer.addEventListener('touchend', handleTouchEnd);
    
    // Double click to reset zoom
    lightboxContainer.addEventListener('dblclick', function(e) {
        e.preventDefault();
        e.stopPropagation();
        resetZoom();
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (lightboxModal.classList.contains('active')) {
            if (e.key === 'Escape') {
                lightboxModal.classList.remove('active');
                document.body.style.overflow = 'auto';
            } else if (e.key === 'ArrowLeft') {
                currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
                resetZoom();
                updateLightboxImage();
            } else if (e.key === 'ArrowRight') {
                currentImageIndex = (currentImageIndex + 1) % images.length;
                resetZoom();
                updateLightboxImage();
            } else if (e.key === '+' || e.key === '=') {
                zoomImage(scaleStep);
            } else if (e.key === '-' || e.key === '_') {
                zoomImage(-scaleStep);
            } else if (e.key === '0' || e.key === ' ') {
                resetZoom();
            }
        }
    });
    
    function updateLightboxImage() {
        lightboxImg.src = images[currentImageIndex];
        
        // Get alt text from the corresponding gallery item
        const galleryItem = galleryItems[currentImageIndex];
        const altText = galleryItem.querySelector('img').alt;
        lightboxImg.alt = altText;
        
        // Update image counter
        imageCounter.textContent = `${currentImageIndex + 1} / ${images.length}`;
        
        // Update zoom info
        updateZoomInfo();
    }
    
    function zoomImage(delta, mouseX = null, mouseY = null) {
        const oldScale = currentScale;
        currentScale += delta;
        
        // Clamp scale within limits
        currentScale = Math.max(minScale, Math.min(maxScale, currentScale));
        
        if (currentScale !== oldScale) {
            // Calculate mouse position relative to image center for zooming toward mouse
            if (mouseX !== null && mouseY !== null && currentScale > 1) {
                const containerRect = lightboxContainer.getBoundingClientRect();
                const contentRect = lightboxContent.getBoundingClientRect();
                
                // Mouse position relative to container
                const mouseXRel = mouseX - containerRect.left;
                const mouseYRel = mouseY - containerRect.top;
                
                // Current content center relative to container
                const currentCenterX = contentRect.width / 2;
                const currentCenterY = contentRect.height / 2;
                
                // Calculate new translate values to zoom toward mouse
                const scaleRatio = currentScale / oldScale;
                translateX = mouseXRel - (mouseXRel - translateX) * scaleRatio;
                translateY = mouseYRel - (mouseYRel - translateY) * scaleRatio;
                
                // Apply constraints to keep image within view
                applyDragConstraints();
            }
            
            applyTransform();
            updateZoomInfo();
        }
    }
    
    function resetZoom() {
        currentScale = 1;
        translateX = 0;
        translateY = 0;
        applyTransform();
        updateZoomInfo();
    }
    
    function applyTransform() {
        lightboxContent.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale})`;
    }
    
    function updateZoomInfo() {
        zoomInfo.textContent = `${Math.round(currentScale * 100)}%`;
    }
    
    function startDrag(e) {
        if (currentScale > 1) {
            isDragging = true;
            lightboxContainer.classList.add('grabbing');
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
        }
    }
    
    function dragImage(e) {
        if (!isDragging) return;
        
        e.preventDefault();
        
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        
        applyDragConstraints();
        applyTransform();
    }
    
    function endDrag() {
        isDragging = false;
        lightboxContainer.classList.remove('grabbing');
    }
    
    function applyDragConstraints() {
        if (currentScale <= 1) {
            translateX = 0;
            translateY = 0;
            return;
        }
        
        const containerRect = lightboxContainer.getBoundingClientRect();
        const contentRect = lightboxContent.getBoundingClientRect();
        
        // Calculate max allowed translation based on scaled content size
        const maxX = Math.max(0, (contentRect.width * currentScale - containerRect.width) / 2);
        const maxY = Math.max(0, (contentRect.height * currentScale - containerRect.height) / 2);
        
        // Clamp translation values
        translateX = Math.max(-maxX, Math.min(maxX, translateX));
        translateY = Math.max(-maxY, Math.min(maxY, translateY));
        
        // If scaled content is smaller than container, center it
        if (contentRect.width * currentScale <= containerRect.width) {
            translateX = 0;
        }
        if (contentRect.height * currentScale <= containerRect.height) {
            translateY = 0;
        }
    }
    
    // Touch event handlers for pinch zoom
    function handleTouchStart(e) {
        e.preventDefault();
        
        if (e.touches.length === 1) {
            // Single touch for dragging
            startTouches = [{
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            }];
            startDrag({
                clientX: e.touches[0].clientX,
                clientY: e.touches[0].clientY
            });
        } else if (e.touches.length === 2) {
            // Two touches for pinch zoom
            startTouches = [
                { x: e.touches[0].clientX, y: e.touches[0].clientY },
                { x: e.touches[1].clientX, y: e.touches[1].clientY }
            ];
        }
    }
    
    function handleTouchMove(e) {
        e.preventDefault();
        
        if (e.touches.length === 1 && isDragging) {
            // Single touch drag
            dragImage({
                clientX: e.touches[0].clientX,
                clientY: e.touches[0].clientY
            });
        } else if (e.touches.length === 2 && startTouches.length === 2) {
            // Pinch zoom
            const currentTouches = [
                { x: e.touches[0].clientX, y: e.touches[0].clientY },
                { x: e.touches[1].clientX, y: e.touches[1].clientY }
            ];
            
            // Calculate distance between touches
            const startDistance = Math.hypot(
                startTouches[1].x - startTouches[0].x,
                startTouches[1].y - startTouches[0].y
            );
            
            const currentDistance = Math.hypot(
                currentTouches[1].x - currentTouches[0].x,
                currentTouches[1].y - currentTouches[0].y
            );
            
            // Calculate zoom delta based on distance change
            const zoomDelta = (currentDistance - startDistance) * 0.01;
            
            // Calculate center point between touches
            const centerX = (currentTouches[0].x + currentTouches[1].x) / 2;
            const centerY = (currentTouches[0].y + currentTouches[1].y) / 2;
            
            // Apply zoom toward center point
            if (Math.abs(zoomDelta) > 0.01) {
                zoomImage(zoomDelta, centerX, centerY);
                startTouches = currentTouches;
            }
        }
    }
    
    function handleTouchEnd(e) {
        endDrag();
        startTouches = [];
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            if (this.getAttribute('href') !== '#') {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    // Add scroll animation to gallery items
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe gallery items for animation
    galleryItems.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(item);
    });
});

// Add parallax effect on scroll
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const stars = document.getElementById('stars');
    
    // Parallax effect for stars
    stars.style.transform = `translateY(${scrolled * 0.2}px)`;
    
    // Parallax effect for hero text
    const heroText = document.querySelector('.hero h1');
    if (heroText && scrolled < 500) {
        heroText.style.transform = `translateY(${scrolled * 0.1}px)`;
    }
});