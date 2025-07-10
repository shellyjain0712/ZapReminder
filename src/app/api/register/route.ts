import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    console.log("Registration request received");
    const body: unknown = await request.json();
    console.log("Registration body:", body);
    
    const { name, email, password } = registerSchema.parse(body);
    console.log("Validation passed for:", { name, email, passwordLength: password.length });

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    });
    console.log("Existing user check:", { exists: !!existingUser });

    if (existingUser) {
      console.log("User already exists:", email);
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    console.log("Creating new user...");
    // For development, store password as plain text
    // In production, hash the password:
    // const hashedPassword = await bcrypt.hash(password, 12);

    console.log("User data to create:", { name, email, hasPassword: !!password });

    // Create user with explicit type casting for compatibility
    const user = await db.user.create({
      data: {
        name,
        email,
        password, // Use hashedPassword in production
      }
    });
    
    console.log("User created successfully:", { id: user.id, email: user.email });

    return NextResponse.json(
      { message: "Account created successfully", user: { id: user.id, name: user.name, email: user.email } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return NextResponse.json(
        { error: `Invalid ${firstError?.path.join('.')}: ${firstError?.message}` },
        { status: 400 }
      );
    }
    
    // Handle Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      console.error("Prisma error code:", error.code);
      return NextResponse.json(
        { error: "Database error. Please try again." },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    );
  }
}
