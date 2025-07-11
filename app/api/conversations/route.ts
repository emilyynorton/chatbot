import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { auth } from '../auth/[...nextauth]/route';

export async function GET(request: Request) {
  try {
    // Get user from session
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching conversations' },
      { status: 500 }
    );
  }
}
