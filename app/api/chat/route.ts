import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '../../../lib/prisma';
import { auth } from '../auth/[...nextauth]/route';

// Initialize the OpenAI client
let openai: OpenAI;
try {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY is not defined in environment variables');
  }
  openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: false,
  });
} catch (error) {
  console.error('Failed to initialize OpenAI client:', error);
}

export async function POST(req: Request) {
  try {
    // Get the user from the session
    const session = await auth();
    const isAuthenticated = !!session?.user?.id;
    
    const { messages, conversationId } = await req.json();
    let conversation = null;
    
    // Handle authenticated users with conversation memory
    if (isAuthenticated) {
      const userId = session!.user!.id;

      // Get or create conversation
      if (conversationId) {
        conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
        });
        
        if (!conversation) {
          return NextResponse.json(
            { error: 'Conversation not found' },
            { status: 404 }
          );
        }
        
        // Verify the conversation belongs to this user
        if (conversation.userId !== userId) {
          return NextResponse.json(
            { error: 'Unauthorized access to conversation' },
            { status: 403 }
          );
        }
      } else {
        // Check if user exists, create if not
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });
        
        if (!user) {
          console.error('Authenticated user not found in database:', userId);
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }
        
        // Create new conversation
        conversation = await prisma.conversation.create({
          data: {
            userId: user.id,
            title: messages.find((m: any) => m.role === 'user')?.content?.substring(0, 30) + '...' || 'New conversation',
          },
        });
        
        // Store any system or initial messages
        for (const msg of messages.filter((m: any) => m.role === 'system')) {
          await prisma.message.create({
            data: {
              role: msg.role,
              content: msg.content,
              conversationId: conversation.id,
            },
          });
        }
      }
      
      // Store the user message
      const userMessage = messages.find((m: any) => m.role === 'user' && !messages.some((existingMsg: any) => 
        existingMsg.role === 'assistant' && messages.indexOf(existingMsg) > messages.indexOf(m)
      ));
      
      if (userMessage && conversation) {
        await prisma.message.create({
          data: {
            role: userMessage.role,
            content: userMessage.content,
            conversationId: conversation.id,
          },
        });
      }
    } 
    // For unauthenticated users, we just process the chat without saving to DB

    // Get response from OpenAI - isolate this from database operations
    let reply;
    try {
      console.log('Calling OpenAI API with messages:', JSON.stringify(messages));
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messages,
      });
      
      // Get the raw response from OpenAI
      const rawResponse = completion.choices[0].message;
      
      // Create a simplified response object with just the text
      reply = {
        role: 'assistant', // Always use 'assistant' for consistency
        content: rawResponse.content || ''
      };
      
      console.log('Simplified response for frontend:', reply);
      
      // Store the assistant's reply (only for authenticated users)
      if (isAuthenticated && conversation) {
        try {
          await prisma.message.create({
            data: {
              role: reply.role,
              content: reply.content,
              conversationId: conversation.id,
            },
          });
        } catch (dbError) {
          console.error('Error storing assistant reply in database:', dbError);
          // Continue even if database save fails
        }
      }
    } catch (aiError: any) {
      console.error('OpenAI API error:', aiError);
      return NextResponse.json({
        error: 'Failed to get response from OpenAI',
        details: aiError.message || 'Unknown OpenAI error',
        type: aiError.type || aiError.code || 'OpenAIError',
      }, { status: 500 });
    }

    // Log the final response being sent to client
    const responseObj = {
      reply: reply,
      conversationId: isAuthenticated && conversation ? conversation.id : null
    };
    
    console.log('Final API response being sent to client:', JSON.stringify(responseObj));
    return NextResponse.json(responseObj);
  } catch (error: any) {
    console.error('API error:', error);
    
    // Provide more detailed error information
    const errorMessage = error.message || 'Unknown error';
    const errorResponse = {
      error: 'An error occurred while processing your request',
      details: errorMessage,
      type: error.type || error.code || 'UnknownError',
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}