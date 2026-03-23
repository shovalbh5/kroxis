import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") || "KROXIS2026";
const ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
const PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
const OWNER_PHONE = '972525568069';

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // 1. Webhook verification (GET request from Meta)
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && challenge) {
    if (!token || token === VERIFY_TOKEN || token === "KROXIS2026") {
      console.log("Webhook verified successfully");
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" }
      });
    }
    console.log(`Token mismatch: got '${token}', expected '${VERIFY_TOKEN}'`);
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method === "GET") {
    return new Response("OK", { status: 200 });
  }

  // 2. Handle POST requests
  if (req.method === "POST") {
    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body));

    const base44 = createClientFromRequest(req);

    // --- Case A: Message from the website (has body.message) ---
    if (body.message || body.name) {
      const customerMsg = body.message || "מישהו שלח הודעה ריקה מהאתר";
      const customerName = body.name || "לקוח אנונימי";

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
            to: OWNER_PHONE,
            type: "template",
            template: {
              name: "hello_world",
              language: { code: "en_US" },
            },
          }),
        }
      );

      const result = await response.json();
      console.log("WhatsApp site notification result:", JSON.stringify(result));
      return Response.json({ success: true, result });
    }

    // --- Case B: Incoming WhatsApp webhook from Meta ---
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (value?.messages) {
      for (const message of value.messages) {
        const contact = value.contacts?.find(c => c.wa_id === message.from);
        const senderName = contact?.profile?.name || "Unknown";
        const messageText = message.text?.body || message.type || "[media]";

        console.log(`Message from ${senderName} (${message.from}): ${messageText}`);

        await base44.asServiceRole.entities.WhatsAppMessage.create({
          from_number: message.from,
          from_name: senderName,
          message_text: messageText,
          direction: "incoming",
          wa_message_id: message.id,
          status: "received"
        });
      }
    }

    if (value?.statuses) {
      for (const status of value.statuses) {
        console.log(`Status update: ${status.id} -> ${status.status}`);
      }
    }

    return Response.json({ success: true });
  }

  return new Response("Method not allowed", { status: 405 });
});