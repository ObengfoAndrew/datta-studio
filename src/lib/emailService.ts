/**
 * Email notification service using Resend
 */

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send email notification using Resend API
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  try {
    // Check if Resend API key is available
    const resendKey = process.env.RESEND_API_KEY;
    
    if (!resendKey) {
      console.warn('⚠️ RESEND_API_KEY not configured. Emails will not be sent.');
      console.log('📧 Email would be sent to:', payload.to);
      console.log('📧 Subject:', payload.subject);
      return true; // Don't fail the request if email isn't configured
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@datta.ai',
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Resend error:', response.status, error);
      return false;
    }

    const data = await response.json();
    console.log('✅ Email sent successfully to:', payload.to, 'ID:', data.id);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send dataset access request notification to owner
 */
export function getOwnerNotificationEmail(
  ownerEmail: string,
  requesterName: string,
  requesterCompany: string,
  datasetTitle: string,
  purpose: string,
  requestId: string,
  datasetId?: string
): EmailPayload {
  const dashboardUrl = process.env.DATTA_DASHBOARD_URL!;
  const reviewUrl = datasetId 
    ? `${dashboardUrl}/dashboard?tab=accessRequests&requestId=${requestId}&datasetId=${datasetId}`
    : `${dashboardUrl}/dashboard?tab=accessRequests&requestId=${requestId}`;
  return {
    to: ownerEmail,
    subject: `📊 New Dataset Access Request: ${datasetTitle}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e293b;">🔔 New Dataset Access Request</h2>
        
        <p style="color: #64748b; font-size: 14px;">You have received a new access request for your dataset:</p>
        
        <div style="background: #f8fafc; border-left: 4px solid #7c3aed; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-weight: 600; color: #1e293b;"><strong>Dataset:</strong> ${datasetTitle}</p>
          <p style="margin: 8px 0 0 0; color: #64748b;"><strong>Requester:</strong> ${requesterName} (${requesterCompany})</p>
          <p style="margin: 8px 0 0 0; color: #64748b;"><strong>Purpose:</strong> ${purpose}</p>
          <p style="margin: 8px 0 0 0; color: #64748b;"><strong>Request ID:</strong> ${requestId}</p>
        </div>

        <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
          Log in to your Datta Dashboard to review and approve/reject this request. Once approved, the requester will automatically receive an API key.
        </p>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${reviewUrl}"
             style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
            Review Request in Dashboard
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          This is an automated notification from Datta AI. Do not reply to this email.
        </p>
      </div>
    `,
  };
}

/**
 * Send API key to requester after approval
 */
export function getApiKeyEmail(
  requesterEmail: string,
  requesterName: string,
  datasetTitle: string,
  apiKey: string
): EmailPayload {
  return {
    to: requesterEmail,
    subject: `✅ API Key Approved: ${datasetTitle}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">✅ Your Access Request Was Approved!</h2>
        
        <p style="color: #64748b; font-size: 14px;">Hi ${requesterName},</p>
        
        <p style="color: #64748b; font-size: 14px;">Your access request for <strong>${datasetTitle}</strong> has been approved. Here's your API key:</p>
        
        <div style="background: #f8fafc; border: 2px dashed #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0 0 12px 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your API Key</p>
          <code style="display: block; background: #1e293b; color: #10b981; padding: 12px; border-radius: 4px; font-family: 'Monaco', 'Courier', monospace; word-break: break-all; font-size: 13px;">
            ${apiKey}
          </code>
        </div>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e; font-size: 13px;">
            <strong>🔐 Keep this key secure!</strong> Don't share it with anyone. You can regenerate it anytime in your account settings.
          </p>
        </div>

        <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
          Use this API key to access the dataset:
        </p>
        <code style="display: block; background: #f8fafc; padding: 12px; border-radius: 4px; border-left: 3px solid #7c3aed; margin: 12px 0; font-size: 12px;">
curl -H "X-API-Key: ${apiKey}" https://api.datta.ai/v1/datasets/${datasetTitle}
        </code>

        <p style="color: #64748b; font-size: 13px; margin-top: 20px;">
          For documentation and examples, visit our <a href="https://docs.datta.ai" style="color: #7c3aed; text-decoration: none;">API documentation</a>.
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          This is an automated notification from Datta AI. Do not reply to this email.
        </p>
      </div>
    `,
  };
}

/**
 * Send request received confirmation to requester
 */
export function getRequestReceivedEmail(
  requesterEmail: string,
  requesterName: string,
  datasetTitle: string
): EmailPayload {
  return {
    to: requesterEmail,
    subject: `📋 Request Received: ${datasetTitle}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e293b;">✅ Request Received</h2>
        
        <p style="color: #64748b; font-size: 14px;">Hi ${requesterName},</p>
        
        <p style="color: #64748b; font-size: 14px;">
          Your access request for <strong>${datasetTitle}</strong> has been received and is pending review.
        </p>
        
        <div style="background: #e0f2fe; border-left: 4px solid #0369a1; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #164e63; font-size: 14px;">
            <strong>⏱️ Expected response time:</strong> The dataset owner will review your request within 24 hours.
          </p>
        </div>

        <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
          We'll send you an email with your API key as soon as your request is approved. Keep an eye on your inbox!
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          This is an automated notification from Datta AI. Do not reply to this email.
        </p>
      </div>
    `,
  };
}

/**
 * Send rejection notification to requester
 */
export function getRejectionEmail(
  requesterEmail: string,
  requesterName: string,
  datasetTitle: string,
  rejectionReason?: string
): EmailPayload {
  return {
    to: requesterEmail,
    subject: `❌ Access Request Declined: ${datasetTitle}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">❌ Access Request Declined</h2>
        
        <p style="color: #64748b; font-size: 14px;">Hi ${requesterName},</p>
        
        <p style="color: #64748b; font-size: 14px;">
          Unfortunately, your access request for <strong>${datasetTitle}</strong> has been declined by the dataset owner.
        </p>

        ${rejectionReason ? `
        <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #7f1d1d; font-size: 14px;">
            <strong>Reason:</strong> ${rejectionReason}
          </p>
        </div>
        ` : ''}

        <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
          You can try requesting access again later, or reach out to the dataset owner if you believe this was done in error.
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          This is an automated notification from Datta AI. Do not reply to this email.
        </p>
      </div>
    `,
  };
}
