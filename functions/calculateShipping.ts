import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * Smart shipping calculation with carrier API integration
 * Supports flat rate, free shipping threshold, and real-time rates
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items, destination, carrier } = await req.json();

    if (!items?.length || !destination) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalWeight = items.reduce((sum, item) => sum + (item.weight_grams || 30) * item.quantity, 0);

    // Free shipping threshold
    const FREE_SHIPPING_THRESHOLD = 150;
    if (subtotal >= FREE_SHIPPING_THRESHOLD) {
      return Response.json({
        method: 'free',
        cost: 0,
        estimated_days: '3-5 business days',
        carrier: 'USPS',
      });
    }

    // Flat rate for domestic
    if (destination.country === 'US' || !destination.country) {
      return Response.json({
        method: 'standard',
        cost: 9.99,
        estimated_days: '3-5 business days',
        carrier: 'USPS',
      });
    }

    // International flat rate
    if (destination.country !== 'US') {
      return Response.json({
        method: 'international',
        cost: 24.99,
        estimated_days: '7-14 business days',
        carrier: 'USPS International',
      });
    }

    // Real-time carrier API integration (example with ShipEngine)
    if (carrier === 'realtime' && Deno.env.get('SHIPENGINE_API_KEY')) {
      const shipEngineResponse = await fetch('https://api.shipengine.com/v1/rates', {
        method: 'POST',
        headers: {
          'API-Key': Deno.env.get('SHIPENGINE_API_KEY'),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shipment: {
            ship_to: {
              name: destination.name,
              address_line1: destination.address,
              city_locality: destination.city,
              state_province: destination.state,
              postal_code: destination.zip,
              country_code: destination.country || 'US',
            },
            ship_from: {
              name: 'KROXIS Warehouse',
              address_line1: '123 Industrial Pkwy',
              city_locality: 'Los Angeles',
              state_province: 'CA',
              postal_code: '90001',
              country_code: 'US',
            },
            packages: [{
              weight: { value: totalWeight, unit: 'gram' },
              dimensions: { length: 12, width: 8, height: 4, unit: 'inch' },
            }],
          },
        }),
      });

      if (shipEngineResponse.ok) {
        const data = await shipEngineResponse.json();
        const rates = data.rate_response?.rates || [];
        
        return Response.json({
          method: 'realtime',
          options: rates.map(r => ({
            carrier: r.carrier_friendly_name,
            service: r.service_type,
            cost: r.shipping_amount.amount,
            estimated_days: r.estimated_delivery_days,
            carrier_code: r.carrier_code,
          })),
        });
      }
    }

    // Default fallback
    return Response.json({
      method: 'standard',
      cost: 9.99,
      estimated_days: '3-5 business days',
      carrier: 'USPS',
    });

  } catch (error) {
    console.error('Shipping calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});