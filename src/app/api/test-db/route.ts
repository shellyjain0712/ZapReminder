import { NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET() {
  try {
    console.log("Testing database connection...");
    
    // Just try to count users
    const userCount = await db.user.count();
    console.log("Current user count:", userCount);
    
    return NextResponse.json({ 
      success: true, 
      userCount,
      message: "Database connection successful" 
    });
  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      message: "Database connection failed" 
    }, { status: 500 });
  }
}
