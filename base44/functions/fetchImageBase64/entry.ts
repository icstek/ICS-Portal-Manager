import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await req.json();
    if (!url) {
      return Response.json({ error: 'URL required' }, { status: 400 });
    }

    const resp = await fetch(url);
    if (!resp.ok) {
      return Response.json({ error: 'Failed to fetch image' }, { status: 500 });
    }

    const buffer = await resp.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    const contentType = resp.headers.get('content-type') || 'image/png';
    const dataUrl = `data:${contentType};base64,${base64}`;

    return Response.json({ dataUrl });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});