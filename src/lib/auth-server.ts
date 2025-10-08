import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function getServerAuth(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.AUTH_SECRET 
    });
    
    if (!token) {
      return null;
    }
    
    return {
      user: {
        email: token.email,
        name: token.name,
        image: token.picture ?? token.image,
      }
    };
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}