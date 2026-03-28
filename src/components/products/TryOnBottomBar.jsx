import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TryOnBottomBar({ product, onAddToCart }) {
  if (!product) return null;

  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : 0;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black via-black/90 to-transparent pt-8 pb-4 px-4">
      <div className="max-w-lg mx-auto flex items-center gap-3" dir="rtl">
        {/* Product image */}
        <div className="w-12 h-12 rounded-lg bg-white/10 overflow-hidden flex-shrink-0 border border-white/20">
          {product.images?.[0] && (
            <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
          )}
        </div>

        {/* Product info */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-heading text-sm font-bold truncate">{product.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {hasDiscount && (
              <span className="text-white/50 text-xs line-through">₪{product.compare_at_price?.toFixed(0)}</span>
            )}
            <span className="text-white font-bold text-sm">₪{product.price?.toFixed(0)}</span>
            {hasDiscount && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                {discountPercent}% OFF
              </span>
            )}
          </div>
        </div>

        {/* Add to cart */}
        <Button
          onClick={() => onAddToCart(product)}
          size="sm"
          className="flex-shrink-0 font-heading uppercase tracking-wider text-xs h-10 px-4"
        >
          <ShoppingBag className="w-4 h-4 ml-1" />
          הוסף לעגלה
        </Button>
      </div>
    </div>
  );
}