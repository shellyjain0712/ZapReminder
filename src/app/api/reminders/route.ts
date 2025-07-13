/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
});

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
  isSnooze: z.boolean().optional(),
  snoozeUntil: z.string().transform((str) => str ? new Date(str) : null).optional(),
});

// GET - Fetch all reminders for the user
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

    interface WhereClause {
      userId: string;
      isCompleted?: boolean;
      priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
      category?: string;
    }

    const whereClause: WhereClause = { userId: user.id };
    
    if (completed !== null) {
      whereClause.isCompleted = completed === "true";
    }
    
    if (priority && ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(priority)) {
      whereClause.priority = priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT";
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

    const reminder = await db.reminder.create({
      data: {
        ...validatedData,
        userId: user.id,
      },
    });

    return NextResponse.json(reminder, { status: 201 });
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
