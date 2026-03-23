import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SalesChart({ orders }) {
  const chartData = useMemo(() => {
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric' });
      const dayOrders = orders.filter(o => o.created_date?.startsWith(key));
      const revenue = dayOrders.reduce((s, o) => s + (o.total || 0), 0);
      last7.push({ name: label, revenue, orders: dayOrders.length });
    }
    return last7;
  }, [orders]);

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-heading text-lg font-bold mb-4">מכירות - 7 ימים אחרונים</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
              formatter={(value) => [`₪${value.toLocaleString()}`, 'הכנסות']}
            />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}