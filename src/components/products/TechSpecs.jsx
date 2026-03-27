import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Shield, Zap, Scale, Layers } from 'lucide-react';

export default function TechSpecs({ product }) {
  const specs = [
    { icon: Zap, label: 'עמידות לפגיעות', value: product.impact_resistance || 'עמידות גבוהה MIL-STD' },
    { icon: Shield, label: 'הגנת UV', value: product.uv_protection || '99.9% UV400' },
    { icon: Scale, label: 'משקל', value: product.weight_grams ? `${product.weight_grams}g` : '28g' },
    { icon: Layers, label: 'חומר מסגרת', value: product.frame_material || 'TR90 Swiss Tech' },
  ];

  const certLabels = {
    ANSI_Z87: 'ANSI Z87.1+ (עמידות בפגיעות)',
    CE_EN166: 'CE EN166 (תקן אירופי)',
    OSHA: 'OSHA Compliant',
    MIL_PRF: 'MIL-PRF-31013 (תקן צבאי)',
  };

  const featureTags = {
    ANSI_Z87: { label: 'Z87.1', desc: 'תקן בטיחות תעשייתי. עמידות גבוהה בפני פגיעות וחלקיקים.' },
    MIL_PRF: { label: 'MIL-SPEC', desc: 'הגנה בליסטית צבאית. עמידות ברסיסים במהירות גבוהה.' },
    polycarbonate: { label: 'POLY', desc: 'עדשות פוליקרבונט. קלות וחזקות פי 10 מפלסטיק רגיל.' },
    polarized: { label: 'POLAR', desc: 'הגנה מסנוור. מסנן החזרי אור ממשטחים ומשפר ניגודיות.' },
    anti_fog: { label: 'AF', desc: 'ציפוי נגד אדים. מונע הצטברות אדים במעברי טמפרטורה.' },
  };

  const getProductTags = (product) => {
    if (!product) return [];
    const tags = [];
    if (product.safety_certs?.includes('ANSI_Z87')) tags.push(featureTags.ANSI_Z87);
    if (product.safety_certs?.includes('MIL_PRF')) tags.push(featureTags.MIL_PRF);
    if (product.lens_tech?.includes('polarized')) tags.push(featureTags.polarized);
    if (product.lens_tech?.includes('anti_fog')) tags.push(featureTags.anti_fog);
    tags.push(featureTags.polycarbonate);
    return tags;
  };

  const tagsToShow = getProductTags(product);

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="specs">
        <AccordionTrigger className="font-heading text-sm uppercase tracking-wider">
          מפרט טכני
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-2 gap-4 py-2">
            {specs.map(spec => (
              <div key={spec.label} className="flex items-start gap-2">
                <spec.icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{spec.label}</p>
                  <p className="text-sm font-medium">{spec.value}</p>
                </div>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="certs">
        <AccordionTrigger className="font-heading text-sm uppercase tracking-wider">
          תקנים וטכנולוגיות
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 py-2" dir="rtl">
            {tagsToShow.map((tag, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="px-2 py-1 bg-muted rounded border border-border/50 shrink-0">
                  <span className="text-xs font-bold text-primary tracking-wider">{tag.label}</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{tag.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="shipping">
        <AccordionTrigger className="font-heading text-sm uppercase tracking-wider">
          משלוח ואחריות
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 py-2 text-sm">
            <p>• משלוח חינם מעל ₪500</p>
            <p>• אחריות לכל החיים על המסגרת</p>
            <p>• 30 יום שביעות רצון מובטחת</p>
            <p>• משלוח בינלאומי</p>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}