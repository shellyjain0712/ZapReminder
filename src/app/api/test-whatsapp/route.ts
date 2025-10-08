import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { whatsappService } from '@/lib/whatsapp';

interface TestRequest {
  phoneNumber: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json() as TestRequest;

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    console.log('🧪 Testing WhatsApp notification:', { phoneNumber, message });

    const result = await whatsappService.sendMessage(phoneNumber, message);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test notification sent successfully!',
        data: result
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        message: 'Failed to send test notification'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ WhatsApp test endpoint error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
