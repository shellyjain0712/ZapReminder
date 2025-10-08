import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const error = searchParams.get('error');
  const code = searchParams.get('code');

  console.error('NextAuth Error:', { error, code });

  // Redirect to login page with error message
  const loginUrl = new URL('/login', request.url);
  if (error) {
    loginUrl.searchParams.set('error', error);
  }
  if (code) {
    loginUrl.searchParams.set('code', code);
  }

  return NextResponse.redirect(loginUrl);
}

export async function POST(request: NextRequest) {
  // Handle POST requests the same way
  return GET(request);
}
