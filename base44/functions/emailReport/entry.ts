import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { Resend } from 'npm:resend';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId, recipientEmail, ccEmail, subject, body, pdfUrl } = await req.json();

    if (!reportId || !recipientEmail) {
      return Response.json({ 
        success: false,
        error: 'Missing reportId or recipientEmail',
        details: {
          timestamp: new Date().toISOString(),
          code: 'MISSING_FIELDS'
        }
      }, { status: 400 });
    }

    // Get the report using service role so all users can access it
    const reports = await base44.asServiceRole.entities.ServiceReport.filter({ id: reportId });
    const report = reports[0];

    if (!report) {
      return Response.json({ 
        success: false,
        error: 'Report not found',
        details: {
          timestamp: new Date().toISOString(),
          code: 'REPORT_NOT_FOUND'
        }
      }, { status: 404 });
    }

    // Get Resend configuration from GlobalSettings (accessible to all roles)
    const settings = await base44.asServiceRole.entities.GlobalSettings.filter({ key: 'global' });
    const globalSettings = settings[0];
    const apiKey = globalSettings?.resend_api_key;
    const fromEmail = globalSettings?.resend_from_email;

    if (!apiKey || !fromEmail) {
      return Response.json({ 
        success: false,
        error: 'Resend configuration missing. An admin needs to configure email settings first.',
        details: {
          timestamp: new Date().toISOString(),
          code: 'MISSING_CONFIG',
          fields: { apiKey: !!apiKey, fromEmail: !!fromEmail }
        }
      }, { status: 500 });
    }

    const resend = new Resend(apiKey);

    // Prepare email attachments
    let attachments = [];
    if (pdfUrl) {
      try {
        const pdfResponse = await fetch(pdfUrl);
        const pdfBuffer = await pdfResponse.arrayBuffer();
        const uint8Array = new Uint8Array(pdfBuffer);
        
        // Process the array in chunks to avoid call stack limits
        let binaryString = '';
        const chunkSize = 8192;
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.subarray(i, i + chunkSize);
          binaryString += String.fromCharCode.apply(null, chunk);
        }
        
        const base64String = btoa(binaryString);
        
        attachments = [{
          filename: `report-${report.report_number}.pdf`,
          content: base64String
        }];
        console.log('PDF attachment prepared successfully:', { filename: `report-${report.report_number}.pdf`, size: pdfBuffer.byteLength });
      } catch (attachError) {
        console.error('PDF attachment error:', attachError);
      }
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      cc: ccEmail || undefined,
      subject: subject || `Service Report #${report.report_number}`,
      html: body || `<p>Service Report for ${report.customer_name}</p>`,
      attachments: attachments.length > 0 ? attachments : undefined
    });

    if (error) {
      console.error('Resend API Error:', error);
      return Response.json({ 
        success: false, 
        error: error.message,
        details: {
          timestamp: new Date().toISOString(),
          code: 'RESEND_API_ERROR',
          errorMessage: error.message,
          fullError: error.toString()
        }
      }, { status: 400 });
    }

    return Response.json({ 
      success: true, 
      message: 'Email sent successfully to ' + recipientEmail,
      details: {
        timestamp: new Date().toISOString(),
        recipientEmail,
        messageId: data?.id,
        status: 'Email sent'
      },
      data: data
    });

  } catch (error) {
    console.error('Email execution error:', error);
    return Response.json({ 
      success: false, 
      error: error.message || 'Failed to send email',
      details: {
        timestamp: new Date().toISOString(),
        code: error.code || 'UNKNOWN_ERROR',
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        fullError: error.toString()
      }
    }, { status: 500 });
  }
});