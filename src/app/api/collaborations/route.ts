/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { db } from '@/server/db';

// GET /api/collaborations - Get pending collaboration invitations
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

    // Get invitations received (where user is the receiver)
    const receivedQuery = `
      SELECT c.*, u.name as sender_name, u.email as sender_email, r.title as reminder_title
      FROM "Collaboration" c 
      JOIN "User" u ON c."senderId" = u.id 
      JOIN "Reminder" r ON c."reminderId" = r.id 
      WHERE c."receiverId" = $1 AND c.status = 'PENDING'
      ORDER BY c."createdAt" DESC
    `;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unnecessary-type-assertion
    const receivedResults = await db.$queryRawUnsafe(receivedQuery, user.id) as any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const received = receivedResults.map((inv: any) => ({
      id: inv.id,
      type: inv.type,
      message: inv.message,
      role: inv.role,
      sender: {
        name: inv.sender_name,
        email: inv.sender_email,
      },
      reminder: {
        title: inv.reminder_title,
      },
      createdAt: inv.createdAt,
    }));

    // Get invitations sent (where user is the sender)
    const sentQuery = `
      SELECT c.*, u.name as receiver_name, u.email as receiver_email, r.title as reminder_title
      FROM "Collaboration" c 
      JOIN "User" u ON c."receiverId" = u.id 
      JOIN "Reminder" r ON c."reminderId" = r.id 
      WHERE c."senderId" = $1 AND c.status = 'PENDING'
      ORDER BY c."createdAt" DESC
    `;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unnecessary-type-assertion
    const sentResults = await db.$queryRawUnsafe(sentQuery, user.id) as any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const sent = sentResults.map((inv: any) => ({
      id: inv.id,
      type: inv.type,
      message: inv.message,
      role: inv.role,
      receiver: {
        name: inv.receiver_name,
        email: inv.receiver_email,
      },
      reminder: {
        title: inv.reminder_title,
      },
      createdAt: inv.createdAt,
    }));

    return NextResponse.json({
      received,
      sent,
    });

  } catch (err) {
    console.error('Error fetching collaborations:', err);
    return NextResponse.json(
      { error: 'Failed to fetch collaborations' },
      { status: 500 }
    );
  }
}

// POST /api/collaborations - Accept/decline collaboration invitations
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const body = await request.json();
    const { collaborationId, action } = body as { collaborationId: string; action: 'accept' | 'decline' };

    if (!collaborationId || !action) {
      return NextResponse.json({ error: 'Missing collaborationId or action' }, { status: 400 });
    }

    // First check if this collaboration exists and is still pending
    const collaborationCheck = await db.$queryRawUnsafe(`
      SELECT status FROM "Collaboration" 
      WHERE id = $1 AND "receiverId" = $2
    `, collaborationId, user.id);

    const existingCollaboration = (collaborationCheck as any[])[0];
    
    if (!existingCollaboration) {
      return NextResponse.json({ error: 'Collaboration not found or you are not authorized' }, { status: 404 });
    }

    if (existingCollaboration.status !== 'PENDING') {
      return NextResponse.json({ 
        success: false,
        error: `This invitation has already been ${existingCollaboration.status.toLowerCase()}` 
      }, { status: 400 });
    }

    if (action === 'accept') {
      // Update collaboration status to ACCEPTED
      await db.$executeRawUnsafe(`
        UPDATE "Collaboration" 
        SET status = 'ACCEPTED'::"CollaborationStatus", "updatedAt" = NOW()
        WHERE id = $1 AND "receiverId" = $2
      `, collaborationId, user.id);

      // Get collaboration details
      const collabQuery = `
        SELECT c.*, r.* 
        FROM "Collaboration" c 
        JOIN "Reminder" r ON c."reminderId" = r.id 
        WHERE c.id = $1
      `;
      
      const collabResults = await db.$queryRawUnsafe(collabQuery, collaborationId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      const collaboration = (collabResults as any[])[0];

      if (collaboration) {
        // Check if SharedReminder already exists to avoid duplicate key error
        const existingSharedReminder = await db.$queryRawUnsafe(`
          SELECT id FROM "SharedReminder" 
          WHERE "reminderId" = $1 AND "userId" = $2
        `, collaboration.reminderId, user.id);

        if ((existingSharedReminder as any[]).length === 0) {
          // Create SharedReminder entry with proper enum casting only if it doesn't exist
          await db.$executeRawUnsafe(`
            INSERT INTO "SharedReminder" (id, "reminderId", "userId", role, "canEdit", "canComplete", "createdAt")
            VALUES (gen_random_uuid(), $1, $2, $3::"SharedReminderRole", $4, $5, NOW())
          `, collaboration.reminderId, user.id, collaboration.role, true, true);
        }
      }

      return NextResponse.json({ success: true, message: 'Invitation accepted successfully! 🎉' });
    } else {
      // Update collaboration status to DECLINED
      await db.$executeRawUnsafe(`
        UPDATE "Collaboration" 
        SET status = 'DECLINED'::"CollaborationStatus", "updatedAt" = NOW()
        WHERE id = $1 AND "receiverId" = $2
      `, collaborationId, user.id);

      return NextResponse.json({ success: true, message: 'Invitation declined successfully' });
    }

  } catch (err) {
    console.error('Error processing collaboration:', err);
    return NextResponse.json(
      { error: 'Failed to process collaboration' },
      { status: 500 }
    );
  }
}
