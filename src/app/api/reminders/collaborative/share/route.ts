/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { z } from 'zod';

const shareReminderSchema = z.object({
  reminderId: z.string().min(1, "Reminder ID is required"),
  recipientEmail: z.string().email("Valid email is required"),
  role: z.enum(["VIEWER", "EDITOR", "ASSIGNEE", "MANAGER"]).default("VIEWER"),
  message: z.string().optional(),
});

// POST /api/reminders/collaborative/share - Share a reminder with another user
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sender = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!sender) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = shareReminderSchema.parse(body);

    // Check if the reminder exists and belongs to the user
    const reminder = await db.reminder.findFirst({
      where: {
        id: validatedData.reminderId,
        userId: sender.id,
      }
    });

    if (!reminder) {
      return NextResponse.json({ 
        error: "Reminder not found or you don't have permission to share it" 
      }, { status: 404 });
    }

    // Check if recipient user exists
    const recipient = await db.user.findUnique({
      where: { email: validatedData.recipientEmail },
    });

    if (!recipient) {
      return NextResponse.json({ 
        error: "Recipient user not found. They need to sign up first." 
      }, { status: 404 });
    }

    // Don't allow sharing with yourself
    if (recipient.id === sender.id) {
      return NextResponse.json({ 
        error: "You cannot share a reminder with yourself" 
      }, { status: 400 });
    }

    // Try to create the collaboration using raw SQL for now
    // This works even if the Prisma models aren't fully recognized
    try {
      // Check if collaboration already exists
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

      // Create the collaboration entry
      await db.$executeRaw`
        INSERT INTO "Collaboration" (
          id, "reminderId", "senderId", "receiverId", 
          type, status, role, message, "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid()::text, 
          ${validatedData.reminderId}, 
          ${sender.id}, 
          ${recipient.id},
          'SHARE', 
          'PENDING', 
          ${validatedData.role}, 
          ${validatedData.message ?? ''}, 
          NOW(), 
          NOW()
        )
      `;

      // Mark the reminder as shared (if the field exists)
      try {
        await db.$executeRaw`
          UPDATE "Reminder" 
          SET "isShared" = true 
          WHERE id = ${validatedData.reminderId}
        `;
      } catch {
        // Ignore if isShared field doesn't exist yet
        console.log('Note: isShared field may not exist in Reminder model yet');
      }

      return NextResponse.json({
        success: true,
        message: `Reminder successfully shared with ${recipient.name ?? recipient.email}`,
        collaboration: {
          recipientName: recipient.name ?? recipient.email,
          role: validatedData.role,
          status: 'PENDING'
        }
      }, { status: 201 });

    } catch (dbError: any) {
      console.error('Database error in collaboration sharing:', dbError);
      
      if (dbError.code === '42P01') { // Table doesn't exist
        return NextResponse.json({
          error: "Collaborative features are not fully set up yet. Database may still be updating.",
          details: "Please try again in a few moments."
        }, { status: 503 });
      }

      return NextResponse.json({
        error: "Failed to share reminder",
        details: "Database operation failed"
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Error sharing reminder:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to share reminder" },
      { status: 500 }
    );
  }
}
