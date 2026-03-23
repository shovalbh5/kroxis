import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Award, Truck, Mail, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const certifications = [
  { label: 'UV400 Protection', icon: Shield },
  { label: 'MIL-STD Rated', icon: Award },
  { label: 'Polarized Lenses', icon: Shield },
];

export default function Footer() {
  const [email, setEmail] = useState('');

  return (
    <footer className="bg-secondary text-secondary-foreground">
      {/* Newsletter */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="font-heading text-2xl uppercase tracking-wider mb-2 font-bold">הירשמו לניוזלטר</h3>
              <p className="text-secondary-foreground/70 text-base font-medium">קבלו 10% הנחה על ההזמנה הראשונה ועדכונים על מוצרים חדשים</p>
            </div>
            <div className="flex gap-2 w-full max-w-md">
              <Input
                type="email"
                placeholder="הזן אימייל"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-muted/20 border-border text-secondary-foreground placeholder:text-secondary-foreground/40"
              />
              <Button className="shrink-0 font-heading uppercase tracking-wider bg-primary text-white hover:bg-primary/90 font-bold">
                <Mail className="w-4 h-4 mr-2" />
                הרשמה
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <span className="font-heading text-3xl font-bold tracking-widest text-white">KROXIS</span>
            <p className="text-secondary-foreground/70 text-base mt-4 leading-relaxed font-medium">
              משקפי שמש טקטיות לאנשי שטח, צבא ולוחמים. הגנה, סטייל ועמידות ללא פשרות.
            </p>
          </div>
          <div>
            <h4 className="font-heading text-xs uppercase tracking-widest text-primary mb-5">חנות</h4>
            <div className="space-y-3">
              <Link to="/shop?category=construction" className="block text-sm text-secondary-foreground/60 hover:text-primary transition-colors">צבא ולוחמים</Link>
              <Link to="/shop?category=outdoor" className="block text-sm text-secondary-foreground/60 hover:text-primary transition-colors">שטח ותפעול</Link>
              <Link to="/shop?category=general" className="block text-sm text-secondary-foreground/60 hover:text-primary transition-colors">עבודה ותעשייה</Link>
              <Link to="/shop" className="block text-sm text-secondary-foreground/60 hover:text-primary transition-colors">כל המוצרים</Link>
            </div>
          </div>
          <div>
            <h4 className="font-heading text-xs uppercase tracking-widest text-primary mb-5">תמיכה</h4>
            <div className="space-y-3">
              <Link to="/warranty" className="block text-sm text-secondary-foreground/60 hover:text-primary transition-colors">רישום אחריות</Link>
              <Link to="/b2b" className="block text-sm text-secondary-foreground/60 hover:text-primary transition-colors">פורטל עסקי</Link>
              <Link to="/contact" className="block text-sm text-secondary-foreground/60 hover:text-primary transition-colors">יצירת קשר</Link>
              <Link to="/faq" className="block text-sm text-secondary-foreground/60 hover:text-primary transition-colors">שאלות נפוצות</Link>
              <Link to="/terms" className="block text-sm text-secondary-foreground/60 hover:text-primary transition-colors">תקנון האתר</Link>
              <Link to="/privacy" className="block text-sm text-secondary-foreground/60 hover:text-primary transition-colors">מדיניות פרטיות</Link>
              <Link to="/returns" className="block text-sm text-secondary-foreground/60 hover:text-primary transition-colors">מדיניות החזרות</Link>
            </div>
          </div>
          <div>
            <h4 className="font-heading text-xs uppercase tracking-widest text-primary mb-5">איכות</h4>
            <div className="space-y-4">
              {certifications.map(cert => (
                <div key={cert.label} className="flex items-center gap-2">
                  <cert.icon className="w-4 h-4 text-primary" />
                  <span className="text-sm text-secondary-foreground/60">{cert.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            <p className="text-xs text-secondary-foreground/40">© {new Date().getFullYear()} KROXIS. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Truck className="w-4 h-4 text-secondary-foreground/40" />
              <span className="text-xs text-secondary-foreground/40">משלוח חינם מעל ₪500</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-2 text-sm text-secondary-foreground/60">
              <span>📍 א.ת נוף הארץ, ראש העין, כפר קאסם</span>
              <span>•</span>
              <a href="tel:054-717-2301" className="hover:text-primary transition-colors">📞 054-717-2301</a>
            </div>
            <a
              href="https://waze.com/ul?q=א.ת נוף הארץ, ראש העין, כפר קאסם, 4810001&navigate=yes"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[#33ccff] hover:bg-[#2eb8e6] text-white rounded-lg font-medium text-sm transition-colors"
            >
              <Navigation className="w-4 h-4" />
              נווט עם Waze
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}