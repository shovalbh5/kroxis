import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function HeroSection({ heroImage }) {
  return (
    <section className="relative h-[90vh] min-h-[600px] overflow-hidden bg-secondary">
      {/* Background Video */}
      <div className="absolute inset-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-50"
        >
          <source src="https://cdn.pixabay.com/video/2023/04/17/159080-820144228_large.mp4" type="video/mp4" />
        </video>
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
            <div className="w-8 h-[2px] bg-primary" />
            <span className="text-primary text-xs font-heading uppercase tracking-[0.3em]">Professional Grade Eyewear</span>
          </motion.div>

          <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl font-bold text-white uppercase leading-[0.95] tracking-tight">
            Built for<br />
            <span className="text-primary">the Grind</span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-secondary-foreground/70 mt-6 text-base sm:text-lg max-w-md leading-relaxed"
          >
            Engineered for the toughest environments. ANSI Z87.1+ certified impact protection meets industrial luxury.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row gap-3 mt-8"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
              <Button asChild size="lg" className="h-13 px-8 font-heading uppercase tracking-wider text-sm transition-all duration-300">
                <Link to="/shop">
                  Shop the Collection <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
              <Button variant="outline" size="lg" className="h-13 px-8 font-heading uppercase tracking-wider text-sm border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10 hover:text-white transition-all duration-300">
                <Play className="w-4 h-4 mr-2" /> Watch Stress Test
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}