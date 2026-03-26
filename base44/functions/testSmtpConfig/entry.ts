import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { Resend } from 'npm:resend';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Extract the Resend API key and From Email from the frontend request
    const { apiKey, fromEmail } = await req.json();

    if (!apiKey || !fromEmail) {
      return Response.json({ 
        success: false,
        error: 'Missing required Resend API Key or From Email',
        details: {
          timestamp: new Date().toISOString(),
          code: 'MISSING_FIELDS',
          fields: { apiKey: !!apiKey, fromEmail: !!fromEmail }
        }
      }, { status: 400 });
    }

    // Initialize the Resend client
    const resend = new Resend(apiKey);

    // Send the test email via HTTP API (Bypasses the Port 587 block)
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: user.email,
      subject: 'Email API Configuration Test',
      html: '<p>This is a test email to verify your Resend API configuration is working perfectly over HTTP.</p>'
    });

    // Resend doesn't throw on API errors, it returns an error object
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
      message: 'Email configuration is valid. Test email sent to ' + user.email,
      details: {
        timestamp: new Date().toISOString(),
        recipientEmail: user.email,
        messageId: data?.id,
        status: 'Email sent successfully'
      },
      data: data
    });

  } catch (error) {
    console.error('Test execution error:', error);
    return Response.json({ 
      success: false, 
      error: error.message || 'Failed to test email configuration',
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