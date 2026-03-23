import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tag, X, Check, Loader2 } from 'lucide-react';

export default function CouponInput({ cartTotal, cartItems, onApply, appliedCoupon }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');

    const coupons = await base44.entities.Coupon.filter({ code: code.trim().toUpperCase(), is_active: true });

    if (coupons.length === 0) {
      setError('קוד קופון לא תקין');
      setLoading(false);
      return;
    }

    const coupon = coupons[0];

    // Check expiration
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      setError('הקופון פג תוקף');
      setLoading(false);
      return;
    }

    // Check max uses
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      setError('הקופון מוצה');
      setLoading(false);
      return;
    }

    // Check min order
    if (coupon.min_order_amount && cartTotal < coupon.min_order_amount) {
      setError(`סכום מינימלי להזמנה: $${coupon.min_order_amount}`);
      setLoading(false);
      return;
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = cartTotal * (coupon.value / 100);
    } else if (coupon.type === 'fixed_amount') {
      discount = Math.min(coupon.value, cartTotal);
    } else if (coupon.type === 'free_shipping') {
      discount = 0; // handled separately
    } else if (coupon.type === 'bogo') {
      // BOGO: cheapest item free for every buy_qty+get_qty items
      const sortedByPrice = [...cartItems].sort((a, b) => a.price - b.price);
      const totalQty = sortedByPrice.reduce((sum, i) => sum + i.quantity, 0);
      const bogoSet = (coupon.bogo_buy_quantity || 1) + (coupon.bogo_get_quantity || 1);
      const freeItems = Math.floor(totalQty / bogoSet) * (coupon.bogo_get_quantity || 1);
      let freeCount = 0;
      for (const item of sortedByPrice) {
        if (freeCount >= freeItems) break;
        const qty = Math.min(item.quantity, freeItems - freeCount);
        discount += qty * item.price;
        freeCount += qty;
      }
    }

    onApply({ ...coupon, calculatedDiscount: discount });
    setLoading(false);
  };

  const handleRemove = () => {
    onApply(null);
    setCode('');
    setError('');
  };

  if (appliedCoupon) {
    return (
      <div className="flex items-center justify-between bg-primary/10 border border-primary/30 rounded-lg px-4 py-3">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold">{appliedCoupon.code}</span>
          <span className="text-xs text-muted-foreground">
            {appliedCoupon.type === 'percentage' && `${appliedCoupon.value}% הנחה`}
            {appliedCoupon.type === 'fixed_amount' && `$${appliedCoupon.value} הנחה`}
            {appliedCoupon.type === 'bogo' && 'קנה וקבל'}
            {appliedCoupon.type === 'free_shipping' && 'משלוח חינם'}
          </span>
        </div>
        <button onClick={handleRemove} className="text-muted-foreground hover:text-destructive">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="קוד קופון"
            className="pr-10"
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          />
        </div>
        <Button onClick={handleApply} variant="outline" className="border-2 font-bold" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'החל'}
        </Button>
      </div>
      {error && <p className="text-destructive text-xs mt-1">{error}</p>}
    </div>
  );
}