import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, getApiKeyEmail } from '@/lib/emailService';

/**
 * POST /api/email/send-api-key
 * Send API key email to requester after approval
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      requesterEmail,
      requesterName,
      datasetTitle,
      apiKey
    } = body;

    console.log('📧 Sending API key email to:', requesterEmail);

    // Validate required fields
    if (!requesterEmail || !requesterName || !datasetTitle || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required fields: requesterEmail, requesterName, datasetTitle, apiKey' },
        { status: 400 }
      );
    }

    // Get email payload
    const emailPayload = getApiKeyEmail(
      requesterEmail,
      requesterName,
      datasetTitle,
      apiKey
    );

    // Send email
    const emailSent = await sendEmail(emailPayload);

    if (emailSent) {
      console.log('✅ API key email sent successfully to:', requesterEmail);
      return NextResponse.json({
        success: true,
        message: 'API key email sent successfully',
        email: requesterEmail
      }, { status: 200 });
    } else {
      console.warn('⚠️ Failed to send API key email to:', requesterEmail);
      return NextResponse.json({
        success: false,
        message: 'Failed to send API key email',
        error: 'EMAIL_SEND_FAILED'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('POST /api/email/send-api-key error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to send email: ${errorMessage}` },
      { status: 500 }
    );
  }
}
