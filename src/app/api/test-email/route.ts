import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { sendReminderNotification } from "@/lib/notifications";
import { env } from "@/env";
import { z } from "zod";

const testEmailSchema = z.object({
  email: z.string().email(),
  type: z.enum(['basic', 'advance-notification']).optional().default('basic'),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const { email, type } = testEmailSchema.parse(body);

    // Check if email is configured
    const isConfigured = env.EMAIL_SERVER_USER !== "your-actual-email@gmail.com" && 
                        env.EMAIL_SERVER_PASSWORD !== "your-actual-app-password-here" &&
                        Boolean(env.EMAIL_SERVER_USER) && 
                        Boolean(env.EMAIL_SERVER_PASSWORD);

    if (!isConfigured) {
      return NextResponse.json(
        { error: "Email is not configured. Please update your .env file with real email credentials." },
        { status: 500 }
      );
    }

    let result;
    
    if (type === 'advance-notification') {
      // Test advance notification email
      console.log('📧 Sending advance notification test email to:', email);
      
      result = await sendReminderNotification({
        type: 'reminder-due-soon',
        reminderTitle: 'TEST: Advance Email Notification',
        userEmail: email,
        userName: 'Test User',
        dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        reminderTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        description: 'This is a test of the advance notification system. You should receive this email 2 hours before your reminder.',
        priority: 'HIGH',
        hoursUntilDue: 2
      });
    } else {
      // Basic test email
      result = await sendEmail({
        to: email,
        subject: "Test Email - Smart Reminder",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Email Configuration Test</h2>
            <p>This is a test email to verify that your email configuration is working correctly.</p>
            <p>If you received this email, your email delivery is properly configured!</p>
            <p>Timestamp: ${new Date().toLocaleString()}</p>
          </div>
        `,
        text: `Email Configuration Test\n\nThis is a test email to verify that your email configuration is working correctly.\n\nIf you received this email, your email delivery is properly configured!\n\nTimestamp: ${new Date().toLocaleString()}`
      });
    }

    if (result.success) {
      return NextResponse.json(
        { 
          message: type === 'advance-notification' ? "Advance notification test email sent!" : "Test email sent successfully!", 
          type 
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: "Failed to send test email", details: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json(
      { error: "Failed to send test email", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
