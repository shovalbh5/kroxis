import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN");
console.log(`VERIFY_TOKEN loaded: '${VERIFY_TOKEN}'`);

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // Webhook verification (GET request from Meta)
  // Also handle verification via query params on any method
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && challenge) {
    console.log(`Verification attempt - received token: '${token}', expected: '${VERIFY_TOKEN}', match: ${token === VERIFY_TOKEN}`);
    if (token === VERIFY_TOKEN) {
      console.log("Webhook verified successfully");
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" }
      });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method === "GET") {
    return new Response("OK", { status: 200 });
  }

  // Handle incoming messages (POST request)
  if (req.method === "POST") {
    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body));

    const base44 = createClientFromRequest(req);

    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    // Handle incoming messages
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

    // Handle status updates
    if (value?.statuses) {
      for (const status of value.statuses) {
        console.log(`Status update: ${status.id} -> ${status.status}`);
      }
    }

    return Response.json({ success: true });
  }

  return new Response("Method not allowed", { status: 405 });
});