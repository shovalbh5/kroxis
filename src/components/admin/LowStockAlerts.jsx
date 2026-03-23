import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function LowStockAlerts({ products }) {
  const lowStock = products
    .filter(p => p.stock_level !== undefined && p.stock_level < 10)
    .sort((a, b) => (a.stock_level || 0) - (b.stock_level || 0));

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-destructive" />
        <h3 className="font-heading text-lg font-bold">התראות מלאי</h3>
      </div>
      {lowStock.length === 0 ? (
        <p className="text-sm text-muted-foreground">כל המלאי תקין ✓</p>
      ) : (
        <div className="space-y-2">
          {lowStock.map(p => {
            const level = p.stock_level || 0;
            const color = level === 0 ? 'bg-red-500' : level < 5 ? 'bg-orange-400' : 'bg-yellow-400';
            return (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm font-medium truncate flex-1">{p.title}</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                  <span className="text-sm font-bold w-8 text-left">{level}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}