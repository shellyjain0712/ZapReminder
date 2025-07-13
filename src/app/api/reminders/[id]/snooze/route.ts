/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { z } from "zod";

const snoozeSchema = z.object({
  snoozeUntil: z.string().transform((str) => new Date(str)),
});

// POST - Snooze a specific reminder
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
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

    const existingReminder = await db.reminder.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingReminder) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    const body = await request.json();
    const { snoozeUntil } = snoozeSchema.parse(body);

    const updatedReminder = await db.reminder.update({
      where: { id },
      data: {
        isSnooze: true,
        snoozeUntil,
      },
    });

    // TODO: Send snooze notification
    console.log(`Task snoozed until: ${snoozeUntil.toISOString()}`);

    return NextResponse.json(updatedReminder);
  } catch (error) {
    console.error("Error snoozing reminder:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to snooze reminder" },
      { status: 500 }
    );
  }
}
