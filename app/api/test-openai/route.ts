import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function GET() {
  try {
    // Check if API key exists
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        status: 'error',
        message: 'OPENAI_API_KEY is not defined in environment variables',
      }, { status: 400 });
    }
    
    // Try to initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: false,
    });
    
    // Make a simple test call to OpenAI
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Using a more widely available model for testing
        messages: [
          { role: "system", content: "You are a test assistant." },
          { role: "user", content: "Test connection" }
        ],
        max_tokens: 5 // Keep it minimal for testing
      });
      
      return NextResponse.json({
        status: 'success',
        message: 'OpenAI API connection successful',
        testResponse: completion.choices[0].message,
      });
    } catch (apiError: any) {
      return NextResponse.json({
        status: 'error',
        message: 'Failed to connect to OpenAI API',
        error: apiError.message,
        type: apiError.type || apiError.code,
        statusCode: apiError.status,
      }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: 'Error setting up OpenAI client',
      error: error.message,
    }, { status: 500 });
  }
}
