import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Award, Truck, Mail, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const certifications = [
  { label: 'ANSI Z87.1+', icon: Shield },
  { label: 'CE EN166', icon: Award },
  { label: 'MIL-PRF', icon: Shield },
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
              <h3 className="font-heading text-2xl uppercase tracking-wider mb-2 font-bold">הצטרף לדרג הפיקודי</h3>
              <p className="text-secondary-foreground/70 text-base font-medium">10% הנחה על ההזמנה הראשונה וגישה מוקדמת לציוד חדש</p>
            </div>
            <div className="flex gap-2 w-full max-w-md">
              <Input
                type="email"
                placeholder="Enter your email"
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
            <span className="font-heading text-xl font-bold tracking-widest text-white">KROXIS</span>
            <p className="text-secondary-foreground/70 text-base mt-4 leading-relaxed font-medium">
              ציוד אופטי בדרגת הנדסה. למי שמוביל פרויקטים ולא מתפשר על איכות.
            </p>
          </div>
          <div>
            <h4 className="font-heading text-xs uppercase tracking-widest text-primary mb-5">Shop</h4>
            <div className="space-y-3">
              <Link to="/shop?category=construction" className="block text-sm text-secondary-foreground/60 hover:text-primary transition-colors">Construction</Link>
              <Link to="/shop?category=lab" className="block text-sm text-secondary-foreground/60 hover:text-primary transition-colors">Lab & Medical</Link>
              <Link to="/shop?category=outdoor" className="block text-sm text-secondary-foreground/60 hover:text-primary transition-colors">Outdoor</Link>
              <Link to="/shop" className="block text-sm text-secondary-foreground/60 hover:text-primary transition-colors">All Products</Link>
            </div>
          </div>
          <div>
            <h4 className="font-heading text-xs uppercase tracking-widest text-primary mb-5">Support</h4>
            <div className="space-y-3">
              <span className="block text-sm text-secondary-foreground/60">Warranty Registration</span>
              <span className="block text-sm text-secondary-foreground/60">B2B Portal</span>
              <span className="block text-sm text-secondary-foreground/60">Contact Us</span>
              <span className="block text-sm text-secondary-foreground/60">FAQ</span>
            </div>
          </div>
          <div>
            <h4 className="font-heading text-xs uppercase tracking-widest text-primary mb-5">Certifications</h4>
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
              <span className="text-xs text-secondary-foreground/40">Free shipping over $150</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-2 text-sm text-secondary-foreground/60">
              <span>📍 א.ת נוף הארץ, ראש העין, כפר קאסם</span>
              <span>•</span>
              <span>📞 054-717-2301</span>
            </div>
            <a
              href="https://waze.com/ul?q=א.ת נוף הארץ, ראש העין, כפר קאסם, 4810001&navigate=yes"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[#33ccff] hover:bg-[#2eb8e6] text-white rounded-lg font-medium text-sm transition-colors"
            >
              <Navigation className="w-4 h-4" />
              Navigate with Waze
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}