import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// The KROXIS store closed when kroxis.com became the Portolan site, so cart
// recovery emails (with a checkout link that no longer exists) are switched off.
const STORE_CLOSED = true;

Deno.serve(async (req) => {
    if (STORE_CLOSED) {
        return Response.json({ success: true, sentCount: 0, skipped: 'store closed' });
    }
    try {
        const base44 = createClientFromRequest(req);
        
        // Find carts abandoned more than 2 hours ago, not recovered, no email sent yet
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
        const carts = await base44.asServiceRole.entities.AbandonedCart.filter({
            recovered: false,
            recovery_email_sent: false,
            abandoned_at: { $lt: twoHoursAgo }
        });
        
        let sentCount = 0;
        for (const cart of carts) {
            if (cart.customer_email) {
                const body = `Hi ${cart.customer_name || 'there'},\n\nYou left some items in your cart! Complete your purchase now and get 10% off with code KROXIS10.\n\nReturn to cart: ${cart.checkout_url || 'https://kroxis.com/checkout'}\n\nBest,\nKROXIS Team`;
                
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: cart.customer_email,
                    subject: 'Did you forget something? - KROXIS',
                    body: body
                });
                
                await base44.asServiceRole.entities.AbandonedCart.update(cart.id, {
                    recovery_email_sent: true
                });
                sentCount++;
            }
        }
        
        return Response.json({ success: true, sentCount });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});