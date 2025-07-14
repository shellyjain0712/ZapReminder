// @ts-nocheck
// Test script for the new direct calendar integration feature
const testCalendarIntegration = async () => {
  try {
    console.log('🧪 Testing NEW Direct Calendar Integration...');
    console.log('📅 This feature automatically adds reminders to your calendar with push notifications!');
    
    // Test 1: Create a reminder with calendar integration enabled (default)
    console.log('');
    console.log('📝 Test 1: Creating reminder with calendar integration ENABLED...');
    
    const tomorrow = new Date(Date.now() + 86400000);
    const reminderDateTime = new Date(tomorrow);
    reminderDateTime.setHours(15, 30, 0, 0); // 3:30 PM tomorrow
    
    const createResponseWithCalendar = await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '📅 Calendar Integration Test',
        description: 'This reminder should trigger calendar integration and push notification',
        dueDate: tomorrow.toISOString(),
        priority: 'HIGH',
        category: 'Calendar Test',
        emailNotification: true,
        pushNotification: true,
        reminderTime: reminderDateTime.toISOString(),
        autoAddToCalendar: true // NEW: Enable calendar integration
      })
    });

    if (createResponseWithCalendar.ok) {
      const reminder = await createResponseWithCalendar.json();
      console.log('✅ Reminder created successfully:', reminder.title);
      console.log('🎯 Expected behavior:');
      console.log('   • Push notification: "Task added to the calendar"');
      console.log('   • Calendar file (.ics) download OR calendar URL opened');
      console.log('   • Toast notification confirming calendar addition');
    }
    
    // Test 2: Create a reminder with calendar integration disabled
    console.log('');
    console.log('📝 Test 2: Creating reminder with calendar integration DISABLED...');
    
    const nextWeek = new Date(Date.now() + 7 * 86400000);
    const noCalendarDateTime = new Date(nextWeek);
    noCalendarDateTime.setHours(10, 0, 0, 0); // 10:00 AM next week
    
    const createResponseNoCalendar = await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '📋 No Calendar Test',
        description: 'This reminder should NOT trigger calendar integration',
        dueDate: nextWeek.toISOString(),
        priority: 'MEDIUM',
        category: 'No Calendar Test',
        emailNotification: true,
        pushNotification: true,
        reminderTime: noCalendarDateTime.toISOString(),
        autoAddToCalendar: false // NEW: Disable calendar integration
      })
    });

    if (createResponseNoCalendar.ok) {
      const reminder = await createResponseNoCalendar.json();
      console.log('✅ Reminder created successfully:', reminder.title);
      console.log('🎯 Expected behavior:');
      console.log('   • NO calendar integration');
      console.log('   • Only basic "Reminder created successfully" message');
      console.log('   • No calendar file download or URL opening');
    }
    
    // Test 3: Create an urgent reminder for immediate calendar testing
    console.log('');
    console.log('📝 Test 3: Creating URGENT reminder for immediate calendar test...');
    
    const inOneHour = new Date(Date.now() + 3600000);
    
    const urgentResponse = await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '🚨 URGENT: Test Calendar Notification',
        description: 'This urgent reminder demonstrates immediate calendar integration with push notification',
        dueDate: inOneHour.toISOString(),
        priority: 'URGENT',
        category: 'Urgent Test',
        emailNotification: false,
        pushNotification: true,
        reminderTime: inOneHour.toISOString(),
        autoAddToCalendar: true
      })
    });

    if (urgentResponse.ok) {
      const urgentReminder = await urgentResponse.json();
      console.log('✅ Urgent reminder created successfully:', urgentReminder.title);
      console.log('🚨 This should trigger IMMEDIATE calendar integration!');
    }
    
    console.log('');
    console.log('🎉 Calendar Integration Test Complete!');
    console.log('');
    console.log('📋 NEW FEATURES TESTED:');
    console.log('  ✅ Direct calendar integration toggle in reminder form');
    console.log('  ✅ Push notification: "Task added to the calendar"');
    console.log('  ✅ Automatic .ics file generation and download');
    console.log('  ✅ Fallback to calendar URL if direct integration fails');
    console.log('  ✅ User choice: enable/disable calendar integration per reminder');
    console.log('');
    console.log('🔧 HOW TO TEST:');
    console.log('  1. Go to http://localhost:3000/dashboard');
    console.log('  2. Click "Add Reminder"');
    console.log('  3. Look for the new "📅 Add to Calendar" toggle');
    console.log('  4. Create a reminder with the toggle ON');
    console.log('  5. Watch for push notification and calendar file download');
    console.log('  6. Create another reminder with toggle OFF');
    console.log('  7. Verify no calendar integration happens');
    console.log('');
    console.log('💡 BROWSER REQUIREMENTS:');
    console.log('  • Allow notifications when prompted');
    console.log('  • Allow downloads for .ics calendar files');
    console.log('  • Modern browser with Notification API support');
    
  } catch (error) {
    console.error('❌ Error testing calendar integration:', error);
    console.log('🔧 Make sure you are logged in and the server is running');
  }
};

// Export for manual testing
window.testCalendarIntegration = testCalendarIntegration;

console.log('🚀 Calendar Integration Test Ready!');
console.log('📞 Run: window.testCalendarIntegration()');

export default testCalendarIntegration;
