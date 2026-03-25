import React, { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/components/ui/use-toast';

export default function FrequentlyBoughtTogether({ mainProduct, recommendations }) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [selected, setSelected] = useState([mainProduct.id]);

  const toggleSelection = (productId) => {
    setSelected(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const allProducts = [mainProduct, ...recommendations];
  const selectedProducts = allProducts.filter(p => selected.includes(p.id));
  const totalPrice = selectedProducts.reduce((sum, p) => sum + (p.price || 0), 0);
  const savings = allProducts.reduce((sum, p) => sum + (p.price || 0), 0) - totalPrice;

  const handleAddAll = () => {
    selectedProducts.forEach(product => {
      addItem(product, 'standard', '', 1);
    });
    toast({
      title: 'נוסף לעגלה',
      description: `${selectedProducts.length} פריטים נוספו`,
    });
  };

  return (
    <div className="p-6 bg-card border border-border rounded-lg">
      <h3 className="font-heading text-sm uppercase tracking-widest text-muted-foreground mb-4">
        נקנים ביחד לעיתים קרובות
      </h3>

      <div className="space-y-3 mb-4">
        {allProducts.map((product, idx) => (
          <div key={product.id} className="flex items-center gap-3">
            <Checkbox
              checked={selected.includes(product.id)}
              onCheckedChange={() => toggleSelection(product.id)}
              disabled={idx === 0}
            />
            <div className="flex items-center gap-3 flex-1">
              <img
                src={product.images?.[0] || '/placeholder.jpg'}
                alt={product.title}
                className="w-12 h-12 object-cover rounded-md bg-muted"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{product.title}</p>
                <p className="text-xs text-muted-foreground">₪{product.price?.toFixed(2)}</p>
              </div>
            </div>
            {idx === 0 && (
              <span className="text-xs text-primary">פריט זה</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md mb-3">
        <div>
          <p className="text-sm font-medium">סה״כ ל-{selectedProducts.length} פריטים</p>
          {savings > 0 && (
            <p className="text-xs text-primary">חוסך ₪{savings.toFixed(2)}</p>
          )}
        </div>
        <span className="font-heading text-xl">₪{totalPrice.toFixed(2)}</span>
      </div>

      <Button onClick={handleAddAll} className="w-full" disabled={selectedProducts.length === 0}>
        <Check className="w-4 h-4 mr-2" />
        הוסף {selectedProducts.length} לעגלה
      </Button>
    </div>
  );
}