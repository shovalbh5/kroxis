import React from 'react';
import { Shield, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Warranty() {
  const benefits = [
    'אחריות לכל החיים על מסגרת המשקפיים',
    'החלפה חינם במקרה של פגם ייצור',
    'תיקון או החלפת עדשות במחיר מסובסד',
    'שירות מהיר – עד 5 ימי עסקים',
    'כיסוי בינלאומי – תקף בכל מקום בעולם',
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16" dir="rtl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="font-heading text-4xl sm:text-5xl uppercase tracking-tight font-bold">רישום אחריות</h1>
        </div>

        <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
          ב-KROXIS אנחנו מאמינים באיכות ללא פשרות. לכן כל משקפי השמש הטקטיות שלנו מגיעות עם <strong className="text-foreground">אחריות לכל החיים</strong> על המסגרת ו-<strong className="text-foreground">שנתיים אחריות מלאה</strong> על העדשות.
        </p>

        <div className="bg-card border border-border rounded-xl p-8 mb-10">
          <h2 className="font-heading text-2xl uppercase tracking-wide mb-6 font-bold">מה כולל הכיסוי?</h2>
          <ul className="space-y-4">
            {benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <span className="text-base">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 mb-10">
          <h2 className="font-heading text-2xl uppercase tracking-wide mb-4 font-bold">איך מפעילים את האחריות?</h2>
          <div className="space-y-4 text-muted-foreground">
            <p><strong className="text-foreground">שלב 1:</strong> שמרו את חשבונית הרכישה או את מספר ההזמנה שלכם.</p>
            <p><strong className="text-foreground">שלב 2:</strong> צרו איתנו קשר בטלפון <a href="tel:054-717-2301" className="text-primary hover:underline">054-717-2301</a> או במייל עם תיאור הבעיה ותמונה של המוצר.</p>
            <p><strong className="text-foreground">שלב 3:</strong> נבדוק את הפנייה ונשלח לכם מוצר חלופי או תיקון תוך 5 ימי עסקים.</p>
          </div>
        </div>

        <div className="p-6 bg-primary/10 border border-primary/20 rounded-xl text-center">
          <p className="text-sm font-medium">שאלות? צרו קשר – <a href="tel:054-717-2301" className="text-primary hover:underline font-bold">054-717-2301</a> | <a href="mailto:support@kroxis.com" className="text-primary hover:underline font-bold">support@kroxis.com</a></p>
        </div>
      </motion.div>
    </div>
  );
}