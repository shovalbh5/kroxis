import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, X, Plus } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { motion } from 'framer-motion';

const upsellProducts = [
  {
    id: 'upsell-1',
    title: 'Hard-Shell Protective Case',
    price: 19.99,
    image: '/__generating__/img_case_hardshell.png',
    description: 'Impact-resistant EVA case with custom foam insert',
  },
  {
    id: 'upsell-2',
    title: 'Anti-Fog Cleaning Kit',
    price: 12.99,
    image: '/__generating__/img_cleaning_kit.png',
    description: 'Professional-grade spray + microfiber cloth pack',
  },
  {
    id: 'upsell-3',
    title: 'Lens Replacement Set',
    price: 29.99,
    image: '/__generating__/img_lens_replacement.png',
    description: 'Spare polarized lenses for quick swap',
  },
];

export default function UpsellModal({ isOpen, onClose, addedProduct }) {
  const { addItem } = useCart();

  const handleAddUpsell = (upsell) => {
    // Create mock product for upsell
    const mockProduct = {
      id: upsell.id,
      title: upsell.title,
      price: upsell.price,
      images: [upsell.image],
    };
    addItem(mockProduct, 'standard', '', 1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Success message */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center mb-6"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-heading text-2xl uppercase tracking-tight mb-2">Added to Cart!</h2>
            <p className="text-muted-foreground">
              {addedProduct?.title || 'Product'} is ready for checkout
            </p>
          </motion.div>

          {/* Upsell section */}
          <div className="border-t border-border pt-6">
            <h3 className="font-heading text-sm uppercase tracking-widest text-muted-foreground mb-4 text-center">
              Complete Your Protection
            </h3>
            <p className="text-center text-sm text-muted-foreground mb-6">
              Workers in your industry also bought:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {upsellProducts.map((upsell) => (
                <motion.div
                  key={upsell.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border border-border rounded-lg hover:border-primary/50 transition-all group"
                >
                  <div className="aspect-square bg-muted rounded-md mb-3 overflow-hidden">
                    <img
                      src={upsell.image}
                      alt={upsell.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <h4 className="font-medium text-sm mb-1">{upsell.title}</h4>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{upsell.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-heading text-lg">${upsell.price}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => handleAddUpsell(upsell)}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Continue Shopping
            </Button>
            <Button asChild className="flex-1" onClick={onClose}>
              <Link to="/checkout">Proceed to Checkout</Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}