import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        // We don't need auth here because the pixel ID is public info needed for the frontend
        const pixelId = Deno.env.get("FACEBOOK_PIXEL_ID");
        return Response.json({ pixelId });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});