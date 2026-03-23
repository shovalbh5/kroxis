import React from 'react';
import { RefreshCw, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ReturnPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16" dir="rtl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <RefreshCw className="w-8 h-8 text-primary" />
          <h1 className="font-heading text-4xl sm:text-5xl uppercase tracking-tight font-bold">מדיניות החזרות</h1>
        </div>

        <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 mb-8">
            <h3 className="font-heading text-lg uppercase text-foreground font-bold mb-3">ב-KROXIS, שביעות רצונך מובטחת.</h3>
            <p className="text-base">אם אינך מרוצה מהמוצר – נחליף או נחזיר, ללא שאלות.</p>
          </div>

          <section>
            <h2 className="font-heading text-xl uppercase tracking-wide text-foreground font-bold">מדיניות 30 יום</h2>
            <p>ניתן להחזיר כל מוצר תוך 30 יום מיום קבלתו, בתנאי שהוא במצב חדש ובאריזה המקורית.</p>
            <ul className="space-y-2 mt-3">
              {[
                'המוצר חייב להיות במצב חדש, ללא סימני שימוש',
                'באריזה המקורית עם כל האביזרים (נרתיק, מטלית, תעודת אחריות)',
                'יש לצרף חשבונית או מספר הזמנה',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl uppercase tracking-wide text-foreground font-bold">תהליך ההחזרה</h2>
            <div className="space-y-3">
              <p><strong className="text-foreground">שלב 1:</strong> צרו קשר בטלפון <a href="tel:054-717-2301" className="text-primary hover:underline">054-717-2301</a> או באימייל <a href="mailto:support@kroxis.com" className="text-primary hover:underline">support@kroxis.com</a>.</p>
              <p><strong className="text-foreground">שלב 2:</strong> נשלח לכם תווית משלוח חינם להחזרה.</p>
              <p><strong className="text-foreground">שלב 3:</strong> ההחזר יזוכה תוך 5-7 ימי עסקים מרגע קבלת המוצר.</p>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-xl uppercase tracking-wide text-foreground font-bold">החלפת מוצר</h2>
            <p>רוצים דגם אחר, צבע אחר או סוג עדשה שונה? נשלח לכם את ההחלפה ללא עלות נוספת. המוצר החלופי ישלח ביום שנקבל את המוצר המוחזר.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl uppercase tracking-wide text-foreground font-bold">מקרים שלא ניתנים להחזרה</h2>
            <p>עדשות מרשם שהותאמו אישית, מוצרים שנפגמו כתוצאה משימוש לא נכון, ומוצרים ללא אריזה מקורית.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl uppercase tracking-wide text-foreground font-bold">הזמנות B2B / סיטונאות</h2>
            <p>להזמנות עסקיות מעל 10 יחידות – מדיניות ההחזרות נקבעת בהסכם הרכישה. צרו קשר עם מנהל החשבון שלכם.</p>
          </section>

          <p className="text-xs text-muted-foreground/60 pt-4 border-t border-border">עודכן לאחרונה: מרץ 2026</p>
        </div>
      </motion.div>
    </div>
  );
}