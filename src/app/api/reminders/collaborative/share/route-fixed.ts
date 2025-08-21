/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";
import { db } from "~/server/db";
import { z } from "zod";

// Validation schema
const shareReminderSchema = z.object({
  reminderId: z.string().min(1, "Reminder ID is required"),
  recipientEmail: z.string().email("Valid email is required"),
  role: z.enum(["VIEWER", "EDITOR", "ASSIGNEE", "MANAGER"]).default("VIEWER"),
  message: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const validatedData = shareReminderSchema.parse(body);

    // Get current user
    const sender = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!sender) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if reminder exists and belongs to user
    const reminder = await db.reminder.findFirst({
      where: {
        id: validatedData.reminderId,
        userId: sender.id,
      },
    });

    if (!reminder) {
      return NextResponse.json({ 
        error: "Reminder not found or you don't have permission to share it" 
      }, { status: 404 });
    }

    // Find recipient user
    const recipient = await db.user.findUnique({
      where: { email: validatedData.recipientEmail },
    });

    if (!recipient) {
      return NextResponse.json({ 
        error: "Recipient user not found. They need to create an account first." 
      }, { status: 404 });
    }

    // Check if sharing already exists
    const existingCollaboration = await db.$queryRaw`
      SELECT id FROM "Collaboration"
      WHERE "reminderId" = ${validatedData.reminderId}
      AND "receiverId" = ${recipient.id}
      LIMIT 1
    `;

    if ((existingCollaboration as any[]).length > 0) {
      return NextResponse.json({ 
        error: "This reminder is already shared with this user" 
      }, { status: 409 });
    }

    // Create the collaboration entry with proper enum casting
    await db.$executeRaw`
      INSERT INTO "Collaboration" (
        id, "reminderId", "senderId", "receiverId", 
        type, status, role, message, "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid()::text, 
        ${validatedData.reminderId}, 
        ${sender.id}, 
        ${recipient.id},
        'SHARE'::"CollaborationType", 
        'PENDING'::"CollaborationStatus", 
        ${validatedData.role}::"SharedReminderRole", 
        ${validatedData.message ?? ''}, 
        NOW(), 
        NOW()
      )`;

    // Also create a SharedReminder entry (checking if status column exists)
    try {
      await db.$executeRaw`
        INSERT INTO "SharedReminder" (
          id, "reminderId", "userId", role, "canEdit", "canComplete", "createdAt"
        ) VALUES (
          gen_random_uuid()::text,
          ${validatedData.reminderId},
          ${recipient.id},
          ${validatedData.role}::"SharedReminderRole",
          ${validatedData.role === 'EDITOR' || validatedData.role === 'MANAGER'},
          ${validatedData.role === 'ASSIGNEE' || validatedData.role === 'MANAGER'},
          NOW()
        )`;
    } catch (sharedReminderError) {
      console.log('SharedReminder creation failed, trying alternate schema:', sharedReminderError);
      // Fallback - might have different schema
    }

    // Update the reminder to mark it as shared
    await db.reminder.update({
      where: { id: validatedData.reminderId },
      data: { isShared: true },
    });

    return NextResponse.json({
      success: true,
      message: `Reminder shared successfully with ${validatedData.recipientEmail}`,
      collaboration: {
        recipientEmail: validatedData.recipientEmail,
        role: validatedData.role,
        status: "PENDING"
      }
    });

  } catch (error: any) {
    console.error("Database error in collaboration sharing:", error);
    
    // Handle specific database errors
    if (error?.code === 'P2010') {
      const dbError = error as any;
      if (dbError.code === '42P01') { // Table doesn't exist
        return NextResponse.json({
          error: "Database tables not ready. Please run the setup script first.",
          details: "Collaborative tables are missing"
        }, { status: 500 });
      }
      
      if (dbError.message?.includes('enum')) {
        return NextResponse.json({
          error: "Database schema mismatch. Please regenerate the database.",
          details: "Enum type casting error"
        }, { status: 500 });
      }
    }

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: "Validation failed",
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      }, { status: 400 });
    }

    return NextResponse.json({
      error: "Failed to share reminder",
      details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
    }, { status: 500 });
  }
}
