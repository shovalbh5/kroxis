import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';

const CATEGORIES = [
  { value: 'all', label: 'הכל' },
  { value: 'construction', label: 'בנייה' },
  { value: 'lab', label: 'מעבדה' },
  { value: 'outdoor', label: 'שטח' },
  { value: 'general', label: 'כללי' },
];

export default function TryOnProductPanel({ products, selectedId, onSelect }) {
  const [category, setCategory] = useState('all');

  const filtered = category === 'all'
    ? products
    : products.filter(p => p.category === category);

  return (
    <div className="flex flex-col h-full bg-black/60 backdrop-blur-md border-l border-white/10">
      {/* Category tabs */}
      <div className="p-3 border-b border-white/10">
        <p className="text-white/50 text-xs font-heading tracking-widest mb-2 text-right" dir="rtl">קטגוריה</p>
        <div className="flex flex-wrap gap-1.5" dir="rtl">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors font-medium ${
                category === cat.value
                  ? 'bg-primary text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filtered.map(product => (
          <button
            key={product.id}
            onClick={() => onSelect(product)}
            className={`w-full flex items-center gap-2.5 p-2 rounded-lg transition-all text-right ${
              selectedId === product.id
                ? 'bg-primary/20 border border-primary/40'
                : 'bg-white/5 hover:bg-white/10 border border-transparent'
            }`}
            dir="rtl"
          >
            <div className="w-14 h-14 rounded-md bg-white/10 flex-shrink-0 overflow-hidden">
              {product.images?.[0] && (
                <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{product.title}</p>
              <p className="text-primary text-xs font-bold mt-0.5">₪{product.price?.toFixed(0)}</p>
              {product.is_bestseller && (
                <Badge className="mt-0.5 text-[10px] px-1.5 py-0 h-4">מוביל</Badge>
              )}
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-white/40 text-xs text-center py-6">אין מוצרים בקטגוריה זו</p>
        )}
      </div>
    </div>
  );
}