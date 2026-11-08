// Sitemap for kroxis.com (Kroxis Portolan landing page and its legal pages).
Deno.serve(async () => {
    const baseUrl = 'https://kroxis.com';
    const pages = [['/', '1.0', 'weekly'], ['/terms', '0.3', 'yearly'], ['/privacy', '0.3', 'yearly']];
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    for (const [path, priority, freq] of pages) {
        xml += `  <url>\n    <loc>${baseUrl}${path}</loc>\n    <changefreq>${freq}</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;
    }
    xml += '</urlset>';
    return new Response(xml, {
        headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' }
    });
});
