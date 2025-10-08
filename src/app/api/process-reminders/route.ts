import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { processRecurringReminders } from '@/server/recurringReminderWorker';

export const maxDuration = 30; // Set timeout to 30 seconds

export async function POST(_request: NextRequest) {
  try {
    console.log('🔄 Processing reminders triggered via API...');
    
    // Set a timeout for the operation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 25000); // 25 second timeout
    });
    
    const processPromise = processRecurringReminders();
    
    // Race between processing and timeout
    await Promise.race([processPromise, timeoutPromise]);
    
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

export async function GET(_request: NextRequest) {
  try {
    console.log('🔄 Processing reminders triggered via GET...');
    
    // Set a timeout for the operation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 25000); // 25 second timeout
    });
    
    const processPromise = processRecurringReminders();
    
    // Race between processing and timeout
    await Promise.race([processPromise, timeoutPromise]);
    
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
