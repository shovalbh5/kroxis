import React from 'react';
import { Badge } from '@/components/ui/badge';

const statusColors = {
  pending: 'bg-yellow-500/10 text-yellow-600',
  processing: 'bg-blue-500/10 text-blue-600',
  shipped: 'bg-purple-500/10 text-purple-600',
  delivered: 'bg-green-500/10 text-green-600',
  cancelled: 'bg-red-500/10 text-red-600',
};

const statusLabels = {
  pending: 'ממתין',
  processing: 'בטיפול',
  shipped: 'נשלח',
  delivered: 'נמסר',
  cancelled: 'בוטל',
};

export default function RecentOrders({ orders }) {
  const recent = orders.slice(0, 10);

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-heading text-lg font-bold mb-4">הזמנות אחרונות</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground text-right border-b border-border">
              <th className="pb-2 font-medium">לקוח</th>
              <th className="pb-2 font-medium">סכום</th>
              <th className="pb-2 font-medium">סטטוס</th>
              <th className="pb-2 font-medium hidden sm:table-cell">תאריך</th>
              <th className="pb-2 font-medium hidden sm:table-cell">סוג</th>
            </tr>
          </thead>
          <tbody>
            {recent.map(order => (
              <tr key={order.id} className="border-b border-border last:border-0">
                <td className="py-2.5 font-medium truncate max-w-[120px]">{order.customer_name || order.customer_email || '—'}</td>
                <td className="py-2.5 font-bold">₪{(order.total || 0).toLocaleString()}</td>
                <td className="py-2.5">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || ''}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </td>
                <td className="py-2.5 text-muted-foreground hidden sm:table-cell">
                  {order.created_date ? new Date(order.created_date).toLocaleDateString('he-IL') : '—'}
                </td>
                <td className="py-2.5 hidden sm:table-cell">
                  {order.is_b2b ? <Badge variant="outline" className="text-[10px]">B2B</Badge> : <span className="text-xs text-muted-foreground">B2C</span>}
                </td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">אין הזמנות עדיין</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}