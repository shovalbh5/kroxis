import React from 'react';
import { Eye } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16" dir="rtl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <Eye className="w-8 h-8 text-primary" />
          <h1 className="font-heading text-4xl sm:text-5xl uppercase tracking-tight font-bold">מדיניות פרטיות</h1>
        </div>

        <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="font-heading text-xl uppercase tracking-wide text-foreground font-bold">1. מידע שאנו אוספים</h2>
            <p>אנו אוספים מידע אישי שאתה מספק לנו ישירות בעת ביצוע הזמנה או יצירת קשר: שם, כתובת אימייל, מספר טלפון, כתובת למשלוח ופרטי תשלום.</p>
            <p>בנוסף, אנו אוספים מידע טכני אוטומטי כגון כתובת IP, סוג דפדפן, עמודים שנצפו וזמני גלישה.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl uppercase tracking-wide text-foreground font-bold">2. שימוש במידע</h2>
            <p>המידע שנאסף משמש לצורך: עיבוד הזמנות ומשלוחים, שירות לקוחות, שליחת עדכונים ומבצעים (בהסכמתך), שיפור חווית המשתמש באתר, ועמידה בדרישות חוקיות.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl uppercase tracking-wide text-foreground font-bold">3. שיתוף מידע</h2>
            <p>אנו לא מוכרים או משכירים את המידע האישי שלך לצדדים שלישיים. המידע ישותף רק עם: ספקי שירותי משלוח לצורך אספקת ההזמנה, ספקי סליקה מאובטחת, ורשויות חוק במידת הצורך.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl uppercase tracking-wide text-foreground font-bold">4. אבטחת מידע</h2>
            <p>אנו משתמשים באמצעי אבטחה מתקדמים כולל הצפנת SSL, אחסון מאובטח ובקרת גישה מוגבלת כדי להגן על המידע האישי שלך.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl uppercase tracking-wide text-foreground font-bold">5. עוגיות (Cookies)</h2>
            <p>האתר משתמש בעוגיות כדי לשפר את חווית הגלישה, לזכור העדפות ולנתח תנועה. ניתן לשלוט בהגדרות העוגיות דרך הדפדפן שלך.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl uppercase tracking-wide text-foreground font-bold">6. זכויות המשתמש</h2>
            <p>יש לך זכות לבקש גישה למידע האישי שלך, לתקן אותו, למחוק אותו או להגביל את עיבודו. לכל בקשה, פנו אלינו באימייל.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl uppercase tracking-wide text-foreground font-bold">7. יצירת קשר</h2>
            <p>לשאלות בנוגע למדיניות הפרטיות: <a href="mailto:support@kroxis.com" className="text-primary hover:underline">support@kroxis.com</a> | <a href="tel:054-717-2301" className="text-primary hover:underline">054-717-2301</a></p>
          </section>

          <p className="text-xs text-muted-foreground/60 pt-4 border-t border-border">עודכן לאחרונה: מרץ 2026</p>
        </div>
      </motion.div>
    </div>
  );
}