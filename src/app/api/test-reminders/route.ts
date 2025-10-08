import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { processRecurringReminders } from '@/server/recurringReminderWorker';
import { db } from '@/server/db';

export async function GET(_request: NextRequest) {
  try {
    console.log('🧪 Testing reminder processing...');
    
    // First, let's see what reminders exist with notification times
    const reminders = await db.reminder.findMany({
      where: {
        isCompleted: false,
        notificationTime: { not: null }
      },
      include: {
        user: true
      },
      take: 10
    });

    const now = new Date();
    console.log(`Current time: ${now.toISOString()}`);
    console.log(`Found ${reminders.length} reminders with notification times`);

    const reminderDetails = reminders.map(reminder => {
      const notificationTime = reminder.notificationTime ? new Date(reminder.notificationTime) : null;
      const timeDiff = notificationTime ? Math.abs(notificationTime.getTime() - now.getTime()) : null;
      const minutesDiff = timeDiff ? Math.round(timeDiff / 1000 / 60) : null;
      
      return {
        id: reminder.id,
        title: reminder.title,
        dueDate: reminder.dueDate.toISOString(),
        notificationTime: notificationTime?.toISOString(),
        userEmail: reminder.user?.email,
        timeDifferenceMinutes: minutesDiff,
        shouldTrigger: timeDiff ? timeDiff <= 300000 : false, // Within 5 minutes
        notificationTimeLocal: notificationTime?.toLocaleString(),
        currentTimeLocal: now.toLocaleString()
      };
    });

    // Now run the processing
    await processRecurringReminders();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test reminder processing completed',
      timestamp: now.toISOString(),
      currentTimeLocal: now.toLocaleString(),
      remindersFound: reminders.length,
      reminderDetails: reminderDetails,
      note: 'Check server logs for processing details'
    });
  } catch (error) {
    console.error('❌ Error in test reminder processing:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process test reminders',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
