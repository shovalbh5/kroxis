import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function HeroSection({ heroImage }) {
  return (
    <section className="relative h-[90vh] min-h-[600px] overflow-hidden bg-secondary">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=1920&q=80"
          alt="Tactical field operator with sunglasses"
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center">
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2 mb-4"
          >
            <div className="w-10 h-[2px] bg-primary" />
            <span className="text-primary text-xs font-heading uppercase tracking-[0.35em] font-semibold">משקפי שמש טקטיות</span>
          </motion.div>

          <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white uppercase leading-[0.9] tracking-tighter mb-6">
            ראייה ברמה<br />
            <span className="text-primary">אחרת לגמרי</span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-secondary-foreground/80 text-lg sm:text-xl max-w-xl leading-relaxed font-medium"
          >
            משקפי שמש טקטיות לאנשי שטח, צבא ולוחמים. עדשות מקוטבות, עמידות בפגיעות ונוחות לשימוש ממושך בכל תנאי שטח.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row gap-4 mt-10"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
              <Button asChild size="lg" className="h-14 px-10 font-heading uppercase tracking-wider text-base font-bold transition-all duration-300">
                <Link to="/shop">
                  לחנות <ArrowRight className="w-5 h-5 ml-3" />
                </Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
              <button className="inline-flex items-center justify-center gap-2 h-14 px-10 font-heading uppercase tracking-wider text-base font-bold border-2 border-white/80 text-white bg-transparent rounded-md hover:bg-white/20 hover:border-white transition-all duration-300">
                <Play className="w-5 h-5" /> סרטון המוצר
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>


    </section>
  );
}