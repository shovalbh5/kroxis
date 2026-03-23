import React, { useState, useEffect } from 'react';
import { ShoppingBag, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const cities = ['חיפה', 'תל אביב', 'ירושלים', 'באר שבע', 'ראשון לציון', 'פתח תקווה', 'נתניה', 'אשדוד', 'רמת גן', 'הרצליה', 'כפר סבא', 'רחובות', 'מודיעין', 'עכו', 'נצרת'];
const names = ['דני', 'יוסי', 'מוחמד', 'אורי', 'עומר', 'אלי', 'חיים', 'סאמי', 'ניר', 'רון', 'אמיר', 'גיל', 'טל', 'איתי', 'עידו', 'ארז', 'שחר', 'דור'];
const products = ['KROXIS Iron-Sight', 'KROXIS Phantom-X', 'KROXIS TitanGuard', 'KROXIS StealthPro', 'KROXIS VoltShield', 'KROXIS HazeClear'];
const timeframes = ['לפני דקה', 'לפני 3 דקות', 'לפני 5 דקות', 'לפני 8 דקות', 'עכשיו'];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function SalesPopup() {
  const [visible, setVisible] = useState(false);
  const [sale, setSale] = useState(null);

  useEffect(() => {
    // First popup after 15 seconds
    const initialDelay = setTimeout(() => showPopup(), 15000);
    return () => clearTimeout(initialDelay);
  }, []);

  useEffect(() => {
    if (!visible) {
      // Show next popup after random 25-60 seconds
      const nextDelay = 25000 + Math.random() * 35000;
      const timer = setTimeout(() => showPopup(), nextDelay);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const showPopup = () => {
    setSale({
      name: getRandomItem(names),
      city: getRandomItem(cities),
      product: getRandomItem(products),
      time: getRandomItem(timeframes),
    });
    setVisible(true);
    // Auto-hide after 5 seconds
    setTimeout(() => setVisible(false), 5000);
  };

  return (
    <AnimatePresence>
      {visible && sale && (
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed bottom-24 left-6 z-50 max-w-xs"
        >
          <div className="bg-secondary border border-border rounded-xl shadow-2xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-secondary-foreground font-medium leading-snug" dir="rtl">
                <span className="font-bold">{sale.name}</span> מ{sale.city} רכש
              </p>
              <p className="text-sm text-primary font-heading font-bold truncate" dir="rtl">{sale.product}</p>
              <p className="text-[11px] text-secondary-foreground/50 mt-1" dir="rtl">{sale.time}</p>
            </div>
            <button onClick={() => setVisible(false)} className="text-secondary-foreground/40 hover:text-secondary-foreground transition-colors p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}