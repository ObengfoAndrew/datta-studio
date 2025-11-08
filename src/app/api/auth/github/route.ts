import { NextResponse } from 'next/server';

// Redirect legacy route to the proper start route
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/api/auth/github/start`);
}