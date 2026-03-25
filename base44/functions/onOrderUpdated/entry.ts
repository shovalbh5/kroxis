import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json();
        const order = payload.data;
        const oldOrder = payload.old_data;
        
        if (order && oldOrder && order.status === 'shipped' && oldOrder.status !== 'shipped' && order.customer_email) {
            const trackingInfo = order.tracking_number ? `\nTracking Number: ${order.tracking_number}` : '';
            const body = `Hi ${order.customer_name},\n\nGood news! Your order has been shipped.${trackingInfo}\n\nBest,\nKROXIS Team`;
            
            await base44.asServiceRole.integrations.Core.SendEmail({
                to: order.customer_email,
                subject: 'Your Order Has Shipped! - KROXIS',
                body: body
            });
        }
        
        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});