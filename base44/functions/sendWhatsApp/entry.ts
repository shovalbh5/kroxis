import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
const PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const { to, message } = await req.json();

  if (!to || !message) {
    return Response.json({ error: 'Missing "to" or "message"' }, { status: 400 });
  }

  const response = await fetch(
    `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: { body: message },
      }),
    }
  );

  const result = await response.json();
  console.log("Send result:", JSON.stringify(result));

  if (!response.ok) {
    return Response.json({ error: result.error?.message || "Failed to send" }, { status: 500 });
  }

  // Save outgoing message
  await base44.asServiceRole.entities.WhatsAppMessage.create({
    from_number: to,
    from_name: "KROXIS",
    message_text: message,
    direction: "outgoing",
    wa_message_id: result.messages?.[0]?.id || "",
    status: "sent"
  });

  return Response.json({ success: true, message_id: result.messages?.[0]?.id });
});