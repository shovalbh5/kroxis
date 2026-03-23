import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductGallery({ images }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lens, setLens] = useState({ show: false, x: 0, y: 0, bgX: 0, bgY: 0 });
  const imgRef = useRef(null);
  const displayImages = images?.length ? images : [];

  const handleMouseMove = (e) => {
    const rect = imgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const bgX = (x / rect.width) * 100;
    const bgY = (y / rect.height) * 100;
    setLens({ show: true, x, y, bgX, bgY });
  };

  const handleMouseLeave = () => setLens(prev => ({ ...prev, show: false }));

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
      <div
        ref={imgRef}
        className="flex-1 relative overflow-hidden rounded-lg bg-muted cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={activeIndex}
            src={displayImages[activeIndex]}
            alt="Product"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full aspect-square object-cover"
          />
        </AnimatePresence>
        {lens.show && (
          <div
            className="hidden sm:block absolute pointer-events-none rounded-full border-2 border-white/60 shadow-lg z-10"
            style={{
              width: 160,
              height: 160,
              top: lens.y - 80,
              left: lens.x - 80,
              backgroundImage: `url(${displayImages[activeIndex]})`,
              backgroundSize: '500%',
              backgroundPosition: `${lens.bgX}% ${lens.bgY}%`,
              backgroundRepeat: 'no-repeat',
            }}
          />
        )}
      </div>
    </div>
  );
}