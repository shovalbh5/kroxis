import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['hsl(30, 100%, 50%)', 'hsl(0, 0%, 45%)'];

export default function B2bSplit({ orders }) {
  const data = useMemo(() => {
    let b2b = 0, b2c = 0;
    orders.forEach(o => {
      if (o.is_b2b) b2b += o.total || 0;
      else b2c += o.total || 0;
    });
    return [
      { name: 'סיטונאות (B2B)', value: b2b },
      { name: 'קמעונאות (B2C)', value: b2c },
    ];
  }, [orders]);

  const total = data[0].value + data[1].value;

  return (
    <div className="bg-background border border-border/50 rounded-2xl p-6 sm:p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
      <h3 className="font-heading text-lg font-bold mb-6 tracking-tight border-b border-border/50 pb-4">פיצול B2B / B2C</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" outerRadius={70} innerRadius={40} dataKey="value" strokeWidth={2}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
            </Pie>
            <Tooltip formatter={(v) => `₪${v.toLocaleString()}`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-6 mt-2">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
            <span>{d.name} ({total > 0 ? Math.round((d.value / total) * 100) : 0}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}