import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Testing network connectivity to github.com...');
    
    const response = await fetch('https://api.github.com', {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Datta-Studio',
      },
    });

    console.log('GitHub API response status:', response.status);

    return NextResponse.json({
      success: true,
      githubApiStatus: response.status,
      message: 'Network to github.com is working',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Network test failed:', errorMessage);

    return NextResponse.json({
      success: false,
      error: errorMessage,
      message: 'Cannot reach github.com - check firewall/proxy settings',
    }, { status: 500 });
  }
}
