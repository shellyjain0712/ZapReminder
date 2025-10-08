import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import twilio from 'twilio';
import nodemailer from 'nodemailer';
import { env } from '@/env';

const prisma = new PrismaClient();

// Simple GET endpoint for testing
export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'Database polling API is ready',
    service: 'ZapReminder Notification Service',
    timestamp: new Date().toISOString()
  });
}

// POST endpoint for processing notifications
export async function POST() {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Database polling endpoint called');
    
    const currentTime = new Date();
    const stats = {
      processed: 0,
      emailsSent: 0,
      whatsappSent: 0,
      errors: 0,
      processingTime: 0
    };

    // Fetch pending reminders (next 2 minutes)
    const windowEnd = new Date(currentTime.getTime() + (2 * 60 * 1000));
    
    const reminders = await prisma.reminder.findMany({
      where: {
        dueDate: {
          lte: windowEnd
        },
        lastNotificationSent: null
      },
      include: {
        user: true
      },
      orderBy: {
        dueDate: 'asc'
      }
    });

    console.log(`📋 Found ${reminders.length} reminders to process`);

    const processedReminders = [];

    for (const reminder of reminders) {
      try {
        stats.processed++;
        
        // Send email notification
        if (reminder.user?.email) {
          const emailSent = await sendEmailNotification(reminder);
          if (emailSent) {
            stats.emailsSent++;
          } else {
            stats.errors++;
          }
        }

        // Send WhatsApp notification if phone number available
        const phoneNumber = reminder.whatsappPhoneNumber || reminder.user?.phoneNumber;
        if (phoneNumber) {
          const whatsappSent = await sendWhatsAppNotification(reminder, phoneNumber);
          if (whatsappSent) {
            stats.whatsappSent++;
          } else {
            stats.errors++;
          }
        }

        // Mark as sent
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { 
            lastNotificationSent: new Date()
          }
        });

        processedReminders.push({
          id: reminder.id,
          title: reminder.title,
          userEmail: reminder.user?.email
        });

      } catch (error) {
        console.error(`❌ Error processing reminder ${reminder.id}:`, error);
        stats.errors++;
      }
    }

    stats.processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      stats,
      reminders: processedReminders,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Database polling error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process notifications',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function sendEmailNotification(reminder) {
  try {
    const transporter = nodemailer.createTransport({
      host: env.EMAIL_SERVER_HOST,
      port: parseInt(env.EMAIL_SERVER_PORT),
      secure: false,
      auth: {
        user: env.EMAIL_SERVER_USER,
        pass: env.EMAIL_SERVER_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const emailSubject = `🔔 ${reminder.title} - Reminder Alert`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; margin: 0; font-size: 24px;">⚡ ZapReminder</h1>
          </div>
          
          <h2 style="color: #1f2937; margin-top: 0; font-size: 20px;">${reminder.title}</h2>
          
          ${reminder.description ? `
            <div style="margin: 20px 0;">
              <h3 style="color: #374151; margin: 0 0 8px 0; font-size: 16px;">📝 Description:</h3>
              <p style="margin: 5px 0 0 0; color: #6b7280;">${reminder.description}</p>
            </div>
          ` : ''}
          
          <div style="margin: 20px 0; padding: 15px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin: 0 0 8px 0; font-size: 16px;">⏰ Due Time:</h3>
            <p style="margin: 5px 0 0 0; color: #b45309; font-weight: bold;">${new Date(reminder.dueDate).toLocaleString()}</p>
          </div>
          
          <div style="margin-top: 30px; padding: 15px; background-color: #f3f4f6; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              📱 Sent via ZapReminder - Your Smart Notification System
            </p>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: reminder.user.email,
      subject: emailSubject,
      html: emailHtml,
    });

    console.log(`✅ Email sent to ${reminder.user.email}`);
    return true;
  } catch (error) {
    console.error(`📧 Email error for ${reminder.user.email}:`, error);
    return false;
  }
}

async function sendWhatsAppNotification(reminder, phoneNumber) {
  try {
    const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    
    if (!phoneNumber) {
      console.log('📱 No phone number available for WhatsApp');
      return false;
    }

    const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    
    const message = `🔔 *ZapReminder Alert*

📝 *${reminder.title}*

${reminder.description ? `📋 ${reminder.description}\n\n` : ''}📅 *Due:* ${new Date(reminder.dueDate).toLocaleString()}
⚡ *Priority:* ${reminder.priority}${reminder.category ? `\n🏷️ *Category:* ${reminder.category}` : ''}

⏰ *Sent at:* ${new Date().toLocaleString()}

💡 Reply "STOP" to unsubscribe from reminders.`;

    const result = await client.messages.create({
      body: message,
      from: env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${formattedNumber}`
    });

    console.log(`📱 WhatsApp sent: ${result.sid} (${result.status})`);
    return true;
  } catch (error) {
    console.error(`📱 WhatsApp error for ${phoneNumber}:`, error);
    return false;
  }
}