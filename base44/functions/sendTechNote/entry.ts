import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { Resend } from 'npm:resend';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, authorName } = await req.json();

    // Get Resend config from GlobalSettings
    const settings = await base44.asServiceRole.entities.GlobalSettings.filter({ key: 'global' });
    const globalSettings = settings[0];
    const apiKey = globalSettings?.resend_api_key;
    const fromEmail = globalSettings?.resend_from_email;

    if (!apiKey || !fromEmail) {
      return Response.json({ error: 'Email configuration missing. Admin needs to set up Resend settings.' }, { status: 500 });
    }

    const resend = new Resend(apiKey);
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
    const sender = authorName || user.full_name || user.email;

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: 'udi@icstek.com',
      subject: `Tech Note from ${sender}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #1e40af;">New Technician Note</h2>
          <p><strong>From:</strong> ${sender}</p>
          <p><strong>Date:</strong> ${timestamp}</p>
          <hr style="border: 1px solid #e5e7eb;" />
          <div style="padding: 16px; background: #f8fafc; border-radius: 8px; margin-top: 12px;">
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
        </div>
      `
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});