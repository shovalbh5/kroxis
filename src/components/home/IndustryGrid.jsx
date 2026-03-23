import React from 'react';
import { Link } from 'react-router-dom';
import { HardHat, FlaskConical, TreePine, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';

const industries = [
  { label: 'Construction', desc: 'Impact-rated frames for the job site', icon: HardHat, category: 'construction', color: 'from-orange-600/20 to-orange-900/20' },
  { label: 'Lab & Medical', desc: 'Anti-splash, anti-fog protection', icon: FlaskConical, category: 'lab', color: 'from-blue-600/20 to-blue-900/20' },
  { label: 'Outdoor & Utility', desc: 'UV & polarized for field work', icon: TreePine, category: 'outdoor', color: 'from-green-600/20 to-green-900/20' },
  { label: 'General Safety', desc: 'Everyday industrial protection', icon: Wrench, category: 'general', color: 'from-gray-500/20 to-gray-800/20' },
];

export default function IndustryGrid() {
  return (
    <section className="py-20 sm:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-[2px] bg-primary" />
            <span className="text-primary text-xs font-heading uppercase tracking-[0.3em]">Industries</span>
            <div className="w-8 h-[2px] bg-primary" />
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl uppercase tracking-tight">Shop by Industry</h2>
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
                className="group block p-8 sm:p-10 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg text-center"
              >
                <div className={`w-16 h-16 mx-auto mb-5 rounded-xl bg-gradient-to-br ${ind.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <ind.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-heading text-sm sm:text-base uppercase tracking-wide group-hover:text-primary transition-colors mb-2">
                  {ind.label}
                </h3>
                <p className="text-xs text-muted-foreground hidden sm:block">{ind.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}