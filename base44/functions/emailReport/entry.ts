import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId, recipientEmail } = await req.json();

    if (!reportId || !recipientEmail) {
      return Response.json({ error: 'Missing reportId or recipientEmail' }, { status: 400 });
    }

    // Get the report
    const reports = await base44.entities.ServiceReport.filter({ id: reportId });
    const report = reports[0];

    if (!report) {
      return Response.json({ error: 'Report not found' }, { status: 404 });
    }

    // Use Base44 built-in email integration
    const emailResponse = await base44.integrations.Core.SendEmail({
      to: recipientEmail,
      subject: `Service Report #${report.report_number}`,
      body: `Service Report #${report.report_number}\n\nCustomer: ${report.customer_name}\nDate: ${report.date}\nTotal: $${(report.total_charges || 0).toFixed(2)}\n\nPlease find the detailed report in your portal.`,
      from_name: 'Service Reports'
    });

    return Response.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});