/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { z } from "zod";

const createReminderSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().transform((str) => new Date(str)),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  category: z.string().optional(),
  emailNotification: z.boolean().default(true),
  pushNotification: z.boolean().default(true),
  reminderTime: z.string().transform((str) => str ? new Date(str) : null).optional(),
  notificationTime: z.string().transform((str) => str ? new Date(str) : null).optional(),
  autoAddToCalendar: z.boolean().default(true).optional(),
  collaborators: z.array(z.object({
    email: z.string().email(),
    role: z.enum(["VIEWER", "EDITOR", "ASSIGNEE", "MANAGER"]),
    message: z.string().optional(),
  })).optional(),
  // Recurring fields
  isRecurring: z.boolean().default(false),
  recurrenceType: z.enum(["DAILY", "WEEKLY", "MONTHLY", "CUSTOM"]).optional(),
  recurrenceInterval: z.number().int().positive().optional(),
  preDueNotifications: z.array(z.number().int().positive()).optional(),
});

// GET - Fetch all reminders for the authenticated user
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const completed = searchParams.get("completed");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");

    const whereClause: any = { userId: user.id };
    
    if (completed !== null) {
      whereClause.isCompleted = completed === "true";
    }
    
    if (priority && ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(priority)) {
      whereClause.priority = priority;
    }
    
    if (category) {
      whereClause.category = category;
    }

    const reminders = await db.reminder.findMany({
      where: whereClause,
      orderBy: [
        { isCompleted: "asc" },
        { priority: "desc" },
        { dueDate: "asc" },
      ],
    });

    return NextResponse.json(reminders);
  } catch (error) {
    console.error("Error fetching reminders:", error);
    return NextResponse.json(
      { error: "Failed to fetch reminders" },
      { status: 500 }
    );
  }
}

// POST - Create a new reminder
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = createReminderSchema.parse(body);

    // Extract calendar preference and collaborators from data to be saved
    const { autoAddToCalendar, collaborators, ...reminderData } = validatedData;

    const reminder = await db.reminder.create({
      data: {
        ...reminderData,
        userId: user.id,
      },
    });

    // Handle collaborators if provided
    let collaborationCount = 0;
    if (collaborators && collaborators.length > 0) {
      try {
        for (const collaborator of collaborators) {
          // Find the collaborator user by email
          const collaboratorUser = await db.user.findUnique({
            where: { email: collaborator.email },
          });

          if (collaboratorUser) {
            // Create collaboration invitation
            await db.$executeRawUnsafe(`
              INSERT INTO "Collaboration" (id, "reminderId", "senderId", "receiverId", type, status, role, message, "createdAt", "updatedAt")
              VALUES (gen_random_uuid(), $1, $2, $3, 'SHARE'::"CollaborationType", 'PENDING'::"CollaborationStatus", $4::"SharedReminderRole", $5, NOW(), NOW())
            `, reminder.id, user.id, collaboratorUser.id, collaborator.role, collaborator.message ?? null);
            
            collaborationCount++;
          } else {
            console.warn(`Collaborator email not found: ${collaborator.email}`);
          }
        }
      } catch (collaborationError) {
        console.error('Error creating collaborations:', collaborationError);
        // Don't fail the reminder creation if collaboration fails
      }
    }

    // If calendar integration is enabled, add calendar-related metadata
    if (autoAddToCalendar) {
      console.log(`📅 Calendar integration enabled for reminder: ${reminder.title}`);
    }

    return NextResponse.json({
      ...reminder,
      calendarIntegrationEnabled: autoAddToCalendar,
      collaborationsCreated: collaborationCount,
      message: collaborationCount > 0 
        ? `Reminder created and shared with ${collaborationCount} collaborator(s)`
        : 'Reminder created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating reminder:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create reminder" },
      { status: 500 }
    );
  }
}
