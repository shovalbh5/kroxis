import React from 'react';
import { Shield, X, Check, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getCertLogo } from '@/components/products/CertLogos';

const categories = [
  { value: 'construction', label: 'צבא ולוחמים' },
  { value: 'outdoor', label: 'שטח ותפעול' },
  { value: 'general', label: 'עבודה ותעשייה' },
  { value: 'lab', label: 'אופנה טקטית' },
];

const techOptions = [
  { value: 'polarized', label: 'מקוטבות', tooltip: 'הגנה מסנוור. מסנן החזרי אור ממשטחים ומשפר ניגודיות.' },
  { value: 'photochromic', label: 'פוטוכרומטיות', tooltip: 'עדשות המתכהות אוטומטית בשמש ומתבהרות בצל.' },
  { value: 'blue_light', label: 'סינון אור כחול', tooltip: 'מפחית עייפות עיניים מול מסכים.' },
  { value: 'anti_fog', label: 'נגד ערפול', tooltip: 'ציפוי המונע הצטברות אדים במעברי טמפרטורה.' },
  { value: 'prescription_ready', label: 'מתאים למשקפי ראייה', tooltip: 'מסגרת המאפשרת התקנת עדשות אופטיות.' },
];

const certOptions = [
  { value: 'ANSI_Z87', label: 'ANSI Z87.1+', tooltip: 'תקן בטיחות תעשייתי. עמידות גבוהה בפני פגיעות וחלקיקים.', id: 'ANSI_Z87', isCert: true },
  { value: 'CE_EN166', label: 'CE EN166', tooltip: 'תקן אירופי להגנה על העיניים.', id: 'CE_EN166', isCert: true },
  { value: 'OSHA', label: 'OSHA', tooltip: 'עומד בדרישות הבטיחות התעסוקתית האמריקאית.', id: 'OSHA', isCert: true },
  { value: 'MIL_PRF', label: 'MIL-PRF', tooltip: 'הגנה בליסטית צבאית. עמידות ברסיסים במהירות גבוהה.', id: 'MIL_PRF', isCert: true },
  { value: 'polycarbonate', label: 'פוליקרבונט (POLY)', tooltip: 'עדשות פוליקרבונט. קלות וחזקות פי 10 מפלסטיק רגיל.' },
];

export default function ProductFilters({ filters, setFilters }) {
  const toggleFilter = (key, value) => {
    setFilters(prev => {
      const current = prev[key] || [];
      return {
        ...prev,
        [key]: current.includes(value) ? current.filter(v => v !== value) : [...current, value],
      };
    });
  };

  const clearAll = () => setFilters({ categories: [], techs: [], certs: [] });
  const hasFilters = (filters.categories?.length || 0) + (filters.techs?.length || 0) + (filters.certs?.length || 0) > 0;

  const FilterChip = ({ active, label, onClick, tooltip, isCert, certId }) => {
    const button = (
      <button
        onClick={onClick}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
          active
            ? 'bg-primary text-white border-primary shadow-sm'
            : 'bg-card text-foreground border-border hover:border-primary/50 hover:bg-muted/50'
        }`}
      >
        {active && <Check className="w-3.5 h-3.5" />}
        {isCert ? (
          <div className="flex items-center gap-2">
            {getCertLogo(certId, `h-4 w-auto ${active ? 'text-white' : 'text-muted-foreground'}`)}
            <span className="sr-only">{label}</span>
          </div>
        ) : (
          label
        )}
        {tooltip && <Info className="w-3 h-3 opacity-50" />}
      </button>
    );

    if (!tooltip) return button;

    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px] text-right" dir="rtl">
            <p className="text-xs leading-relaxed">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="space-y-5" dir="rtl">
      {hasFilters && (
        <button onClick={clearAll} className="flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold">
          <X className="w-3.5 h-3.5" /> נקה הכל
        </button>
      )}

      <div>
        <h4 className="font-heading text-[11px] uppercase tracking-widest text-muted-foreground mb-2.5 font-bold">שימוש</h4>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <FilterChip
              key={cat.value}
              active={filters.categories?.includes(cat.value)}
              label={cat.label}
              tooltip={cat.tooltip}
              onClick={() => toggleFilter('categories', cat.value)}
            />
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-heading text-[11px] uppercase tracking-widest text-muted-foreground mb-2.5 font-bold">סוג עדשות</h4>
        <div className="flex flex-wrap gap-2">
          {techOptions.map(tech => (
            <FilterChip
              key={tech.value}
              active={filters.techs?.includes(tech.value)}
              label={tech.label}
              tooltip={tech.tooltip}
              onClick={() => toggleFilter('techs', tech.value)}
            />
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-heading text-[11px] uppercase tracking-widest text-muted-foreground mb-2.5 font-bold">
          <Shield className="w-3.5 h-3.5 inline ml-1" />
          תקני עמידות
        </h4>
        <div className="flex flex-wrap gap-2">
          {certOptions.map(cert => (
            <FilterChip
              key={cert.value}
              active={filters.certs?.includes(cert.value)}
              label={cert.label}
              tooltip={cert.tooltip}
              isCert={cert.isCert}
              certId={cert.id}
              onClick={() => toggleFilter('certs', cert.value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}