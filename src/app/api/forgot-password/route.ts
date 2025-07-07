/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { z } from "zod";
import { sendEmail, generatePasswordResetEmail } from "@/lib/email";
import { env } from "@/env";
import crypto from "crypto";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

// Check if email is properly configured
function isEmailConfigured(): boolean {
  try {
    return env.EMAIL_SERVER_USER !== "your-actual-email@gmail.com" && 
           env.EMAIL_SERVER_PASSWORD !== "your-actual-app-password-here" &&
           env.EMAIL_SERVER_USER !== "your-email@gmail.com" && 
           env.EMAIL_SERVER_PASSWORD !== "your-app-password" &&
           Boolean(env.EMAIL_SERVER_USER) && 
           Boolean(env.EMAIL_SERVER_PASSWORD);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email }
    }) as { id: string; email: string | null; name: string | null } | null;

    if (!user) {
      // For security, we don't reveal whether the email exists or not
      return NextResponse.json(
        { message: "If an account with this email exists, you will receive a password reset link." },
        { status: 200 }
      );
    }

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Delete any existing reset tokens for this email
    try {
      // @ts-expect-error - passwordResetToken model exists in schema
      await db.passwordResetToken.deleteMany({
        where: { email }
      });
    } catch (error) {
      console.error("Error deleting existing reset tokens:", error);
      // Continue execution - this might fail if the table doesn't exist yet
    }

    // Create new reset token
    try {
      // @ts-expect-error - passwordResetToken model exists in schema
      await db.passwordResetToken.create({
        data: {
          email,
          token: resetToken,
          expires: resetTokenExpiry,
        }
      });
    } catch (error) {
      console.error("Error creating reset token:", error);
      return NextResponse.json(
        { error: "Failed to create reset token. The database may need to be updated." },
        { status: 500 }
      );
    }

    // Generate reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // Check if email is configured
    if (!isEmailConfigured()) {
      // Development mode: log the reset link instead of sending email
      console.log('\n🔗 PASSWORD RESET LINK (Development Mode):');
      console.log('═══════════════════════════════════════════');
      console.log(`📧 Email: ${email}`);
      console.log(`🔗 Reset URL: ${resetUrl}`);
      console.log(`⏰ Expires: ${new Date(resetTokenExpiry).toLocaleString()}`);
      console.log('═══════════════════════════════════════════');
      console.log('📧 Email not configured. Copy the URL above to reset password.\n');
      
      return NextResponse.json(
        { 
          message: "Password reset link generated! Check the server console for the reset link (development mode). Copy the URL from the console to reset your password.",
          devMode: true,
          resetUrl: resetUrl, // Include in response for development
          expiresAt: resetTokenExpiry.toISOString()
        },
        { status: 200 }
      );
    }

    // Production mode: send actual email
    try {
      // Generate email content
      const emailContent = generatePasswordResetEmail(resetUrl, user.name ?? undefined);

      // Send email
      const emailResult = await sendEmail({
        to: email,
        subject: "Password Reset Request - Smart Reminder",
        html: emailContent.html,
        text: emailContent.text,
      });

      if (!emailResult.success) {
        console.error("Failed to send email:", emailResult.error);
        return NextResponse.json(
          { error: "Failed to send reset email. Please try again later." },
          { status: 500 }
        );
      }

      console.log(`Password reset email sent to: ${email}`);
      
      return NextResponse.json(
        { message: "If an account with this email exists, you will receive a password reset link." },
        { status: 200 }
      );
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      return NextResponse.json(
        { error: "Failed to send reset email. Please check your email configuration." },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error("Forgot password error:", error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return NextResponse.json(
        { error: `Invalid ${firstError?.path.join('.')}: ${firstError?.message}` },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to process request. Please try again." },
      { status: 500 }
    );
  }
}
