import { NextResponse } from 'next/server';
import whatsappService from '../../../../lib/whatsapp.js';

export async function GET() {
  try {
    const status = await whatsappService.getStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('WhatsApp status error:', error);
    return NextResponse.json(
      { error: 'Failed to get WhatsApp status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
