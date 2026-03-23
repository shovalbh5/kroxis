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
      <DialogContent className="max-w-lg p-0 overflow-hidden border-primary">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-secondary/80 hover:bg-secondary transition-colors"
        >
          <X className="w-4 h-4 text-secondary-foreground" />
        </button>

        <div className="relative">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary to-primary/20" />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative p-8 sm:p-10 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center"
            >
              <Tag className="w-10 h-10 text-primary" />
            </motion.div>

            <h2 className="font-heading text-3xl sm:text-4xl uppercase tracking-tight text-white mb-3">
              רגע! לא ללכת
            </h2>
            <p className="text-secondary-foreground/70 text-lg mb-2">
              קבלו <span className="text-primary font-bold text-2xl">10% הנחה</span> על ההזמנה הראשונה
            </p>
            <p className="text-secondary-foreground/60 text-sm mb-6">
              הצטרפו ל-50,000+ אנשי שטח ולוחמים שסומכים על KROXIS
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                type="email"
                placeholder="הזן את האימייל שלך"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-muted/20 border-border text-secondary-foreground text-center"
              />
              <Button type="submit" size="lg" className="w-full h-12 font-heading uppercase tracking-wider">
                לקבל 10% הנחה
              </Button>
            </form>

            <p className="text-xs text-secondary-foreground/40 mt-4">
              קוד: <span className="font-mono text-primary">KROXIS10</span> • בתוקף 48 שעות
            </p>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}