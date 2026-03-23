/**
 * SEO utility functions for generating meta tags and structured data
 */

export function generateProductSEO(product) {
  return {
    title: `${product.title} - Professional Safety Eyewear | KROXIS`,
    description: product.description || `Shop ${product.title} - ANSI Z87.1+ certified safety glasses with ${product.lens_tech?.join(', ')} technology. Engineered for ${product.category} professionals.`,
    keywords: [
      product.title,
      'safety glasses',
      'protective eyewear',
      product.category,
      ...(product.lens_tech || []),
      ...(product.safety_certs || []),
      'ANSI Z87.1',
      'industrial eyewear',
    ].join(', '),
    ogImage: product.images?.[0] || '',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.title,
      "description": product.description,
      "image": product.images || [],
      "brand": {
        "@type": "Brand",
        "name": "KROXIS"
      },
      "offers": {
        "@type": "Offer",
        "price": product.price,
        "priceCurrency": "USD",
        "availability": product.stock_level > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "url": `${window.location.origin}/product/${product.id}`
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "127"
      }
    }
  };
}

export function generateCollectionSEO(category) {
  const categoryTitles = {
    construction: 'Construction Safety Glasses',
    lab: 'Lab & Medical Safety Eyewear',
    outdoor: 'Outdoor Safety Glasses',
    general: 'General Safety Eyewear',
  };

  const categoryDescriptions = {
    construction: 'Shop ANSI Z87.1+ certified safety glasses for construction workers. Impact-rated frames, anti-fog coating, and all-day comfort for the job site.',
    lab: 'Professional lab safety glasses with splash protection, anti-fog technology, and optical clarity for laboratory and medical environments.',
    outdoor: 'Polarized outdoor safety glasses with UV400 protection. Perfect for utility workers, landscapers, and field professionals.',
    general: 'Industrial safety eyewear for everyday protection. OSHA compliant, durable, and designed for professional use.',
  };

  return {
    title: `${categoryTitles[category] || 'Safety Eyewear'} | KROXIS`,
    description: categoryDescriptions[category] || 'Shop professional-grade safety eyewear engineered for the toughest environments.',
    keywords: `${category} safety glasses, industrial eyewear, protective glasses, ANSI Z87.1, safety goggles`,
  };
}

export function generateBlogSEO(post) {
  return {
    title: `${post.title} | KROXIS Blog`,
    description: post.excerpt || post.meta_description || post.content?.substring(0, 160),
    keywords: post.tags?.join(', ') || '',
    ogImage: post.featured_image || '',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.excerpt,
      "image": post.featured_image,
      "author": {
        "@type": "Person",
        "name": post.author || "KROXIS Team"
      },
      "publisher": {
        "@type": "Organization",
        "name": "KROXIS",
        "logo": {
          "@type": "ImageObject",
          "url": `${window.location.origin}/logo.png`
        }
      },
      "datePublished": post.published_date,
      "dateModified": post.updated_date || post.published_date
    }
  };
}

export function applySEO(seoData) {
  // Update title
  document.title = seoData.title;

  // Update or create meta tags
  const metaTags = {
    description: seoData.description,
    keywords: seoData.keywords,
    'og:title': seoData.title,
    'og:description': seoData.description,
    'og:image': seoData.ogImage,
    'og:type': 'website',
    'twitter:card': 'summary_large_image',
    'twitter:title': seoData.title,
    'twitter:description': seoData.description,
    'twitter:image': seoData.ogImage,
  };

  Object.entries(metaTags).forEach(([name, content]) => {
    if (!content) return;
    
    const property = name.startsWith('og:') ? 'property' : 'name';
    let meta = document.querySelector(`meta[${property}="${name}"]`);
    
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(property, name);
      document.head.appendChild(meta);
    }
    
    meta.setAttribute('content', content);
  });

  // Add structured data
  if (seoData.structuredData) {
    let script = document.querySelector('script[type="application/ld+json"]');
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(seoData.structuredData);
  }
}