/**
 * Image optimization utilities for KROXIS
 * Handles lazy loading, WebP conversion, and responsive images
 */

/**
 * Generate srcset for responsive images
 * @param {string} baseUrl - Base image URL
 * @param {number[]} widths - Array of widths to generate
 * @returns {string} srcset attribute value
 */
export function generateSrcSet(baseUrl, widths = [320, 640, 960, 1280, 1920]) {
  if (!baseUrl) return '';
  
  return widths
    .map(width => {
      const url = addImageParams(baseUrl, { w: width, q: 85 });
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * Add query parameters to image URL for optimization
 * @param {string} url - Original image URL
 * @param {object} params - Parameters to add (w, h, q, fit, etc.)
 * @returns {string} Modified URL
 */
export function addImageParams(url, params) {
  if (!url || url.includes('__generating__')) return url;
  
  try {
    const urlObj = new URL(url, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
      urlObj.searchParams.set(key, value);
    });
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Convert image URL to WebP format
 * @param {string} url - Original image URL
 * @returns {string} WebP URL
 */
export function toWebP(url) {
  if (!url || url.endsWith('.webp') || url.includes('__generating__')) {
    return url;
  }
  
  return url.replace(/\.(jpg|jpeg|png)$/i, '.webp');
}

/**
 * Check if browser supports WebP
 * @returns {Promise<boolean>}
 */
export async function supportsWebP() {
  if (typeof window === 'undefined') return false;
  
  // Check if already cached
  const cached = sessionStorage.getItem('webpSupport');
  if (cached !== null) return cached === 'true';
  
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      const support = webP.height === 2;
      sessionStorage.setItem('webpSupport', support.toString());
      resolve(support);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

/**
 * Lazy load images with Intersection Observer
 * @param {string} selector - CSS selector for images to lazy load
 */
export function lazyLoadImages(selector = 'img[data-src]') {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return;
  }

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const src = img.getAttribute('data-src');
        const srcset = img.getAttribute('data-srcset');

        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
        }

        if (srcset) {
          img.srcset = srcset;
          img.removeAttribute('data-srcset');
        }

        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px', // Load images 50px before they enter viewport
  });

  document.querySelectorAll(selector).forEach((img) => {
    imageObserver.observe(img);
  });
}

/**
 * Preload critical images
 * @param {string[]} urls - Array of image URLs to preload
 */
export function preloadImages(urls) {
  if (typeof window === 'undefined') return;
  
  urls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Get optimal image size based on container and device pixel ratio
 * @param {number} containerWidth - Container width in pixels
 * @param {number} dpr - Device pixel ratio (default: window.devicePixelRatio)
 * @returns {number} Optimal image width
 */
export function getOptimalImageSize(containerWidth, dpr = window.devicePixelRatio) {
  const targetWidth = containerWidth * dpr;
  
  // Round up to nearest standard width
  const standardWidths = [320, 640, 750, 828, 1080, 1200, 1920, 2048, 3840];
  return standardWidths.find(w => w >= targetWidth) || standardWidths[standardWidths.length - 1];
}