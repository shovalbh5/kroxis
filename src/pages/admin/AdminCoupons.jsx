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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">קופונים ומבצעים</h1>
        <Button onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4 mr-2" /> צור קופון חדש</Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-sm">
                <th className="pb-3 font-medium">קוד קופון</th>
                <th className="pb-3 font-medium">סוג</th>
                <th className="pb-3 font-medium">ערך</th>
                <th className="pb-3 font-medium">מינימום הזמנה</th>
                <th className="pb-3 font-medium">שימושים</th>
                <th className="pb-3 font-medium">סטטוס</th>
                <th className="pb-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan="7" className="py-8 text-center text-muted-foreground">טוען קופונים...</td></tr>
              ) : coupons.length === 0 ? (
                <tr><td colSpan="7" className="py-8 text-center text-muted-foreground">לא נמצאו קופונים</td></tr>
              ) : (
                coupons.map(coupon => (
                  <tr key={coupon.id} className="group hover:bg-muted/50 transition-colors">
                    <td className="py-3 font-mono font-bold text-primary">{coupon.code}</td>
                    <td className="py-3">
                      {coupon.type === 'percentage' ? 'אחוזים (%)' : 
                       coupon.type === 'fixed_amount' ? 'סכום קבוע (₪)' : 
                       coupon.type === 'free_shipping' ? 'משלוח חינם' : coupon.type}
                    </td>
                    <td className="py-3 font-medium">
                      {coupon.type === 'percentage' ? `${coupon.value}%` : 
                       coupon.type === 'fixed_amount' ? `₪${coupon.value}` : '-'}
                    </td>
                    <td className="py-3">₪{coupon.min_order_amount || 0}</td>
                    <td className="py-3">{coupon.used_count || 0}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${coupon.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {coupon.is_active ? 'פעיל' : 'לא פעיל'}
                      </span>
                    </td>
                    <td className="py-3">
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
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