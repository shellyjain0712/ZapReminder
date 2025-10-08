import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { sendReminderNotification } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Processing notification requests...');
    
    const now = new Date();
    console.log(`⏰ Current time: ${now.toLocaleString()}`);

    // Get all reminders that have advance notifications enabled and notification time set
    const reminders = await db.reminder.findMany({
      where: {
        emailNotification: true,
        notificationTime: {
          not: null
        },
        isCompleted: false
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    console.log(`📋 Found ${reminders.length} reminders with advance notifications enabled`);

    let processedCount = 0;
    let sentCount = 0;

    for (const reminder of reminders) {
      if (!reminder.notificationTime) continue;

      const notificationTime = new Date(reminder.notificationTime);
      
      // Check if notification time is within the last 5 minutes (to avoid missing notifications)
      const timeDiff = Math.abs(now.getTime() - notificationTime.getTime());
      const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
      
      console.log(`📝 Checking "${reminder.title}":
        - Notification time: ${notificationTime.toLocaleString()}
        - Current time: ${now.toLocaleString()}
        - Time difference: ${Math.round(timeDiff / 1000 / 60)} minutes`);

      if (timeDiff <= fiveMinutes && notificationTime <= now) {
        console.log(`📧 Sending advance notification for: "${reminder.title}"`);
        
        try {
          const result = await sendReminderNotification(
            {
              title: reminder.title,
              description: reminder.description,
              dueDate: reminder.dueDate,
              reminderTime: reminder.reminderTime,
              priority: reminder.priority,
              category: reminder.category
            },
            reminder.user.email!,
            'advance'
          );

          if (result.success) {
            sentCount++;
            console.log(`✅ Advance notification sent successfully for: "${reminder.title}"`);
          } else {
            console.error(`❌ Failed to send notification for: "${reminder.title}"`, result.error);
          }
        } catch (error) {
          console.error(`❌ Error sending notification for "${reminder.title}":`, error);
        }
      } else {
        console.log(`⏳ Not time yet for: "${reminder.title}" (${Math.round(timeDiff / 1000 / 60)} minutes ${notificationTime > now ? 'early' : 'late'})`);
      }
      
      processedCount++;
    }

    const summary = {
      success: true,
      processedCount,
      sentCount,
      timestamp: now.toISOString(),
      message: `Processed ${processedCount} reminders, sent ${sentCount} notifications`
    };

    console.log(`✅ Notification processing complete: ${summary.message}`);
    
    return NextResponse.json(summary);

  } catch (error) {
    console.error('❌ Error in notification processing:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
