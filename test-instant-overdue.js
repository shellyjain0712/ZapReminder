// @ts-nocheck
// INSTANT Overdue Test - Creates reminders that become overdue in seconds!
const testInstantOverdueNotification = async () => {
  try {
    console.log('🔥 Testing INSTANT overdue notifications...');
    console.log('This will create reminders that become overdue in 3, 5, and 10 seconds!');
    
    // Create reminder that becomes overdue in 3 seconds
    const now = new Date();
    const in3Seconds = new Date(now.getTime() + 3000); // 3 seconds from now
    
    console.log('📝 Creating reminder that becomes overdue in 3 seconds...');
    const reminder3s = await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '🚨 INSTANT TEST: 3 Second Reminder',
        description: 'This reminder will be overdue in 3 seconds and should trigger INSTANT notification!',
        dueDate: in3Seconds.toISOString(),
        priority: 'URGENT',
        category: 'Instant Test',
        emailNotification: false,
        pushNotification: true,
        reminderTime: in3Seconds.toISOString()
      })
    });
    
    if (reminder3s.ok) {
      console.log('✅ 3-second reminder created!');
    }
    
    // Create reminder that becomes overdue in 5 seconds
    const in5Seconds = new Date(now.getTime() + 5000); // 5 seconds from now
    
    console.log('📝 Creating reminder that becomes overdue in 5 seconds...');
    const reminder5s = await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '⚡ INSTANT TEST: 5 Second Reminder',
        description: 'This reminder will be overdue in 5 seconds!',
        dueDate: in5Seconds.toISOString(),
        priority: 'HIGH',
        category: 'Instant Test',
        emailNotification: false,
        pushNotification: true,
        reminderTime: in5Seconds.toISOString()
      })
    });
    
    if (reminder5s.ok) {
      console.log('✅ 5-second reminder created!');
    }
    
    // Create reminder that becomes overdue in 10 seconds
    const in10Seconds = new Date(now.getTime() + 10000); // 10 seconds from now
    
    console.log('📝 Creating reminder that becomes overdue in 10 seconds...');
    const reminder10s = await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '💥 INSTANT TEST: 10 Second Reminder',
        description: 'This reminder will be overdue in 10 seconds!',
        dueDate: in10Seconds.toISOString(),
        priority: 'MEDIUM',
        category: 'Instant Test',
        emailNotification: false,
        pushNotification: true,
        reminderTime: in10Seconds.toISOString()
      })
    });
    
    if (reminder10s.ok) {
      console.log('✅ 10-second reminder created!');
    }
    
    console.log('');
    console.log('🎯 COUNTDOWN STARTED!');
    console.log('⏰ Notifications should appear at:');
    console.log(`   • 3 seconds: ${in3Seconds.toLocaleTimeString()}`);
    console.log(`   • 5 seconds: ${in5Seconds.toLocaleTimeString()}`);
    console.log(`   • 10 seconds: ${in10Seconds.toLocaleTimeString()}`);
    console.log('');
    console.log('👀 Watch for INSTANT notifications to pop up!');
    console.log('📱 Make sure you allowed notifications when prompted');
    
    // Countdown timer in console
    let countdown = 10;
    const countdownInterval = setInterval(() => {
      if (countdown <= 3) {
        console.log(`🔥 ${countdown} seconds remaining...`);
      } else if (countdown <= 5) {
        console.log(`⚡ ${countdown} seconds remaining...`);
      } else {
        console.log(`💥 ${countdown} seconds remaining...`);
      }
      
      countdown--;
      
      if (countdown < 0) {
        clearInterval(countdownInterval);
        console.log('🎉 All instant overdue reminders should have triggered!');
        console.log('✅ Check your dashboard to see the overdue styling');
      }
    }, 1000);
    
  } catch (error) {
    console.error('❌ Instant test failed:', error);
  }
};

// Export for use in development
if (typeof window !== 'undefined') {
  window.testInstantOverdue = testInstantOverdueNotification;
  console.log('🔥 INSTANT Overdue Test available:');
  console.log('   Run: window.testInstantOverdue()');
  console.log('   This creates reminders that become overdue in 3, 5, and 10 seconds!');
}

export default testInstantOverdueNotification;
