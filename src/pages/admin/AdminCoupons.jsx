import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

export default function AdminCoupons() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => base44.entities.Coupon.list('-created_date', 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Coupon.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-coupons']);
      toast({ title: "קופון נמחק" });
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Coupon.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-coupons']);
      setIsDialogOpen(false);
      toast({ title: "קופון נוצר בהצלחה" });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      code: formData.get('code').toUpperCase(),
      type: formData.get('type'),
      value: parseFloat(formData.get('value')),
      min_order_amount: parseFloat(formData.get('min_order_amount')) || 0,
      is_active: true
    };
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">קופונים ומבצעים</h1>
          <p className="text-muted-foreground">נהל קודי הנחה, מבצעים וקופונים ללקוחות.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="rounded-full px-6 shadow-md hover:shadow-lg transition-all"><Plus className="w-4 h-4 mr-2" /> צור קופון חדש</Button>
      </div>

      <div className="bg-background rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground text-xs uppercase tracking-wider bg-muted/5">
                <th className="px-6 py-4 font-medium">קוד קופון</th>
                <th className="px-6 py-4 font-medium">סוג</th>
                <th className="px-6 py-4 font-medium">ערך</th>
                <th className="px-6 py-4 font-medium">מינימום הזמנה</th>
                <th className="px-6 py-4 font-medium">שימושים</th>
                <th className="px-6 py-4 font-medium">סטטוס</th>
                <th className="px-6 py-4 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan="7" className="py-8 text-center text-muted-foreground">טוען קופונים...</td></tr>
              ) : coupons.length === 0 ? (
                <tr><td colSpan="7" className="py-8 text-center text-muted-foreground">לא נמצאו קופונים</td></tr>
              ) : (
                coupons.map(coupon => (
                  <tr key={coupon.id} className="group hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-primary bg-primary/5 rounded-r-xl my-2 inline-block">{coupon.code}</td>
                    <td className="px-6 py-4 text-foreground">
                      {coupon.type === 'percentage' ? 'אחוזים (%)' : 
                       coupon.type === 'fixed_amount' ? 'סכום קבוע (₪)' : 
                       coupon.type === 'free_shipping' ? 'משלוח חינם' : coupon.type}
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      {coupon.type === 'percentage' ? `${coupon.value}%` : 
                       coupon.type === 'fixed_amount' ? `₪${coupon.value}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">₪{coupon.min_order_amount || 0}</td>
                    <td className="px-6 py-4 text-muted-foreground">{coupon.used_count || 0}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${coupon.is_active ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                        {coupon.is_active ? 'פעיל' : 'לא פעיל'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive/70 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                        if (window.confirm('למחוק את הקופון?')) deleteMutation.mutate(coupon.id);
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>יצירת קופון חדש</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">קוד קופון (באנגלית/מספרים)</label>
              <Input name="code" required dir="ltr" className="text-left uppercase" placeholder="e.g. SUMMER20" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">סוג הנחה</label>
              <select name="type" className="w-full h-10 px-3 rounded-md border border-input bg-background">
                <option value="percentage">אחוזים (%)</option>
                <option value="fixed_amount">סכום קבוע (₪)</option>
                <option value="free_shipping">משלוח חינם</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">ערך ההנחה (אחוז או שקלים)</label>
              <Input name="value" type="number" step="0.01" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">מינימום סכום הזמנה (אופציונלי)</label>
              <Input name="min_order_amount" type="number" step="0.01" defaultValue="0" />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>ביטול</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'יוצר...' : 'צור קופון'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}