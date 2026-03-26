import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { items, customerInfo } = body;

    const WIX_API_KEY = Deno.env.get("PAYMENTS_BY_WIX_API_KEY");
    const WIX_SITE_ID = Deno.env.get("PAYMENTS_BY_WIX_SITE_ID");

    if (!WIX_API_KEY || !WIX_SITE_ID) {
      throw new Error("Wix Payments credentials are not configured.");
    }

    const origin = req.headers.get("origin") || "https://kroxis.com";

    const response = await fetch(
      "https://www.wixapis.com/payments/platform/v1/checkout-sessions/construct",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": WIX_API_KEY,
          "wix-site-id": WIX_SITE_ID,
        },
        body: JSON.stringify({
          cart: { items, customerInfo },
          callbackUrls: {
            postFlowUrl: `${origin}/shop`,
            thankYouPageUrl: `${origin}/checkout?success=true`,
          },
        }),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
        console.error("Wix API Error:", JSON.stringify(data));
        throw new Error(data.message || "Failed to create checkout session");
    }

    return Response.json({ checkoutSession: data.checkoutSession });
  } catch (error) {
    console.error("Create checkout error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});