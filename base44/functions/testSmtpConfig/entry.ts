import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import nodemailer from 'npm:nodemailer@6.9.7';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { host, port, user: smtpUser, password, fromEmail } = await req.json();

    if (!host || !port || !smtpUser || !password || !fromEmail) {
      return Response.json({ 
        success: false,
        error: 'Missing required SMTP configuration fields',
        details: {
          timestamp: new Date().toISOString(),
          code: 'MISSING_FIELDS',
          fields: { host: !!host, port: !!port, user: !!smtpUser, password: !!password, fromEmail: !!fromEmail }
        }
      }, { status: 400 });
    }

    const portNum = parseInt(port);

    // Create transporter with provided config
    const transporter = nodemailer.createTransport({
      host,
      port: portNum,
      secure: portNum === 465,
      auth: {
        user: smtpUser,
        pass: password
      }
    });

    // Verify connection
    console.log(`Testing SMTP connection to ${host}:${portNum}`);
    await transporter.verify();
    console.log('SMTP connection verified successfully');

    // Send test email
    console.log(`Sending test email to ${user.email}`);
    await transporter.sendMail({
      from: fromEmail,
      to: user.email,
      subject: 'SMTP Configuration Test',
      text: 'This is a test email to verify your SMTP configuration is working correctly.'
    });
    console.log('Test email sent successfully');

    return Response.json({ 
      success: true, 
      message: 'SMTP configuration is valid. Test email sent to ' + user.email,
      details: {
        timestamp: new Date().toISOString(),
        host,
        port: portNum,
        secure: portNum === 465,
        recipientEmail: user.email,
        status: 'Connection verified and email sent'
      }
    });
  } catch (error) {
    console.error('SMTP test error:', error);
    return Response.json({ 
      success: false, 
      error: error.message || 'Failed to test SMTP configuration',
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