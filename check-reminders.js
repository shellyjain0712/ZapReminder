// Quick test to check current reminders
import { db } from "../src/server/db.js";

async function checkReminders() {
  try {
    console.log("🔍 Checking current reminders in database...");
    
    const reminders = await db.reminder.findMany({
      where: {
        isCompleted: false,
        OR: [
          { reminderTime: { not: null } },
          { notificationTime: { not: null } }
        ]
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    console.log(`📊 Found ${reminders.length} active reminders with times:`);
    
    reminders.forEach((reminder, index) => {
      console.log(`\n${index + 1}. "${reminder.title}"`);
      console.log(`   📅 Due Date: ${reminder.dueDate}`);
      console.log(`   ⏰ Reminder Time: ${reminder.reminderTime || 'Not set'}`);
      console.log(`   🔔 Notification Time: ${reminder.notificationTime || 'Not set'}`);
      console.log(`   👤 User: ${reminder.user.email}`);
      console.log(`   🔄 Recurring: ${reminder.isRecurring ? 'Yes' : 'No'}`);
      if (reminder.isRecurring) {
        console.log(`   📈 Pattern: ${reminder.recurrenceType} every ${reminder.recurrenceInterval || 1}`);
      }
    });
    
    const now = new Date();
    console.log(`\n🕐 Current time: ${now.toLocaleString()}`);
    
  } catch (error) {
    console.error("❌ Error checking reminders:", error);
  } finally {
    await db.$disconnect();
  }
}

checkReminders();
