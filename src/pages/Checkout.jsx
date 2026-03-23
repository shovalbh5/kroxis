import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, ShieldCheck, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { useCart } from '@/context/CartContext';
import CouponInput from '@/components/checkout/CouponInput';
import { motion } from 'framer-motion';

export default function Checkout() {
  const { items, subtotal, freeShipping, clearCart } = useCart();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_address: '',
  });

  const couponDiscount = appliedCoupon?.calculatedDiscount || 0;
  const isFreeShippingCoupon = appliedCoupon?.type === 'free_shipping';
  const shippingCost = (freeShipping || isFreeShippingCoupon) ? 0 : 9.99;
  const total = subtotal - couponDiscount + shippingCost;

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const orderItems = items.map(item => ({
      product_id: item.product_id,
      title: item.title,
      price: item.price + item.lens_surcharge,
      quantity: item.quantity,
      lens_option: item.lens_option,
      color: item.color,
    }));

    // Update coupon usage
    if (appliedCoupon) {
      await base44.entities.Coupon.update(appliedCoupon.id, { used_count: (appliedCoupon.used_count || 0) + 1 });
    }

    await base44.entities.Order.create({
      ...form,
      items: orderItems,
      subtotal,
      shipping_cost: shippingCost,
      discount_amount: couponDiscount,
      total,
      status: 'pending',
      is_b2b: false,
      notes: appliedCoupon ? `קופון: ${appliedCoupon.code}` : '',
    });

    clearCart();
    setOrderPlaced(true);
    setIsSubmitting(false);
    toast({ title: 'ההזמנה אושרה!', description: 'תודה שבחרת ב-KROXIS.' });
  };

  if (orderPlaced) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <ShieldCheck className="w-16 h-16 text-primary mx-auto mb-6" />
          <h1 className="font-heading text-3xl uppercase tracking-tight mb-4">ההזמנה אושרה</h1>
          <p className="text-muted-foreground mb-8">תודה שבחרת ב-KROXIS. תקבל מייל אישור בקרוב.</p>
          <Button asChild><Link to="/shop">המשך קנייה</Link></Button>
        </motion.div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground text-lg mb-4">העגלה ריקה</p>
        <Button asChild><Link to="/shop">לחנות</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> המשך קנייה
      </Link>

      <h1 className="font-heading text-3xl uppercase tracking-tight mb-8">תשלום</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-6">
          <div className="space-y-4">
            <h2 className="font-heading text-sm uppercase tracking-widest text-muted-foreground">פרטי קשר</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">שם מלא</Label>
                <Input id="name" required value={form.customer_name} onChange={e => handleChange('customer_name', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="email">אימייל</Label>
                <Input id="email" type="email" required value={form.customer_email} onChange={e => handleChange('customer_email', e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">טלפון</Label>
              <Input id="phone" value={form.customer_phone} onChange={e => handleChange('customer_phone', e.target.value)} />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h2 className="font-heading text-sm uppercase tracking-widest text-muted-foreground">כתובת למשלוח</h2>
            <div>
              <Label htmlFor="address">כתובת מלאה</Label>
              <Input id="address" required value={form.shipping_address} onChange={e => handleChange('shipping_address', e.target.value)} placeholder="רחוב, עיר, מיקוד, מדינה" />
            </div>
          </div>

          <Separator />

          <Button type="submit" disabled={isSubmitting} className="w-full h-13 font-heading uppercase tracking-wider text-sm">
            <Lock className="w-4 h-4 mr-2" />
            {isSubmitting ? 'מעבד...' : `ביצוע הזמנה — $${total.toFixed(2)}`}
          </Button>

          <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" /> תשלום מאובטח · הצפנת SSL
          </p>
        </form>

        {/* Order summary */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-lg p-6 sticky top-28">
            <h2 className="font-heading text-sm uppercase tracking-widest text-muted-foreground mb-4">סיכום הזמנה</h2>
            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={`${item.product_id}-${item.lens_option}`} className="flex justify-between text-sm">
                  <div>
                    <p className="font-medium">{item.title} × {item.quantity}</p>
                    {item.lens_option !== 'standard' && (
                      <p className="text-xs text-primary capitalize">{item.lens_option.replace('_', ' ')}</p>
                    )}
                  </div>
                  <span>${((item.price + item.lens_surcharge) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            {/* Coupon */}
            <div className="mb-4">
              <CouponInput
                cartTotal={subtotal}
                cartItems={items}
                onApply={setAppliedCoupon}
                appliedCoupon={appliedCoupon}
              />
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">סכום ביניים</span><span>${subtotal.toFixed(2)}</span></div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-primary"><span>הנחת קופון</span><span>-${couponDiscount.toFixed(2)}</span></div>
              )}
              <div className="flex justify-between"><span className="text-muted-foreground">משלוח</span><span>{(freeShipping || isFreeShippingCoupon) ? 'חינם' : `$${shippingCost.toFixed(2)}`}</span></div>
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between font-heading text-lg">
              <span>סה״כ</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}