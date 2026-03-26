import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json();
        const order = payload.data;
        
        if (order && order.customer_email) {
            const settingsList = await base44.asServiceRole.entities.StoreSettings.list();
            const settings = settingsList && settingsList.length > 0 ? settingsList[0] : {};
            
            const storeName = settings.store_name || 'KROXIS';
            const contactEmail = settings.contact_email || 'support@kroxis.com';
            const contactPhone = settings.contact_phone || '050-0000000';

            const itemsHtml = (order.items || []).map(item => 
              `<tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.title} ${item.lens_option && item.lens_option !== 'standard' ? `(${item.lens_option})` : ''}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.quantity}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">₪${item.price}</td>
              </tr>`
            ).join('');

            const body = `
            <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; text-align: right;">
              <h2 style="color: #ff6600;">תודה על הזמנתך מ-${storeName}!</h2>
              <p>שלום ${order.customer_name},</p>
              <p>הזמנתך התקבלה בהצלחה ונמצאת בטיפול. להלן פרטי ההזמנה (טופס גילוי נאות בהתאם לחוק הגנת הצרכן):</p>
              
              <h3 style="border-bottom: 2px solid #ff6600; padding-bottom: 5px;">פרטי העסק</h3>
              <p>
                <strong>שם העסק:</strong> ${storeName}<br>
                <strong>ח.פ/ע.מ:</strong> יש להשלים ח.פ בהגדרות<br>
                <strong>טלפון לבירורים:</strong> <span dir="ltr">${contactPhone}</span><br>
                <strong>דוא"ל:</strong> ${contactEmail}
              </p>

              <h3 style="border-bottom: 2px solid #ff6600; padding-bottom: 5px;">פרטי ההזמנה</h3>
              <p><strong>מספר הזמנה:</strong> ${order.id}</p>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                  <tr style="background-color: #f9f9f9;">
                    <th style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">פריט</th>
                    <th style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">כמות</th>
                    <th style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">מחיר</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              
              <p>
                <strong>סכום ביניים:</strong> ₪${order.subtotal}<br>
                <strong>דמי משלוח:</strong> ₪${order.shipping_cost}<br>
                ${order.discount_amount > 0 ? `<strong>הנחה:</strong> -₪${order.discount_amount}<br>` : ''}
                <strong style="font-size: 1.2em;">סך הכל לתשלום: ₪${order.total}</strong>
              </p>

              <h3 style="border-bottom: 2px solid #ff6600; padding-bottom: 5px;">פרטי משלוח וזמני אספקה</h3>
              <p>
                <strong>כתובת למשלוח:</strong> ${order.shipping_address}<br>
                <strong>זמן אספקה משוער:</strong> עד 7 ימי עסקים (או בהתאם לשיטת המשלוח שנבחרה).
              </p>

              <h3 style="border-bottom: 2px solid #ff6600; padding-bottom: 5px;">מדיניות ביטולים והחזרות</h3>
              <p style="font-size: 0.9em;">
                על פי חוק הגנת הצרכן, הנך רשאי/ת לבטל את העסקה בתוך 14 ימים מיום קבלת המוצר או מסמך זה (לפי המאוחר מביניהם). 
                הביטול ייעשה באמצעות הודעה בכתב (דוא"ל, וואטסאפ או דואר רשום).
                במקרה של ביטול שלא עקב פגם או אי התאמה, ייגבו דמי ביטול בשיעור של 5% ממחיר העסקה או 100 ש"ח, הנמוך מביניהם.
                החזרת המוצר תיעשה על חשבון הצרכן, כשהוא באריזתו המקורית ושלא נעשה בו שימוש.
              </p>

              <p>נשמח לעמוד לרשותך בכל שאלה!</p>
              <p>בברכה,<br>צוות ${storeName}</p>
            </div>
            `;
            
            await base44.asServiceRole.integrations.Core.SendEmail({
                from_name: storeName,
                to: order.customer_email,
                subject: `אישור הזמנה - ${storeName}`,
                body: body
            });
        }
        
        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});