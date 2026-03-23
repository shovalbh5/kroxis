import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, TrendingDown, Shield, Truck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const perks = [
  { icon: TrendingDown, title: 'הנחות כמות', desc: 'עד 25% הנחה על הזמנות גדולות – ככל שמזמינים יותר, החיסכון גדל.' },
  { icon: Shield, title: 'ציוד בתקן מחמיר', desc: 'כל המוצרים עומדים בתקני ANSI Z87.1+, CE EN166 ו-MIL-PRF.' },
  { icon: Truck, title: 'לוגיסטיקה מהירה', desc: 'אספקה ישירה לאתר – משלוח חינם מעל ₪2,000 להזמנות עסקיות.' },
  { icon: Users, title: 'מנהל לקוח ייעודי', desc: 'נציג B2B שמכיר את הצרכים שלכם ומלווה אתכם לאורך כל הדרך.' },
];

export default function B2BPortal() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16" dir="rtl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="w-8 h-8 text-primary" />
          <h1 className="font-heading text-4xl sm:text-5xl uppercase tracking-tight font-bold">פורטל עסקי</h1>
        </div>

        <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
          KROXIS עובדת עם קבלנים, מפעלים, ארגוני בטיחות וחברות הנדסה בכל רחבי הארץ. אנחנו מציעים פתרון ציוד מגן מותאם אישית עם תנאי מחיר ושירות שמתאימים לעסקים.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          {perks.map((p, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6">
              <p.icon className="w-6 h-6 text-primary mb-3" />
              <h3 className="font-heading text-lg uppercase tracking-wide mb-2 font-bold">{p.title}</h3>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl p-8 mb-10">
          <h2 className="font-heading text-2xl uppercase tracking-wide mb-4 font-bold">מי יכול להצטרף?</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>• קבלני בנייה ותשתיות</li>
            <li>• מנהלי בטיחות במפעלים</li>
            <li>• מעבדות מחקר ורפואה</li>
            <li>• מפיצים וסוחרי ציוד מגן</li>
            <li>• כל עסק שצריך 10+ יחידות</li>
          </ul>
        </div>

        <div className="text-center">
          <Button asChild size="lg" className="h-14 px-10 font-heading uppercase tracking-wider text-base font-bold">
            <Link to="/wholesale">בקשת הצעת מחיר סיטונאית</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}