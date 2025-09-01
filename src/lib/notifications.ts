import { sendEmail } from './email';

export interface NotificationOptions {
  type: 'reminder' | 'completion' | 'snooze' | 'deletion' | 'pre-due' | 'reminder-time' | 'reminder-due-soon';
  reminderTitle: string;
  userEmail: string;
  userName?: string;
  dueDate?: Date;
  snoozeUntil?: Date;
  reminderTime?: Date;
  description?: string;
  priority?: string;
  hoursUntilDue?: number;
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
          <p>Hi ${userName ?? 'there'},</p>
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
        
        Hi ${userName ?? 'there'},
        
        This is a friendly reminder about your upcoming task:
        
        ${reminderTitle}
        ${dueDate ? `Due: ${dueDate.toLocaleDateString()} at ${dueDate.toLocaleTimeString()}` : ''}
        
        Don't forget to complete this task on time!
      `;
      break;

    case 'pre-due':
      subject = `⏰ Upcoming Reminder: ${reminderTitle}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ffc107;">⏳ Upcoming Reminder</h2>
          <p>Hi ${userName ?? 'there'},</p>
          <p>This is a heads-up that your reminder <strong>${reminderTitle}</strong> is due soon.</p>
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="margin: 0; color: #856404;">${reminderTitle}</h3>
            ${dueDate ? `<p style="margin: 10px 0 0 0; color: #856404;">Due: ${dueDate.toLocaleDateString()} at ${dueDate.toLocaleTimeString()}</p>` : ''}
          </div>
          <p>Stay on track and plan ahead!</p>
          <p style="color: #6c757d; font-size: 14px;">You're receiving this because you have pre-due notifications enabled for your reminders.</p>
        </div>
      `;
      textContent = `
        Upcoming Reminder
        
        Hi ${userName ?? 'there'},
        
        Your reminder "${reminderTitle}" is due soon.
        ${dueDate ? `Due: ${dueDate.toLocaleDateString()} at ${dueDate.toLocaleTimeString()}` : ''}
        
        Stay on track and plan ahead!
      `;
      break;

    case 'completion':
      subject = `✅ Task Completed: ${reminderTitle}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">🎉 Task Completed!</h2>
          <p>Hi ${userName ?? 'there'},</p>
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
        
        Hi ${userName ?? 'there'},
        
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
          <p>Hi ${userName ?? 'there'},</p>
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
        
        Hi ${userName ?? 'there'},
        
        You've snoozed the following task:
        
        ${reminderTitle}
        ${snoozeUntil ? `Snoozed until: ${snoozeUntil.toLocaleDateString()} at ${snoozeUntil.toLocaleTimeString()}` : ''}
        
        We'll remind you again at the specified time.
      `;
      break;

    case 'reminder-due-soon':
      const timeUntil = options.hoursUntilDue ?? 1;
      const timeText = timeUntil === 1 ? '1 hour' : `${timeUntil} hours`;
      
      subject = `⏰ Upcoming: ${reminderTitle} due at ${options.reminderTime?.toLocaleTimeString() ?? 'scheduled time'}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 30px; border-radius: 16px; color: white;">
            <h2 style="color: white; margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px;">
              ⏰ Reminder Coming Up!
            </h2>
            <p style="font-size: 18px; margin: 0 0 15px 0;">Hi ${userName ?? 'there'},</p>
            <p style="font-size: 16px; margin: 15px 0;">Your reminder will be due in ${timeText}:</p>
          </div>
          
          <div style="background-color: white; padding: 25px; border-radius: 12px; margin: -10px 20px 25px 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-left: 4px solid #4f46e5;">
            <h3 style="margin: 0 0 15px 0; color: #333; font-size: 22px;">${reminderTitle}</h3>
            ${options.description ? `<p style="margin: 10px 0; color: #666; font-style: italic; font-size: 16px;">${options.description}</p>` : ''}
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                <div style="background: #4f46e5; color: white; padding: 10px 15px; border-radius: 8px; font-weight: bold; display: flex; align-items: center; gap: 8px;">
                  🕐 Due Time: ${options.reminderTime?.toLocaleTimeString() ?? 'Not set'}
                </div>
                ${dueDate ? `
                  <div style="background: #e5e7eb; padding: 10px 15px; border-radius: 8px; font-weight: 500;">
                    📅 Date: ${dueDate.toLocaleDateString()}
                  </div>
                ` : ''}
                <div style="background: #fef3c7; color: #92400e; padding: 10px 15px; border-radius: 8px; font-weight: 500;">
                  ⚡ Priority: ${options.priority ?? 'MEDIUM'}
                </div>
              </div>
            </div>
            
            <div style="background: #dbeafe; padding: 15px; border-radius: 8px; border-left: 3px solid #3b82f6;">
              <p style="margin: 0; color: #1e40af; font-weight: 500;">💡 Get Ready:</p>
              <p style="margin: 5px 0 0 0; color: #1d4ed8;">Your reminder will be due at ${options.reminderTime?.toLocaleTimeString() ?? 'the scheduled time'}. Start preparing now!</p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">You'll receive another notification when it's exactly time for your reminder.</p>
          </div>
        </div>
      `;
      textContent = `
        ⏰ Reminder Coming Up!
        
        Hi ${userName ?? 'there'},
        
        Your reminder will be due in ${timeText}:
        
        ${reminderTitle}
        ${options.description ? `\nDescription: ${options.description}` : ''}
        
        Due Time: ${options.reminderTime?.toLocaleTimeString() ?? 'Not set'}
        ${dueDate ? `Date: ${dueDate.toLocaleDateString()}` : ''}
        Priority: ${options.priority ?? 'MEDIUM'}
        
        Get ready! Your reminder will be due at ${options.reminderTime?.toLocaleTimeString() ?? 'the scheduled time'}.
        You'll receive another notification when it's exactly time.
      `;
      break;

    case 'reminder-time':
      const priorityEmoji = {
        'URGENT': '🚨',
        'HIGH': '⚡',
        'MEDIUM': '⏰',
        'LOW': '💙'
      };
      
      const priorityColor = {
        'URGENT': '#dc3545',
        'HIGH': '#fd7e14', 
        'MEDIUM': '#ffc107',
        'LOW': '#17a2b8'
      };

      const currentPriority = options.priority ?? 'MEDIUM';
      const emoji = priorityEmoji[currentPriority as keyof typeof priorityEmoji] ?? '⏰';
      const color = priorityColor[currentPriority as keyof typeof priorityColor] ?? '#ffc107';

      subject = `${emoji} REMINDER DUE NOW: ${reminderTitle}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, ${color}, ${color}dd); padding: 30px; border-radius: 16px; color: white; border: 3px solid ${color};">
            <h2 style="color: white; margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px; font-size: 24px;">
              ${emoji} REMINDER DUE NOW!
            </h2>
            <p style="font-size: 18px; margin: 0 0 15px 0;">Hi ${userName ?? 'there'},</p>
            <p style="font-size: 20px; margin: 15px 0; font-weight: bold;">🔔 Your reminder is due right now!</p>
          </div>
          
          <div style="background-color: white; padding: 25px; border-radius: 12px; margin: -10px 20px 25px 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-left: 6px solid ${color};">
            <h3 style="margin: 0 0 15px 0; color: #333; font-size: 24px; font-weight: bold;">${reminderTitle}</h3>
            ${options.description ? `<p style="margin: 10px 0; color: #666; font-style: italic; font-size: 16px;">${options.description}</p>` : ''}
            
            <div style="background: linear-gradient(45deg, ${color}10, ${color}05); padding: 25px; border-radius: 12px; margin: 25px 0; border: 2px solid ${color}30;">
              <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap; justify-content: center;">
                <div style="background: ${color}; color: white; padding: 12px 20px; border-radius: 12px; font-weight: bold; display: flex; align-items: center; gap: 8px; font-size: 18px;">
                  🕐 DUE NOW at ${options.reminderTime?.toLocaleTimeString() ?? 'this time'}!
                </div>
                ${dueDate ? `
                  <div style="background: #f3f4f6; padding: 12px 20px; border-radius: 12px; font-weight: 500;">
                    📅 ${dueDate.toLocaleDateString()}
                  </div>
                ` : ''}
                <div style="background: ${color}20; color: ${color}; padding: 12px 20px; border-radius: 12px; font-size: 16px; font-weight: bold; border: 2px solid ${color};">
                  Priority: ${currentPriority}
                </div>
              </div>
            </div>
            
            <div style="background: #fee2e2; padding: 20px; border-radius: 12px; border-left: 4px solid #ef4444; margin: 20px 0;">
              <p style="margin: 0; color: #dc2626; font-weight: bold; font-size: 18px;">⚡ Action Required:</p>
              <p style="margin: 8px 0 0 0; color: #dc2626; font-size: 16px;">This is your scheduled reminder time. Take action now!</p>
            </div>
            
            <div style="text-align: center; background: #f0fdf4; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <p style="margin: 0; color: #15803d; font-weight: 600; font-size: 16px;">✅ Complete this task and mark it done in your app!</p>
            </div>
          </div>
        </div>
      `;
      textContent = `
        ${emoji} REMINDER DUE NOW!
        
        Hi ${userName ?? 'there'},
        
        🔔 Your reminder is due right now!
        
        ${reminderTitle}
        ${options.description ? `\nDescription: ${options.description}` : ''}
        
        DUE NOW at ${options.reminderTime?.toLocaleTimeString() ?? 'this time'}!
        ${dueDate ? `Date: ${dueDate.toLocaleDateString()}` : ''}
        Priority: ${currentPriority}
        
        ⚡ ACTION REQUIRED: This is your scheduled reminder time. Take action now!
        ✅ Complete this task and mark it done in your app!
      `;
      break;

    case 'deletion':
      subject = `🗑️ Task Deleted: ${reminderTitle}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">🗑️ Task Deleted</h2>
          <p>Hi ${userName ?? 'there'},</p>
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
        
        Hi ${userName ?? 'there'},
        
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
    return { success: false, error: error };
  }
}
