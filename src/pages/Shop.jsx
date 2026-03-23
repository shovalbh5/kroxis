import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal, X, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import ProductCard from '@/components/products/ProductCard';
import ProductFilters from '@/components/products/ProductFilters';
import { AnimatePresence, motion } from 'framer-motion';

export default function Shop() {
  const urlParams = new URLSearchParams(window.location.search);
  const initCategory = urlParams.get('category');
  const initTech = urlParams.get('tech');

  const [filters, setFilters] = useState({
    categories: initCategory ? [initCategory] : [],
    techs: initTech ? [initTech] : [],
    certs: [],
  });
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('-created_date', 100),
    initialData: [],
  });

  const filtered = useMemo(() => {
    let result = [...products];

    if (filters.categories.length) {
      result = result.filter(p => filters.categories.includes(p.category));
    }
    if (filters.techs.length) {
      result = result.filter(p => p.lens_tech?.some(t => filters.techs.includes(t)));
    }
    if (filters.certs.length) {
      result = result.filter(p => p.safety_certs?.some(c => filters.certs.includes(c)));
    }

    switch (sortBy) {
      case 'price_asc': result.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
      case 'price_desc': result.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
      case 'name': result.sort((a, b) => (a.title || '').localeCompare(b.title || '')); break;
      default: break;
    }

    return result;
  }, [products, filters, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      {/* Page header */}
      <div className="mb-10">
        <div className="mb-6">
          <h1 className="font-heading text-4xl sm:text-5xl uppercase tracking-tight mb-3 font-bold">כל הציוד</h1>
          <p className="text-muted-foreground text-lg font-medium">משקפי מגן בדרג הנדסי. לכל סוג אתר, מעבדה או תפעול.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>📍 א.ת נוף הארץ, ראש העין, כפר קאסם</span>
          <span>•</span>
          <span>📞 054-717-2301</span>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop filters */}
        <aside className="hidden lg:block w-64 shrink-0">
          <ProductFilters filters={filters} setFilters={setFilters} />
        </aside>

        {/* Main content */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden border-2 font-bold"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" /> סינון
              </Button>
              <span className="text-sm text-muted-foreground">{filtered.length} products</span>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price_asc">Price: Low → High</SelectItem>
                <SelectItem value="price_desc">Price: High → Low</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mobile filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden lg:hidden mb-6"
              >
                <div className="p-4 bg-card border border-border rounded-lg">
                  <ProductFilters filters={filters} setFilters={setFilters} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Products grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">No products match your filters.</p>
              <Button variant="outline" className="mt-4 border-2 font-bold" onClick={() => setFilters({ categories: [], techs: [], certs: [] })}>
                נקה סינון
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {filtered.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}