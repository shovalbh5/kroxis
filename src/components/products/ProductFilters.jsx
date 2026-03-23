import React from 'react';
import { Shield, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

const categories = [
  { value: 'construction', label: 'Construction' },
  { value: 'lab', label: 'Lab & Medical' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'general', label: 'General' },
];

const techOptions = [
  { value: 'anti_fog', label: 'Anti-Fog' },
  { value: 'polarized', label: 'Polarized' },
  { value: 'blue_light', label: 'Blue Light' },
  { value: 'prescription_ready', label: 'Prescription Ready' },
  { value: 'photochromic', label: 'Photochromic' },
];

const certOptions = [
  { value: 'ANSI_Z87', label: 'ANSI Z87.1+' },
  { value: 'CE_EN166', label: 'CE EN166' },
  { value: 'OSHA', label: 'OSHA' },
  { value: 'MIL_PRF', label: 'MIL-PRF' },
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

  return (
    <div className="space-y-6">
      {hasFilters && (
        <button onClick={clearAll} className="flex items-center gap-1 text-xs text-primary hover:underline">
          <X className="w-3 h-3" /> Clear all filters
        </button>
      )}

      <div>
        <h4 className="font-heading text-xs uppercase tracking-widest text-muted-foreground mb-3">Industry</h4>
        <div className="space-y-2">
          {categories.map(cat => (
            <button
              key={cat.value}
              onClick={() => toggleFilter('categories', cat.value)}
              className={`block w-full text-left text-sm px-3 py-2 rounded-md transition-colors ${
                filters.categories?.includes(cat.value)
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-heading text-xs uppercase tracking-widest text-muted-foreground mb-3">Lens Technology</h4>
        <div className="space-y-2">
          {techOptions.map(tech => (
            <button
              key={tech.value}
              onClick={() => toggleFilter('techs', tech.value)}
              className={`block w-full text-left text-sm px-3 py-2 rounded-md transition-colors ${
                filters.techs?.includes(tech.value)
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              {tech.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-heading text-xs uppercase tracking-widest text-muted-foreground mb-3">
          <Shield className="w-3.5 h-3.5 inline mr-1" />
          Safety Rating
        </h4>
        <div className="flex flex-wrap gap-2">
          {certOptions.map(cert => (
            <Badge
              key={cert.value}
              variant={filters.certs?.includes(cert.value) ? 'default' : 'outline'}
              className="cursor-pointer text-xs"
              onClick={() => toggleFilter('certs', cert.value)}
            >
              {cert.label}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}