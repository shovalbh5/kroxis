import React from 'react';
import { Shield, Lock, Truck, RefreshCw, Award } from 'lucide-react';

const badges = [
  { icon: Shield, label: 'UV400 הגנה מלאה' },
  { icon: Award, label: 'עמידות MIL-STD' },
  { icon: Lock, label: 'תשלום מאובטח' },
  { icon: Truck, label: 'משלוח חינם 500₪+' },
  { icon: RefreshCw, label: '30 יום החזרה' },
];

export default function TrustBadges() {
  return (
    <div className="flex flex-wrap items-center gap-3 py-4 border-t border-border" dir="rtl">
      {badges.map((badge) => (
        <div key={badge.label} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted/50 rounded-md">
          <badge.icon className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{badge.label}</span>
        </div>
      ))}
    </div>
  );
}