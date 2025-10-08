import { type NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerAuth(request);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    return NextResponse.json({ 
      message: "Auth test successful", 
      user: session.user.email 
    });
  } catch (error) {
    console.error("Auth test error:", error);
    return NextResponse.json({ error: "Auth test failed" }, { status: 500 });
  }
}