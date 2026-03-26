import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import nodemailer from 'npm:nodemailer@6.9.7';

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

    // Create SMTP transporter
    const transporter = nodemailer.createTransport({
      host: Deno.env.get('SMTP_HOST'),
      port: parseInt(Deno.env.get('SMTP_PORT') || '587'),
      secure: Deno.env.get('SMTP_PORT') === '465',
      auth: {
        user: Deno.env.get('SMTP_USER'),
        pass: Deno.env.get('SMTP_PASSWORD')
      }
    });

    // Prepare email
    const emailBody = `Service Report for ${report.customer_name}\n\nDate: ${report.date}\nTotal: $${(report.total_charges || 0).toFixed(2)}\n\nReport Number: ${report.report_number}${pdfUrl ? '\n\nPlease see attached PDF for the detailed report.' : ''}`;
    
    const mailOptions = {
      from: Deno.env.get('SMTP_FROM_EMAIL'),
      to: recipientEmail,
      cc: ccEmail || undefined,
      subject: `Service Report #${report.report_number}`,
      text: emailBody
    };

    // Add PDF attachment if available
    if (pdfUrl) {
      const pdfResponse = await fetch(pdfUrl);
      const pdfBuffer = await pdfResponse.arrayBuffer();
      mailOptions.attachments = [{
        filename: `report-${report.report_number}.pdf`,
        content: new Uint8Array(pdfBuffer)
      }];
    }

    await transporter.sendMail(mailOptions);

    return Response.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});