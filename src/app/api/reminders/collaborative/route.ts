import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { db } from '@/server/db';

// GET /api/reminders/collaborative - Get all collaborative reminders for the user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's own reminders
    const myReminders = await db.reminder.findMany({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Try to get shared reminders, but gracefully handle if table doesn't exist yet
    let sharedWithMe = [];
    let pendingInvitations = [];

    try {
      // Check if SharedReminder table exists and has data
      const sharedQuery = `
        SELECT sr.*, r.*, u1.name as shared_by_name, u1.email as shared_by_email 
        FROM "SharedReminder" sr 
        JOIN "Reminder" r ON sr."reminderId" = r.id 
        JOIN "User" u1 ON sr."sharedById" = u1.id 
        WHERE sr."sharedWithId" = $1 AND sr.status = 'ACTIVE'
        ORDER BY sr."createdAt" DESC
      `;
      
      // Use raw query as fallback
      const sharedResults = await db.$queryRawUnsafe(sharedQuery, user.id) as any[];
      sharedWithMe = sharedResults.map((sr: any) => ({
        id: sr.id,
        title: sr.title,
        description: sr.description,
        dueDate: sr.dueDate,
        isCompleted: sr.isCompleted,
        priority: sr.priority,
        sharedBy: {
          name: sr.shared_by_name,
          email: sr.shared_by_email,
        },
        role: sr.role,
        sharedAt: sr.createdAt,
      }));

      // Get pending invitations
      const inviteQuery = `
        SELECT c.*, u.name as inviter_name, u.email as inviter_email, r.title as reminder_title
        FROM "Collaboration" c 
        JOIN "User" u ON c."inviterId" = u.id 
        JOIN "Reminder" r ON c."reminderId" = r.id 
        WHERE c."inviteeId" = $1 AND c.status = 'PENDING'
        ORDER BY c."createdAt" DESC
      `;
      
      const inviteResults = await db.$queryRawUnsafe(inviteQuery, user.id) as any[];
      pendingInvitations = inviteResults.map((inv: any) => ({
        id: inv.id,
        type: inv.type,
        message: inv.message,
        inviter: {
          name: inv.inviter_name,
          email: inv.inviter_email,
        },
        reminder: {
          title: inv.reminder_title,
        },
        createdAt: inv.createdAt,
      }));

    } catch (error) {
      console.log('Collaborative tables not fully ready yet, using fallback');
      // If tables don't exist yet, just return empty arrays
    }

    return NextResponse.json({
      myReminders,
      sharedWithMe,
      pendingInvitations,
      success: true,
    });

  } catch (error) {
    console.error('Error fetching collaborative reminders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collaborative reminders' },
      { status: 500 }
    );
  }
}

// POST /api/reminders/collaborative - Share a reminder or create a collaborative reminder
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json() as {
      reminderId: string;
      email: string;
      role: 'VIEWER' | 'EDITOR' | 'ASSIGNEE' | 'MANAGER';
      message?: string;
    };

    const { reminderId, email, role, message } = body;

    // Validate the reminder belongs to the user
    const reminder = await db.reminder.findFirst({
      where: {
        id: reminderId,
        userId: user.id,
      },
    });

    if (!reminder) {
      return NextResponse.json({ error: 'Reminder not found or you do not have permission' }, { status: 404 });
    }

    // Find the user to share with
    const targetUser = await db.user.findUnique({
      where: { email },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found. They might need to sign up first.' }, { status: 404 });
    }

    if (targetUser.id === user.id) {
      return NextResponse.json({ error: 'You cannot share a reminder with yourself' }, { status: 400 });
    }

    try {
      // Try using the Prisma models, fall back to raw queries if needed
      const shareQuery = `
        INSERT INTO "SharedReminder" ("id", "reminderId", "sharedById", "sharedWithId", "role", "status", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, 'ACTIVE', NOW(), NOW())
        ON CONFLICT ("reminderId", "sharedWithId") DO NOTHING
        RETURNING *
      `;

      const shareResult = await db.$queryRawUnsafe(
        shareQuery,
        reminderId,
        user.id,
        targetUser.id,
        role
      ) as any[];

      if (shareResult.length === 0) {
        return NextResponse.json({ error: 'Reminder already shared with this user' }, { status: 400 });
      }

      // Create collaboration notification
      const collaborationQuery = `
        INSERT INTO "Collaboration" ("id", "inviterId", "inviteeId", "reminderId", "type", "status", "message", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, 'SHARE', 'ACCEPTED', $4, NOW(), NOW())
        RETURNING *
      `;

      await db.$queryRawUnsafe(
        collaborationQuery,
        user.id,
        targetUser.id,
        reminderId,
        message || `${user.name || user.email} shared a reminder "${reminder.title}" with you`
      );

      return NextResponse.json({
        success: true,
        message: `Reminder shared successfully with ${targetUser.name || targetUser.email}!`,
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({
        error: 'Failed to share reminder. Database may still be updating.',
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in collaborative reminders:', error);
    return NextResponse.json(
      { error: 'Failed to process collaborative reminder request' },
      { status: 500 }
    );
  }
}
