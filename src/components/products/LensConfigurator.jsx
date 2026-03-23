import React from 'react';
import { Check } from 'lucide-react';

const lensOptions = [
  { value: 'standard', label: 'שקוף סטנדרטי', price: 0, desc: 'פוליקרבונט עמיד בפני פגיעה' },
  { value: 'polarized', label: 'פולארי', price: 30, desc: 'הפחתת סנוור לעבודה בחוץ' },
  { value: 'blue_light', label: 'סינון אור כחול', price: 20, desc: 'הגנה מפני מסכים דיגיטליים' },
];

export default function LensConfigurator({ selected, onChange }) {
  return (
    <div className="space-y-3">
      <h4 className="font-heading text-xs uppercase tracking-widest text-muted-foreground">סוג עדשה</h4>
      <div className="space-y-2">
        {lensOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left ${
              selected === opt.value
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selected === opt.value ? 'border-primary bg-primary' : 'border-border'
              }`}>
                {selected === opt.value && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
              <div>
                <span className="text-sm font-medium">{opt.label}</span>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
            </div>
            {opt.price > 0 && (
              <span className="text-sm font-medium text-primary">+${opt.price}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}