import React, { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Optimized image component with lazy loading and WebP format
 * Falls back to original format if WebP is not supported
 */
export default function OptimizedImage({ src, alt, className, ...props }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Convert image URL to WebP if it's not already
  const getWebPUrl = (url) => {
    if (!url) return url;
    if (url.includes('__generating__')) return url; // Skip for generated images
    
    // Check if already WebP
    if (url.endsWith('.webp')) return url;
    
    // For external images, return original
    if (url.startsWith('http') && !url.includes(window.location.hostname)) {
      return url;
    }
    
    // Convert common formats to WebP
    return url.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  };

  const webpUrl = getWebPUrl(src);
  const fallbackUrl = src;

  return (
    <picture>
      {/* WebP format for modern browsers */}
      {webpUrl !== fallbackUrl && (
        <source srcSet={webpUrl} type="image/webp" />
      )}
      
      {/* Fallback to original format */}
      <motion.img
        src={hasError ? fallbackUrl : webpUrl}
        alt={alt}
        className={className}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        {...props}
      />
    </picture>
  );
}