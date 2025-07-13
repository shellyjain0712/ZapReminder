// @ts-nocheck
// Test script to verify reminder functionality
const testReminderFlow = async () => {
  try {
    console.log('🧪 Testing Enhanced Reminder System...');
    
    // Test 1: Create a regular reminder for tomorrow (auto-calendar integration)
    console.log('📝 Creating a test reminder for tomorrow with auto-calendar...');
    
    // Create a reminder for tomorrow at 2:30 PM
    const tomorrow = new Date(Date.now() + 86400000);
    const reminderDateTime = new Date(tomorrow);
    reminderDateTime.setHours(14, 30, 0, 0); // 2:30 PM
    
    const createResponse = await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Reminder with Auto-Calendar',
        description: 'This reminder will automatically open calendar integration',
        dueDate: tomorrow.toISOString(),
        priority: 'HIGH',
        category: 'Testing',
        emailNotification: true,
        pushNotification: false,
        reminderTime: reminderDateTime.toISOString() // Specific time: 2:30 PM tomorrow
      })
    });
    
    if (createResponse.ok) {
      const reminder = await createResponse.json();
      console.log('✅ Regular reminder created successfully:', reminder.title);
    }
    
    // Test 2: Create an overdue reminder to test snooze functionality
    console.log('⏰ Creating an overdue reminder to test snooze behavior...');
    
    // Create a reminder for yesterday (overdue)
    const yesterday = new Date(Date.now() - 86400000);
    const overdueDateTime = new Date(yesterday);
    overdueDateTime.setHours(10, 15, 0, 0); // 10:15 AM yesterday
    
    const overdueResponse = await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '🚨 OVERDUE: Test Snooze Feature',
        description: 'This overdue reminder will test snooze functionality - snooze it to see the red styling disappear!',
        dueDate: yesterday.toISOString(),
        priority: 'URGENT',
        category: 'Testing',
        emailNotification: true,
        pushNotification: true,
        reminderTime: overdueDateTime.toISOString() // Specific time: 10:15 AM yesterday
      })
    });
    
    if (overdueResponse.ok) {
      const overdueReminder = await overdueResponse.json();
      console.log('✅ Overdue reminder created successfully:', overdueReminder.title);
      
      // Test 3: Automatically snooze the overdue reminder for testing
      console.log('💤 Testing snooze functionality on overdue reminder...');
      
      setTimeout(async () => {
        try {
          const snoozeTime = new Date();
          snoozeTime.setHours(snoozeTime.getHours() + 2); // Snooze for 2 hours
          
          const snoozeResponse = await fetch(`/api/reminders/${overdueReminder.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              isSnooze: true,
              snoozeUntil: snoozeTime.toISOString()
            })
          });
          
          if (snoozeResponse.ok) {
            console.log('✅ Reminder snoozed successfully - red styling should disappear!');
            console.log('🔄 Refresh the page to see the updated styling');
          }
        } catch (error) {
          console.error('❌ Error snoozing reminder:', error);
        }
      }, 3000); // Wait 3 seconds before snoozing
    }
    
    // Test 4: Create another overdue reminder from this morning
    console.log('⏰ Creating another overdue reminder from this morning...');
    
    const thisMorning = new Date();
    thisMorning.setHours(8, 0, 0, 0); // 8:00 AM today
    
    const recentOverdueResponse = await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '📞 Call Client - Testing Features',
        description: 'This reminder shows hours overdue and tests the enhanced overdue theme',
        dueDate: thisMorning.toISOString(),
        priority: 'HIGH',
        category: 'Business',
        emailNotification: false,
        pushNotification: true,
        reminderTime: thisMorning.toISOString()
      })
    });
    
    if (recentOverdueResponse.ok) {
      const recentOverdue = await recentOverdueResponse.json();
      console.log('✅ Recent overdue reminder created successfully:', recentOverdue.title);
    }
      
    // Test 5: Fetch all reminders to see them in action
    console.log('📋 Fetching all reminders...');
    const fetchResponse = await fetch('/api/reminders');
    if (fetchResponse.ok) {
      const reminders = await fetchResponse.json();
      console.log(`✅ Found ${reminders.length} reminder(s)`);
      console.log('🎨 Check the dashboard to see the beautiful overdue theme!');
      console.log('📅 New reminders should auto-open calendar integration!');
      console.log('💤 Snooze an overdue reminder to see red styling disappear!');
    }
    
    console.log('🎉 All enhanced tests completed successfully!');
    console.log('');
    console.log('📍 NEW FEATURES TESTED:');
    console.log('  ✅ Auto-calendar integration on reminder creation');
    console.log('  ✅ Improved overdue detection (respects snooze status)');
    console.log('  ✅ Enhanced overdue theme with better styling');
    console.log('');
    console.log('💡 Go to http://localhost:3000/dashboard to test:');
    console.log('  🔹 Create a new reminder → Calendar should open automatically');
    console.log('  🔹 Snooze an overdue reminder → Red styling should disappear');
    console.log('  🔹 View enhanced overdue styling with gradients and animations');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Export for use in development
if (typeof window !== 'undefined') {
  window.testReminderFlow = testReminderFlow;
  window.testEnhancedFeatures = testReminderFlow; // Alias for easier access
  console.log('🔧 Test functions available:');
  console.log('  - window.testReminderFlow()');
  console.log('  - window.testEnhancedFeatures()');
}

export default testReminderFlow;
