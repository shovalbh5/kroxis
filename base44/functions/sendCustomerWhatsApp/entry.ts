import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
const PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

async function sendWhatsAppTemplate(to, templateName, languageCode) {
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
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
        },
      }),
    }
  );
  return response.json();
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

  // Send template message to business owner (always works, no 24h restriction)
  const ownerPhone = '972525568069';
  const ownerResult = await sendWhatsAppTemplate(ownerPhone, "hello_world", "en_US");
  console.log("Owner template result:", JSON.stringify(ownerResult));

  // Send template message to customer
  const customerResult = await sendWhatsAppTemplate(cleanPhone, "hello_world", "en_US");
  console.log("Customer template result:", JSON.stringify(customerResult));

  // Save the inquiry in the database so admin can see it
  const base44 = createClientFromRequest(req);
  await base44.asServiceRole.entities.WhatsAppMessage.create({
    from_number: cleanPhone,
    from_name: name || 'אורח',
    message_text: `[פנייה מהאתר] ${name || 'לא צוין'} - ${phone} - ${message}`,
    direction: "incoming",
    wa_message_id: ownerResult.messages?.[0]?.id || "",
    status: "received"
  });

  return Response.json({ success: true });
});