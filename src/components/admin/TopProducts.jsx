import React, { useMemo } from 'react';
import { Trophy } from 'lucide-react';

export default function TopProducts({ orders, products }) {
  const top5 = useMemo(() => {
    const counts = {};
    orders.forEach(order => {
      order.items?.forEach(item => {
        const id = item.product_id;
        if (!counts[id]) counts[id] = { id, title: item.title || 'מוצר', qty: 0, revenue: 0 };
        counts[id].qty += item.quantity || 1;
        counts[id].revenue += (item.price || 0) * (item.quantity || 1);
      });
    });
    return Object.values(counts).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [orders]);

  const maxQty = top5[0]?.qty || 1;

  return (
    <div className="bg-background border border-border/50 rounded-2xl p-6 sm:p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-2 mb-6 border-b border-border/50 pb-4">
        <Trophy className="w-5 h-5 text-primary" />
        <h3 className="font-heading text-lg font-bold tracking-tight">מוצרים מובילים</h3>
      </div>
      <div className="space-y-3">
        {top5.length === 0 && <p className="text-sm text-muted-foreground">אין נתונים עדיין</p>}
        {top5.map((p, i) => (
          <div key={p.id} className="flex items-center gap-3">
            <span className="text-sm font-bold text-muted-foreground w-5">{i + 1}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium truncate">{p.title}</span>
                <span className="text-xs text-muted-foreground">{p.qty} יח׳</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${(p.qty / maxQty) * 100}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}