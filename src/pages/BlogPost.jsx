import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, Tag, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import ProductCard from '@/components/products/ProductCard';
import { generateBlogSEO, applySEO } from '@/utils/seo';
import ReactMarkdown from 'react-markdown';

export default function BlogPost() {
  const slug = window.location.pathname.split('/blog/')[1];

  const { data: post, isLoading } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const posts = await base44.entities.BlogPost.filter({ slug, is_published: true });
      return posts[0];
    },
    enabled: !!slug,
  });

  const { data: relatedProducts } = useQuery({
    queryKey: ['related-products', post?.related_products],
    queryFn: async () => {
      if (!post?.related_products?.length) return [];
      const products = await base44.entities.Product.list();
      return products.filter(p => post.related_products.includes(p.id));
    },
    enabled: !!post?.related_products?.length,
  });

  useEffect(() => {
    if (post) {
      applySEO(generateBlogSEO(post));
    }
  }, [post]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="text-muted-foreground">טוען מאמר...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="text-muted-foreground text-lg">המאמר לא נמצא.</p>
        <Button asChild className="mt-4"><Link to="/blog">חזרה לבלוג</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Back button */}
      <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> חזרה לבלוג
      </Link>

      {/* Article header */}
      <article className="mb-12">
        <div className="mb-6">
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map(tag => (
                <Badge key={tag} variant="outline">
                  <Tag className="w-3 h-3 mr-1" /> {tag}
                </Badge>
              ))}
            </div>
          )}
          <h1 className="font-heading text-4xl sm:text-5xl uppercase tracking-tight mb-4">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {new Date(post.published_date).toLocaleDateString('he-IL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            {post.author && <span>מאת {post.author}</span>}
          </div>
        </div>

        {post.featured_image && (
          <img
            src={post.featured_image}
            alt={post.title}
            className="w-full aspect-video object-cover rounded-lg mb-8"
          />
        )}

        <div className="prose prose-lg max-w-none prose-headings:font-heading prose-headings:uppercase prose-headings:tracking-tight prose-a:text-primary prose-strong:text-foreground prose-img:rounded-lg">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>
      </article>

      {/* Share buttons */}
      <div className="flex items-center gap-3 py-6 border-y border-border">
        <span className="text-sm text-muted-foreground flex items-center gap-2">
          <Share2 className="w-4 h-4" /> שתפו:
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}`, '_blank')}
        >
          Twitter
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank')}
        >
          LinkedIn
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigator.clipboard.writeText(window.location.href)}
        >
          העתק קישור
        </Button>
      </div>

      {/* Related products */}
      {relatedProducts?.length > 0 && (
        <div className="mt-12">
          <Separator className="mb-8" />
          <h2 className="font-heading text-2xl uppercase tracking-tight mb-6">
            מוצרים מומלצים
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {relatedProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}