import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function LowStockAlerts({ products }) {
  const lowStock = products
    .filter(p => p.stock_level !== undefined && p.stock_level < 10)
    .sort((a, b) => (a.stock_level || 0) - (b.stock_level || 0));

  return (
    <div className="bg-background border border-border/50 rounded-2xl p-6 sm:p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-2 mb-6 border-b border-border/50 pb-4">
        <AlertTriangle className="w-5 h-5 text-destructive" />
        <h3 className="font-heading text-lg font-bold tracking-tight">התראות מלאי</h3>
      </div>
      {lowStock.length === 0 ? (
        <p className="text-sm text-muted-foreground">כל המלאי תקין ✓</p>
      ) : (
        <div className="space-y-2">
          {lowStock.map(p => {
            const level = p.stock_level || 0;
            const color = level === 0 ? 'bg-red-500' : level < 5 ? 'bg-orange-400' : 'bg-yellow-400';
            return (
              <div key={p.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors">
                <span className="text-sm font-medium truncate flex-1 text-foreground">{p.title}</span>
                <div className="flex items-center gap-2 bg-background px-2 py-1 rounded-lg border border-border/50 shadow-sm ml-2">
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="text-sm font-bold w-6 text-center">{level}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}