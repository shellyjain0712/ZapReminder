// Test the complete signup flow
import { db } from "@/server/db";

async function testSignupFlow() {
  try {
    console.log("Testing database connection...");
    
    // Test creating a user
    const testUser = await db.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        password: "testpassword123"
      }
    });
    
    console.log("✅ User created successfully:", testUser);
    
    // Test finding the user
    const foundUser = await db.user.findUnique({
      where: { email: "test@example.com" }
    });
    
    console.log("✅ User found:", foundUser);
    
    // Clean up
    await db.user.delete({
      where: { id: testUser.id }
    });
    
    console.log("✅ Test completed successfully!");
    console.log("🎉 Database is working correctly!");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testSignupFlow();
