import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import HeroSection from '@/components/home/HeroSection';
import FeaturedCarousel from '@/components/home/FeaturedCarousel';
import IndustryGrid from '@/components/home/IndustryGrid';
import TrustBar from '@/components/home/TrustBar';

const HERO_IMAGE = 'https://media.base44.com/images/public/69c0edec05cbd3064b4b2279/403427992_generated_d25fa65d.png';

export default function Home() {
  const { data: featuredProducts } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => base44.entities.Product.filter({ is_featured: true }),
    initialData: [],
  });

  const { data: allProducts } = useQuery({
    queryKey: ['all-products'],
    queryFn: () => base44.entities.Product.list('-created_date', 20),
    initialData: [],
  });

  const displayProducts = featuredProducts.length > 0 ? featuredProducts : allProducts;

  return (
    <div>
      <HeroSection heroImage={HERO_IMAGE} />
      <FeaturedCarousel products={displayProducts} />
      <IndustryGrid />
      <TrustBar />
    </div>
  );
}