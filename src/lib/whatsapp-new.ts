// WhatsApp service for sending reminder notifications
// This service works with an external WhatsApp Web.js client

interface WhatsAppStatus {
  isReady: boolean;
  hasQrCode: boolean;
  qrCode: string | null;
}

interface MessageResult {
  success: boolean;
  error?: string;
}

interface Reminder {
  id: string;
  title: string;
  description?: string;
  reminderDateTime: Date;
  frequency?: string;
}

// Extend global to include our WhatsApp client
declare global {
  var whatsappClient: any;
}

class WhatsAppService {
  public isReady = false;

  async getStatus(): Promise<WhatsAppStatus> {
    const hasClient = typeof global !== 'undefined' && global.whatsappClient;
    
    return {
      isReady: hasClient && this.isReady,
      hasQrCode: false,
      qrCode: null
    };
  }

  async start(): Promise<void> {
    // The client is started externally via start-whatsapp.cjs
    // We just check if it's available
    if (typeof global !== 'undefined' && global.whatsappClient) {
      this.isReady = true;
      console.log('📱 WhatsApp service connected to external client');
    } else {
      console.log('⚠️ WhatsApp client not found. Make sure to run: node start-whatsapp.cjs');
    }
  }

  async stop(): Promise<void> {
    this.isReady = false;
    console.log('📱 WhatsApp service stopped');
  }

  formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // If it starts with +, keep it; otherwise add +
    if (!cleaned.startsWith('+')) {
      // If it starts with country code without +, add +
      if (cleaned.length > 10) {
        cleaned = '+' + cleaned;
      } else {
        // Assume it's a local number, you might want to add a default country code
        console.warn('⚠️ Phone number might need country code:', phone);
      }
    }
    
    // Convert to WhatsApp format (remove + and add @c.us)
    const whatsappNumber = cleaned.substring(1) + '@c.us';
    console.log(`📞 Formatted ${phone} -> ${whatsappNumber}`);
    
    return whatsappNumber;
  }

  async sendMessage(phoneNumber: string, message: string): Promise<MessageResult> {
    try {
      if (!global.whatsappClient) {
        return {
          success: false,
          error: 'WhatsApp client not available. Please start the WhatsApp service first.'
        };
      }

      const client = global.whatsappClient;
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      console.log('📤 Sending WhatsApp message:', {
        to: formattedNumber,
        message: message.substring(0, 50) + '...'
      });

      // Check if the number is registered on WhatsApp
      const isRegistered = await client.isRegisteredUser(formattedNumber);
      
      if (!isRegistered) {
        return {
          success: false,
          error: `Phone number ${phoneNumber} is not registered on WhatsApp`
        };
      }

      // Send the message
      const sentMessage = await client.sendMessage(formattedNumber, message);
      
      console.log('✅ WhatsApp message sent successfully:', sentMessage.id);
      
      return {
        success: true
      };

    } catch (error) {
      console.error('❌ WhatsApp send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async sendReminderNotification(reminder: Reminder, phoneNumber: string): Promise<boolean> {
    try {
      const message = this.formatReminderMessage(reminder);
      const result = await this.sendMessage(phoneNumber, message);
      return result.success;
    } catch (error) {
      console.error('❌ Failed to send reminder notification:', error);
      return false;
    }
  }

  private formatReminderMessage(reminder: Reminder): string {
    const emoji = this.getReminderEmoji(reminder.title);
    const time = reminder.reminderDateTime.toLocaleString();
    
    let message = `${emoji} *Reminder Alert!*\n\n`;
    message += `📋 *${reminder.title}*\n`;
    
    if (reminder.description) {
      message += `📝 ${reminder.description}\n`;
    }
    
    message += `⏰ Scheduled for: ${time}\n`;
    
    if (reminder.frequency && reminder.frequency !== 'none') {
      message += `🔄 Frequency: ${reminder.frequency}\n`;
    }
    
    message += `\n✨ Sent from your Personal Reminder App`;
    
    return message;
  }

  private getReminderEmoji(title: string): string {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('meeting') || lowerTitle.includes('call')) return '📞';
    if (lowerTitle.includes('birthday') || lowerTitle.includes('anniversary')) return '🎂';
    if (lowerTitle.includes('medicine') || lowerTitle.includes('health')) return '💊';
    if (lowerTitle.includes('exercise') || lowerTitle.includes('workout')) return '🏃‍♂️';
    if (lowerTitle.includes('bill') || lowerTitle.includes('payment')) return '💳';
    if (lowerTitle.includes('appointment') || lowerTitle.includes('doctor')) return '🏥';
    if (lowerTitle.includes('travel') || lowerTitle.includes('flight')) return '✈️';
    if (lowerTitle.includes('grocery') || lowerTitle.includes('shopping')) return '🛒';
    if (lowerTitle.includes('task') || lowerTitle.includes('work')) return '💼';
    if (lowerTitle.includes('event') || lowerTitle.includes('party')) return '🎉';
    
    return '⏰'; // Default reminder emoji
  }
}

// Export singleton instance
export const whatsappService = new WhatsAppService();
