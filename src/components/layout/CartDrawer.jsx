import React from 'react';
import { Link } from 'react-router-dom';
import { X, Plus, Minus, Trash2, ShoppingBag, Truck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const crossSells = [
  { name: 'ספריי אנטי-פוג', price: 12.99 },
  { name: 'נרתיק קשיח', price: 19.99 },
  { name: 'חבילת מטליות מיקרופייבר', price: 7.99 },
];

export default function CartDrawer() {
  const {
    items, removeItem, updateQuantity, itemCount, subtotal,
    isCartOpen, setIsCartOpen, FREE_SHIPPING_THRESHOLD, shippingProgress, freeShipping
  } = useCart();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/60 z-50"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-background z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                <span className="font-heading text-lg uppercase tracking-wide">עגלה ({itemCount})</span>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Shipping progress */}
            <div className="px-4 py-3 bg-muted/50">
              <div className="flex items-center gap-2 text-xs mb-1.5">
                <Truck className="w-3.5 h-3.5 text-primary" />
                {freeShipping
                  ? <span className="text-primary font-medium">זכית במשלוח חינם!</span>
                  : <span className="text-muted-foreground">הוסף ${(FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2)} למשלוח חינם</span>
                }
              </div>
              <Progress value={shippingProgress} className="h-1.5" />
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">העגלה ריקה</p>
                  <Button asChild className="mt-4" onClick={() => setIsCartOpen(false)}>
                    <Link to="/shop">לחנות</Link>
                  </Button>
                </div>
              ) : (
                <>
                  {items.map((item) => {
                    const key = `${item.product_id}-${item.lens_option}-${item.color}`;
                    const lineTotal = (item.price + item.lens_surcharge) * item.quantity;
                    return (
                      <motion.div
                        key={key}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        className="flex gap-3 p-3 bg-card rounded-lg border border-border"
                      >
                        {item.image && (
                          <img src={item.image} alt={item.title} className="w-16 h-16 object-cover rounded-md bg-muted" />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.title}</h4>
                          {item.lens_option !== 'standard' && (
                            <p className="text-xs text-primary capitalize">{item.lens_option.replace('_', ' ')} (+${item.lens_surcharge})</p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1.5 bg-muted rounded-md">
                              <button
                                onClick={() => updateQuantity(item.product_id, item.lens_option, item.color, item.quantity - 1)}
                                className="p-1 hover:text-primary transition-colors"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-medium w-6 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.product_id, item.lens_option, item.color, item.quantity + 1)}
                                className="p-1 hover:text-primary transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="font-medium text-sm">${lineTotal.toFixed(2)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(item.product_id, item.lens_option, item.color)}
                          className="text-muted-foreground hover:text-destructive transition-colors self-start"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    );
                  })}

                  {/* Cross-sells */}
                  <div className="pt-4 border-t border-border">
                    <h4 className="font-heading text-xs uppercase tracking-widest text-muted-foreground mb-3">נקנים ביחד לעיתים קרובות</h4>
                    <div className="space-y-2">
                      {crossSells.map(cs => (
                        <div key={cs.name} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                          <span className="text-sm">{cs.name}</span>
                          <span className="text-sm font-medium text-primary">${cs.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">סכום ביניים</span>
                  <span className="text-lg font-bold">${subtotal.toFixed(2)}</span>
                </div>
                <Button asChild className="w-full h-12 font-heading uppercase tracking-wider text-sm" onClick={() => setIsCartOpen(false)}>
                  <Link to="/checkout">לתשלום</Link>
                </Button>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  המשך קנייה
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}