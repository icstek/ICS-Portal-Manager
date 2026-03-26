import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId, recipientEmail, ccEmail, pdfUrl } = await req.json();

    if (!reportId || !recipientEmail) {
      return Response.json({ error: 'Missing reportId or recipientEmail' }, { status: 400 });
    }

    // Get the report
    const reports = await base44.entities.ServiceReport.filter({ id: reportId });
    const report = reports[0];

    if (!report) {
      return Response.json({ error: 'Report not found' }, { status: 404 });
    }

    // Send email using Base44's built-in email service
    const emailBody = `Service Report for ${report.customer_name}\n\nDate: ${report.date}\nTotal: $${(report.total_charges || 0).toFixed(2)}\n\nReport Number: ${report.report_number}${pdfUrl ? '\n\nPlease see attached PDF for the detailed report.' : ''}`;
    
    await base44.integrations.Core.SendEmail({
      to: recipientEmail,
      subject: `Service Report #${report.report_number}`,
      body: emailBody
    });

    return Response.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});