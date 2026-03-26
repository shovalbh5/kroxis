import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Fetch public products and blog posts
        const products = await base44.asServiceRole.entities.Product.filter({});
        const posts = await base44.asServiceRole.entities.BlogPost.filter({ is_published: true });
        
        const baseUrl = 'https://kroxis.com'; // Replace with actual domain
        
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        
        // Static pages
        const staticPages = ['/', '/shop', '/blog', '/wholesale', '/contact', '/faq', '/terms', '/privacy', '/returns'];
        staticPages.forEach(page => {
            xml += `  <url>\n    <loc>${baseUrl}${page}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${page === '/' ? '1.0' : '0.8'}</priority>\n  </url>\n`;
        });
        
        // Products
        products.forEach(product => {
            const slug = product.slug || product.id;
            xml += `  <url>\n    <loc>${baseUrl}/product/${slug}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
        });
        
        // Blog Posts
        posts.forEach(post => {
            xml += `  <url>\n    <loc>${baseUrl}/blog/${post.slug}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
        });
        
        xml += '</urlset>';
        
        return new Response(xml, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, max-age=3600'
            }
        });
    } catch (error) {
        return new Response('Error generating sitemap', { status: 500 });
    }
});