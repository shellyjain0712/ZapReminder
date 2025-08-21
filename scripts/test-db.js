// Test database connection
import { db } from "@/server/db";

async function testDb() {
  try {
    console.log("Testing database connection...");
    
    // Test user creation
    const testUser = await db.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        password: "testpassword"
      }
    });
    
    console.log("User created successfully:", testUser);
    
    // Clean up
    await db.user.delete({
      where: { id: testUser.id }
    });
    
    console.log("Test completed successfully!");
  } catch (error) {
    console.error("Database test failed:", error);
  }
}

testDb();
