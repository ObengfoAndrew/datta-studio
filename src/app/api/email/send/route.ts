import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/emailService';

/**
 * POST /api/email/send
 * Send an email notification
 * Used internally by the dashboard to send approval/rejection notifications
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, html } = body;

    // Validate required fields
    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      );
    }

    console.log(`📧 Sending email to: ${to}`);
    console.log(`📧 Subject: ${subject}`);

    // Send the email
    const emailSent = await sendEmail({ to, subject, html });

    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        to,
        subject
      }, { status: 200 });
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to send email',
          to,
          subject
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to send email',
        success: false
      },
      { status: 500 }
    );
  }
}
