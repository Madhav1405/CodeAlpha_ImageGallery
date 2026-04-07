# Advanced Interactive Image Gallery

A high-performance, fully responsive, feature-rich media gallery built entirely with Vanilla HTML, CSS, and JavaScript. It features an intelligent masonry-style grid, a built-in canvas image editor, local AI text extraction (OCR), and complex state management (Favorites/Recycle Bin)—all without requiring a backend framework.

##  Features

* **Dynamic Masonry Grid:** Built with CSS Grid, automatically scaling from ultra-compact mobile views to wide-screen desktop displays.
* **Smart Category Filtering:** Smoothly filter media by categories (Nature, City, Technology, Animals, Food, Documents) with horizontal scroll support on mobile devices.
* **Built-in Image Editor:** * Adjust Brightness, Contrast, and Saturation on the fly.
  * True mathematical Image Sharpness powered by a custom SVG Convolution Matrix (`feConvolveMatrix`).
  * Cross-Origin (CORS) safe image saving straight to your device.
* **AI Text Extraction (OCR):** Integrated with Tesseract.js to securely scan and extract typed or handwritten text directly from images inside the browser, complete with a one-click clipboard copy feature.
* **Rich Media Support:** Seamlessly plays `.mp4` videos directly inside the custom lightbox.
* **State Management:** Easily flag images as "Favorites" or move them to the "Recycle Bin" (rendering them grayscale) using the hover action menu.
* **Mobile-First UX:** Touch-friendly swipe navigation, larger tap targets, and bottom-sheet slide-up panels for the Editor and OCR tools on smaller screens.
* **Settings Panel:** Toggle between standard and "Compact Grid" high-density viewing modes.

##  Performance Optimizations

* **Lazy Loading & Async Decoding:** Off-screen images are deferred, and decoding is pushed off the main thread to ensure buttery smooth scrolling.
* **CSS `content-visibility`:** The browser skips rendering calculations for off-screen DOM elements, saving massive amounts of RAM and CPU usage.
* **Auto-Fallback System:** Built-in JavaScript failsafes automatically swap out broken or deleted external image URLs with working placeholders. No broken UI, ever.

##  Technologies Used

* **HTML5** * **CSS3** (CSS Grid, Flexbox, Animations, Media Queries)
* **Vanilla JavaScript** (ES6+, DOM Manipulation, Canvas API)
* **[Tesseract.js](https://tesseract.projectnaptha.com/)** (Client-side OCR Engine)
