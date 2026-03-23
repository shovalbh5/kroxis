import React from 'react';

export default function ProductSchema({ product, reviews = [] }) {
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title,
    "description": product.description || product.long_description || '',
    "image": product.images?.[0] || '',
    "brand": {
      "@type": "Brand",
      "name": "KROXIS"
    },
    "sku": product.slug || product.id,
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "USD",
      "price": product.price,
      "availability": product.stock_level > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "KROXIS"
      }
    }
  };

  if (avgRating && reviews.length > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": avgRating,
      "reviewCount": reviews.length,
      "bestRating": "5",
      "worstRating": "1"
    };
    schema.review = reviews.slice(0, 5).map(r => ({
      "@type": "Review",
      "author": { "@type": "Person", "name": r.customer_name || "לקוח KROXIS" },
      "datePublished": r.created_date,
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": r.rating,
        "bestRating": "5"
      },
      "reviewBody": r.content || ''
    }));
  }

  if (product.safety_certs?.length > 0) {
    schema.additionalProperty = product.safety_certs.map(cert => ({
      "@type": "PropertyValue",
      "name": "Safety Certification",
      "value": cert.replace('_', ' ')
    }));
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}