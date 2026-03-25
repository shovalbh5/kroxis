import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Eye, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusTranslations = {
  pending: 'ממתין',
  processing: 'בטיפול',
  shipped: 'נשלח',
  delivered: 'נמסר',
  cancelled: 'בוטל',
};

export default function AdminOrders() {
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders-full'],
    queryFn: () => base44.entities.Order.list('-created_date', 500),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, tracking_number }) => {
      const data = { status };
      if (tracking_number !== undefined) data.tracking_number = tracking_number;
      return base44.entities.Order.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-orders-full']);
      toast({ title: "סטטוס הזמנה עודכן" });
    }
  });

  const filteredOrders = orders.filter(o => 
    o.id.includes(search) || 
    o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleStatusChange = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    updateStatusMutation.mutate({
      id: selectedOrder.id,
      status: formData.get('status'),
      tracking_number: formData.get('tracking_number')
    });
    setSelectedOrder(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">ניהול הזמנות</h1>
        <p className="text-muted-foreground">צפה, נהל ועדכן סטטוסים של הזמנות לקוחות.</p>
      </div>

      <div className="bg-background rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-border/50 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-border/50 bg-muted/5">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="חיפוש לפי מספר הזמנה, שם או אימייל..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 bg-background border-border/50 rounded-xl h-11 focus-visible:ring-primary/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground text-xs uppercase tracking-wider bg-muted/5">
                <th className="px-6 py-4 font-medium">מספר הזמנה</th>
                <th className="px-6 py-4 font-medium">תאריך</th>
                <th className="px-6 py-4 font-medium">לקוח</th>
                <th className="px-6 py-4 font-medium">סכום</th>
                <th className="px-6 py-4 font-medium">סטטוס</th>
                <th className="px-6 py-4 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan="6" className="py-8 text-center text-muted-foreground">טוען הזמנות...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan="6" className="py-8 text-center text-muted-foreground">לא נמצאו הזמנות</td></tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="group hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-muted-foreground">#{order.id.slice(-6).toUpperCase()}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{format(new Date(order.created_date), 'dd/MM/yyyy HH:mm')}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{order.customer_name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{order.customer_email}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">₪{order.total?.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status || 'pending']}`}>
                        {statusTranslations[order.status || 'pending']}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="sm" className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => setSelectedOrder(order)}>
                        <Eye className="w-4 h-4 ml-2" /> צפה ונהל
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        {selectedOrder && (
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                הזמנה #{selectedOrder.id.slice(-6).toUpperCase()}
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedOrder.status || 'pending']}`}>
                  {statusTranslations[selectedOrder.status || 'pending']}
                </span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {/* פרטי לקוח ומשלוח */}
              <div className="space-y-4 bg-muted/30 p-4 rounded-lg border border-border">
                <h3 className="font-bold text-lg border-b border-border pb-2">פרטי לקוח ומשלוח</h3>
                <div>
                  <p className="text-sm text-muted-foreground">שם:</p>
                  <p className="font-medium">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">אימייל:</p>
                  <p className="font-medium">{selectedOrder.customer_email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">טלפון:</p>
                  <p className="font-medium">{selectedOrder.customer_phone || 'לא הוזן'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">כתובת למשלוח:</p>
                  <p className="font-medium whitespace-pre-wrap">{selectedOrder.shipping_address}</p>
                </div>
                {selectedOrder.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">הערות להזמנה:</p>
                    <p className="font-medium text-amber-600 bg-amber-50 p-2 rounded">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>

              {/* עדכון סטטוס */}
              <div className="space-y-4 bg-muted/30 p-4 rounded-lg border border-border">
                <h3 className="font-bold text-lg border-b border-border pb-2">ניהול הזמנה</h3>
                <form onSubmit={handleStatusChange} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">עדכן סטטוס</label>
                    <select name="status" defaultValue={selectedOrder.status || 'pending'} className="w-full h-10 px-3 rounded-md border border-input bg-background">
                      <option value="pending">ממתין</option>
                      <option value="processing">בטיפול</option>
                      <option value="shipped">נשלח</option>
                      <option value="delivered">נמסר</option>
                      <option value="cancelled">בוטל</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">מספר מעקב (אופציונלי)</label>
                    <Input name="tracking_number" defaultValue={selectedOrder.tracking_number || ''} dir="ltr" className="text-left" placeholder="e.g. RR123456789IL" />
                  </div>
                  <Button type="submit" className="w-full">עדכן הזמנה</Button>
                </form>
              </div>

              {/* פריטים */}
              <div className="md:col-span-2 space-y-4 bg-muted/30 p-4 rounded-lg border border-border">
                <h3 className="font-bold text-lg border-b border-border pb-2">פריטים בהזמנה</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-background p-3 rounded border border-border">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.lens_option && `עדשות: ${item.lens_option}`}
                          {item.color && ` | צבע: ${item.color}`}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="font-medium">₪{item.price} x {item.quantity}</p>
                        <p className="font-bold">₪{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-3 mt-3 text-left space-y-1">
                  <p className="text-sm text-muted-foreground">סכום ביניים: ₪{selectedOrder.subtotal?.toFixed(2)}</p>
                  {selectedOrder.discount_amount > 0 && <p className="text-sm text-green-600">הנחה: -₪{selectedOrder.discount_amount?.toFixed(2)}</p>}
                  <p className="text-sm text-muted-foreground">משלוח: ₪{selectedOrder.shipping_cost?.toFixed(2)}</p>
                  <p className="text-xl font-bold mt-2">סה"כ לתשלום: ₪{selectedOrder.total?.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}