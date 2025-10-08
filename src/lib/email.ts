/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import nodemailer from 'nodemailer';
import { env } from '@/env';

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: env.EMAIL_SERVER_HOST,
  port: parseInt(env.EMAIL_SERVER_PORT),
  secure: false, // true for 465, false for other ports
  auth: {
    user: env.EMAIL_SERVER_USER,
    pass: env.EMAIL_SERVER_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false // For development only
  }
});

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const mailOptions = {
      from: `"Smart Reminder" <${env.EMAIL_FROM}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export function generatePasswordResetEmail(resetUrl: string, userName?: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset - Smart Reminder</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          margin: 0;
          padding: 0;
          background-color: #f8fafc;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .email-card {
          background: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .logo {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo h1 {
          color: #1e40af;
          margin: 0;
          font-size: 28px;
          font-weight: bold;
        }
        .content {
          color: #374151;
          font-size: 16px;
        }
        .reset-button {
          display: inline-block;
          background: #1e40af;
          color: #ffffff !important;
          padding: 14px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin: 24px 0;
          text-align: center;
        }
        .reset-button:hover {
          background: #1d4ed8;
          color: #ffffff !important;
        }
        .security-note {
          background: #f3f4f6;
          border-left: 4px solid #fbbf24;
          padding: 16px;
          margin: 24px 0;
          border-radius: 4px;
        }
        .footer {
          text-align: center;
          color: #6b7280;
          font-size: 14px;
          margin-top: 32px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="email-card">
          <div class="logo">
            <h1>Smart Reminder</h1>
          </div>
          
          <div class="content">
            <h2>Password Reset Request</h2>
            
            <p>Hello${userName ? ` ${userName}` : ''},</p>
            
            <p>We received a request to reset your password for your Smart Reminder account. If you made this request, click the button below to reset your password:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="reset-button" style="display: inline-block; background: #1e40af; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 24px 0; text-align: center;">Reset Your Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #1e40af;">${resetUrl}</p>
            
            <div class="security-note">
              <strong>Security Note:</strong> This password reset link will expire in 1 hour for your security. If you didn't request this password reset, you can safely ignore this email.
            </div>
            
            <p>If you continue to have problems, please contact our support team.</p>
            
            <p>Best regards,<br>The Smart Reminder Team</p>
          </div>
          
          <div class="footer">
            <p>This email was sent from Smart Reminder. If you have any questions, please contact us.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Password Reset Request - Smart Reminder

    Hello${userName ? ` ${userName}` : ''},

    We received a request to reset your password for your Smart Reminder account.
    
    Reset your password by clicking this link: ${resetUrl}
    
    This link will expire in 1 hour for your security.
    
    If you didn't request this password reset, you can safely ignore this email.
    
    Best regards,
    The Smart Reminder Team
  `;

  return { html, text };
}

export function generateReminderNotificationEmail(reminder: any, notificationType: 'advance' | 'due' | 'overdue' = 'advance') {
  const typeEmoji = notificationType === 'advance' ? '🔔' : notificationType === 'due' ? '⏰' : '🚨';
  const typeText = notificationType === 'advance' ? 'Advance Reminder' : notificationType === 'due' ? 'Reminder Due' : 'Overdue Reminder';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${typeEmoji} ${typeText}: ${reminder.title}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f8fafc;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .email-card {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 24px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .content {
          padding: 32px;
        }
        .reminder-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .reminder-title {
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 8px;
        }
        .reminder-details {
          display: grid;
          gap: 8px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
        }
        .detail-label {
          font-weight: 500;
          color: #64748b;
        }
        .detail-value {
          color: #1e293b;
          font-weight: 600;
        }
        .priority-high { color: #dc2626; }
        .priority-medium { color: #ea580c; }
        .priority-low { color: #16a34a; }
        .notification-banner {
          background: ${notificationType === 'advance' ? '#dbeafe' : notificationType === 'due' ? '#fef3c7' : '#fee2e2'};
          border: 1px solid ${notificationType === 'advance' ? '#3b82f6' : notificationType === 'due' ? '#f59e0b' : '#ef4444'};
          border-radius: 8px;
          padding: 16px;
          margin: 24px 0;
          text-align: center;
        }
        .action-button {
          display: inline-block;
          background: #4f46e5;
          color: #ffffff !important;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 16px 0;
        }
        .footer {
          text-align: center;
          color: #6b7280;
          font-size: 14px;
          margin-top: 32px;
          padding: 20px;
          background: #f9fafb;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="email-card">
          <div class="header">
            <h1>${typeEmoji} Smart Reminder</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">${typeText}</p>
          </div>
          
          <div class="content">
            <div class="notification-banner">
              <strong>${typeEmoji} ${typeText}</strong>
              ${notificationType === 'advance' ? '<p>This is your advance notification!</p>' : 
                notificationType === 'due' ? '<p>Your reminder is due now!</p>' : 
                '<p>Your reminder is overdue!</p>'}
            </div>
            
            <div class="reminder-card">
              <div class="reminder-title">${reminder.title}</div>
              
              ${reminder.description ? `<p style="color: #64748b; margin: 8px 0 16px 0;">${reminder.description}</p>` : ''}
              
              <div class="reminder-details">
                <div class="detail-row">
                  <span class="detail-label">📅 Due Date:</span>
                  <span class="detail-value">${new Date(reminder.dueDate).toLocaleDateString('en-US', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
                
                ${reminder.reminderTime ? `
                <div class="detail-row">
                  <span class="detail-label">⏰ Time:</span>
                  <span class="detail-value">${new Date(reminder.reminderTime).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
                ` : ''}
                
                <div class="detail-row">
                  <span class="detail-label">🎯 Priority:</span>
                  <span class="detail-value priority-${reminder.priority?.toLowerCase() || 'medium'}">${reminder.priority || 'MEDIUM'}</span>
                </div>
                
                ${reminder.category ? `
                <div class="detail-row">
                  <span class="detail-label">📂 Category:</span>
                  <span class="detail-value">${reminder.category}</span>
                </div>
                ` : ''}
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/dashboard" class="action-button">
                📱 View Dashboard
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
              You received this email because you have email notifications enabled for your reminders. 
              You can manage your notification preferences in your dashboard settings.
            </p>
          </div>
          
          <div class="footer">
            <p>Smart Reminder - Your Personal Task Management System</p>
            <p style="font-size: 12px; color: #9ca3af;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    ${typeEmoji} ${typeText} - Smart Reminder

    ${reminder.title}
    ${reminder.description ? `\nDescription: ${reminder.description}` : ''}
    
    Due Date: ${new Date(reminder.dueDate).toLocaleDateString()}
    ${reminder.reminderTime ? `Time: ${new Date(reminder.reminderTime).toLocaleTimeString()}` : ''}
    Priority: ${reminder.priority || 'MEDIUM'}
    ${reminder.category ? `Category: ${reminder.category}` : ''}
    
    ${notificationType === 'advance' ? 'This is your advance notification!' : 
      notificationType === 'due' ? 'Your reminder is due now!' : 
      'Your reminder is overdue!'}
    
    View your dashboard: ${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/dashboard
    
    ---
    Smart Reminder - Your Personal Task Management System
  `;

  return { html, text };
}

export async function sendReminderNotification(reminder: any, userEmail: string, notificationType: 'advance' | 'due' | 'overdue' = 'advance') {
  try {
    const typeEmoji = notificationType === 'advance' ? '🔔' : notificationType === 'due' ? '⏰' : '🚨';
    const typeText = notificationType === 'advance' ? 'Advance Reminder' : notificationType === 'due' ? 'Reminder Due' : 'Overdue Reminder';
    
    const { html, text } = generateReminderNotificationEmail(reminder, notificationType);
    
    const result = await sendEmail({
      to: userEmail,
      subject: `${typeEmoji} ${typeText}: ${reminder.title}`,
      html,
      text
    });

    if (result.success) {
      console.log(`✅ ${typeText} email sent successfully for: ${reminder.title}`);
      return { success: true, messageId: result.messageId };
    } else {
      console.error(`❌ Failed to send ${typeText} email for: ${reminder.title}`, result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error(`❌ Error sending ${notificationType} reminder notification:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
