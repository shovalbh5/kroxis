import React from 'react';
import { Link } from 'react-router-dom';
import { HardHat, FlaskConical, TreePine, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';

const industries = [
  { label: 'בנייה ותשתיות', desc: 'הגנה מפגיעות, אבק וחלקיקים באתרי בנייה', icon: HardHat, category: 'construction', color: 'from-orange-600/20 to-orange-900/20', image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&q=75' },
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