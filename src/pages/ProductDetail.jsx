import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ShoppingBag, Plus, Minus, ArrowLeft, Shield, Truck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
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

  const featureTags = {
    ANSI_Z87: { label: 'Z87.1', desc: 'תקן בטיחות תעשייתי. עמידות גבוהה בפני פגיעות וחלקיקים.' },
    MIL_PRF: { label: 'MIL-SPEC', desc: 'הגנה בליסטית צבאית. עמידות ברסיסים במהירות גבוהה.' },
    polycarbonate: { label: 'POLY', desc: 'עדשות פוליקרבונט. קלות וחזקות פי 10 מפלסטיק רגיל.' },
    polarized: { label: 'POLAR', desc: 'הגנה מסנוור. מסנן החזרי אור ממשטחים ומשפר ניגודיות.' },
    anti_fog: { label: 'AF', desc: 'ציפוי נגד אדים. מונע הצטברות אדים במעברי טמפרטורה.' },
  };

  const getProductTags = (product) => {
    if (!product) return [];
    const tags = [];
    if (product.safety_certs?.includes('ANSI_Z87')) tags.push(featureTags.ANSI_Z87);
    if (product.safety_certs?.includes('MIL_PRF')) tags.push(featureTags.MIL_PRF);
    if (product.lens_tech?.includes('polarized')) tags.push(featureTags.polarized);
    if (product.lens_tech?.includes('anti_fog')) tags.push(featureTags.anti_fog);
    tags.push(featureTags.polycarbonate);
    return tags;
  };

  const tagsToShow = getProductTags(product);

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
          {/* Feature Tags */}
          <div className="flex flex-wrap items-center gap-2" dir="rtl">
            <TooltipProvider delayDuration={100}>
              {tagsToShow.map((tag, idx) => (
                <Tooltip key={idx}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-md border border-border/50 cursor-help hover:bg-muted/80 transition-colors">
                      <span className="text-xs font-bold text-primary tracking-wider">{tag.label}</span>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[250px] text-right" dir="rtl">
                    <p className="font-bold text-sm mb-1">{tag.label}</p>
                    <p className="text-xs leading-relaxed text-primary-foreground/90">{tag.desc}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>

          <h1 className="font-heading text-2xl sm:text-4xl uppercase tracking-tight leading-tight">{product.title}</h1>

          {/* Share */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">שתף:</span>
            <ShareButtons url={window.location.href} title={product.title} />
          </div>

          <div className="flex items-center gap-3">
            <span className="font-heading text-2xl sm:text-3xl">₪{product.price?.toFixed(2)}</span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-lg text-muted-foreground line-through">₪{product.compare_at_price.toFixed(2)}</span>
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center justify-between sm:justify-center gap-4 sm:gap-2 bg-muted rounded-lg px-4 sm:px-3 py-3 sm:py-2">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-2 sm:p-1 hover:text-primary transition-colors">
                <Minus className="w-5 h-5 sm:w-4 sm:h-4" />
              </button>
              <span className="w-8 text-center font-medium text-lg sm:text-base">{quantity}</span>
              <button onClick={() => setQuantity(q => q + 1)} className="p-2 sm:p-1 hover:text-primary transition-colors">
                <Plus className="w-5 h-5 sm:w-4 sm:h-4" />
              </button>
            </div>
            <Button onClick={handleAddToCart} size="lg" className="flex-1 h-14 sm:h-12 font-heading uppercase tracking-wider text-sm sm:text-base">
              <ShoppingBag className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
              הוסף לעגלה — ₪{totalPrice.toFixed(2)}
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