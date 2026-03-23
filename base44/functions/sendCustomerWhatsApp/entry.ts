import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
const PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

async function sendWhatsAppMessage(to, payload) {
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
        to,
        ...payload,
      }),
    }
  );
  return response.json();
}

async function sendTemplateMessage(to, templateName, languageCode) {
  return sendWhatsAppMessage(to, {
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
    },
  });
}

async function sendTextMessage(to, text) {
  return sendWhatsAppMessage(to, {
    type: "text",
    text: { body: text },
  });
}

Deno.serve(async (req) => {
  const { name, phone, message } = await req.json();

  if (!phone || !message) {
    return Response.json({ error: 'Missing phone or message' }, { status: 400 });
  }

  // Clean phone number
  let cleanPhone = phone.replace(/[\s\-()]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '972' + cleanPhone.slice(1);
  }
  if (!cleanPhone.startsWith('+') && !cleanPhone.startsWith('972')) {
    cleanPhone = '972' + cleanPhone;
  }
  cleanPhone = cleanPhone.replace('+', '');

  const ownerPhone = '972525568069';
  const notifyText = `📩 הודעה חדשה מהאתר!\n\n👤 שם: ${name || 'לא צוין'}\n📱 טלפון: ${phone}\n💬 הודעה: ${message}`;

  // Try sending text message to owner first, fallback to template if 24h window expired
  let ownerResult = await sendTextMessage(ownerPhone, notifyText);
  console.log("Owner text attempt:", JSON.stringify(ownerResult));

  if (ownerResult.error) {
    // Text failed (likely 24h window) — send template to re-open conversation
    const templateResult = await sendTemplateMessage(ownerPhone, "hello_world", "en_US");
    console.log("Owner template result:", JSON.stringify(templateResult));
    
    // Also try sending the actual notification as a follow-up text after template
    // (template re-opens the window, then text can follow)
    if (!templateResult.error) {
      // Small delay to let template open the conversation window
      await new Promise(r => setTimeout(r, 2000));
      ownerResult = await sendTextMessage(ownerPhone, notifyText);
      console.log("Owner text retry after template:", JSON.stringify(ownerResult));
    }
  }

  // Send confirmation to customer — same logic
  const confirmText = `היי${name ? ' ' + name : ''}! 👋\nקיבלנו את ההודעה שלך ב-KROXIS.\nניצור איתך קשר בהקדם האפשרי! 🔥`;

  let customerResult = await sendTextMessage(cleanPhone, confirmText);
  console.log("Customer text attempt:", JSON.stringify(customerResult));

  if (customerResult.error) {
    const templateResult = await sendTemplateMessage(cleanPhone, "hello_world", "en_US");
    console.log("Customer template result:", JSON.stringify(templateResult));
  }

  // Save message record
  const base44 = createClientFromRequest(req);
  await base44.asServiceRole.entities.WhatsAppMessage.create({
    from_number: cleanPhone,
    from_name: name || 'אורח',
    message_text: message,
    direction: "incoming",
    wa_message_id: ownerResult.messages?.[0]?.id || "",
    status: "received"
  });

  return Response.json({ success: true });
});