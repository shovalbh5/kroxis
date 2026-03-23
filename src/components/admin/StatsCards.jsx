import React from 'react';
import { DollarSign, ShoppingBag, Users, TrendingUp, TrendingDown } from 'lucide-react';

function StatCard({ label, value, change, icon: Icon, changeLabel }) {
  const isPositive = change >= 0;
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <div className="text-2xl sm:text-3xl font-heading font-bold">{value}</div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {isPositive ? '+' : ''}{change}% {changeLabel || 'מאתמול'}
        </div>
      )}
    </div>
  );
}

export default function StatsCards({ orders, todayTraffic, yesterdayTraffic }) {
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const orderCount = orders.length;
  const aov = orderCount > 0 ? totalRevenue / orderCount : 0;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const todayOrders = orders.filter(o => o.created_date?.startsWith(today));
  const yesterdayOrders = orders.filter(o => o.created_date?.startsWith(yesterday));

  const todayRev = todayOrders.reduce((s, o) => s + (o.total || 0), 0);
  const yesterdayRev = yesterdayOrders.reduce((s, o) => s + (o.total || 0), 0);
  const revChange = yesterdayRev > 0 ? Math.round(((todayRev - yesterdayRev) / yesterdayRev) * 100) : 0;

  const trafficChange = yesterdayTraffic > 0 ? Math.round(((todayTraffic - yesterdayTraffic) / yesterdayTraffic) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="הכנסות היום" value={`₪${todayRev.toLocaleString()}`} change={revChange} icon={DollarSign} />
      <StatCard label="הזמנות" value={orderCount} icon={ShoppingBag} />
      <StatCard label="ממוצע הזמנה (AOV)" value={`₪${aov.toFixed(0)}`} icon={TrendingUp} />
      <StatCard label="מבקרים היום" value={todayTraffic} change={trafficChange} icon={Users} />
    </div>
  );
}