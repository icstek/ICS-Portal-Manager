import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { Resend } from 'npm:resend@3.4.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId, recipientEmail, ccEmail } = await req.json();

    if (!reportId || !recipientEmail) {
      return Response.json({ error: 'Missing reportId or recipientEmail' }, { status: 400 });
    }

    // Get the report
    const reports = await base44.entities.ServiceReport.filter({ id: reportId });
    const report = reports[0];

    if (!report) {
      return Response.json({ error: 'Report not found' }, { status: 404 });
    }

    // Send email using Resend
    const result = await resend.emails.send({
      from: Deno.env.get('SMTP_FROM_EMAIL'),
      to: recipientEmail,
      cc: ccEmail ? [ccEmail] : undefined,
      subject: `Service Report #${report.report_number}`,
      html: `<p>Please find the service report #${report.report_number} for ${report.customer_name}.</p>
             <p><strong>Date:</strong> ${report.date}</p>
             <p><strong>Total:</strong> $${(report.total_charges || 0).toFixed(2)}</p>`
    });

    if (result.error) {
      return Response.json({ error: result.error.message }, { status: 500 });
    }

    return Response.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});