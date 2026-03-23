import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Clock, Tag, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';

export default function Blog() {
  const [selectedTag, setSelectedTag] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: posts, isLoading } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: () => base44.entities.BlogPost.filter({ is_published: true }, '-published_date'),
    initialData: [],
  });

  const allTags = [...new Set(posts.flatMap(p => p.tags || []))];

  const filteredPosts = posts.filter(post => {
    const matchesTag = !selectedTag || post.tags?.includes(selectedTag);
    const matchesSearch = !searchQuery || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-8 h-[2px] bg-primary" />
          <span className="text-primary text-xs font-heading uppercase tracking-[0.3em]">Knowledge Base</span>
          <div className="w-8 h-[2px] bg-primary" />
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl uppercase tracking-tight mb-4">
          Work-Safety Insights
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Expert guides, industry news, and safety best practices for professionals who demand protection.
        </p>
      </div>

      {/* Search & Filter */}
      <div className="mb-8 space-y-4">
        <Input
          type="search"
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md mx-auto"
        />
        <div className="flex flex-wrap justify-center gap-2">
          <Badge
            variant={!selectedTag ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedTag(null)}
          >
            All Topics
          </Badge>
          {allTags.map(tag => (
            <Badge
              key={tag}
              variant={selectedTag === tag ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Posts grid */}
      {isLoading ? (
        <div className="text-center py-20">Loading articles...</div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No articles found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Link to={`/blog/${post.slug}`} className="group block">
                <div className="overflow-hidden rounded-lg bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                  {post.featured_image && (
                    <div className="aspect-video overflow-hidden bg-muted">
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(post.published_date).toLocaleDateString()}
                      {post.tags?.length > 0 && (
                        <>
                          <span>•</span>
                          <Tag className="w-3.5 h-3.5" />
                          {post.tags[0]}
                        </>
                      )}
                    </div>
                    <h3 className="font-heading text-lg uppercase tracking-wide group-hover:text-primary transition-colors mb-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {post.excerpt}
                    </p>
                    <span className="inline-flex items-center gap-1 text-primary text-sm font-medium">
                      Read More <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}