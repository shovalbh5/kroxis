import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export default function ProductCard({ product }) {
  const certLabels = {
    ANSI_Z87: 'ANSI Z87.1+',
    CE_EN166: 'CE EN166',
    OSHA: 'OSHA',
    MIL_PRF: 'MIL-PRF',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -8 }}
    >
      <Link to={`/product/${product.id}`} className="group block">
        <div className="relative overflow-hidden rounded-lg bg-card border border-border transition-all duration-500 ease-out group-hover:shadow-2xl group-hover:border-primary/50">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden bg-muted">
            <img
              src={product.images?.[0] || '/placeholder.jpg'}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-115"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out translate-y-4 group-hover:translate-y-0">
              <span className="bg-primary text-white px-5 py-2.5 rounded-md text-sm font-heading uppercase tracking-wider flex items-center gap-2 font-bold shadow-lg">
                <Eye className="w-4 h-4" /> צפייה מהירה
              </span>
            </div>
            {product.is_bestseller && (
              <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-heading uppercase tracking-wider font-bold px-3 py-1">
                רב מכר
              </Badge>
            )}
          </div>

          {/* Info */}
          <div className="p-3 sm:p-5">
            <div className="flex items-center gap-1 sm:gap-1.5 mb-2 sm:mb-3">
              {product.safety_certs?.slice(0, 2).map(cert => (
                <span key={cert} className="flex items-center gap-0.5 text-[9px] sm:text-[10px] text-muted-foreground">
                  <Shield className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-primary" />
                  {certLabels[cert] || cert}
                </span>
              ))}
            </div>
            <h3 className="font-heading text-xs sm:text-base uppercase tracking-wide group-hover:text-primary transition-colors duration-300 truncate mb-1 sm:mb-2 font-bold">
              {product.title}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground/80 line-clamp-1 mb-2 sm:mb-3 font-medium hidden sm:block">{product.description}</p>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="font-heading text-sm sm:text-lg">${product.price?.toFixed(2)}</span>
              {product.compare_at_price && product.compare_at_price > product.price && (
                <span className="text-[10px] sm:text-xs text-muted-foreground line-through">${product.compare_at_price.toFixed(2)}</span>
              )}
            </div>
            {product.b2b_bulk_discount_threshold && (
              <p className="text-[10px] sm:text-xs text-primary mt-1 font-bold hidden sm:block">
                הזמנה של {product.b2b_bulk_discount_threshold}+ יחידות → {product.b2b_bulk_discount_percent}% הנחה
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}