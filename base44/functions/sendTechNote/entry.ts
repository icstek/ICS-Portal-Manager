import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { noteId, message, authorName } = await req.json();

    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'udi@icstek.com',
      subject: `Tech Note from ${authorName || user.full_name || user.email}`,
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #1e40af;">New Technician Note</h2>
          <p><strong>From:</strong> ${authorName || user.full_name || user.email}</p>
          <p><strong>Date:</strong> ${timestamp}</p>
          <hr style="border: 1px solid #e5e7eb;" />
          <div style="padding: 16px; background: #f8fafc; border-radius: 8px; margin-top: 12px;">
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
        </div>
      `
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});