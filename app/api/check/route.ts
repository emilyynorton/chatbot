import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if OPENAI_API_KEY is defined
    const apiKeyExists = !!process.env.OPENAI_API_KEY;
    
    // Return status without exposing the actual key
    return NextResponse.json({
      status: apiKeyExists ? 'API key is set' : 'API key is missing',
      keyExists: apiKeyExists,
      envVars: Object.keys(process.env).filter(key => 
        key.includes('OPENAI') || key.includes('API') || key.includes('DATABASE')
      ).map(key => ({ key, exists: !!process.env[key] })),
    });
  } catch (error: any) {
    return NextResponse.json({
      error: 'Error checking API key',
      details: error.message,
    }, { status: 500 });
  }
}
