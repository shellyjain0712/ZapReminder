import { NextResponse } from 'next/server';
import whatsappService from '../../../../lib/whatsapp.js';

export async function POST(request) {
  try {
    const { phoneNumber, message } = await request.json();

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    const result = await whatsappService.sendMessage(phoneNumber, message);
    return NextResponse.json(result);
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return NextResponse.json(
      { error: 'Failed to send WhatsApp message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
