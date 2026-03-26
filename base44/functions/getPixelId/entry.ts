import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        const pixelId = Deno.env.get("FACEBOOK_PIXEL_ID");
        return Response.json({ pixelId: pixelId || null });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});