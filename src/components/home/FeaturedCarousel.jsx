import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '@/components/products/ProductCard';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';

export default function FeaturedCarousel({ products }) {
  const scrollRef = useRef(null);
  const { isRTL, t } = useLanguage();

  const scroll = (dir) => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      const multiplier = isRTL ? -1 : 1;
      scrollRef.current.scrollBy({
        left: dir === 'left' ? -scrollAmount * multiplier : scrollAmount * multiplier,
        behavior: 'smooth',
      });
    }
  };

  if (!products?.length) return null;

  return (
    <section className="py-20 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-[2px] bg-primary" />
              <span className="text-primary text-xs font-heading uppercase tracking-[0.35em] font-semibold">{t('featured.badge')}</span>
            </div>
            <h2 className="font-heading text-4xl sm:text-5xl uppercase tracking-tight font-bold">{t('featured.title')}</h2>
          </div>
          <div className="hidden sm:flex gap-2">
            <button
              onClick={() => scroll('left')}
              className="p-2 rounded-lg border border-border hover:border-primary hover:text-primary transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2 rounded-lg border border-border hover:border-primary hover:text-primary transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product) => (
            <div key={product.id} className="min-w-[260px] sm:min-w-[280px] snap-start">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}