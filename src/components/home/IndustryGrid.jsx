import React from 'react';
import { Link } from 'react-router-dom';
import { HardHat, FlaskConical, TreePine, Wrench, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';

const industryIcons = [HardHat, TreePine, Wrench, FlaskConical];
const industryCategories = ['construction', 'outdoor', 'general', 'lab'];
const industryImages = [
  'https://images.unsplash.com/photo-1579912437766-7896df6d3cd3?w=800&q=80',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80',
  'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800&q=80',
  'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80',
];

export default function IndustryGrid() {
  const { t, isRTL, locale } = useLanguage();
  const items = t('industry.items');
  const ArrowIcon = isRTL ? ChevronLeft : ChevronRight;
  return (
    <section className="relative py-24 sm:py-32 bg-secondary overflow-hidden">
      {/* Tactical background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 49px, white 49px, white 50px), repeating-linear-gradient(90deg, transparent, transparent 49px, white 49px, white 50px)' }} />
      <div className="absolute top-0 left-0 right-0 h-px bg-primary/40" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-primary/40" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-16 h-[1px] bg-primary" />
            <span className="text-primary text-[11px] font-heading uppercase tracking-[0.5em] font-bold">{t('industry.badge')}</span>
            <div className="w-16 h-[1px] bg-primary" />
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl uppercase tracking-tight font-bold text-white">
            {t('industry.title_1')} <span className="text-primary">{t('industry.title_2')}</span> {t('industry.title_3')}
          </h2>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {items.map((ind, i) => (
            <motion.div
              key={industryCategories[i]}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                to={`${locale === 'en' ? '/en' : ''}/shop?category=${industryCategories[i]}`}
                className="group relative block h-[280px] sm:h-[320px] overflow-hidden"
              >
                {/* Image */}
                <img
                  src={industryImages[i]}
                  alt={ind.label}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
                {/* Dark overlays */}
                <div className="absolute inset-0 bg-black/60 group-hover:bg-black/50 transition-colors duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-12 h-12">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-primary" />
                  <div className="absolute top-0 left-0 h-full w-[2px] bg-primary" />
                </div>
                <div className="absolute bottom-0 right-0 w-12 h-12">
                  <div className="absolute bottom-0 right-0 w-full h-[2px] bg-primary" />
                  <div className="absolute bottom-0 right-0 h-full w-[2px] bg-primary" />
                </div>

                {/* Category index */}
                <div className="absolute top-4 right-4 text-primary/30 font-heading text-6xl font-bold leading-none">
                  0{i + 1}
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary flex items-center justify-center">
                      {React.createElement(industryIcons[i], { className: 'w-5 h-5 text-white' })}
                    </div>
                    <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent to-primary/50" />
                  </div>
                  <h3 className="font-heading text-xl sm:text-2xl uppercase tracking-wide text-white font-bold mb-2 group-hover:text-primary transition-colors duration-300">
                    {ind.label}
                  </h3>
                  <p className="text-sm text-white/60 font-medium mb-4 max-w-xs">{ind.desc}</p>
                  <div className="flex items-center gap-2 text-primary text-sm font-heading uppercase tracking-wider font-bold opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-400">
                    <span>{t('industry.discover')}</span>
                    <ArrowIcon className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}