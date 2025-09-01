import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { processRecurringReminders } from '@/server/recurringReminderWorker';

export async function GET(_request: NextRequest) {
  try {
    console.log('🧪 Testing reminder processing...');
    await processRecurringReminders();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test reminder processing completed',
      timestamp: new Date().toISOString(),
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
