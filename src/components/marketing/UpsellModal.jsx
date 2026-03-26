import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, X, Plus } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { motion } from 'framer-motion';

const upsellProducts = [
  {
    id: 'upsell-1',
    title: 'נרתיק מגן קשיח',
    price: 19.99,
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop',
    description: 'נרתיק EVA עמיד בפני פגיעות עם ריפוד פנימי',
  },
  {
    id: 'upsell-2',
    title: 'ערכת ניקוי אנטי-פוג',
    price: 12.99,
    image: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&h=400&fit=crop',
    description: 'ספריי מקצועי + חבילת מטליות מיקרופייבר',
  },
  {
    id: 'upsell-3',
    title: 'סט עדשות חלופיות',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&h=400&fit=crop',
    description: 'עדשות פולאריות חלופיות להחלפה מהירה',
  },
];

export default function UpsellModal({ isOpen, onClose, addedProduct }) {
  const { addItem } = useCart();
  const [addedItems, setAddedItems] = useState({});

  const handleAddUpsell = (upsell) => {
    // Create mock product for upsell
    const mockProduct = {
      id: upsell.id,
      title: upsell.title,
      price: upsell.price,
      images: [upsell.image],
    };
    addItem(mockProduct, 'standard', '', 1);
    
    setAddedItems(prev => ({ ...prev, [upsell.id]: true }));
    setTimeout(() => {
      setAddedItems(prev => ({ ...prev, [upsell.id]: false }));
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden w-[95vw] sm:w-full rounded-xl">


        <div className="p-4 sm:p-8 max-h-[85vh] overflow-y-auto">
          {/* Success message */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center mb-6"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-heading text-2xl uppercase tracking-tight mb-2">נוסף לעגלה!</h2>
            <p className="text-muted-foreground">
              {addedProduct?.title || 'מוצר'} מוכן לתשלום
            </p>
          </motion.div>

          {/* Upsell section */}
          <div className="border-t border-border pt-6">
            <h3 className="font-heading text-sm uppercase tracking-widest text-muted-foreground mb-4 text-center">
              השלם את ההגנה שלך
            </h3>
            <p className="text-center text-sm text-muted-foreground mb-6">
              אנשי מקצוע בתחום שלך גם קנו:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {upsellProducts.map((upsell) => (
                <motion.div
                  key={upsell.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 sm:p-4 border border-border rounded-lg hover:border-primary/50 transition-all group flex sm:block items-center gap-3 sm:gap-0"
                >
                  <div className="w-20 h-20 sm:w-full sm:h-auto sm:aspect-square bg-muted rounded-md mb-0 sm:mb-3 overflow-hidden shrink-0">
                    <img
                      src={upsell.image}
                      alt={upsell.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-0.5 sm:mb-1">{upsell.title}</h4>
                    <p className="text-xs text-muted-foreground mb-2 sm:mb-3 line-clamp-1 sm:line-clamp-2">{upsell.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-heading text-base sm:text-lg">₪{upsell.price}</span>
                      <Button
                        size="sm"
                        variant={addedItems[upsell.id] ? "default" : "outline"}
                        className="h-8 text-xs transition-all"
                        onClick={() => handleAddUpsell(upsell)}
                        disabled={addedItems[upsell.id]}
                      >
                        {addedItems[upsell.id] ? (
                          <><CheckCircle className="w-3 h-3 mr-1" /> נוסף</>
                        ) : (
                          <><Plus className="w-3 h-3 mr-1" /> הוסף</>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button variant="outline" onClick={onClose} className="flex-1 w-full">
              המשך קנייה
            </Button>
            <Button asChild className="flex-1 w-full" onClick={onClose}>
              <Link to="/checkout">לתשלום</Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}