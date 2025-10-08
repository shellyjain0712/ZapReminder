import { NextResponse } from 'next/server';
import { whatsappService } from '../../../lib/whatsapp.js';

export async function GET() {
  try {
    const status = whatsappService.getStatus();
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get WhatsApp status' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { action, phoneNumber, message, contentSid, contentVariables } = await request.json();

    // If no action is provided but message is, default to send
    const finalAction = action || (message ? 'send' : null);

    switch (finalAction) {
      case 'test':
        if (!phoneNumber) {
          return NextResponse.json(
            { error: 'Phone number is required for test' },
            { status: 400 }
          );
        }
        
        const testResult = await whatsappService.testConnection(phoneNumber);
        return NextResponse.json(testResult);

      case 'send':
        if (!message) {
          return NextResponse.json(
            { error: 'Message is required' },
            { status: 400 }
          );
        }
        
        // Use default phone number if not provided
        const targetPhone = phoneNumber || '+919819288130';
        const sendResult = await whatsappService.sendMessage(targetPhone, message);
        return NextResponse.json(sendResult);

      case 'template':
        if (!phoneNumber || !contentSid) {
          return NextResponse.json(
            { error: 'Phone number and contentSid are required for template messages' },
            { status: 400 }
          );
        }
        
        const templateResult = await whatsappService.sendTemplateMessage(
          phoneNumber, 
          contentSid, 
          contentVariables || {}
        );
        return NextResponse.json(templateResult);

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: test, send, or template. Or provide a message to send directly.' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('WhatsApp API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
