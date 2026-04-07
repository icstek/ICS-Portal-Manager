import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { Resend } from 'npm:resend';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId } = await req.json();

    if (!reportId) {
      return Response.json({ success: false, error: 'Missing reportId' }, { status: 400 });
    }

    // Get the report using service role so all users can access it
    const reports = await base44.asServiceRole.entities.ServiceReport.filter({ id: reportId });
    const report = reports[0];

    if (!report) {
      return Response.json({ success: false, error: 'Report not found' }, { status: 404 });
    }

    // Get Resend configuration from GlobalSettings (accessible to all roles)
    const settings = await base44.asServiceRole.entities.GlobalSettings.filter({ key: 'global' });
    const globalSettings = settings[0];
    const apiKey = globalSettings?.resend_api_key;
    const fromEmail = globalSettings?.resend_from_email;

    if (!apiKey || !fromEmail) {
      return Response.json({ 
        success: false, 
        error: 'Resend configuration missing. An admin needs to configure email settings first.' 
      }, { status: 500 });
    }

    const resend = new Resend(apiKey);

    const r = report;
    const subject = `Service Report #${r.report_number} - ${r.customer_name}`;
    
    // Build HTML email body
    const partsRows = (r.items_replaced || []).map(item => 
      `<tr>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;">${item.part_name || ''}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;">${item.qty || 0}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right;">$${(item.total || 0).toFixed(2)}</td>
      </tr>`
    ).join('');

    const htmlBody = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#1a1a1a;">Service Report #${r.report_number}</h2>
        <p style="color:#666;">Date: ${r.date || 'N/A'}</p>
        <hr style="border:none;border-top:1px solid #ddd;margin:16px 0;">
        
        <h3 style="color:#333;font-size:14px;">Customer</h3>
        <p style="margin:4px 0;">${r.customer_name}</p>
        ${r.customer_address ? `<p style="margin:4px 0;color:#666;">${r.customer_address}${r.customer_city ? ', ' + r.customer_city : ''} ${r.customer_zip || ''}</p>` : ''}
        ${r.customer_tel ? `<p style="margin:4px 0;color:#666;">Tel: ${r.customer_tel}</p>` : ''}
        ${r.customer_cell ? `<p style="margin:4px 0;color:#666;">Cell: ${r.customer_cell}</p>` : ''}
        
        ${r.problem_description ? `<h3 style="color:#333;font-size:14px;">Problem Description</h3><p style="color:#666;">${r.problem_description}</p>` : ''}
        
        <h3 style="color:#333;font-size:14px;">Technician & Labor</h3>
        <p style="margin:4px 0;">Technician: ${r.technician_name || 'N/A'}</p>
        <p style="margin:4px 0;">Hours: ${r.total_time_hours || 0} | Rate: $${r.hourly_rate || 0}/hr</p>
        
        ${r.service_description ? `<h3 style="color:#333;font-size:14px;">Service Description</h3><p style="color:#666;">${r.service_description}</p>` : ''}
        
        ${(r.items_replaced || []).length > 0 ? `
          <h3 style="color:#333;font-size:14px;">Parts Replaced</h3>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead><tr style="background:#f5f5f5;">
              <th style="padding:4px 8px;text-align:left;">Part</th>
              <th style="padding:4px 8px;text-align:left;">Qty</th>
              <th style="padding:4px 8px;text-align:right;">Total</th>
            </tr></thead>
            <tbody>${partsRows}</tbody>
          </table>
        ` : ''}
        
        <hr style="border:none;border-top:1px solid #ddd;margin:16px 0;">
        <table style="width:100%;font-size:13px;">
          <tr><td style="color:#666;">Labor</td><td style="text-align:right;">$${(r.labor_charge || 0).toFixed(2)}</td></tr>
          <tr><td style="color:#666;">Parts</td><td style="text-align:right;">$${(r.parts_charge || 0).toFixed(2)}</td></tr>
          <tr><td style="color:#666;">Travel</td><td style="text-align:right;">$${(r.travel_charge || r.misc_charge || 0).toFixed(2)}</td></tr>
          <tr><td style="color:#666;">Tax (${r.tax_rate || 9.5}%)</td><td style="text-align:right;">$${(r.tax_amount || 0).toFixed(2)}</td></tr>
          <tr style="font-weight:bold;font-size:15px;"><td>Total</td><td style="text-align:right;">$${(r.total_charges || 0).toFixed(2)}</td></tr>
        </table>
        
        <p style="color:#999;font-size:11px;margin-top:24px;">This is an automated notification from ICS Service Management.</p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: 'udi@icstek.com',
      cc: 'mariangel@icstek.com',
      subject,
      html: htmlBody,
    });

    if (error) {
      console.error('Resend API Error:', error);
      return Response.json({ success: false, error: error.message }, { status: 400 });
    }

    return Response.json({ 
      success: true, 
      message: `Email sent to udi@icstek.com (CC: mariangel@icstek.com)`,
      data 
    });

  } catch (error) {
    console.error('Auto email error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});