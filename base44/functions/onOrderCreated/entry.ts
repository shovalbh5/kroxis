import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json();
        const order = payload.data;
        
        if (order && order.customer_email) {
            const body = `Hi ${order.customer_name},\n\nThank you for your order!\nYour order total is ₪${order.total}.\nWe will notify you once it ships.\n\nBest,\nKROXIS Team`;
            
            await base44.asServiceRole.integrations.Core.SendEmail({
                to: order.customer_email,
                subject: 'Order Confirmation - KROXIS',
                body: body
            });
        }
        
        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});