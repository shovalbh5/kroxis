import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ShoppingBag, Plus, Minus, ArrowLeft, Shield, Truck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useCart } from '@/context/CartContext';
import ProductGallery from '@/components/products/ProductGallery';
import LensConfigurator from '@/components/products/LensConfigurator';
import TechSpecs from '@/components/products/TechSpecs';
import ReviewSection from '@/components/products/ReviewSection';
import FrequentlyBoughtTogether from '@/components/products/FrequentlyBoughtTogether';
import UpsellModal from '@/components/marketing/UpsellModal';
import ProductSchema from '@/components/seo/ProductSchema';
import ShareButtons from '@/components/sharing/ShareButtons';
import TrustBadges from '@/components/products/TrustBadges';
import { generateProductSEO, applySEO } from '@/utils/seo';
import { motion } from 'framer-motion';

export default function ProductDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = window.location.pathname.split('/product/')[1];
  const { addItem } = useCart();
  const { toast } = useToast();

  const [lensOption, setLensOption] = useState('standard');
  const [quantity, setQuantity] = useState(1);
  const [showUpsell, setShowUpsell] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const products = await base44.entities.Product.filter({ id: productId });
      return products[0];
    },
    enabled: !!productId,
  });

  const { data: recommendations } = useQuery({
    queryKey: ['recommendations', product?.category],
    queryFn: async () => {
      if (!product) return [];
      const products = await base44.entities.Product.filter({ category: product.category });
      return products.filter(p => p.id !== product.id).slice(0, 2);
    },
    enabled: !!product,
  });

  React.useEffect(() => {
    if (product) {
      applySEO(generateProductSEO(product));
    }
  }, [product]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, lensOption, '', quantity);
    setShowUpsell(true);
  };

  const surcharges = { standard: 0, polarized: 30, blue_light: 20 };
  const totalPrice = product ? (product.price + (surcharges[lensOption] || 0)) * quantity : 0;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <Skeleton className="aspect-square rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="text-muted-foreground text-lg">מוצר לא נמצא</p>
        <Button asChild className="mt-4"><Link to="/shop">חזרה לחנות</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <ProductSchema product={product} />
      {/* Breadcrumb */}
      <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> חזרה לחנות
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Gallery */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <ProductGallery images={product.images} />
        </motion.div>

        {/* Product info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Certs */}
          <div className="flex flex-wrap gap-2">
            {product.safety_certs?.map(cert => (
              <Badge key={cert} variant="outline" className="text-[10px] font-heading uppercase tracking-wider">
                <Shield className="w-3 h-3 mr-1 text-primary" />
                {cert.replace('_', ' ')}
              </Badge>
            ))}
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl uppercase tracking-tight">{product.title}</h1>

          {/* Share */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">שתף:</span>
            <ShareButtons url={window.location.href} title={product.title} />
          </div>

          <div className="flex items-center gap-3">
            <span className="font-heading text-3xl">${product.price?.toFixed(2)}</span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-lg text-muted-foreground line-through">${product.compare_at_price.toFixed(2)}</span>
            )}
          </div>

          <p className="text-muted-foreground leading-relaxed">{product.description || product.long_description}</p>

          {/* B2B pricing */}
          {product.b2b_bulk_discount_threshold && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm font-medium text-primary">
                🏗️ מחיר קבלנים: קנה {product.b2b_bulk_discount_threshold}+ יחידות וקבל {product.b2b_bulk_discount_percent}% הנחה
              </p>
            </div>
          )}

          {/* Lens configurator */}
          <LensConfigurator selected={lensOption} onChange={setLensOption} />

          {/* Color */}
          {product.colors?.length > 0 && (
            <div>
              <h4 className="font-heading text-xs uppercase tracking-widest text-muted-foreground mb-3">צבע</h4>
              <div className="flex gap-2">
                {product.colors.map(color => (
                  <span key={color} className="px-3 py-1.5 text-xs border border-border rounded-md">{color}</span>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + Add to Cart */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-1 hover:text-primary transition-colors">
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <button onClick={() => setQuantity(q => q + 1)} className="p-1 hover:text-primary transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <Button onClick={handleAddToCart} size="lg" className="flex-1 h-12 font-heading uppercase tracking-wider text-sm">
              <ShoppingBag className="w-4 h-4 mr-2" />
              הוסף לעגלה — ${totalPrice.toFixed(2)}
            </Button>
          </div>

          {/* Trust Badges */}
          <TrustBadges />

          {/* Tech specs */}
          <TechSpecs product={product} />
        </motion.div>
      </div>

      {/* Frequently Bought Together */}
      {recommendations?.length > 0 && (
        <div className="mt-10">
          <FrequentlyBoughtTogether
            mainProduct={product}
            recommendations={recommendations}
          />
        </div>
      )}

      {/* Reviews */}
      <ReviewSection productId={productId} />

      {/* Upsell Modal */}
      <UpsellModal
        isOpen={showUpsell}
        onClose={() => setShowUpsell(false)}
        addedProduct={product}
      />
    </div>
  );
}