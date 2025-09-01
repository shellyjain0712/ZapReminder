import { NextRequest, NextResponse } from 'next/server';
import { processRecurringReminders } from '~/server/recurringReminderWorker';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Processing reminders triggered via API...');
    await processRecurringReminders();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Reminders processed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error processing reminders:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process reminders',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Processing reminders triggered via GET...');
    await processRecurringReminders();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Reminders processed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error processing reminders:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process reminders',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
