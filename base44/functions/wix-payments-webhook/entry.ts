import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import jwt from "npm:jsonwebtoken@9.0.2";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const bodyText = await req.text();

    const WEBHOOK_PUBLIC_KEY = Deno.env.get("WIX_PAYMENTS_WEBHOOK_PUBLIC_KEY");
    
    if (!WEBHOOK_PUBLIC_KEY) {
        console.error("Missing WIX_PAYMENTS_WEBHOOK_PUBLIC_KEY");
        return new Response("OK", { status: 200 }); // Acknowledge to avoid retries if not configured
    }

    let rawPayload;
    try {
        rawPayload = jwt.verify(bodyText, WEBHOOK_PUBLIC_KEY, { algorithms: ["RS256"] });
    } catch (err) {
        console.error("JWT Verification failed:", err);
        return new Response("Unauthorized", { status: 401 });
    }

    const event = JSON.parse(rawPayload.data);
    const eventData = JSON.parse(event.data);

    if (event.eventType === "wix.ecom.v1.order_approved") {
      const order = eventData.actionEvent.body.order;
      const checkoutId = order.checkoutId;

      console.log(`Order approved webhook received for checkoutId: ${checkoutId}`);

      // Find the order in our database
      const orders = await base44.asServiceRole.entities.Order.filter({ checkout_id: checkoutId });
      
      if (orders && orders.length > 0) {
          const dbOrder = orders[0];
          await base44.asServiceRole.entities.Order.update(dbOrder.id, {
              payment_status: "paid",
              status: "processing"
          });
          console.log(`Updated order ${dbOrder.id} to paid/processing`);
      } else {
          console.log(`Order with checkoutId ${checkoutId} not found in database`);
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("OK", { status: 200 }); // Always return 200 to acknowledge receipt
  }
});