import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Send plan invitation email
  async sendInvitationEmail(invitedEmail, planName, inviterName, invitationLink) {
    try {
      await this.transporter.sendMail({
        from: `"SaveWise" <${process.env.EMAIL_USER}>`,
        to: invitedEmail,
        subject: `Invitation to Join "${planName}"`,
        html: this.getInvitationTemplate(invitedEmail, planName, inviterName, invitationLink)
      });

      console.log(`Invitation email sent to ${invitedEmail}`);
      return { success: true };
    } catch (error) {
      console.error('Invitation email sending error:', error);
      throw new Error('Failed to send invitation email');
    }
  }

  // Send contact form message
  async sendContactEmail(formData, adminEmail) {
    try {
      // 1. Send acknowledgment to user
      await this.transporter.sendMail({
        from: `"SaveWise Support" <${process.env.EMAIL_USER}>`,
        to: formData.email,
        subject: 'Thank You for Contacting SaveWise',
        html: this.getUserAcknowledgementTemplate(formData)
      });

      // 2. Forward message to admin
      await this.transporter.sendMail({
        from: `"SaveWise Contact Form" <${process.env.EMAIL_USER}>`,
        to: adminEmail,
        subject: `New Contact Form: ${formData.subject}`,
        html: this.getAdminNotificationTemplate(formData)
      });

      return { success: true };
    } catch (error) {
      console.error('Email sending error:', error);
      throw new Error('Failed to send email');
    }
  }

  // Invitation email template
  getInvitationTemplate(invitedEmail, planName, inviterName, invitationLink) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Join ${planName} on SaveWise</title>
        <style>
          /* Base styles */
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f6f9fc;
          }
          
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 0;
            background-color: #ffffff;
          }
          
          /* Header */
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            text-align: center;
            color: white;
            border-radius: 0 0 30px 30px;
          }
          
          .logo {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
            color: white;
            text-decoration: none;
          }
          
          .invite-badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 8px 20px;
            border-radius: 50px;
            font-size: 14px;
            margin-top: 10px;
          }
          
          /* Content */
          .content {
            padding: 40px 30px;
          }
          
          .plan-card {
            background: #f8f9fa;
            border-radius: 15px;
            padding: 25px;
            margin: 25px 0;
            border-left: 5px solid #667eea;
          }
          
          .plan-name {
            color: #2d3748;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          
          .inviter-info {
            display: flex;
            align-items: center;
            margin: 20px 0;
            padding: 15px;
            background: #fff5e6;
            border-radius: 10px;
          }
          
          .inviter-avatar {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 20px;
            margin-right: 15px;
          }
          
          /* Button */
          .invite-button {
            display: block;
            width: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            text-align: center;
            padding: 18px;
            border-radius: 12px;
            font-size: 18px;
            font-weight: bold;
            margin: 30px 0;
            transition: transform 0.3s, box-shadow 0.3s;
          }
          
          .invite-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
          }
          
          /* Steps */
          .steps {
            background: #f8f9fa;
            border-radius: 15px;
            padding: 25px;
            margin: 30px 0;
          }
          
          .step {
            display: flex;
            align-items: flex-start;
            margin-bottom: 20px;
          }
          
          .step-number {
            background: #667eea;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-right: 15px;
            flex-shrink: 0;
          }
          
          /* Footer */
          .footer {
            text-align: center;
            padding: 30px;
            background: #f8f9fa;
            border-top: 1px solid #e2e8f0;
            border-radius: 30px 30px 0 0;
            color: #718096;
            font-size: 14px;
          }
          
          .social-links {
            margin: 20px 0;
          }
          
          .social-links a {
            color: #667eea;
            margin: 0 10px;
            text-decoration: none;
          }
          
          /* Responsive */
          @media (max-width: 600px) {
            .content {
              padding: 20px;
            }
            
            .header {
              padding: 30px 15px;
            }
            
            .plan-card {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <div class="logo">💰 SaveWise</div>
            <h1 style="margin: 20px 0 10px 0; font-size: 28px;">You're Invited!</h1>
            <div class="invite-badge">Plan Invitation</div>
          </div>
          
          <!-- Content -->
          <div class="content">
            <p style="font-size: 16px; color: #4a5568; margin-bottom: 25px;">
              Hello! You've been invited to join a saving plan on SaveWise.
            </p>
            
            <!-- Inviter Info -->
            <div class="inviter-info">
              <div class="inviter-avatar">
                ${inviterName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style="margin: 0; font-weight: bold; color: #2d3748;">
                  ${inviterName}
                </p>
                <p style="margin: 5px 0 0 0; color: #718096; font-size: 14px;">
                  Has invited you to join their saving plan
                </p>
              </div>
            </div>
            
            <!-- Plan Card -->
            <div class="plan-card">
              <div class="plan-name">${planName}</div>
              <p style="color: #4a5568; margin-bottom: 15px;">
                Join this collaborative saving plan and start building your financial future together.
              </p>
              <div style="display: flex; align-items: center; color: #667eea; font-weight: bold;">
                <svg style="width: 20px; height: 20px; margin-right: 8px;" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                </svg>
                <span>Invitation expires in 72 hours</span>
              </div>
            </div>
            
            <!-- Accept Button -->
            <a href="${invitationLink}" class="invite-button">
              Accept Invitation & Join Plan
            </a>
            
            <!-- Steps -->
            <div class="steps">
              <h3 style="color: #2d3748; margin-bottom: 20px; font-size: 18px;">How to join:</h3>
              
              <div class="step">
                <div class="step-number">1</div>
                <div>
                  <p style="font-weight: bold; margin: 0 0 5px 0; color: #2d3748;">Click the invitation link</p>
                  <p style="margin: 0; color: #718096; font-size: 14px;">The link above will take you to the invitation page</p>
                </div>
              </div>
              
              <div class="step">
                <div class="step-number">2</div>
                <div>
                  <p style="font-weight: bold; margin: 0 0 5px 0; color: #2d3748;">Login or Create Account</p>
                  <p style="margin: 0; color: #718096; font-size: 14px;">Sign in with your existing account or create a new one</p>
                </div>
              </div>
              
              <div class="step">
                <div class="step-number">3</div>
                <div>
                  <p style="font-weight: bold; margin: 0 0 5px 0; color: #2d3748;">Accept and Start Saving</p>
                  <p style="margin: 0; color: #718096; font-size: 14px;">Once accepted, you can start participating in the plan</p>
                </div>
              </div>
            </div>
            
            <!-- Alternative Link -->
            <div style="background: #e6f7ff; border-radius: 10px; padding: 20px; margin-top: 30px; border-left: 4px solid #1890ff;">
              <p style="margin: 0 0 10px 0; color: #2d3748; font-weight: bold;">
                📋 Can't click the button?
              </p>
              <p style="margin: 0; color: #4a5568; font-size: 14px;">
                Copy and paste this link into your browser:
              </p>
              <p style="margin: 10px 0 0 0; padding: 12px; background: white; border-radius: 6px; font-family: monospace; font-size: 13px; color: #667eea; word-break: break-all;">
                ${invitationLink}
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <p style="margin: 0 0 20px 0; font-size: 14px;">
              This invitation was sent to <strong>${invitedEmail}</strong>. If you weren't expecting this invitation, you can safely ignore this email.
            </p>
            
            <div class="social-links">
              <a href="${process.env.FRONTEND_URL || 'https://savewise.com'}">Website</a> • 
              <a href="${process.env.FRONTEND_URL || 'https://savewise.com'}/help">Help Center</a> • 
              <a href="${process.env.FRONTEND_URL || 'https://savewise.com'}/privacy">Privacy</a>
            </div>
            
            <p style="margin: 20px 0 0 0; font-size: 12px; color: #a0aec0;">
              © ${new Date().getFullYear()} SaveWise. All rights reserved.<br>
              This email was sent from an automated system. Please do not reply to this address.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Send email when invitation is accepted
  async sendInvitationAcceptedEmail(planOwnerEmail, memberName, planName) {
    try {
      await this.transporter.sendMail({
        from: `"SaveWise" <${process.env.EMAIL_USER}>`,
        to: planOwnerEmail,
        subject: `${memberName} has joined "${planName}"`,
        html: this.getInvitationAcceptedTemplate(memberName, planName)
      });

      return { success: true };
    } catch (error) {
      console.error('Invitation accepted email sending error:', error);
      // Don't throw error for this, as the invitation was already accepted
      return { success: false, error: error.message };
    }
  }

  // Invitation accepted email template (to plan owner)
  getInvitationAcceptedTemplate(memberName, planName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-box { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Invitation Accepted!</h1>
          </div>
          <div class="content">
            <div class="success-box">
              <p style="margin: 0; font-size: 18px; font-weight: bold;">
                ${memberName} has accepted your invitation!
              </p>
            </div>
            
            <p>Hello Plan Owner,</p>
            
            <p><strong>${memberName}</strong> has successfully joined your saving plan:</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
              <h3 style="margin: 0 0 10px 0; color: #2d3748;">"${planName}"</h3>
              <p style="margin: 0; color: #666;">Member count has been updated.</p>
            </div>
            
            <p>You can now:</p>
            <ul>
              <li>View all members in your plan dashboard</li>
              <li>Set permissions for the new member</li>
              <li>Send welcome message to the team</li>
            </ul>
            
            <div style="margin-top: 30px; padding: 15px; background: #e8f4fd; border-radius: 8px;">
              <p style="margin: 0; color: #2d3748;">
                <strong>Quick Access:</strong> 
                <a href="${process.env.FRONTEND_URL || 'https://savewise.com'}/plans" style="color: #2196F3; text-decoration: none; font-weight: bold;">
                  Go to Plan Dashboard →
                </a>
              </p>
            </div>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              The SaveWise Team
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Send deposit reminder email
  async sendDepositReminderEmail(memberEmail, memberName, planName, dueDate, amount) {
    try {
      await this.transporter.sendMail({
        from: `"SaveWise Reminders" <${process.env.EMAIL_USER}>`,
        to: memberEmail,
        subject: `Reminder: Deposit Due for "${planName}"`,
        html: this.getDepositReminderTemplate(memberName, planName, dueDate, amount)
      });

      return { success: true };
    } catch (error) {
      console.error('Deposit reminder email sending error:', error);
      return { success: false, error: error.message };
    }
  }

  // Deposit reminder template
  getDepositReminderTemplate(memberName, planName, dueDate, amount) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .reminder-box { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Deposit Reminder</h1>
          </div>
          <div class="content">
            <div class="reminder-box">
              <p style="margin: 0; font-size: 18px; font-weight: bold;">
                Friendly reminder: Your deposit is due soon!
              </p>
            </div>
            
            <p>Hello <strong>${memberName}</strong>,</p>
            
            <p>This is a reminder about your upcoming deposit for the saving plan:</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF9800;">
              <h3 style="margin: 0 0 10px 0; color: #2d3748;">"${planName}"</h3>
              <div style="display: flex; justify-content: space-between; margin-top: 15px;">
                <div>
                  <p style="margin: 5px 0; color: #666;">Amount Due:</p>
                  <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: #2d3748;">ZMW ${amount}</p>
                </div>
                <div>
                  <p style="margin: 5px 0; color: #666;">Due Date:</p>
                  <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #F57C00;">${dueDate}</p>
                </div>
              </div>
            </div>
            
            <div style="margin-top: 30px; padding: 15px; background: #e8f4fd; border-radius: 8px;">
              <p style="margin: 0; color: #2d3748;">
                <strong>Make Deposit:</strong> 
                <a href="${process.env.FRONTEND_URL || 'https://savewise.com'}/deposit" style="color: #2196F3; text-decoration: none; font-weight: bold;">
                  Submit Deposit Now →
                </a>
              </p>
            </div>
            
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              This is an automated reminder. Please contact your plan admin if you have any questions.
            </p>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              The SaveWise Team
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // User acknowledgment email template (keep your existing)
  getUserAcknowledgementTemplate(formData) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          .message-box { background: white; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thank You for Contacting SaveWise</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${formData.name}</strong>,</p>
            
            <p>We've received your message and will get back to you within 24-48 hours.</p>
            
            <div class="message-box">
              <p><strong>Your Message:</strong></p>
              <p>${formData.message}</p>
            </div>
            
            <h3>Your Inquiry Details:</h3>
            <ul>
              <li><strong>Reference ID:</strong> CONTACT-${Date.now()}</li>
              <li><strong>Subject:</strong> ${formData.subject}</li>
              <li><strong>Submitted:</strong> ${new Date().toLocaleString()}</li>
            </ul>
            
            <p>In the meantime, you might find answers to common questions in our <a href="${process.env.FRONTEND_URL}/faq">FAQ section</a>.</p>
            
            <p>Best regards,<br>
            The SaveWise Support Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} SaveWise. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Admin notification template (keep your existing)
  getAdminNotificationTemplate(formData) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 700px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; padding: 20px; color: white; border-radius: 5px; }
          .info-box { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .message-box { background: white; border: 1px solid #dee2e6; padding: 15px; border-radius: 5px; }
          .highlight { background: #fff3cd; padding: 5px 10px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>📧 New Contact Form Submission</h2>
          </div>
          
          <div class="info-box">
            <h3>Contact Details</h3>
            <table cellpadding="10" cellspacing="0" border="0">
              <tr>
                <td><strong>Name:</strong></td>
                <td>${formData.name}</td>
              </tr>
              <tr>
                <td><strong>Email:</strong></td>
                <td><a href="mailto:${formData.email}">${formData.email}</a></td>
              </tr>
              <tr>
                <td><strong>Subject:</strong></td>
                <td><span class="highlight">${formData.subject}</span></td>
              </tr>
              <tr>
                <td><strong>Submitted:</strong></td>
                <td>${new Date().toLocaleString()}</td>
              </tr>
              <tr>
                <td><strong>Reference ID:</strong></td>
                <td>CONTACT-${Date.now()}</td>
              </tr>
            </table>
          </div>
          
          <div class="message-box">
            <h3>Message Content</h3>
            <p>${formData.message.replace(/\n/g, '<br>')}</p>
          </div>
          
          <div style="margin-top: 30px; padding: 15px; background: #d4edda; border-radius: 5px;">
            <h4>Quick Actions:</h4>
            <ul>
              <li><a href="mailto:${formData.email}?subject=Re: ${formData.subject}">Reply to ${formData.name}</a></li>
              <li>Add to CRM system</li>
              <li>Forward to relevant department</li>
            </ul>
          </div>
          
          <div style="margin-top: 20px; font-size: 12px; color: #6c757d;">
            <p>This notification was sent from the SaveWise contact form.</p>
            <p>Platform: ${process.env.APP_NAME || 'SaveWise'}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export default new EmailService();