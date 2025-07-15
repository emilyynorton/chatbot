// Simple script to check environment variables
console.log('Checking environment variables...');
console.log('NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET);
console.log('NEXTAUTH_URL exists:', !!process.env.NEXTAUTH_URL);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET);
