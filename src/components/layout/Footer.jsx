import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Award, Truck, Mail } from 'lucide-react';
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-heading text-2xl uppercase tracking-wider">Join the Crew</h3>
              <p className="text-secondary-foreground/60 text-sm mt-1">Get 10% off your first order and early access to new drops.</p>
            </div>
            <div className="flex gap-2 w-full max-w-md">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-muted/20 border-border text-secondary-foreground placeholder:text-secondary-foreground/40"
              />
              <Button className="shrink-0 font-heading uppercase tracking-wider">
                <Mail className="w-4 h-4 mr-2" />
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <span className="font-heading text-xl font-bold tracking-widest text-white">KROXIS</span>
            <p className="text-secondary-foreground/60 text-sm mt-3 leading-relaxed">
              Professional-grade eyewear engineered for those who build, protect, and innovate.
            </p>
          </div>
          <div>
            <h4 className="font-heading text-xs uppercase tracking-widest text-primary mb-4">Shop</h4>
            <div className="space-y-2">
              <Link to="/shop?category=construction" className="block text-sm text-secondary-foreground/60 hover:text-primary transition-colors">Construction</Link>
              <Link to="/shop?category=lab" className="block text-sm text-secondary-foreground/60 hover:text-primary transition-colors">Lab & Medical</Link>
              <Link to="/shop?category=outdoor" className="block text-sm text-secondary-foreground/60 hover:text-primary transition-colors">Outdoor</Link>
              <Link to="/shop" className="block text-sm text-secondary-foreground/60 hover:text-primary transition-colors">All Products</Link>
            </div>
          </div>
          <div>
            <h4 className="font-heading text-xs uppercase tracking-widest text-primary mb-4">Support</h4>
            <div className="space-y-2">
              <span className="block text-sm text-secondary-foreground/60">Warranty Registration</span>
              <span className="block text-sm text-secondary-foreground/60">B2B Portal</span>
              <span className="block text-sm text-secondary-foreground/60">Contact Us</span>
              <span className="block text-sm text-secondary-foreground/60">FAQ</span>
            </div>
          </div>
          <div>
            <h4 className="font-heading text-xs uppercase tracking-widest text-primary mb-4">Certifications</h4>
            <div className="space-y-3">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-secondary-foreground/40">© {new Date().getFullYear()} KROXIS. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Truck className="w-4 h-4 text-secondary-foreground/40" />
            <span className="text-xs text-secondary-foreground/40">Free shipping over $150</span>
          </div>
        </div>
      </div>
    </footer>
  );
}