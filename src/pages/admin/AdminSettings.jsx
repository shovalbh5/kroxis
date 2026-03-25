import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Save, Settings, Truck, Calculator, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';

export default function AdminSettings() {
  const queryClient = useQueryClient();

  const { data: settingsList = [], isLoading } = useQuery({
    queryKey: ['admin-store-settings'],
    queryFn: () => base44.entities.StoreSettings.list(),
  });

  const settings = settingsList[0] || {};

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (settings.id) {
        return base44.entities.StoreSettings.update(settings.id, data);
      }
      return base44.entities.StoreSettings.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-store-settings']);
      toast({ title: "הגדרות נשמרו בהצלחה" });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      store_name: formData.get('store_name'),
      contact_email: formData.get('contact_email'),
      contact_phone: formData.get('contact_phone'),
      shipping_fee: parseFloat(formData.get('shipping_fee')) || 0,
      free_shipping_threshold: parseFloat(formData.get('free_shipping_threshold')) || 0,
      tax_rate: parseFloat(formData.get('tax_rate')) || 0,
      currency: formData.get('currency') || 'ILS'
    };
    saveMutation.mutate(data);
  };

  if (isLoading) {
    return <div className="p-8 text-center">טוען הגדרות...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6" /> הגדרות חנות
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* פרטי חנות */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-border pb-2">
            <Phone className="w-5 h-5 text-primary" /> פרטי התקשרות וחנות
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">שם החנות</label>
              <Input name="store_name" defaultValue={settings.store_name || 'KROXIS'} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">מטבע</label>
              <select name="currency" defaultValue={settings.currency || 'ILS'} className="w-full h-10 px-3 rounded-md border border-input bg-background">
                <option value="ILS">שקל חדש (₪)</option>
                <option value="USD">דולר אמריקאי ($)</option>
                <option value="EUR">אירו (€)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">אימייל שירות לקוחות</label>
              <Input name="contact_email" type="email" defaultValue={settings.contact_email} dir="ltr" className="text-left" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">טלפון שירות לקוחות</label>
              <Input name="contact_phone" defaultValue={settings.contact_phone} dir="ltr" className="text-left" />
            </div>
          </div>
        </div>

        {/* משלוחים */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-border pb-2">
            <Truck className="w-5 h-5 text-primary" /> הגדרות משלוח
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">עלות משלוח רגיל (₪)</label>
              <Input name="shipping_fee" type="number" step="0.01" defaultValue={settings.shipping_fee ?? 35} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">משלוח חינם מעל סכום (₪)</label>
              <Input name="free_shipping_threshold" type="number" step="0.01" defaultValue={settings.free_shipping_threshold ?? 300} />
              <p className="text-xs text-muted-foreground">השאר 0 כדי לבטל משלוח חינם</p>
            </div>
          </div>
        </div>

        {/* מיסים */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-border pb-2">
            <Calculator className="w-5 h-5 text-primary" /> מיסים ומע"מ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">אחוז מס / מע"מ (%)</label>
              <Input name="tax_rate" type="number" step="0.01" defaultValue={settings.tax_rate ?? 17} />
              <p className="text-xs text-muted-foreground">הכנס 17 עבור 17% מע"מ</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={saveMutation.isPending} className="w-full md:w-auto">
            <Save className="w-5 h-5 mr-2" />
            {saveMutation.isPending ? 'שומר...' : 'שמור הגדרות'}
          </Button>
        </div>
      </form>
    </div>
  );
}