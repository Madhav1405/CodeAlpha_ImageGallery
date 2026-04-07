  // --- 0. Performance & Auto-Fallback for Broken Images ---
        // This guarantees that if any external image link ever breaks or gets deleted, 
        // it instantly swaps to a working placeholder so your gallery never looks broken.
        document.querySelectorAll('.gallery-item img').forEach((img, idx) => {
            // Lazy load images off-screen and decode asynchronously so main thread doesn't freeze
            if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
            img.setAttribute('decoding', 'async');

            img.addEventListener('error', function() {
                this.onerror = null; // Prevent infinite loops
                this.src = `https://picsum.photos/seed/galleryfix${idx}/800/800`;
            });
        });

        // Add fallback protection to the lightbox image preview as well
        const lightboxImgNode = document.getElementById('lightbox-img');
        if(lightboxImgNode) {
            lightboxImgNode.setAttribute('decoding', 'async');
            lightboxImgNode.addEventListener('error', function() {
                this.onerror = null;
                this.src = `https://picsum.photos/seed/lightboxfix/800/800`;
            });
        }

        // --- 1. Filter & Action Logic ---
        const filterBtns = document.querySelectorAll('.filter-btn');
        let currentFilter = 'all';

        // Initial load stagger animation
        function animateItems() {
            // requestAnimationFrame makes animations fluid by synching with monitor refresh rate
            requestAnimationFrame(() => {
                const galleryItems = document.querySelectorAll('.gallery-item');
                let delay = 0;
                galleryItems.forEach((item) => {
                    if (!item.classList.contains('hide')) {
                        item.style.animationDelay = `${delay * 0.03}s`; // Sped up stagger for agility
                        item.classList.remove('show-anim');
                        void item.offsetWidth; // Trigger reflow
                        item.classList.add('show-anim');
                        delay++;
                    }
                });
            });
        }

        function applyCurrentFilter() {
            // requestAnimationFrame prevents UI freezing during heavy DOM filtering
            requestAnimationFrame(() => {
                const galleryItems = document.querySelectorAll('.gallery-item');
                
                galleryItems.forEach(item => {
                    const isRecycled = item.getAttribute('data-recycled') === 'true';
                    const isFavorite = item.getAttribute('data-favorite') === 'true';
                    const type = item.getAttribute('data-type');
                    const category = item.getAttribute('data-category');

                    let shouldShow = false;

                    if (currentFilter === 'recycle') {
                        shouldShow = isRecycled;
                    } else if (!isRecycled) {
                        if (currentFilter === 'all') shouldShow = true;
                        else if (currentFilter === 'favorites') shouldShow = isFavorite;
                        else if (currentFilter === 'videos') shouldShow = type === 'video';
                        else shouldShow = category === currentFilter;
                    }

                    if (shouldShow) {
                        item.classList.remove('hide');
                    } else {
                        item.classList.add('hide');
                    }
                });
                
                animateItems();
                
                // Update visible items for lightbox navigation
                visibleItems = Array.from(document.querySelectorAll('.gallery-item')).filter(el => !el.classList.contains('hide'));
            });
        }

        // Initialize animations on load
        window.addEventListener('DOMContentLoaded', applyCurrentFilter);

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const activeBtn = document.querySelector('.filter-btn.active');
                if (activeBtn) activeBtn.classList.remove('active');
                btn.classList.add('active');
                currentFilter = btn.getAttribute('data-filter');
                applyCurrentFilter();
            });
        });

        // Gallery Item Action Buttons (Event Delegation)
        document.getElementById('gallery').addEventListener('click', (e) => {
            const actionBtn = e.target.closest('.action-btn');
            if (actionBtn) {
                e.stopPropagation(); // Prevent opening lightbox when clicking an action
                const item = actionBtn.closest('.gallery-item');

                if (actionBtn.classList.contains('btn-fav')) {
                    const isFav = item.getAttribute('data-favorite') === 'true';
                    item.setAttribute('data-favorite', !isFav);
                    actionBtn.textContent = !isFav ? '❤️' : '🤍';
                } else if (actionBtn.classList.contains('btn-trash')) {
                    item.setAttribute('data-recycled', 'true');
                } else if (actionBtn.classList.contains('btn-restore')) {
                    item.setAttribute('data-recycled', 'false');
                } else if (actionBtn.classList.contains('btn-perm-del')) {
                    if (confirm("Are you sure you want to permanently delete this item?")) {
                        item.remove();
                    }
                }
                applyCurrentFilter(); // Re-evaluate view instantly
            }
        });

        // --- 2. Lightbox Logic & Editor ---
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightbox-img');
        const lightboxVideo = document.getElementById('lightbox-video');
        const lightboxCaption = document.getElementById('lightbox-caption');
        const closeBtn = document.getElementById('close-btn');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        // Editor Elements
        const editToggleBtn = document.getElementById('edit-toggle-btn');
        const brightnessInput = document.getElementById('edit-brightness');
        const contrastInput = document.getElementById('edit-contrast');
        const saturationInput = document.getElementById('edit-saturation');
        const sharpnessInput = document.getElementById('edit-sharpness');
        const sharpenMatrix = document.getElementById('sharpen-matrix');
        const btnReset = document.getElementById('btn-reset');
        const btnSave = document.getElementById('btn-save');

        // OCR Elements
        const extractToggleBtn = document.getElementById('extract-toggle-btn');
        const ocrPanel = document.getElementById('ocr-panel');
        const btnStartOcr = document.getElementById('btn-start-ocr');
        const ocrLoading = document.getElementById('ocr-loading');
        const ocrStatus = document.getElementById('ocr-status');
        const ocrResult = document.getElementById('ocr-result');
        const btnCopyText = document.getElementById('btn-copy-text');

        let currentIndex = 0;
        let visibleItems = []; // Array to track currently filtered images

        // --- Editor Functions ---
        function applyFilters() {
            const b = brightnessInput.value;
            const c = contrastInput.value;
            const sat = saturationInput.value;
            const sharp = sharpnessInput.value;

            document.getElementById('val-brightness').textContent = b + '%';
            document.getElementById('val-contrast').textContent = c + '%';
            document.getElementById('val-saturation').textContent = sat + '%';
            document.getElementById('val-sharpness').textContent = sharp + '%';

            // Sharpness SVG filter logic
            const s = sharp / 100;
            const center = 1 + 4 * s;
            const edge = -s;
            sharpenMatrix.setAttribute('kernelMatrix', `0 ${edge} 0 ${edge} ${center} ${edge} 0 ${edge} 0`);

            // Apply CSS Filter
            let filterStr = `brightness(${b}%) contrast(${c}%) saturate(${sat}%)`;
            if (sharp > 0) {
                filterStr += ` url(#sharpen-filter)`;
            }
            lightboxImg.style.filter = filterStr;
        }

        function resetFilters() {
            brightnessInput.value = 100;
            contrastInput.value = 100;
            saturationInput.value = 100;
            sharpnessInput.value = 0;
            applyFilters();
        }

        [brightnessInput, contrastInput, saturationInput, sharpnessInput].forEach(input => {
            input.addEventListener('input', applyFilters);
        });

        btnReset.addEventListener('click', resetFilters);
        
        editToggleBtn.addEventListener('click', () => {
            lightbox.classList.remove('ocr-active');
            extractToggleBtn.innerHTML = '📝 Extract Text';
            lightbox.classList.toggle('editing');
            editToggleBtn.innerHTML = lightbox.classList.contains('editing') ? '❌ Close Editor' : '🎨 Edit Image';
        });

        extractToggleBtn.addEventListener('click', () => {
            lightbox.classList.remove('editing');
            editToggleBtn.innerHTML = '🎨 Edit Image';
            lightbox.classList.toggle('ocr-active');
            extractToggleBtn.innerHTML = lightbox.classList.contains('ocr-active') ? '❌ Close Extractor' : '📝 Extract Text';
        });

        // --- OCR Extraction Logic ---
        function resetOCR() {
            ocrResult.style.display = 'none';
            btnCopyText.style.display = 'none';
            ocrLoading.style.display = 'none';
            btnStartOcr.style.display = 'block';
            btnStartOcr.textContent = 'Start Extraction';
            btnStartOcr.disabled = false;
            ocrResult.value = '';
        }

        btnStartOcr.addEventListener('click', async () => {
            if (typeof Tesseract === 'undefined') {
                alert('OCR Library is still loading. Please try again in a moment.');
                return;
            }

            btnStartOcr.style.display = 'none';
            ocrLoading.style.display = 'block';
            ocrResult.style.display = 'none';
            btnCopyText.style.display = 'none';
            ocrStatus.textContent = 'Loading AI Engine...';

            try {
                // Pass the image element directly! Since we already loaded it securely in the lightbox,
                // Tesseract can read it directly from the DOM without re-fetching or triggering CORS errors.
                const result = await Tesseract.recognize(
                    lightboxImg,
                    'eng',
                    { logger: m => {
                        if (m.status === 'recognizing text') {
                            ocrStatus.textContent = `Scanning: ${Math.round(m.progress * 100)}%`;
                        } else {
                            ocrStatus.textContent = m.status;
                        }
                    }}
                );
                
                ocrLoading.style.display = 'none';
                ocrResult.value = result.data.text || 'No text found in this image.';
                ocrResult.style.display = 'block';
                
                if (result.data.text.trim().length > 0) {
                    btnCopyText.style.display = 'block';
                } else {
                    btnStartOcr.style.display = 'block';
                    btnStartOcr.textContent = 'Try Again';
                }
            } catch(e) {
                console.error("OCR Error:", e);
                ocrLoading.style.display = 'none';
                ocrResult.value = 'An error occurred during text extraction. Please try another image.';
                ocrResult.style.display = 'block';
                btnStartOcr.style.display = 'block';
            }
        });

        btnCopyText.addEventListener('click', () => {
            ocrResult.select();
            ocrResult.setSelectionRange(0, 99999); /* For mobile devices */
            try {
                document.execCommand('copy');
                const originalText = btnCopyText.textContent;
                btnCopyText.textContent = 'Copied! ✓';
                setTimeout(() => { btnCopyText.textContent = originalText; }, 2000);
            } catch (err) {
                console.error('Failed to copy', err);
                alert('Could not copy to clipboard. Please copy the text manually.');
            }
        });

        btnSave.addEventListener('click', () => {
            const originalText = btnSave.textContent;
            btnSave.textContent = 'Saving...';
            btnSave.disabled = true;

            const img = new Image();
            img.crossOrigin = 'anonymous'; // Enforce CORS to prevent tainted canvas

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;

                // 1. Apply basic CSS filters directly to canvas context
                const b = brightnessInput.value;
                const c = contrastInput.value;
                const sat = saturationInput.value;
                ctx.filter = `brightness(${b}%) contrast(${c}%) saturate(${sat}%)`;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // 2. Apply Custom Sharpness (Convolution Matrix) via pixel manipulation 
                // because canvas ctx.filter doesn't reliably export SVG url() references.
                const sharp = parseInt(sharpnessInput.value, 10);
                if (sharp > 0) {
                    const s = sharp / 100;
                    const edge = -s;
                    const center = 1 + 4 * s;
                    
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;
                    const sw = canvas.width;
                    const sh = canvas.height;
                    const src = new Uint8ClampedArray(data); // copy original pixels
                    
                    for (let y = 0; y < sh; y++) {
                        for (let x = 0; x < sw; x++) {
                            const dstOff = (y * sw + x) * 4;
                            let r = 0, g = 0, b_val = 0;
                            
                            const offsets = [[0, -1], [-1, 0], [0, 0], [1, 0], [0, 1]]; // Cross kernel
                            const weights = [edge, edge, center, edge, edge];
                            
                            for (let i = 0; i < 5; i++) {
                                const cx = Math.min(Math.max(x + offsets[i][0], 0), sw - 1);
                                const cy = Math.min(Math.max(y + offsets[i][1], 0), sh - 1);
                                const srcOff = (cy * sw + cx) * 4;
                                const wt = weights[i];
                                
                                r += src[srcOff] * wt;
                                g += src[srcOff + 1] * wt;
                                b_val += src[srcOff + 2] * wt;
                            }
                            
                            data[dstOff] = r;
                            data[dstOff + 1] = g;
                            data[dstOff + 2] = b_val;
                        }
                    }
                    ctx.putImageData(imageData, 0, 0);
                }

                // 3. Trigger Download
                try {
                    const link = document.createElement('a');
                    link.download = 'edited-gallery-image.jpg';
                    link.href = canvas.toDataURL('image/jpeg', 0.9);
                    link.click();
                } catch (err) {
                    alert('Browser security blocked the download. Try opening the image in a new tab.');
                    console.error(err);
                } finally {
                    btnSave.textContent = originalText;
                    btnSave.disabled = false;
                }
            };

            img.onerror = () => {
                alert('Error loading image for saving. Ensure you have an internet connection.');
                btnSave.textContent = originalText;
                btnSave.disabled = false;
            };

            // Cache-buster: Forces the browser to fetch a fresh CORS-enabled image from Unsplash
            const currentSrc = lightboxImg.src;
            img.src = currentSrc + (currentSrc.includes('?') ? '&' : '?') + 'cb=' + new Date().getTime();
        });

        // Open Lightbox
        document.getElementById('gallery').addEventListener('click', (e) => {
            const item = e.target.closest('.gallery-item');
            if (!item || e.target.closest('.item-actions')) return; // Ignore if clicking action buttons

            // Get all currently visible images for navigation
            visibleItems = Array.from(document.querySelectorAll('.gallery-item')).filter(el => !el.classList.contains('hide'));
            currentIndex = visibleItems.indexOf(item);
            
            openLightboxMedia(item);
            lightbox.classList.add('show');
        });

        function openLightboxMedia(item) {
            resetFilters();
            lightboxImg.classList.remove('slide-next', 'slide-prev');
            lightboxVideo.classList.remove('slide-next', 'slide-prev');
            
            const type = item.getAttribute('data-type');
            const infoDiv = item.querySelector('.item-info h3');
            lightboxCaption.textContent = infoDiv ? infoDiv.textContent : "Media";

            resetOCR(); // Clear OCR results for new media

            if (type === 'video') {
                const vidElement = item.querySelector('video');
                lightboxImg.style.display = 'none';
                lightboxVideo.style.display = 'block';
                lightboxVideo.src = vidElement.getAttribute('src');
                lightboxVideo.play();
                editToggleBtn.style.display = 'none'; // Disable editor for videos
                extractToggleBtn.style.display = 'none'; // Disable OCR for videos
            } else {
                const imgElement = item.querySelector('img');
                lightboxVideo.style.display = 'none';
                lightboxVideo.pause();
                lightboxImg.style.display = 'block';
                lightboxImg.setAttribute('src', imgElement.getAttribute('src'));
                editToggleBtn.style.display = 'block'; // Enable editor
                extractToggleBtn.style.display = 'block'; // Enable OCR
            }
        }

        // Close Lightbox
        closeBtn.addEventListener('click', () => {
            lightbox.classList.remove('show');
            lightbox.classList.remove('editing');
            lightbox.classList.remove('ocr-active');
            editToggleBtn.innerHTML = '🎨 Edit Image';
            extractToggleBtn.innerHTML = '📝 Extract Text';
            lightboxVideo.pause(); // Stop video when closing
            resetFilters();
            resetOCR();
        });

        // Close if clicked outside the image
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox || e.target.classList.contains('lightbox-main')) {
                lightbox.classList.remove('show');
                lightbox.classList.remove('editing');
                lightbox.classList.remove('ocr-active');
                editToggleBtn.innerHTML = '🎨 Edit Image';
                extractToggleBtn.innerHTML = '📝 Extract Text';
                lightboxVideo.pause();
                resetFilters();
                resetOCR();
            }
        });

        // Navigate Lightbox
        function updateLightboxImage(index, direction) {
            const item = visibleItems[index];
            const type = item.getAttribute('data-type');
            const mediaElement = type === 'video' ? lightboxVideo : lightboxImg;
            
            // Brief fade out effect
            lightboxImg.style.opacity = 0;
            lightboxVideo.style.opacity = 0;
            lightboxCaption.style.opacity = 0;
            
            setTimeout(() => {
                openLightboxMedia(item);
                
                mediaElement.style.opacity = 1;
                lightboxCaption.style.opacity = 1;
                
                if (direction === 'next') mediaElement.classList.add('slide-next');
                if (direction === 'prev') mediaElement.classList.add('slide-prev');
            }, 200);
        }

        prevBtn.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + visibleItems.length) % visibleItems.length;
            updateLightboxImage(currentIndex, 'prev');
        });

        nextBtn.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % visibleItems.length;
            updateLightboxImage(currentIndex, 'next');
        });

        // --- Touch/Swipe Navigation for Mobile ---
        let touchStartX = 0;
        let touchEndX = 0;

        lightbox.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        lightbox.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe(e);
        }, { passive: true });

        function handleSwipe(e) {
            const swipeThreshold = 50; // Minimum swipe distance
            
            // Ignore swipes if we are tweaking editor sliders or copying text
            if (lightbox.classList.contains('editing') || lightbox.classList.contains('ocr-active') || e.target.closest('.editor-panel') || e.target.closest('.ocr-panel')) return; 
            
            if (touchEndX < touchStartX - swipeThreshold) {
                nextBtn.click(); // Swipe Left -> Next Image
            }
            if (touchEndX > touchStartX + swipeThreshold) {
                prevBtn.click(); // Swipe Right -> Prev Image
            }
        }

        // --- 3. Top Menu & Settings Logic ---
        const menuToggle = document.getElementById('menu-toggle');
        const dropdownMenu = document.getElementById('dropdown-menu');
        
        // Toggle Dropdown
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });

        // Close Dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.menu-container')) {
                dropdownMenu.classList.remove('show');
            }
        });

        // Dropdown Actions (Favorites & Recycle Bin)
        function setExternalFilter(filterType) {
            const activeBtn = document.querySelector('.filter-btn.active');
            if (activeBtn) activeBtn.classList.remove('active');
            
            currentFilter = filterType;
            applyCurrentFilter();
            dropdownMenu.classList.remove('show');
        }

        document.getElementById('menu-favorites').addEventListener('click', () => setExternalFilter('favorites'));
        document.getElementById('menu-recycle').addEventListener('click', () => setExternalFilter('recycle'));

        // Settings Modal Logic
        const settingsModal = document.getElementById('settings-modal');
        const closeSettings = document.getElementById('close-settings');
        const gridSwitch = document.getElementById('grid-switch');

        document.getElementById('menu-settings').addEventListener('click', () => {
            settingsModal.classList.add('show');
            dropdownMenu.classList.remove('show');
        });

        closeSettings.addEventListener('click', () => settingsModal.classList.remove('show'));
        settingsModal.addEventListener('click', (e) => {
            if(e.target === settingsModal) settingsModal.classList.remove('show');
        });
        
        gridSwitch.addEventListener('change', (e) => {
            document.body.classList.toggle('compact-grid', e.target.checked);
        });

        // Keyboard Navigation (Bonus accessibility feature)
        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('show')) return;
            if (e.key === 'Escape') lightbox.classList.remove('show');
            if (e.key === 'ArrowLeft') prevBtn.click();
            if (e.key === 'ArrowRight') nextBtn.click();
        });
