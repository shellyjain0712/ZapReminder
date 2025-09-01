// Simple test script to check advance notification logic
const testNotificationLogic = () => {
  const now = new Date();
  console.log('Current time:', now.toISOString());
  
  // Test case 1: User set notification time (6pm) for reminder at 8pm
  const reminderTime = new Date();
  reminderTime.setHours(20, 0, 0, 0); // 8pm today
  
  const notificationTime = new Date();
  notificationTime.setHours(18, 0, 0, 0); // 6pm today
  
  console.log('Reminder Time:', reminderTime.toISOString());
  console.log('Notification Time:', notificationTime.toISOString());
  
  // Check if it's time for advance notification (within 1 minute of 6pm)
  const timeDiff = Math.abs(notificationTime.getTime() - now.getTime());
  const isAdvanceTime = timeDiff <= 60000; // Within 1 minute
  
  console.log('Time difference (ms):', timeDiff);
  console.log('Is advance notification time?', isAdvanceTime);
  
  // Test case 2: 1 hour before logic (7pm for 8pm reminder)
  const oneHourBefore = new Date(reminderTime.getTime() - (60 * 60 * 1000));
  const oneHourDiff = Math.abs(oneHourBefore.getTime() - now.getTime());
  const isOneHourBefore = oneHourDiff <= 60000;
  
  console.log('One hour before time:', oneHourBefore.toISOString());
  console.log('One hour before difference (ms):', oneHourDiff);
  console.log('Is one hour before time?', isOneHourBefore);
};

testNotificationLogic();
