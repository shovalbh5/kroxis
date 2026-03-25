import React, { useState, useEffect } from 'react';
import { X, Tag } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';

export default function ExitIntentPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    const handleMouseLeave = (e) => {
      if (e.clientY <= 0 && !hasShown && !sessionStorage.getItem('exitPopupShown')) {
        setIsOpen(true);
        setHasShown(true);
        sessionStorage.setItem('exitPopupShown', 'true');
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [hasShown]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Store discount code in localStorage
    localStorage.setItem('discountCode', 'KROXIS10');
    localStorage.setItem('discountEmail', email);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-zinc-950 border border-white/10 sm:rounded-2xl shadow-2xl" hideCloseButton>
        <div className="relative p-8 sm:p-10 text-center" dir="rtl">
          {/* Subtle glow effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-primary/20 blur-[100px] pointer-events-none" />
          
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 left-4 z-10 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white/70 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative z-10"
          >
            <h2 className="font-heading text-3xl sm:text-4xl uppercase tracking-tight text-white mb-2 font-bold">
              רגע! לא ללכת
            </h2>
            <p className="text-white/80 text-lg mb-8">
              קבלו <span className="text-primary font-bold">10% הנחה</span> על ההזמנה הראשונה
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  type="email"
                  placeholder="הזן את האימייל שלך"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 text-center focus-visible:ring-primary focus-visible:border-primary transition-all"
                />
              </div>
              <Button type="submit" size="lg" className="w-full h-12 font-heading uppercase tracking-wider text-base font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
                לקבל 10% הנחה
              </Button>
            </form>

            <p className="text-xs text-white/40 mt-6">
              הצטרפו ל-50,000+ אנשי שטח ולוחמים שסומכים על KROXIS
            </p>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}