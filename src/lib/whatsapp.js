// WhatsApp Direct Messaging Service - Using Twilio API
// No QR codes required - direct messaging to phone numbers

import twilio from 'twilio';

class WhatsAppService {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.client = null;
    this.initializeTwilio();
    console.log('🔧 WhatsApp Service initialized:', this.isDevelopment ? 'Development Mode' : 'Production Mode');
  }

  initializeTwilio() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (accountSid && authToken && authToken !== '[AuthToken]') {
      this.client = twilio(accountSid, authToken);
      console.log('✅ Twilio client initialized');
    } else {
      console.warn('⚠️ Twilio credentials not found or incomplete in environment variables');
      if (authToken === '[AuthToken]') {
        console.warn('   Please replace [AuthToken] with your actual Twilio Auth Token');
      }
    }
  }

  async sendMessage(phoneNumber, message) {
    if (this.isDevelopment && !this.client) {
      console.log('📱 [DEV] Mock WhatsApp message sent:');
      console.log(`  To: ${phoneNumber}`);
      console.log(`  Message: ${message}`);
      
      return {
        success: true,
        messageId: `mock_${Date.now()}`,
        message: 'Message sent successfully (development mode)',
        to: phoneNumber,
        isDevelopment: true
      };
    }

    if (!this.client) {
      return {
        success: false,
        error: 'Twilio client not initialized. Check environment variables.',
        message: 'Failed to send message'
      };
    }

    try {
      // Clean and format phone number for WhatsApp
      let cleanedPhoneNumber = phoneNumber;
      
      // Remove whatsapp: prefix if present to clean it
      if (cleanedPhoneNumber.startsWith('whatsapp:')) {
        cleanedPhoneNumber = cleanedPhoneNumber.replace('whatsapp:', '');
      }
      
      // Remove all spaces, dashes, and other formatting
      cleanedPhoneNumber = cleanedPhoneNumber.replace(/[\s\-\(\)]/g, '');
      
      // Ensure it starts with + if not already
      if (!cleanedPhoneNumber.startsWith('+')) {
        cleanedPhoneNumber = '+' + cleanedPhoneNumber;
      }
      
      // Format for WhatsApp
      const formattedTo = `whatsapp:${cleanedPhoneNumber}`;
      
      console.log(`📱 Sending WhatsApp message to: ${formattedTo}`);
      
      const twilioMessage = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
        to: formattedTo
      });

      console.log('✅ WhatsApp message sent successfully:', twilioMessage.sid);
      
      return {
        success: true,
        messageId: twilioMessage.sid,
        message: 'Message sent successfully via Twilio',
        to: formattedTo,
        status: twilioMessage.status
      };
    } catch (error) {
      console.error('❌ Failed to send WhatsApp message:', error);
      
      // If authentication error, provide helpful message
      if (error.code === 20003) {
        return {
          success: false,
          error: 'Authentication failed - please check your Twilio Auth Token',
          message: 'Please replace [AuthToken] in your .env file with your actual Twilio Auth Token',
          code: error.code,
          helpUrl: 'https://console.twilio.com/'
        };
      }
      
      return {
        success: false,
        error: error.message,
        message: 'Failed to send WhatsApp message',
        code: error.code
      };
    }
  }

  // Send message using Content Template (like your curl example)
  async sendTemplateMessage(phoneNumber, contentSid, contentVariables = {}) {
    if (this.isDevelopment && !this.client) {
      console.log('📱 [DEV] Mock WhatsApp template message sent:');
      console.log(`  To: ${phoneNumber}`);
      console.log(`  ContentSid: ${contentSid}`);
      console.log(`  Variables: ${JSON.stringify(contentVariables)}`);
      
      return {
        success: true,
        messageId: `mock_template_${Date.now()}`,
        message: 'Template message sent successfully (development mode)',
        to: phoneNumber,
        isDevelopment: true
      };
    }

    if (!this.client) {
      return {
        success: false,
        error: 'Twilio client not initialized. Check environment variables.',
        message: 'Failed to send template message'
      };
    }

    try {
      // Format phone number for WhatsApp
      const formattedTo = phoneNumber.startsWith('whatsapp:') 
        ? phoneNumber 
        : `whatsapp:${phoneNumber}`;
      
      const twilioMessage = await this.client.messages.create({
        contentSid: contentSid,
        contentVariables: JSON.stringify(contentVariables),
        from: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
        to: formattedTo
      });

      console.log('✅ WhatsApp template message sent successfully:', twilioMessage.sid);
      
      return {
        success: true,
        messageId: twilioMessage.sid,
        message: 'Template message sent successfully via Twilio',
        to: formattedTo,
        status: twilioMessage.status,
        contentSid: contentSid
      };
    } catch (error) {
      console.error('❌ Failed to send WhatsApp template message:', error);
      
      // If authentication error, provide helpful message
      if (error.code === 20003) {
        return {
          success: false,
          error: 'Authentication failed - please check your Twilio Auth Token',
          message: 'Please replace [AuthToken] in your .env file with your actual Twilio Auth Token',
          code: error.code,
          helpUrl: 'https://console.twilio.com/'
        };
      }
      
      return {
        success: false,
        error: error.message,
        message: 'Failed to send WhatsApp template message',
        code: error.code
      };
    }
  }

  getStatus() {
    return {
      ready: !!this.client,
      development: this.isDevelopment,
      method: 'twilio_api',
      twilioConfigured: !!this.client,
      message: this.client 
        ? (this.isDevelopment 
          ? 'WhatsApp service ready with Twilio API (development mode)'
          : 'WhatsApp service ready for production messaging via Twilio')
        : 'WhatsApp service not configured - missing Twilio credentials'
    };
  }

  async testConnection(phoneNumber) {
    const testMessage = `🧪 WhatsApp Test Message\n\nHello! This is a test message from your Reminder App.\n\nWhatsApp notifications are working correctly via Twilio API!`;
    return await this.sendMessage(phoneNumber, testMessage);
  }
}

export const whatsappService = new WhatsAppService();
export default whatsappService;
