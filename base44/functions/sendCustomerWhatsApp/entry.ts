import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
const PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

Deno.serve(async (req) => {
  const { name, phone, message } = await req.json();

  if (!phone || !message) {
    return Response.json({ error: 'Missing phone or message' }, { status: 400 });
  }

  // Clean phone number - remove spaces, dashes, leading zeros
  let cleanPhone = phone.replace(/[\s\-()]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '972' + cleanPhone.slice(1);
  }
  if (!cleanPhone.startsWith('+') && !cleanPhone.startsWith('972')) {
    cleanPhone = '972' + cleanPhone;
  }
  cleanPhone = cleanPhone.replace('+', '');

  // Send message to business number (the owner) notifying about customer inquiry
  const ownerPhone = '972525568069';
  const notifyMessage = `📩 הודעה חדשה מהאתר!\n\n👤 שם: ${name || 'לא צוין'}\n📱 טלפון: ${phone}\n💬 הודעה: ${message}`;

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
        to: ownerPhone,
        type: "text",
        text: { body: notifyMessage },
      }),
    }
  );

  const result = await response.json();
  console.log("Send result:", JSON.stringify(result));

  if (!response.ok) {
    return Response.json({ error: result.error?.message || "Failed to send" }, { status: 500 });
  }

  // Save message record
  const base44 = createClientFromRequest(req);
  await base44.asServiceRole.entities.WhatsAppMessage.create({
    from_number: cleanPhone,
    from_name: name || 'אורח',
    message_text: message,
    direction: "incoming",
    wa_message_id: result.messages?.[0]?.id || "",
    status: "received"
  });

  return Response.json({ success: true });
});