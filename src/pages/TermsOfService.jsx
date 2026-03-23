import React from 'react';
import { FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TermsOfService() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16" dir="rtl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-8 h-8 text-primary" />
          <h1 className="font-heading text-4xl sm:text-5xl uppercase tracking-tight font-bold">תקנון האתר</h1>
        </div>

        <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="font-heading text-xl uppercase tracking-wide text-foreground font-bold">1. כללי</h2>
            <p>אתר KROXIS (להלן "האתר") מופעל על ידי חברת KROXIS בע"מ. השימוש באתר מהווה הסכמה לתנאי שימוש אלה. אם אינך מסכים לתנאים, אנא הימנע משימוש באתר.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl uppercase tracking-wide text-foreground font-bold">2. מוצרים ותיאורים</h2>
            <p>אנו עושים מאמץ סביר להבטיח שהתיאורים, התמונות והמפרטים הטכניים המוצגים באתר מדויקים. עם זאת, ייתכנו הבדלים קלים בצבעים ובממדים בין המוצר המוצג לבין המוצר בפועל.</p>
            <p>משקפי KROXIS הם ציוד מגן מקצועי. יש להשתמש בהם בהתאם להוראות היצרן ולתקנים הרלוונטיים. המוצר אינו מחליף ציוד מגן אישי נוסף הנדרש על פי חוק.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl uppercase tracking-wide text-foreground font-bold">3. הזמנות ותשלום</h2>
            <p>ביצוע הזמנה באתר מהווה הצעה לרכישת המוצר. KROXIS שומרת לעצמה את הזכות לסרב להזמנה או לבטלה מכל סיבה.</p>
            <p>המחירים באתר כוללים מע"מ. עלויות משלוח יוצגו לפני אישור ההזמנה. התשלום מתבצע באמצעות אמצעי תשלום מאובטחים.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl uppercase tracking-wide text-foreground font-bold">4. משלוח ואספקה</h2>
            <p>זמני אספקה משוערים: 3-5 ימי עסקים להזמנות רגילות. הזמנות מעל ₪500 זכאיות למשלוח חינם. KROXIS אינה אחראית לעיכובים שנגרמים על ידי חברות השליחות.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl uppercase tracking-wide text-foreground font-bold">5. ביטולים והחזרות</h2>
            <p>ניתן לבטל עסקה תוך 14 ימים מיום קבלת המוצר, בהתאם לחוק הגנת הצרכן. המוצר חייב להיות במצבו המקורי ובאריזה המקורית. דמי ביטול: 5% מערך העסקה או 100 ₪, הנמוך מביניהם.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl uppercase tracking-wide text-foreground font-bold">6. אחריות</h2>
            <p>משקפי KROXIS מגיעים עם אחריות לכל החיים על המסגרת ושנתיים אחריות על העדשות כנגד פגמי ייצור. האחריות אינה מכסה נזק כתוצאה משימוש לא נכון, שריטות מכניות או בלאי רגיל.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl uppercase tracking-wide text-foreground font-bold">7. הגבלת אחריות</h2>
            <p>משקפי KROXIS עומדים בתקני בטיחות בינלאומיים (ANSI Z87.1+, CE EN166) אך אינם מהווים תחליף לציוד מגן אישי מלא. השימוש במוצר הוא באחריות המשתמש בלבד. KROXIS לא תישא באחריות לנזק שנגרם כתוצאה משימוש לא תקין במוצר.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl uppercase tracking-wide text-foreground font-bold">8. קניין רוחני</h2>
            <p>כל התכנים באתר, לרבות טקסטים, תמונות, לוגואים ועיצוב, הם רכושה הבלעדי של KROXIS ומוגנים בחוקי קניין רוחני. אין להעתיק, לשכפל או להפיץ תכנים מהאתר ללא אישור בכתב.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl uppercase tracking-wide text-foreground font-bold">9. יצירת קשר</h2>
            <p>לשאלות בנוגע לתנאי השימוש: טלפון <a href="tel:054-717-2301" className="text-primary hover:underline">054-717-2301</a> | אימייל <a href="mailto:support@kroxis.com" className="text-primary hover:underline">support@kroxis.com</a></p>
          </section>

          <p className="text-xs text-muted-foreground/60 pt-4 border-t border-border">עודכן לאחרונה: מרץ 2026</p>
        </div>
      </motion.div>
    </div>
  );
}