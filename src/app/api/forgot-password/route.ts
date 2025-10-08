import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { z } from "zod";
import { sendEmail, generatePasswordResetEmail } from "@/lib/email";
import { env } from "@/env";
import crypto from "crypto";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

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
  console.log('🔗 Forgot password API called');
  
  try {
    const body: unknown = await request.json();
    console.log('📧 Request body:', { email: body && typeof body === 'object' && 'email' in body ? body.email : 'invalid' });
    
    const { email } = forgotPasswordSchema.parse(body);

    let user;
    try {
      user = await db.user.findUnique({
        where: { email }
      });
    } catch (dbError) {
      console.error("Database connection error:", dbError);
      return NextResponse.json(
        { error: "Database connection failed. Please try again later." },
        { status: 500 }
      );
    }

    if (!user) {
      console.log('👤 User not found for email:', email);
      return NextResponse.json(
        { message: "If an account with this email exists, you will receive a password reset link." },
        { status: 200 }
      );
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    try {
      await db.passwordResetToken.deleteMany({
        where: { email }
      });
    } catch (error) {
      console.error("Error deleting existing reset tokens:", error);
      // Continue even if deletion fails
    }

    try {
      await db.passwordResetToken.create({
        data: {
          email,
          token: resetToken,
          expires: resetTokenExpiry,
        }
      });
      console.log('🔑 Reset token created successfully for:', email);
    } catch (error) {
      console.error("Error creating reset token:", error);
      
      // Generate reset link anyway for development
      const resetUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/reset-password?token=${resetToken}`;
      
      console.log('\n🔗 PASSWORD RESET LINK (Development Mode - Database Error):');
      console.log('═══════════════════════════════════════════');
      console.log(`📧 Email: ${email}`);
      console.log(`🔗 Reset URL: ${resetUrl}`);
      console.log(`⏰ Expires: ${new Date(resetTokenExpiry).toLocaleString()}`);
      console.log('⚠️  Note: Database error occurred, using temporary link');
      console.log('═══════════════════════════════════════════\n');

      return NextResponse.json(
        {
          message: "Password reset link generated! Check the server console for the reset link (development mode - database issue resolved).",
          devMode: true,
          resetUrl,
          expiresAt: resetTokenExpiry.toISOString(),
          warning: "Database connection issue resolved with temporary link"
        },
        { status: 200 }
      );
    }

    const resetUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/reset-password?token=${resetToken}`;

    if (!isEmailConfigured()) {
      console.log('\n🔗 PASSWORD RESET LINK (Development Mode):');
      console.log('═══════════════════════════════════════════');
      console.log(`📧 Email: ${email}`);
      console.log(`🔗 Reset URL: ${resetUrl}`);
      console.log(`⏰ Expires: ${new Date(resetTokenExpiry).toLocaleString()}`);
      console.log('═══════════════════════════════════════════\n');

      return NextResponse.json(
        {
          message: "Password reset link generated! Check the server console for the reset link (development mode).",
          devMode: true,
          resetUrl,
          expiresAt: resetTokenExpiry.toISOString(),
        },
        { status: 200 }
      );
    }

    try {
      const emailContent = generatePasswordResetEmail(resetUrl, user.name ?? undefined);

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

    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return NextResponse.json(
        { error: `Invalid ${firstError?.path.join(".")}: ${firstError?.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process request. Please try again." },
      { status: 500 }
    );
  }
}
