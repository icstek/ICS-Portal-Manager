import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { Resend } from 'npm:resend';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (!data) {
      return Response.json({ error: 'No report data' }, { status: 400 });
    }

    const report = data;
    const reportId = event?.entity_id;

    // Get global Resend settings
    const settings = await base44.asServiceRole.entities.GlobalSettings.filter({ key: 'global' });
    const config = settings[0];

    if (!config?.resend_api_key || !config?.resend_from_email) {
      console.error('Resend not configured in global settings');
      return Response.json({ error: 'Email not configured' }, { status: 500 });
    }

    const resend = new Resend(config.resend_api_key);

    const reportNum = report.report_number || 'N/A';
    const customerName = report.customer_name || 'Unknown';
    const date = report.date || '';
    const techName = report.technician_name || '';
    const reportType = (report.report_type || 'repair').toUpperCase();
    const memo = report.memo || '';
    const status = (report.service_status || 'incomplete').toUpperCase();

    const subject = `New Service Report #${reportNum} - ${customerName}`;
    const body = `
      <h2>Service Report #${reportNum}</h2>
      <p><strong>Type:</strong> ${reportType}</p>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Customer:</strong> ${customerName}</p>
      ${report.customer_address ? `<p><strong>Address:</strong> ${report.customer_address}${report.customer_city ? ', ' + report.customer_city : ''}${report.customer_zip ? ' ' + report.customer_zip : ''}</p>` : ''}
      ${report.customer_tel ? `<p><strong>Tel:</strong> ${report.customer_tel}</p>` : ''}
      ${techName ? `<p><strong>Technician:</strong> ${techName}</p>` : ''}
      ${memo ? `<p><strong>Memo:</strong> ${memo}</p>` : ''}
      <p><strong>Status:</strong> ${status}</p>
      ${report.problem_description ? `<p><strong>Problem:</strong> ${report.problem_description}</p>` : ''}
      ${report.service_description ? `<p><strong>Service Description:</strong> ${report.service_description}</p>` : ''}
      <hr/>
      <p><strong>Labor:</strong> $${(report.labor_charge || 0).toFixed(2)}</p>
      <p><strong>Parts:</strong> $${(report.parts_charge || 0).toFixed(2)}</p>
      <p><strong>Travel:</strong> $${(report.travel_charge || 0).toFixed(2)}</p>
      <p><strong>Sub Total:</strong> $${(report.sub_total || 0).toFixed(2)}</p>
      <p><strong>Tax:</strong> $${(report.tax_amount || 0).toFixed(2)}</p>
      <p><strong>Total Charges:</strong> $${(report.total_charges || 0).toFixed(2)}</p>
    `;

    const { data: emailResult, error } = await resend.emails.send({
      from: config.resend_from_email,
      to: 'udi@icstek.com',
      cc: 'mariangel@icstek.com',
      subject,
      html: body,
    });

    if (error) {
      console.error('Resend error:', error);
      return Response.json({ success: false, error: error.message }, { status: 400 });
    }

    console.log('Auto-email sent for report', reportNum, emailResult);
    return Response.json({ success: true, messageId: emailResult?.id });
  } catch (error) {
    console.error('Auto-email error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});