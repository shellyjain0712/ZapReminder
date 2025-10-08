import { sendEmail } from './email';

/**
 * Send an instant confirmation email when a reminder is created
 */
export async function sendReminderConfirmationEmail(reminder: any, userEmail: string, userName?: string | null) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>✅ Reminder Created Successfully</title>
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
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
          .confirmation-banner {
            background: #dcfce7;
            border: 1px solid #10b981;
            border-radius: 8px;
            padding: 16px;
            margin: 24px 0;
            text-align: center;
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
          .priority-urgent { color: #dc2626; }
          .priority-high { color: #ea580c; }
          .priority-medium { color: #eab308; }
          .priority-low { color: #16a34a; }
          .action-button {
            display: inline-block;
            background: #10b981;
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
              <h1>✅ ZapReminder</h1>
              <p style="margin: 8px 0 0 0; opacity: 0.9;">Reminder Created Successfully</p>
            </div>
            
            <div class="content">
              <div class="confirmation-banner">
                <strong>🎉 Your reminder has been created!</strong>
                <p>We'll notify you when it's time.</p>
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

                  ${reminder.isRecurring ? `
                  <div class="detail-row">
                    <span class="detail-label">🔄 Recurring:</span>
                    <span class="detail-value">Every ${reminder.recurrenceInterval || 1} ${reminder.recurrenceType?.toLowerCase()}${(reminder.recurrenceInterval || 1) > 1 ? 's' : ''}</span>
                  </div>
                  ` : ''}
                </div>
              </div>

              <div style="text-align: center;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/dashboard" class="action-button">
                  📱 View Dashboard
                </a>
              </div>
              
              <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <h4 style="margin: 0 0 8px 0; color: #0369a1;">📧 What happens next?</h4>
                <ul style="margin: 0; padding-left: 20px; color: #0369a1;">
                  ${reminder.emailNotification ? '<li>You\'ll receive email notifications when due</li>' : ''}
                  ${reminder.whatsappNotification ? '<li>You\'ll receive WhatsApp messages when due</li>' : ''}
                  ${reminder.pushNotification ? '<li>You\'ll receive push notifications when due</li>' : ''}
                  ${reminder.preDueNotifications?.length ? `<li>You'll get early reminders ${reminder.preDueNotifications.join(', ')} days before</li>` : ''}
                  <li>You can edit or delete this reminder anytime from your dashboard</li>
                </ul>
              </div>
              
              <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
                This confirmation email lets you know your reminder was successfully saved. 
                You'll receive separate notifications when it's actually time for your reminder.
              </p>
            </div>
            
            <div class="footer">
              <p>ZapReminder - Your Personal Task Management System</p>
              <p style="font-size: 12px; color: #9ca3af;">
                This confirmation was sent because you created a new reminder.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ✅ Reminder Created Successfully - ZapReminder

      Hi ${userName || 'there'},
      
      Your reminder "${reminder.title}" has been created successfully!
      ${reminder.description ? `\nDescription: ${reminder.description}` : ''}
      
      Details:
      Due Date: ${new Date(reminder.dueDate).toLocaleDateString()}
      ${reminder.reminderTime ? `Time: ${new Date(reminder.reminderTime).toLocaleTimeString()}` : ''}
      Priority: ${reminder.priority || 'MEDIUM'}
      ${reminder.category ? `Category: ${reminder.category}` : ''}
      ${reminder.isRecurring ? `Recurring: Every ${reminder.recurrenceInterval || 1} ${reminder.recurrenceType?.toLowerCase()}${(reminder.recurrenceInterval || 1) > 1 ? 's' : ''}` : ''}
      
      What happens next?
      ${reminder.emailNotification ? '• You\'ll receive email notifications when due\n' : ''}${reminder.whatsappNotification ? '• You\'ll receive WhatsApp messages when due\n' : ''}${reminder.pushNotification ? '• You\'ll receive push notifications when due\n' : ''}${reminder.preDueNotifications?.length ? `• You'll get early reminders ${reminder.preDueNotifications.join(', ')} days before\n` : ''}• You can edit or delete this reminder anytime from your dashboard
      
      View your dashboard: ${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/dashboard
      
      ---
      ZapReminder - Your Personal Task Management System
    `;

    const result = await sendEmail({
      to: userEmail,
      subject: `✅ Reminder Created: ${reminder.title}`,
      html,
      text
    });

    if (result.success) {
      console.log(`✅ Confirmation email sent successfully for: ${reminder.title}`);
      return { success: true, messageId: result.messageId };
    } else {
      console.error(`❌ Failed to send confirmation email for: ${reminder.title}`, result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error(`❌ Error sending confirmation email:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}