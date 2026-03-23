import React from 'react';
import { Link } from 'react-router-dom';
import { HardHat, FlaskConical, TreePine, Wrench, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const industries = [
  { label: 'בנייה ותשתיות', desc: 'הגנה מפגיעות, אבק וחלקיקים באתרי בנייה', icon: HardHat, category: 'construction', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80' },
  { label: 'מעבדות ורפואה', desc: 'עדשות נגד אדים וכימיקלים לסביבות סטריליות', icon: FlaskConical, category: 'lab', image: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&q=80' },
  { label: 'עבודות שטח', desc: 'עדשות מקוטבות לעבודה ממושכת בשמש', icon: TreePine, category: 'outdoor', image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&q=80' },
  { label: 'תעשייה כללית', desc: 'משקפי מגן לשימוש יומיומי בכל סביבת עבודה', icon: Wrench, category: 'general', image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800&q=80' },
];

export default function IndustryGrid() {
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
            <span className="text-primary text-[11px] font-heading uppercase tracking-[0.5em] font-bold">בחר את שדה הקרב שלך</span>
            <div className="w-16 h-[1px] bg-primary" />
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl uppercase tracking-tight font-bold text-white">
            מוכן <span className="text-primary">לכל</span> סביבה
          </h2>
        </motion.div>

        {/* Grid - 2 large on top, 2 below on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {industries.map((ind, i) => (
            <motion.div
              key={ind.category}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                to={`/shop?category=${ind.category}`}
                className="group relative block h-[280px] sm:h-[320px] overflow-hidden"
              >
                {/* Image */}
                <img
                  src={ind.image}
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
                      <ind.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent to-primary/50" />
                  </div>
                  <h3 className="font-heading text-xl sm:text-2xl uppercase tracking-wide text-white font-bold mb-2 group-hover:text-primary transition-colors duration-300">
                    {ind.label}
                  </h3>
                  <p className="text-sm text-white/60 font-medium mb-4 max-w-xs">{ind.desc}</p>
                  <div className="flex items-center gap-2 text-primary text-sm font-heading uppercase tracking-wider font-bold opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-400">
                    <span>גלה עכשיו</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
},
  { label: 'מעבדות ורפואה', desc: 'עדשות נגד אדים וכימיקלים לסביבות סטריליות', icon: FlaskConical, category: 'lab', color: 'from-blue-600/20 to-blue-900/20', image: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=600&q=75' },
  { label: 'עבודות שטח', desc: 'עדשות מקוטבות לעבודה ממושכת בשמש', icon: TreePine, category: 'outdoor', color: 'from-green-600/20 to-green-900/20', image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=600&q=75' },
  { label: 'תעשייה כללית', desc: 'משקפי מגן לשימוש יומיומי בכל סביבת עבודה', icon: Wrench, category: 'general', color: 'from-gray-500/20 to-gray-800/20', image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=600&q=75' },
];

export default function IndustryGrid() {
  return (
    <section className="py-20 sm:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-10 h-[2px] bg-primary" />
            <span className="text-primary text-xs font-heading uppercase tracking-[0.35em] font-semibold">קטגוריות</span>
            <div className="w-10 h-[2px] bg-primary" />
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl uppercase tracking-tight font-bold">לכל סביבת עבודה</h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {industries.map((ind, i) => (
            <motion.div
              key={ind.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                to={`/shop?category=${ind.category}`}
                className="group block rounded-xl border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg text-center overflow-hidden relative"
              >
                <div className="aspect-[4/3] relative overflow-hidden">
                  <img src={ind.image} alt={ind.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white text-center">
                    <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <ind.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-heading text-base sm:text-lg uppercase tracking-wide group-hover:text-primary transition-colors mb-1 font-bold">
                      {ind.label}
                    </h3>
                    <p className="text-xs text-white/70 hidden sm:block font-medium">{ind.desc}</p>
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