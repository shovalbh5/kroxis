import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Award, Truck, Mail, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/context/LanguageContext';

const certifications = [
  { label: 'UV400 Protection', icon: Shield },
  { label: 'MIL-STD Rated', icon: Award },
  { label: 'Polarized Lenses', icon: Shield },
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const { t, locale } = useLanguage();
  const prefix = locale === 'en' ? '/en' : '';

  return (
    <footer className="bg-secondary text-secondary-foreground">
      {/* Newsletter */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="font-heading text-2xl uppercase tracking-wider mb-2 font-bold">{t('footer.newsletter')}</h3>
              <p className="text-secondary-foreground/70 text-base font-medium">{t('footer.newsletterDesc')}</p>
            </div>
            <div className="flex gap-2 w-full max-w-md">
              <Input
                type="email"
                placeholder={t('footer.enterEmail')}
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-muted/20 border-border text-secondary-foreground placeholder:text-secondary-foreground/40"
              />
              <Button className="shrink-0 font-heading uppercase tracking-wider bg-primary text-white hover:bg-primary/90 font-bold">
                <Mail className="w-4 h-4 me-2" />
                {t('footer.subscribe')}
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
              {t('footer.brandDesc')}
            </p>
          </div>
          <div>
            <h4 className="font-heading text-xs uppercase tracking-widest text-primary mb-5">{t('footer.shopTitle')}</h4>
            <div className="space-y-3">
              <Link to={`${prefix}/shop?category=construction`} className="block text-sm text-secondary-foreground/60 hover:text-primary transition-colors">{t('footer.military')}</Link>
              <Link to={`${prefix}/shop?category=outdoor`} className="block text-sm text-secondary-foreground/60 hover:text-primary transition-colors">{t('footer.field')}</Link>
              <Link to={`${prefix}/shop?category=general`} className="block text-sm text-secondary-foreground/60 hover:text-primary transition-colors">{t('footer.work')}</Link>
              <Link to={`${prefix}/shop`} className="block text-sm text-secondary-foreground/60 hover:text-primary transition-colors">{t('footer.allProducts')}</Link>
            </div>
          </div>
          <div>
            <h4 className="font-heading text-xs uppercase tracking-widest text-primary mb-5">{t('footer.supportTitle')}</h4>
            <div className="space-y-3">
              <Link to={`${prefix}/warranty`} className="block text-sm text-secondary-foreground/60 hover:text-primary transition-colors">{t('footer.warranty')}</Link>
              <Link to={`${prefix}/b2b`} className="block text-sm text-secondary-foreground/60 hover:text-primary transition-colors">{t('footer.b2b')}</Link>
              <Link to={`${prefix}/contact`} className="block text-sm text-secondary-foreground/60 hover:text-primary transition-colors">{t('footer.contact')}</Link>
              <Link to={`${prefix}/faq`} className="block text-sm text-secondary-foreground/60 hover:text-primary transition-colors">{t('footer.faq')}</Link>
              <Link to={`${prefix}/terms`} className="block text-sm text-secondary-foreground/60 hover:text-primary transition-colors">{t('footer.terms')}</Link>
              <Link to={`${prefix}/privacy`} className="block text-sm text-secondary-foreground/60 hover:text-primary transition-colors">{t('footer.privacy')}</Link>
              <Link to={`${prefix}/returns`} className="block text-sm text-secondary-foreground/60 hover:text-primary transition-colors">{t('footer.returns')}</Link>
            </div>
          </div>
          <div>
            <h4 className="font-heading text-xs uppercase tracking-widest text-primary mb-5">{t('footer.qualityTitle')}</h4>
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
              <span className="text-xs text-secondary-foreground/40">{t('footer.freeShipping')}</span>
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
              {t('footer.navigateWaze')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}