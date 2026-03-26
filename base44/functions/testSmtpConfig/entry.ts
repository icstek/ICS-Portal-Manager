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
      return Response.json({ error: 'Missing required SMTP configuration fields' }, { status: 400 });
    }

    // Create transporter with provided config
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user: smtpUser,
        pass: password
      }
    });

    // Verify connection
    await transporter.verify();

    // Send test email
    await transporter.sendMail({
      from: fromEmail,
      to: user.email,
      subject: 'SMTP Configuration Test',
      text: 'This is a test email to verify your SMTP configuration is working correctly.'
    });

    return Response.json({ 
      success: true, 
      message: 'SMTP configuration is valid. Test email sent to ' + user.email 
    });
  } catch (error) {
    console.error('SMTP test error:', error);
    return Response.json({ 
      success: false, 
      error: error.message || 'Failed to test SMTP configuration' 
    }, { status: 500 });
  }
});