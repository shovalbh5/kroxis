import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingBag, Menu, X, ChevronDown, HardHat, FlaskConical, TreePine, Shield, Globe } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const megaMenuData = {
  industry: [
    { label: 'בנייה ותשתיות', icon: HardHat, href: '/shop?category=construction' },
    { label: 'מעבדות ורפואה', icon: FlaskConical, href: '/shop?category=lab' },
    { label: 'עבודות שטח', icon: TreePine, href: '/shop?category=outdoor' },
  ],
  tech: [
    { label: 'אנטי פוג', href: '/shop?tech=anti_fog' },
    { label: 'עדשות מקוטבות', href: '/shop?tech=polarized' },
    { label: 'סינון אור כחול', href: '/shop?tech=blue_light' },
    { label: 'מתאים למשקפי ראייה', href: '/shop?tech=prescription_ready' },
  ],
};

export default function Header() {
  const { itemCount, setIsCartOpen } = useCart();
  const { locale, switchLanguage } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${scrolled ? 'bg-secondary/95 backdrop-blur-md shadow-lg' : 'bg-secondary'}`}>
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground text-center text-xs py-1.5 font-medium tracking-wider uppercase">
        משלוח חינם מעל ₪500 · כל המוצרים בתקן ANSI Z87.1+
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-secondary-foreground">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src="https://media.base44.com/images/public/69c0edec05cbd3064b4b2279/fdd4eb076_Gemini_Generated_Image_5d5gf85d5gf85d5g-removebg-preview.png" 
              alt="KROXIS Logo" 
              className="h-8 w-auto"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link to="/" className="text-secondary-foreground/80 hover:text-primary text-sm font-medium tracking-wide transition-all duration-300 hover:scale-105 uppercase">
              בית
            </Link>
            <div
              className="relative"
              onMouseEnter={() => setMegaOpen(true)}
              onMouseLeave={() => setMegaOpen(false)}
            >
              <button className="text-secondary-foreground/80 hover:text-primary text-sm font-medium tracking-wide transition-all duration-300 hover:scale-105 uppercase flex items-center gap-1">
                חנות <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <AnimatePresence>
                {megaOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[480px] bg-secondary border border-border rounded-lg shadow-2xl p-6"
                  >
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <h4 className="font-heading text-primary text-xs uppercase tracking-widest mb-3">לפי תעשייה</h4>
                        <div className="space-y-2">
                          {megaMenuData.industry.map(item => (
                            <Link
                              key={item.label}
                              to={item.href}
                              className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/20 transition-colors text-secondary-foreground/80 hover:text-white"
                              onClick={() => setMegaOpen(false)}
                            >
                              <item.icon className="w-4 h-4 text-primary" />
                              <span className="text-sm">{item.label}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-heading text-primary text-xs uppercase tracking-widest mb-3">לפי טכנולוגיה</h4>
                        <div className="space-y-2">
                          {megaMenuData.tech.map(item => (
                            <Link
                              key={item.label}
                              to={item.href}
                              className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/20 transition-colors text-secondary-foreground/80 hover:text-white"
                              onClick={() => setMegaOpen(false)}
                            >
                              <Shield className="w-4 h-4 text-primary" />
                              <span className="text-sm">{item.label}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-border">
                      <Link
                        to="/shop"
                        className="text-primary text-sm font-medium hover:underline"
                        onClick={() => setMegaOpen(false)}
                      >
                        כל המוצרים →
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Link to="/shop" className="text-secondary-foreground/80 hover:text-primary text-sm font-medium tracking-wide transition-all duration-300 hover:scale-105 uppercase">
              כל המוצרים
            </Link>
            <Link to="/blog" className="text-secondary-foreground/80 hover:text-primary text-sm font-medium tracking-wide transition-all duration-300 hover:scale-105 uppercase">
              בלוג
            </Link>
            <Link to="/wholesale" className="text-secondary-foreground/80 hover:text-primary text-sm font-medium tracking-wide transition-all duration-300 hover:scale-105 uppercase">
              סיטונאות
            </Link>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => switchLanguage(locale === 'he' ? 'en' : 'he')}
              className="text-secondary-foreground/80 hover:text-primary transition-all duration-300 hover:scale-110 p-2 font-medium text-sm"
              title={locale === 'he' ? 'Switch to English' : 'עבור לעברית'}
            >
              {locale === 'he' ? 'EN' : 'עב'}
            </button>
            <button onClick={() => setSearchOpen(!searchOpen)} className="text-secondary-foreground/80 hover:text-primary transition-all duration-300 hover:scale-110 p-2">
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative text-secondary-foreground/80 hover:text-primary transition-all duration-300 hover:scale-110 p-2"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center min-w-[18px] h-[18px]">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-secondary border-t border-border"
          >
            <div className="max-w-2xl mx-auto px-4 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="חיפוש מוצרים, תקנים..."
                  className="w-full pl-10 pr-4 py-3 bg-muted/20 border border-border rounded-lg text-secondary-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  autoFocus
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-secondary border-t border-border lg:hidden"
          >
            <nav className="px-4 py-4 space-y-3">
              <Link to="/" onClick={() => setMobileOpen(false)} className="block text-secondary-foreground py-2 text-sm uppercase tracking-wide">בית</Link>
              <Link to="/shop" onClick={() => setMobileOpen(false)} className="block text-secondary-foreground py-2 text-sm uppercase tracking-wide">כל המוצרים</Link>
              <Link to="/shop?category=construction" onClick={() => setMobileOpen(false)} className="block text-secondary-foreground/70 py-2 text-sm pl-4">בנייה ותשתיות</Link>
              <Link to="/shop?category=lab" onClick={() => setMobileOpen(false)} className="block text-secondary-foreground/70 py-2 text-sm pl-4">מעבדות ורפואה</Link>
              <Link to="/shop?category=outdoor" onClick={() => setMobileOpen(false)} className="block text-secondary-foreground/70 py-2 text-sm pl-4">שטח ותפעול</Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}