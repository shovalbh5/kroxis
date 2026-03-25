import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Find products with low stock
        const products = await base44.asServiceRole.entities.Product.filter({ stock_level: { $lt: 10 } });
        
        if (products.length > 0) {
            const settings = await base44.asServiceRole.entities.StoreSettings.list();
            const adminEmail = settings[0]?.contact_email || 'admin@kroxis.com';
            
            let body = 'The following products are running low on stock:\n\n';
            products.forEach(p => {
                body += `- ${p.title}: ${p.stock_level} units left\n`;
            });
            
            await base44.asServiceRole.integrations.Core.SendEmail({
                to: adminEmail,
                subject: 'Low Stock Alert - KROXIS',
                body: body
            });
        }
        
        return Response.json({ success: true, lowStockCount: products.length });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});