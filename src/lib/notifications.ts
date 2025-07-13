import { sendEmail } from './email';

export interface NotificationOptions {
  type: 'reminder' | 'completion' | 'snooze' | 'deletion';
  reminderTitle: string;
  userEmail: string;
  userName?: string;
  dueDate?: Date;
  snoozeUntil?: Date;
}

export async function sendReminderNotification(options: NotificationOptions) {
  const { type, reminderTitle, userEmail, userName, dueDate, snoozeUntil } = options;

  let subject = '';
  let htmlContent = '';
  let textContent = '';

  switch (type) {
    case 'reminder':
      subject = `⏰ Reminder: ${reminderTitle}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">📋 Reminder Alert</h2>
          <p>Hi ${userName || 'there'},</p>
          <p>This is a friendly reminder about your upcoming task:</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0; color: #495057;">${reminderTitle}</h3>
            ${dueDate ? `<p style="margin: 10px 0 0 0; color: #6c757d;">Due: ${dueDate.toLocaleDateString()} at ${dueDate.toLocaleTimeString()}</p>` : ''}
          </div>
          <p>Don't forget to complete this task on time!</p>
          <p style="color: #6c757d; font-size: 14px;">You're receiving this because you have email notifications enabled for your reminders.</p>
        </div>
      `;
      textContent = `
        Reminder Alert
        
        Hi ${userName || 'there'},
        
        This is a friendly reminder about your upcoming task:
        
        ${reminderTitle}
        ${dueDate ? `Due: ${dueDate.toLocaleDateString()} at ${dueDate.toLocaleTimeString()}` : ''}
        
        Don't forget to complete this task on time!
      `;
      break;

    case 'completion':
      subject = `✅ Task Completed: ${reminderTitle}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">🎉 Task Completed!</h2>
          <p>Hi ${userName || 'there'},</p>
          <p>Congratulations! You've successfully completed your task:</p>
          <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="margin: 0; color: #155724;">${reminderTitle}</h3>
            <p style="margin: 10px 0 0 0; color: #155724;">✓ Completed</p>
          </div>
          <p>Great job staying on top of your tasks! 🌟</p>
        </div>
      `;
      textContent = `
        Task Completed!
        
        Hi ${userName || 'there'},
        
        Congratulations! You've successfully completed your task:
        
        ${reminderTitle}
        ✓ Completed
        
        Great job staying on top of your tasks!
      `;
      break;

    case 'snooze':
      subject = `😴 Task Snoozed: ${reminderTitle}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ffc107;">😴 Task Snoozed</h2>
          <p>Hi ${userName || 'there'},</p>
          <p>You've snoozed the following task:</p>
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="margin: 0; color: #856404;">${reminderTitle}</h3>
            ${snoozeUntil ? `<p style="margin: 10px 0 0 0; color: #856404;">Snoozed until: ${snoozeUntil.toLocaleDateString()} at ${snoozeUntil.toLocaleTimeString()}</p>` : ''}
          </div>
          <p>We'll remind you again at the specified time.</p>
        </div>
      `;
      textContent = `
        Task Snoozed
        
        Hi ${userName || 'there'},
        
        You've snoozed the following task:
        
        ${reminderTitle}
        ${snoozeUntil ? `Snoozed until: ${snoozeUntil.toLocaleDateString()} at ${snoozeUntil.toLocaleTimeString()}` : ''}
        
        We'll remind you again at the specified time.
      `;
      break;

    case 'deletion':
      subject = `🗑️ Task Deleted: ${reminderTitle}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">🗑️ Task Deleted</h2>
          <p>Hi ${userName || 'there'},</p>
          <p>The following task has been deleted:</p>
          <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <h3 style="margin: 0; color: #721c24; text-decoration: line-through;">${reminderTitle}</h3>
            <p style="margin: 10px 0 0 0; color: #721c24;">Deleted</p>
          </div>
          <p>This task has been permanently removed from your reminders.</p>
        </div>
      `;
      textContent = `
        Task Deleted
        
        Hi ${userName || 'there'},
        
        The following task has been deleted:
        
        ${reminderTitle}
        Deleted
        
        This task has been permanently removed from your reminders.
      `;
      break;
  }

  try {
    const result = await sendEmail({
      to: userEmail,
      subject,
      html: htmlContent,
      text: textContent,
    });

    if (result.success) {
      console.log(`✅ ${type} notification sent to ${userEmail}`);
      return { success: true };
    } else {
      console.error(`❌ Failed to send ${type} notification:`, result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error(`❌ Error sending ${type} notification:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Push notification service (placeholder for future implementation)
export async function sendPushNotification(options: NotificationOptions) {
  // This is a placeholder for push notification implementation
  // You can integrate with services like Firebase Cloud Messaging, OneSignal, etc.
  console.log(`📱 Push notification (${options.type}): ${options.reminderTitle}`);
  
  // For now, we'll simulate a successful push notification
  return { success: true, message: 'Push notification sent' };
}
