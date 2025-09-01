// Test advance email by creating a reminder with immediate notification time
const testAdvanceEmail = async () => {
  console.log('🧪 Testing Advance Email System...\n');
  
  // Create a test reminder via the API
  const reminderData = {
    title: 'TEST: Advance Email Test',
    description: 'Testing advance notification system - should receive email immediately',
    dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    reminderTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    notificationTime: new Date(Date.now() + 30 * 1000).toISOString(), // 30 seconds from now
    priority: 'HIGH',
    category: 'Test',
    emailNotification: true,
    pushNotification: false
  };
  
  console.log('Creating test reminder with:');
  console.log('- Due Date:', new Date(reminderData.dueDate).toLocaleString());
  console.log('- Reminder Time:', new Date(reminderData.reminderTime).toLocaleString());
  console.log('- Notification Time:', new Date(reminderData.notificationTime).toLocaleString());
  console.log();
  
  try {
    // Create the reminder
    const response = await fetch('http://localhost:3000/api/reminders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reminderData),
    });
    
    if (!response.ok) {
      console.error('Failed to create reminder:', await response.text());
      return;
    }
    
    const result = await response.json();
    console.log('✅ Test reminder created:', result.id);
    
    // Wait 35 seconds then trigger the worker
    console.log('\n⏳ Waiting 35 seconds for notification time...');
    await new Promise(resolve => setTimeout(resolve, 35000));
    
    // Trigger the worker
    console.log('🔄 Triggering reminder worker...');
    const workerResponse = await fetch('http://localhost:3000/api/test-reminders');
    const workerResult = await workerResponse.json();
    
    console.log('Worker result:', workerResult);
    console.log('\n📧 Check your email for the advance notification!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

testAdvanceEmail();
