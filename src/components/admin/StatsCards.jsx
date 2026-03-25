import React from 'react';
import { DollarSign, ShoppingBag, Users, TrendingUp, TrendingDown } from 'lucide-react';

function StatCard({ label, value, change, icon: Icon, changeLabel }) {
  const isPositive = change >= 0;
  return (
    <div className="bg-background border border-border/50 rounded-2xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
      <div className="text-3xl sm:text-4xl font-heading font-bold tracking-tight text-foreground">{value}</div>
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