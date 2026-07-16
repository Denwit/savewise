import nodemailer from 'nodemailer';
import ContactMessage from '../models/ContactMessage.js';
import { generateReferenceId } from '../utils/referenceGenerator.js';

// @desc    Submit contact form
// @route   POST /api/contact
// @access  Public
export const submitContactForm = async (req, res) => {
  console.log('📧 Contact form submission received:', req.body);
  
  // Get IP address and user agent
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];
  
  try {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Generate reference ID
    const referenceId = generateReferenceId();
    
    // Save to database
    const contactMessage = await ContactMessage.create({
      reference_id: referenceId,
      name,
      email,
      subject,
      message,
      ip_address: ipAddress,
      user_agent: userAgent,
      status: 'pending'
    });

    console.log(`✅ Contact message saved to database with ID: ${contactMessage.id}, Reference: ${referenceId}`);

    // Get email configuration from environment
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASSWORD;
    const adminEmail = process.env.ADMIN_EMAIL || emailUser;
    const noReplyEmail = process.env.NO_REPLY_EMAIL || emailUser;

    if (!emailUser || !emailPass) {
      console.error('❌ Email configuration missing in environment variables');
      
      // Update database status
      await contactMessage.update({ 
        status: 'failed',
        admin_email_sent: false,
        user_email_sent: false 
      });
      
      return res.status(500).json({
        success: false,
        message: 'Email service is not configured. Please try again later.'
      });
    }

    console.log('📧 Email configuration loaded:', {
      emailUser,
      noReplyEmail,
      adminEmail,
      hasPassword: !!emailPass
    });

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

    // Verify transporter configuration
    try {
      await transporter.verify();
      console.log('✅ SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('❌ SMTP verification failed:', verifyError);
      
      await contactMessage.update({ 
        status: 'failed',
        admin_email_sent: false,
        user_email_sent: false 
      });
      
      return res.status(500).json({
        success: false,
        message: 'Email service configuration error. Please contact administrator.'
      });
    }

    // Email templates with reference ID
    const userAcknowledgementTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
          <h1>Thank You for Contacting SaveWise</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Hello <strong>${name}</strong>,</p>
          <p>We've received your message and will get back to you within 24-48 hours.</p>
          <div style="background: white; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0;">
            <p><strong>Your Message:</strong></p>
            <p>${message}</p>
          </div>
          <h3>Your Inquiry Details:</h3>
          <ul>
            <li><strong>Reference ID:</strong> ${referenceId}</li>
            <li><strong>Subject:</strong> ${subject}</li>
            <li><strong>Submitted:</strong> ${new Date().toLocaleString()}</li>
          </ul>
          <p><strong>Note:</strong> This is an automated acknowledgment. Please do not reply to this email.</p>
          <p>Best regards,<br>The SaveWise Support Team</p>
        </div>
      </div>
    `;

    const adminNotificationTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
        <div style="background: #dc3545; padding: 20px; color: white; border-radius: 5px;">
          <h2>📧 New Contact Form Submission</h2>
          <p><strong>Reference ID:</strong> ${referenceId}</p>
        </div>
        <div style="background: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3>Contact Details</h3>
          <table cellpadding="10" cellspacing="0" border="0" style="width: 100%;">
            <tr>
              <td style="width: 30%;"><strong>Reference ID:</strong></td>
              <td><strong style="color: #dc3545;">${referenceId}</strong></td>
            </tr>
            <tr>
              <td><strong>Name:</strong></td>
              <td>${name}</td>
            </tr>
            <tr>
              <td><strong>Email:</strong></td>
              <td><a href="mailto:${email}">${email}</a></td>
            </tr>
            <tr>
              <td><strong>Subject:</strong></td>
              <td><span style="background: #fff3cd; padding: 5px 10px; border-radius: 3px;">${subject}</span></td>
            </tr>
            <tr>
              <td><strong>Submitted:</strong></td>
              <td>${new Date().toLocaleString()}</td>
            </tr>
            <tr>
              <td><strong>IP Address:</strong></td>
              <td>${ipAddress}</td>
            </tr>
          </table>
        </div>
        <div style="background: white; border: 1px solid #dee2e6; padding: 15px; border-radius: 5px;">
          <h3>Message Content</h3>
          <p>${message.replace(/\n/g, '<br>')}</p>
        </div>
        <div style="margin-top: 30px; padding: 15px; background: #d4edda; border-radius: 5px;">
          <h4>📋 Message Stored in Database</h4>
          <p>This message has been logged in the system with Reference ID: <strong>${referenceId}</strong></p>
          <p>You can track this inquiry using the reference ID above.</p>
        </div>
      </div>
    `;

    let userEmailSent = false;
    let adminEmailSent = false;

    // Send acknowledgment to user (FROM no-reply email)
    try {
      console.log(`📧 Attempting to send acknowledgment email to: ${email} (from: ${noReplyEmail})`);
      const userMailInfo = await transporter.sendMail({
        from: `"SaveWise" <${noReplyEmail}>`,
        replyTo: process.env.SUPPORT_EMAIL || adminEmail, // Set reply-to to support email
        to: email,
        subject: `Thank You for Contacting SaveWise [Ref: ${referenceId}]`,
        html: userAcknowledgementTemplate,
        text: `Hello ${name},\n\nWe've received your message and will get back to you within 24-48 hours.\n\nYour Message: ${message}\n\nReference ID: ${referenceId}\nSubject: ${subject}\nSubmitted: ${new Date().toLocaleString()}\n\nNote: This is an automated acknowledgment. Please do not reply to this email.\n\nBest regards,\nThe SaveWise Support Team`
      });
      console.log('✅ User acknowledgment email sent:', userMailInfo.messageId);
      userEmailSent = true;
      
      // Update database
      await contactMessage.update({ 
        user_email_sent: true 
      });
    } catch (userError) {
      console.error('❌ Failed to send user acknowledgment email:', userError.message);
    }

    // Forward message to admin
    try {
      console.log(`📧 Attempting to send admin notification to: ${adminEmail}`);
      const adminMailInfo = await transporter.sendMail({
        from: `"SaveWise Contact Form" <${emailUser}>`,
        to: adminEmail,
        subject: `[Ref: ${referenceId}] New Contact Form: ${subject}`,
        html: adminNotificationTemplate,
        text: `New Contact Form Submission\n\nReference ID: ${referenceId}\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage: ${message}\nSubmitted: ${new Date().toLocaleString()}\nIP Address: ${ipAddress}`
      });
      console.log('✅ Admin notification email sent:', adminMailInfo.messageId);
      adminEmailSent = true;
      
      // Update database
      await contactMessage.update({ 
        admin_email_sent: true 
      });
    } catch (adminError) {
      console.error('❌ Failed to send admin notification email:', adminError.message);
    }

    // Update final status in database
    if (userEmailSent || adminEmailSent) {
      await contactMessage.update({ 
        status: 'sent'
      });
    } else {
      await contactMessage.update({ 
        status: 'failed'
      });
    }

    // Return success response with reference ID
    return res.status(200).json({
      success: true,
      message: 'Thank you for your message! We\'ll get back to you soon.',
      referenceId: referenceId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Contact form error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit contact form. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};