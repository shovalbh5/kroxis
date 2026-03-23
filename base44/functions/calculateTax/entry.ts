import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * Automated tax calculation based on shipping destination
 * Supports US sales tax and international VAT
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subtotal, destination } = await req.json();

    if (!subtotal || !destination) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // US Sales Tax Rates (simplified - state level)
    const usSalesTaxRates = {
      'AL': 4.00, 'AK': 0.00, 'AZ': 5.60, 'AR': 6.50, 'CA': 7.25,
      'CO': 2.90, 'CT': 6.35, 'DE': 0.00, 'FL': 6.00, 'GA': 4.00,
      'HI': 4.00, 'ID': 6.00, 'IL': 6.25, 'IN': 7.00, 'IA': 6.00,
      'KS': 6.50, 'KY': 6.00, 'LA': 4.45, 'ME': 5.50, 'MD': 6.00,
      'MA': 6.25, 'MI': 6.00, 'MN': 6.88, 'MS': 7.00, 'MO': 4.23,
      'MT': 0.00, 'NE': 5.50, 'NV': 6.85, 'NH': 0.00, 'NJ': 6.63,
      'NM': 5.13, 'NY': 4.00, 'NC': 4.75, 'ND': 5.00, 'OH': 5.75,
      'OK': 4.50, 'OR': 0.00, 'PA': 6.00, 'RI': 7.00, 'SC': 6.00,
      'SD': 4.50, 'TN': 7.00, 'TX': 6.25, 'UT': 6.10, 'VT': 6.00,
      'VA': 5.30, 'WA': 6.50, 'WV': 6.00, 'WI': 5.00, 'WY': 4.00,
    };

    // International VAT Rates
    const vatRates = {
      'GB': 20.0,  // UK
      'DE': 19.0,  // Germany
      'FR': 20.0,  // France
      'IT': 22.0,  // Italy
      'ES': 21.0,  // Spain
      'NL': 21.0,  // Netherlands
      'BE': 21.0,  // Belgium
      'SE': 25.0,  // Sweden
      'PL': 23.0,  // Poland
      'AT': 20.0,  // Austria
      'IL': 17.0,  // Israel
      'AU': 10.0,  // Australia (GST)
      'CA': 5.0,   // Canada (GST, provinces vary)
      'JP': 10.0,  // Japan
    };

    const country = destination.country || 'US';
    const state = destination.state?.toUpperCase();

    let taxRate = 0;
    let taxType = 'none';
    let taxAmount = 0;

    // US Sales Tax
    if (country === 'US' && state && usSalesTaxRates[state] !== undefined) {
      taxRate = usSalesTaxRates[state];
      taxType = 'sales_tax';
      taxAmount = (subtotal * taxRate) / 100;
    }
    // International VAT
    else if (vatRates[country] !== undefined) {
      taxRate = vatRates[country];
      taxType = 'vat';
      taxAmount = (subtotal * taxRate) / 100;
    }

    // Integration with TaxJar or Avalara (optional)
    if (Deno.env.get('TAXJAR_API_KEY')) {
      try {
        const taxJarResponse = await fetch('https://api.taxjar.com/v2/taxes', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('TAXJAR_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from_country: 'US',
            from_zip: '90001',
            from_state: 'CA',
            to_country: country,
            to_zip: destination.zip,
            to_state: state,
            amount: subtotal,
            shipping: 0,
          }),
        });

        if (taxJarResponse.ok) {
          const taxData = await taxJarResponse.json();
          return Response.json({
            tax_amount: taxData.tax.amount_to_collect,
            tax_rate: taxData.tax.rate * 100,
            tax_type: 'sales_tax',
            jurisdiction: taxData.tax.jurisdictions,
            provider: 'taxjar',
          });
        }
      } catch (error) {
        console.error('TaxJar API error:', error);
        // Fallback to manual calculation
      }
    }

    return Response.json({
      tax_amount: parseFloat(taxAmount.toFixed(2)),
      tax_rate: taxRate,
      tax_type: taxType,
      jurisdiction: country === 'US' ? `${state}, US` : country,
      provider: 'manual',
    });

  } catch (error) {
    console.error('Tax calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});