import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Package, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function MyAccount() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders', user?.email],
    queryFn: () => base44.entities.Order.filter({ customer_email: user?.email }, '-created_date'),
    enabled: !!user?.email,
  });

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-background p-6">
        <User className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-heading mb-4 text-center">התחבר לאזור האישי</h1>
        <Button onClick={() => base44.auth.redirectToLogin()}>התחברות / הרשמה</Button>
      </div>
    );
  }

  const statusMap = {
    pending: { label: 'ממתין', color: 'bg-yellow-500/10 text-yellow-500' },
    processing: { label: 'בטיפול', color: 'bg-blue-500/10 text-blue-500' },
    shipped: { label: 'נשלח', color: 'bg-purple-500/10 text-purple-500' },
    delivered: { label: 'נמסר', color: 'bg-green-500/10 text-green-500' },
    cancelled: { label: 'בוטל', color: 'bg-red-500/10 text-red-500' },
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold">האזור האישי שלי</h1>
            <p className="text-muted-foreground mt-1">שלום, {user.full_name}</p>
          </div>
          <Button variant="outline" onClick={() => base44.auth.logout()} className="gap-2">
            <LogOut className="w-4 h-4" /> התנתק
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-primary" /> פרטי חשבון
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">שם מלא</p>
                <p className="font-medium">{user.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">אימייל</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" /> ההזמנות שלי
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">טוען הזמנות...</div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  עדיין לא ביצעת הזמנות
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-border rounded-lg p-4 flex flex-col sm:flex-row justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-bold">הזמנה #{order.id.slice(-6).toUpperCase()}</span>
                          <Badge className={statusMap[order.status]?.color || 'bg-muted'}>
                            {statusMap[order.status]?.label || order.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(order.created_date), 'dd/MM/yyyy')} • {order.items?.length || 0} פריטים
                        </p>
                      </div>
                      <div className="text-right sm:text-left">
                        <p className="font-bold text-lg">₪{order.total}</p>
                        {order.tracking_number && (
                          <p className="text-xs text-primary mt-1">מעקב: {order.tracking_number}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}