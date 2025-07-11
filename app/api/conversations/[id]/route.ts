import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { auth } from '../../auth/[...nextauth]/route';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get user from session
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const conversationId = params.id;
    
    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    // Get the conversation details
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    
    // Check if conversation exists and belongs to the user
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    
    if (conversation.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to access this conversation' },
        { status: 403 }
      );
    }

    // Get all messages for this conversation
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    // Include the system message if it doesn't exist in the returned messages
    const hasSystemMessage = messages.some((msg: any) => msg.role === 'system');
    
    const formattedMessages = hasSystemMessage 
      ? messages 
      : [{ role: 'system', content: 'You are a helpful assistant.' }, ...messages];

    return NextResponse.json({
      conversation,
      messages: formattedMessages,
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching the conversation' },
      { status: 500 }
    );
  }
}
