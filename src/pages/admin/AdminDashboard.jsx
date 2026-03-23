import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatsCards from '@/components/admin/StatsCards';
import SalesChart from '@/components/admin/SalesChart';
import TopProducts from '@/components/admin/TopProducts';
import LowStockAlerts from '@/components/admin/LowStockAlerts';
import B2bSplit from '@/components/admin/B2bSplit';
import RecentOrders from '@/components/admin/RecentOrders';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const { data: orders = [], refetch: refetchOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 200),
    enabled: user?.role === 'admin',
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => base44.entities.Product.list('-created_date', 200),
    enabled: user?.role === 'admin',
  });

  const { data: trafficToday = [], isLoading: trafficLoading } = useQuery({
    queryKey: ['admin-traffic-today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      return base44.entities.TrafficLog.filter({ created_date: { $gte: today } });
    },
    enabled: user?.role === 'admin',
  });

  const { data: trafficYesterday = [] } = useQuery({
    queryKey: ['admin-traffic-yesterday'],
    queryFn: async () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];
      return base44.entities.TrafficLog.filter({ created_date: { $gte: yesterday, $lt: today } });
    },
    enabled: user?.role === 'admin',
  });

  // Real-time order updates
  useEffect(() => {
    if (user?.role !== 'admin') return;
    const unsub = base44.entities.Order.subscribe(() => refetchOrders());
    return unsub;
  }, [user, refetchOrders]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <div className="text-center p-8">
          <h1 className="font-heading text-3xl font-bold mb-2">גישה חסומה</h1>
          <p className="text-muted-foreground">דף זה זמין למנהלים בלבד.</p>
        </div>
      </div>
    );
  }

  const isLoading = ordersLoading || productsLoading || trafficLoading;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold">לוח בקרה</h1>
              <p className="text-sm text-muted-foreground">שלום, {user.full_name || 'מנהל'}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetchOrders()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} /> רענון
          </Button>
        </div>

        {/* Stats */}
        <StatsCards
          orders={orders}
          todayTraffic={trafficToday.length}
          yesterdayTraffic={trafficYesterday.length}
        />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          <SalesChart orders={orders} />
          <TopProducts orders={orders} products={products} />
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
          <LowStockAlerts products={products} />
          <B2bSplit orders={orders} />
          <div className="lg:col-span-1" />
        </div>

        {/* Orders Table */}
        <div className="mt-6">
          <RecentOrders orders={orders} />
        </div>
      </div>
    </div>
  );
}