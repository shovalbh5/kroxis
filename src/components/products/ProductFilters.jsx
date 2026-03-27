import React from 'react';
import { Shield, X, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

const categories = [
  { value: 'construction', label: 'צבא ולוחמים' },
  { value: 'outdoor', label: 'שטח ותפעול' },
  { value: 'general', label: 'עבודה ותעשייה' },
  { value: 'lab', label: 'אופנה טקטית' },
];

const techOptions = [
  { value: 'polarized', label: 'מקוטבות' },
  { value: 'photochromic', label: 'פוטוכרומטיות' },
  { value: 'blue_light', label: 'סינון אור כחול' },
  { value: 'anti_fog', label: 'נגד ערפול' },
  { value: 'prescription_ready', label: 'מתאים למשקפי ראייה' },
];

const certOptions = [
  { value: 'ANSI_Z87', label: 'ANSI Z87.1+' },
  { value: 'CE_EN166', label: 'CE EN166' },
  { value: 'OSHA', label: 'OSHA' },
  { value: 'MIL_PRF', label: 'MIL-PRF' },
  { value: 'polycarbonate', label: 'פוליקרבונט (POLY)' },
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

  const FilterChip = ({ active, label, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
        active
          ? 'bg-primary text-white border-primary shadow-sm'
          : 'bg-card text-foreground border-border hover:border-primary/50 hover:bg-muted/50'
      }`}
    >
      {active && <Check className="w-3.5 h-3.5" />}
      {label}
    </button>
  );

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
              onClick={() => toggleFilter('certs', cert.value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}