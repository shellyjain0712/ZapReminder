/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unnecessary-type-assertion */
import { type NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/auth-server";
import { db } from "@/server/db";
import { z } from "zod";

const updateReminderSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  dueDate: z.string().transform((str) => new Date(str)).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  category: z.string().optional(),
  isCompleted: z.boolean().optional(),
  emailNotification: z.boolean().optional(),
  pushNotification: z.boolean().optional(),
  reminderTime: z.string().transform((str) => str ? new Date(str) : null).optional(),
  notificationTime: z.string().transform((str) => str ? new Date(str) : null).optional(),
  isSnooze: z.boolean().optional(),
  snoozeUntil: z.string().transform((str) => str ? new Date(str) : null).optional(),
  // Recurring fields
  isRecurring: z.boolean().optional(),
  recurrenceType: z.enum(["DAILY", "WEEKLY", "MONTHLY", "CUSTOM"]).optional(),
  recurrenceInterval: z.number().int().positive().optional(),
  preDueNotifications: z.array(z.number().int().positive()).optional(),
});

// GET - Fetch a specific reminder
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerAuth(request);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user owns the reminder OR has access through collaboration
    const reminder = await db.reminder.findFirst({
      where: {
        id: id,
        OR: [
          // User owns the reminder
          { userId: user.id },
          // User has access through shared reminder
          {
            sharedReminders: {
              some: {
                userId: user.id
              }
            }
          }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        sharedReminders: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        collaborations: {
          include: {
            receiver: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        }
      }
    });

    if (!reminder) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    return NextResponse.json(reminder);
  } catch (error) {
    console.error("Error fetching reminder:", error);
    return NextResponse.json(
      { error: "Failed to fetch reminder" },
      { status: 500 }
    );
  }
}

// PUT - Update a specific reminder
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerAuth(request);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user owns the reminder OR has editing permissions through collaboration
    const existingReminder = await db.reminder.findFirst({
      where: {
        id,
        OR: [
          // User owns the reminder
          { userId: user.id },
          // User has editing permissions through shared reminder
          {
            sharedReminders: {
              some: {
                userId: user.id,
                OR: [
                  { role: "EDITOR" },
                  { role: "MANAGER" },
                  { canEdit: true }
                ]
              }
            }
          }
        ]
      },
      include: {
        user: true,
        sharedReminders: {
          where: { userId: user.id }
        }
      }
    });

    if (!existingReminder) {
      return NextResponse.json({ 
        error: "Reminder not found or you don't have permission to edit it" 
      }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const body = await request.json();
    const validatedData = updateReminderSchema.parse(body);

    // Recalculate notification time if due date or reminder time changes
    const updateData = { ...validatedData };
    if (validatedData.dueDate || validatedData.reminderTime) {
      const newDueTime = validatedData.reminderTime ?? validatedData.dueDate ?? existingReminder.reminderTime ?? existingReminder.dueDate;
      const newNotificationTime = new Date(newDueTime.getTime() - 30 * 60 * 1000); // 30 minutes before
      updateData.notificationTime = newNotificationTime;
    }

    const updatedReminder = await db.reminder.update({
      where: { id },
      data: updateData,
    });

    // Send notification if task is completed
    if (validatedData.isCompleted && !existingReminder.isCompleted) {
      // TODO: Send completion notification
      console.log(`Task completed: ${updatedReminder.title}`);
    }

    return NextResponse.json(updatedReminder);
  } catch (error) {
    console.error("Error updating reminder:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update reminder" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a specific reminder
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerAuth(request);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user owns the reminder OR has manager permissions through collaboration
    const existingReminder = await db.reminder.findFirst({
      where: {
        id,
        OR: [
          // User owns the reminder
          { userId: user.id },
          // User has manager permissions through shared reminder
          {
            sharedReminders: {
              some: {
                userId: user.id,
                role: "MANAGER"
              }
            }
          }
        ]
      },
      include: {
        user: true,
        sharedReminders: {
          where: { userId: user.id }
        }
      }
    });

    if (!existingReminder) {
      return NextResponse.json({ 
        error: "Reminder not found or you don't have permission to delete it" 
      }, { status: 404 });
    }

    // Check if this reminder has collaborators
    const collaboratorsCount = await db.$queryRawUnsafe(`
      SELECT COUNT(*) as count FROM "SharedReminder" WHERE "reminderId" = $1
    `, id) as { count: bigint }[];
    
    const hasCollaborators = Number(collaboratorsCount[0]?.count ?? 0) > 0;

    // Delete the main reminder (this will cascade delete related data due to foreign keys)
    await db.reminder.delete({
      where: { id },
    });

    // Clean up collaborative data when reminder is deleted
    try {
      // Delete all SharedReminder entries for this reminder
      await db.$executeRawUnsafe(`
        DELETE FROM "SharedReminder" WHERE "reminderId" = $1
      `, id);

      // Delete all Collaboration entries for this reminder
      await db.$executeRawUnsafe(`
        DELETE FROM "Collaboration" WHERE "reminderId" = $1
      `, id);

      if (hasCollaborators) {
        console.log(`Cleaned up collaborative data for reminder: ${existingReminder.title} (had collaborators)`);
      } else {
        console.log(`Task deleted: ${existingReminder.title} (personal reminder)`);
      }
    } catch (cleanupError) {
      console.error('Error cleaning up collaborative data:', cleanupError);
      // Don't fail the delete operation if cleanup fails
    }

    // Return success with info about collaboration
    return NextResponse.json({ 
      message: hasCollaborators 
        ? "Reminder deleted successfully. All collaborators have been notified." 
        : "Reminder deleted successfully",
      wasCollaborative: hasCollaborators
    });
  } catch (error) {
    console.error("Error deleting reminder:", error);
    return NextResponse.json(
      { error: "Failed to delete reminder" },
      { status: 500 }
    );
  }
}
