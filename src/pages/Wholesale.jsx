import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Building2, Users, TrendingDown, CheckCircle, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

const pricingTiers = [
  { min: 10, max: 49, discount: 10, label: 'Bronze' },
  { min: 50, max: 99, discount: 15, label: 'Silver' },
  { min: 100, max: 499, discount: 20, label: 'Gold' },
  { min: 500, max: Infinity, discount: 25, label: 'Platinum' },
];

export default function Wholesale() {
  const { toast } = useToast();
  const [step, setStep] = useState('browse'); // browse | request | success
  const [selectedProducts, setSelectedProducts] = useState({});
  const [form, setForm] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    industry: '',
    message: '',
  });

  const { data: products } = useQuery({
    queryKey: ['wholesale-products'],
    queryFn: () => base44.entities.Product.list('-created_date', 100),
    initialData: [],
  });

  const createRequestMutation = useMutation({
    mutationFn: (data) => base44.entities.WholesaleRequest.create(data),
    onSuccess: () => {
      setStep('success');
      toast({ title: 'הבקשה נשלחה!', description: 'צוות ה-B2B שלנו ייצור קשר תוך 24 שעות.' });
    },
  });

  const totalQuantity = Object.values(selectedProducts).reduce((sum, qty) => sum + qty, 0);
  const currentTier = pricingTiers.find(t => totalQuantity >= t.min && totalQuantity <= t.max);

  const calculatePrice = (basePrice, quantity) => {
    if (!quantity) return basePrice;
    const tier = pricingTiers.find(t => quantity >= t.min && quantity <= t.max);
    return basePrice * (1 - (tier?.discount || 0) / 100);
  };

  const handleQuantityChange = (productId, delta) => {
    setSelectedProducts(prev => {
      const current = prev[productId] || 0;
      const newQty = Math.max(0, current + delta);
      if (newQty === 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: newQty };
    });
  };

  const handleSubmitRequest = (e) => {
    e.preventDefault();
    const productIds = Object.keys(selectedProducts);
    createRequestMutation.mutate({
      ...form,
      products_interested: productIds,
      estimated_annual_volume: totalQuantity,
      status: 'pending',
    });
  };

  if (step === 'success') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <CheckCircle className="w-16 h-16 text-primary mx-auto mb-6" />
          <h1 className="font-heading text-3xl uppercase tracking-tight mb-4">הבקשה התקבלה</h1>
          <p className="text-muted-foreground mb-8">
            תודה על ההתעניינות ב-KROXIS סיטונאי. צוות ה-B2B שלנו יבחן את הבקשה וייצור קשר תוך 24 שעות.
          </p>
          <Button onClick={() => { setStep('browse'); setSelectedProducts({}); }}>
            עיין במוצרים נוספים
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Building2 className="w-6 h-6 text-primary" />
          <span className="text-primary text-xs font-heading uppercase tracking-[0.3em]">B2B Portal</span>
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl uppercase tracking-tight mb-4">
          מחירי סיטונאות
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          הנחות כמות ליחידות, צוותי שטח ומפיצים. ציידו את כל הצוות שלכם עם משקפי שמש טקטיות מקצועיות.
        </p>
      </div>

      {/* Pricing tiers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {pricingTiers.map((tier, i) => (
          <div
            key={i}
            className={`p-6 rounded-lg border-2 transition-all ${
              currentTier === tier ? 'border-primary bg-primary/5' : 'border-border'
            }`}
          >
            <div className="text-center">
              <h3 className="font-heading text-lg uppercase tracking-wide mb-2">{tier.label}</h3>
              <div className="text-3xl font-heading font-bold text-primary mb-2">{tier.discount}%</div>
              <p className="text-xs text-muted-foreground">
                {tier.min}+ יחידות
              </p>
            </div>
          </div>
        ))}
      </div>

      {step === 'browse' && (
        <>
          {/* Current selection summary */}
          {totalQuantity > 0 && (
            <div className="mb-8 p-6 bg-card border border-primary/30 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-heading text-lg uppercase tracking-wide">הבחירה שלך</h3>
                  <p className="text-sm text-muted-foreground">
                    {totalQuantity} יחידות • דרג {currentTier?.label} • {currentTier?.discount}% הנחה
                  </p>
                </div>
                <Button onClick={() => setStep('request')}>
                  בקש הצעת מחיר
                </Button>
              </div>
            </div>
          )}

          {/* Product grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => {
              const quantity = selectedProducts[product.id] || 0;
              const unitPrice = calculatePrice(product.price, quantity);
              const savings = quantity > 0 ? (product.price - unitPrice) * quantity : 0;

              return (
                <div key={product.id} className="p-4 border border-border rounded-lg hover:border-primary/50 transition-all">
                  <div className="aspect-square bg-muted rounded-md mb-3 overflow-hidden">
                    <img
                      src={product.images?.[0]}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-heading text-sm uppercase tracking-wide mb-2">{product.title}</h3>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-lg font-heading">${unitPrice.toFixed(2)}</span>
                    {quantity > 0 && unitPrice < product.price && (
                      <span className="text-xs text-muted-foreground line-through">
                        ${product.price.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {quantity > 0 && (
                    <div className="mb-3 p-2 bg-primary/10 rounded-md">
                      <p className="text-xs text-primary font-medium">
                        סה״כ: ${(unitPrice * quantity).toFixed(2)} • חיסכון: ${savings.toFixed(2)}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(product.id, -1)}
                      disabled={quantity === 0}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="flex-1 text-center font-medium">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(product.id, 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {step === 'request' && (
        <div className="max-w-2xl mx-auto">
          <Button variant="outline" onClick={() => setStep('browse')} className="mb-6">
            ← חזרה למוצרים
          </Button>

          <div className="p-8 bg-card border border-border rounded-lg">
            <h2 className="font-heading text-2xl uppercase tracking-tight mb-6">
              בקשת הצעת מחיר סיטונאית
            </h2>
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company">שם חברה</Label>
                  <Input
                    id="company"
                    required
                    value={form.company_name}
                    onChange={(e) => setForm(prev => ({ ...prev, company_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="contact">איש קשר</Label>
                  <Input
                    id="contact"
                    required
                    value={form.contact_name}
                    onChange={(e) => setForm(prev => ({ ...prev, contact_name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">אימייל</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">טלפון</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="industry">תעשייה</Label>
                <Select value={form.industry} onValueChange={(value) => setForm(prev => ({ ...prev, industry: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר תעשייה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="construction">צבא ולוחמים</SelectItem>
                    <SelectItem value="outdoor">שטח ותפעול</SelectItem>
                    <SelectItem value="general">עבודה ותעשייה</SelectItem>
                    <SelectItem value="lab">אבטחה ושמירה</SelectItem>
                    <SelectItem value="other">אחר</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message">מידע נוסף</Label>
                <Textarea
                  id="message"
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="ספרו לנו על הצרכים שלכם..."
                />
              </div>

              <Button type="submit" className="w-full" disabled={createRequestMutation.isPending}>
                {createRequestMutation.isPending ? 'שולח...' : 'שלח בקשת הצעת מחיר'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}