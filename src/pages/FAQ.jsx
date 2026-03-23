import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { motion } from 'framer-motion';

const faqs = [
  {
    q: 'מה ההבדל בין עדשות מקוטבות לעדשות רגילות?',
    a: 'עדשות מקוטבות מסננות סנוור ואור מוחזר, מה שמשפר את הנראות בשטח, בנהיגה ובתנאי שמש חזקים. עדשות רגילות מתאימות לתנאי תאורה רגילים וסביבות עבודה בפנים.',
  },
  {
    q: 'האם אפשר להתקין עדשות מרשם במשקפי KROXIS?',
    a: 'כן! דגמים מסוימים מסומנים כ-Prescription Ready ותומכים בהתקנת עדשות אופטיות. ניתן לשלוח לנו את המרשם מרופא העיניים ואנחנו נדאג לשאר.',
  },
  {
    q: 'עד כמה המשקפיים עמידות?',
    a: 'משקפי KROXIS בנויות לתנאי שטח קיצוניים. המסגרות עשויות TR90 עם עמידות בפגיעות ברמה צבאית. העדשות עמידות בשריטות ומספקות הגנת UV400 מלאה.',
  },
  {
    q: 'כמה זמן לוקח המשלוח?',
    a: 'הזמנות רגילות מגיעות תוך 3-5 ימי עסקים. הזמנות מעל ₪500 נהנות ממשלוח חינם. להזמנות סיטונאיות – אספקה תוך 5-7 ימי עסקים.',
  },
  {
    q: 'מה מדיניות ההחזרות?',
    a: 'ניתן להחזיר מוצר תוך 30 יום מקבלתו, כל עוד הוא במצב תקין ובאריזה המקורית. ההחזר יזוכה לאמצעי התשלום המקורי תוך 5-7 ימי עסקים.',
  },
  {
    q: 'מה כולל כיסוי האחריות?',
    a: 'אחריות לכל החיים על המסגרת כנגד פגמי ייצור, ושנתיים אחריות על העדשות. אינו כולל שריטות מכניות או נזק כתוצאה משימוש לא נכון.',
  },
  {
    q: 'האם אפשר להזמין בכמויות לצוות או ליחידה?',
    a: 'בהחלט! דרך הפורטל העסקי שלנו ניתן לקבל הנחות כמות של עד 25%. פנו אלינו דרך דף הסיטונאות ונציג B2B ייצור קשר תוך 24 שעות.',
  },
  {
    q: 'מה זה עדשות פוטוכרומטיות?',
    a: 'עדשות פוטוכרומטיות משנות את דרגת הכהות שלהן בהתאם לעוצמת השמש. בחוץ הן מתכהות אוטומטית, ובפנים חוזרות להיות שקופות – מושלם למעבר בין סביבות.',
  },
];

export default function FAQ() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16" dir="rtl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <HelpCircle className="w-8 h-8 text-primary" />
          <h1 className="font-heading text-4xl sm:text-5xl uppercase tracking-tight font-bold">שאלות נפוצות</h1>
        </div>
        <p className="text-lg text-muted-foreground mb-10">ריכזנו עבורכם תשובות לשאלות הנפוצות ביותר.</p>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="bg-card border border-border rounded-xl px-6">
              <AccordionTrigger className="text-right font-medium text-base py-5 hover:text-primary">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-10 p-6 bg-primary/10 border border-primary/20 rounded-xl text-center">
          <p className="text-base font-medium mb-1">לא מצאתם תשובה?</p>
          <p className="text-sm text-muted-foreground">צרו קשר – <a href="tel:054-717-2301" className="text-primary hover:underline font-bold">054-717-2301</a> | <a href="mailto:support@kroxis.com" className="text-primary hover:underline font-bold">support@kroxis.com</a></p>
        </div>
      </motion.div>
    </div>
  );
}