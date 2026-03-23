import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
const PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
const OWNER_PHONE = '972525568069';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { visitorName, message, sessionId } = await req.json();

  if (!message) {
    return Response.json({ error: 'Missing message' }, { status: 400 });
  }

  // Send WhatsApp notification to owner
  const text = `💬 הודעה חדשה מהאתר!\n\nשם: ${visitorName}\nהודעה: ${message}`;

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
        type: "text",
        text: { body: text },
      }),
    }
  );

  const result = await response.json();
  console.log("WhatsApp notification result:", JSON.stringify(result));

  return Response.json({ success: true });
});