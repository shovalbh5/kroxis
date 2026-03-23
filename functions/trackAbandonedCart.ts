import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { cartData, customerEmail, customerName } = await req.json();

    if (!cartData?.items?.length) {
      return Response.json({ error: 'No cart items provided' }, { status: 400 });
    }

    const totalValue = cartData.items.reduce((sum, item) => 
      sum + (item.price + (item.lens_surcharge || 0)) * item.quantity, 0
    );

    const sessionId = cartData.sessionId || `session_${Date.now()}`;
    const checkoutUrl = `${Deno.env.get('APP_URL') || 'https://yourapp.base44.com'}/checkout?recover=${sessionId}`;

    // Create abandoned cart record
    await base44.asServiceRole.entities.AbandonedCart.create({
      session_id: sessionId,
      customer_email: customerEmail,
      customer_name: customerName,
      items: cartData.items,
      total_value: totalValue,
      checkout_url: checkoutUrl,
      abandoned_at: new Date().toISOString(),
      recovered: false,
      recovery_email_sent: false,
    });

    // Schedule recovery email after 45 minutes
    // This would typically trigger an automation or external webhook
    const webhookUrl = Deno.env.get('ABANDONED_CART_WEBHOOK_URL');
    if (webhookUrl) {
      // Send to external CRM/email service
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'cart.abandoned',
          customer: {
            email: customerEmail,
            name: customerName,
          },
          cart: {
            items: cartData.items,
            total_value: totalValue,
            recovery_url: checkoutUrl,
          },
          abandoned_at: new Date().toISOString(),
        }),
      });
    }

    return Response.json({
      success: true,
      session_id: sessionId,
      recovery_url: checkoutUrl,
    });
  } catch (error) {
    console.error('Abandoned cart tracking error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});