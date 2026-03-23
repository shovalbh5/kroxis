import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductGallery({ images }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const displayImages = images?.length ? images : [];

  if (!displayImages.length) {
    return <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-muted-foreground">No image</div>;
  }

  return (
    <div className="flex flex-col-reverse sm:flex-row gap-4">
      {/* Thumbnails */}
      {displayImages.length > 1 && (
        <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto sm:max-h-[500px]">
          {displayImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                i === activeIndex ? 'border-primary' : 'border-border hover:border-primary/50'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Main image */}
      <div className="flex-1 relative overflow-hidden rounded-lg bg-muted group">
        <AnimatePresence mode="wait">
          <motion.img
            key={activeIndex}
            src={displayImages[activeIndex]}
            alt="Product"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </AnimatePresence>
      </div>
    </div>
  );
}