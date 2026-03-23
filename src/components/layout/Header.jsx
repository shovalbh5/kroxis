import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingBag, Menu, X, ChevronDown, HardHat, FlaskConical, TreePine, Shield, Globe } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const megaMenuData = {
  industry: [
    { label: 'Construction', icon: HardHat, href: '/shop?category=construction' },
    { label: 'Lab & Medical', icon: FlaskConical, href: '/shop?category=lab' },
    { label: 'Outdoor & Utility', icon: TreePine, href: '/shop?category=outdoor' },
  ],
  tech: [
    { label: 'Anti-Fog', href: '/shop?tech=anti_fog' },
    { label: 'Polarized', href: '/shop?tech=polarized' },
    { label: 'Blue Light', href: '/shop?tech=blue_light' },
    { label: 'Prescription Ready', href: '/shop?tech=prescription_ready' },
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
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-secondary/95 backdrop-blur-md shadow-lg' : 'bg-secondary'}`}>
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground text-center text-xs py-1.5 font-medium tracking-wider uppercase">
        Free Shipping on Orders Over $150 · ANSI Z87.1+ Certified
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-secondary-foreground">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo */}
          <Link to="/" className="font-heading text-2xl font-bold text-white tracking-widest">
            KROXIS
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link to="/" className="text-secondary-foreground/80 hover:text-primary text-sm font-medium tracking-wide transition-colors uppercase">
              Home
            </Link>
            <div
              className="relative"
              onMouseEnter={() => setMegaOpen(true)}
              onMouseLeave={() => setMegaOpen(false)}
            >
              <button className="text-secondary-foreground/80 hover:text-primary text-sm font-medium tracking-wide transition-colors uppercase flex items-center gap-1">
                Shop <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <AnimatePresence>
                {megaOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[480px] bg-secondary border border-border rounded-lg shadow-2xl p-6"
                  >
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <h4 className="font-heading text-primary text-xs uppercase tracking-widest mb-3">By Industry</h4>
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
                        <h4 className="font-heading text-primary text-xs uppercase tracking-widest mb-3">By Technology</h4>
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
                        View All Products →
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Link to="/shop" className="text-secondary-foreground/80 hover:text-primary text-sm font-medium tracking-wide transition-colors uppercase">
              All Products
            </Link>
            <Link to="/blog" className="text-secondary-foreground/80 hover:text-primary text-sm font-medium tracking-wide transition-colors uppercase">
              Blog
            </Link>
            <Link to="/wholesale" className="text-secondary-foreground/80 hover:text-primary text-sm font-medium tracking-wide transition-colors uppercase">
              Wholesale
            </Link>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => switchLanguage(locale === 'he' ? 'en' : 'he')}
              className="text-secondary-foreground/80 hover:text-primary transition-colors p-2 font-medium text-sm"
              title={locale === 'he' ? 'Switch to English' : 'עבור לעברית'}
            >
              {locale === 'he' ? 'EN' : 'עב'}
            </button>
            <button onClick={() => setSearchOpen(!searchOpen)} className="text-secondary-foreground/80 hover:text-primary transition-colors p-2">
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative text-secondary-foreground/80 hover:text-primary transition-colors p-2"
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
                  placeholder="Search products, certifications..."
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
              <Link to="/" onClick={() => setMobileOpen(false)} className="block text-secondary-foreground py-2 text-sm uppercase tracking-wide">Home</Link>
              <Link to="/shop" onClick={() => setMobileOpen(false)} className="block text-secondary-foreground py-2 text-sm uppercase tracking-wide">All Products</Link>
              <Link to="/shop?category=construction" onClick={() => setMobileOpen(false)} className="block text-secondary-foreground/70 py-2 text-sm pl-4">Construction</Link>
              <Link to="/shop?category=lab" onClick={() => setMobileOpen(false)} className="block text-secondary-foreground/70 py-2 text-sm pl-4">Lab & Medical</Link>
              <Link to="/shop?category=outdoor" onClick={() => setMobileOpen(false)} className="block text-secondary-foreground/70 py-2 text-sm pl-4">Outdoor & Utility</Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}