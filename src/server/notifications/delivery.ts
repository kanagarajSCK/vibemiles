/**
 * VibeMiles — Notification & External Delivery Service
 * 
 * Provider-agnostic communication interface supporting in-app event dispatching,
 * optional external email/SMS channels, and transparent local test/outbox mode.
 * 
 * Security & Reliability:
 * - Credentials must reside solely in server-side environment variables.
 * - In local/test mode, delivery is logged without claiming false external dispatch.
 * - Sensitive KYC, OTPs, or payment secrets are never transmitted.
 */

export interface ExternalNotificationMessage {
  recipientEmail?: string;
  recipientPhone?: string;
  recipientName?: string;
  type: string;
  subject: string;
  text: string;
  html?: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

export type DeliveryStatus = 'EXTERNAL_SENT' | 'TEST_MODE_RECORDED' | 'FAILED' | 'SKIPPED';

export interface DeliveryResult {
  success: boolean;
  status: DeliveryStatus;
  provider: string;
  recipient: string;
  to?: string;
  timestamp: string;
  messageId?: string;
  details?: string;
  metadata?: Record<string, unknown>;
}

export class NotificationDeliveryService {
  private static instance: NotificationDeliveryService;
  private testOutbox: DeliveryResult[] = [];

  private constructor() {}

  public static getInstance(): NotificationDeliveryService {
    if (!NotificationDeliveryService.instance) {
      NotificationDeliveryService.instance = new NotificationDeliveryService();
    }
    return NotificationDeliveryService.instance;
  }

  /**
   * Helper to dispatch email notifications.
   */
  public async sendEmailNotification(params: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    metadata?: Record<string, unknown>;
  }): Promise<DeliveryResult> {
    return this.deliver({
      recipientEmail: params.to,
      type: 'EMAIL',
      subject: params.subject,
      text: params.text || params.subject,
      html: params.html,
      metadata: params.metadata,
    });
  }

  /**
   * Dispatches an external notification via configured provider or test mode.
   */
  public async deliver(message: ExternalNotificationMessage): Promise<DeliveryResult> {
    const recipient = message.recipientEmail || message.recipientPhone || 'unknown';
    const timestamp = new Date().toISOString();

    // Sanitize metadata to never leak credentials, passwords, or tokens
    const sanitizedMetadata: Record<string, unknown> = {};
    if (message.metadata) {
      for (const [k, v] of Object.entries(message.metadata)) {
        if (/password|hash|pan|secret|token|otp|gstin|cvv|card/i.test(k)) {
          sanitizedMetadata[k] = '[REDACTED]';
        } else {
          sanitizedMetadata[k] = v;
        }
      }
    }

    const providerType = (process.env.EMAIL_PROVIDER || 'test').toLowerCase();
    const apiKey = process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY;

    // Check if real provider is configured
    if (providerType === 'resend' && apiKey) {
      return this.sendViaResend(message, apiKey, recipient, timestamp);
    }

    if (providerType === 'sendgrid' && apiKey) {
      return this.sendViaSendGrid(message, apiKey, recipient, timestamp);
    }

    // Default: Local/Test Mode Outbox
    // Explicitly records in outbox without falsely claiming external delivery.
    const result: DeliveryResult = {
      success: true,
      status: 'TEST_MODE_RECORDED',
      provider: 'local_test_outbox',
      recipient,
      to: recipient,
      timestamp,
      messageId: `test-msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      details: `Message stored in test mode. External delivery is not active. Subject: "${message.subject}".`,
      metadata: sanitizedMetadata,
    };

    this.testOutbox.push(result);
    // Keep max 100 items in test outbox
    if (this.testOutbox.length > 100) {
      this.testOutbox.shift();
    }

    return result;
  }

  private async sendViaResend(
    message: ExternalNotificationMessage,
    apiKey: string,
    recipient: string,
    timestamp: string
  ): Promise<DeliveryResult> {
    try {
      const fromEmail = process.env.EMAIL_FROM || 'notifications@vibemiles.com';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [recipient],
          subject: message.subject,
          text: message.text,
          html: message.html || `<p>${message.text}</p>`,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return {
          success: false,
          status: 'FAILED',
          provider: 'resend',
          recipient,
          timestamp,
          details: `Resend HTTP error ${res.status}: ${JSON.stringify(errorData)}`,
        };
      }

      const data = await res.json();
      return {
        success: true,
        status: 'EXTERNAL_SENT',
        provider: 'resend',
        recipient,
        timestamp,
        messageId: data.id,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        status: 'FAILED',
        provider: 'resend',
        recipient,
        timestamp,
        details: `Network error delivering via Resend: ${errorMsg}`,
      };
    }
  }

  private async sendViaSendGrid(
    message: ExternalNotificationMessage,
    apiKey: string,
    recipient: string,
    timestamp: string
  ): Promise<DeliveryResult> {
    try {
      const fromEmail = process.env.EMAIL_FROM || 'notifications@vibemiles.com';
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: recipient }] }],
          from: { email: fromEmail },
          subject: message.subject,
          content: [
            { type: 'text/plain', value: message.text },
            ...(message.html ? [{ type: 'text/html', value: message.html }] : []),
          ],
        }),
      });

      if (!res.ok) {
        return {
          success: false,
          status: 'FAILED',
          provider: 'sendgrid',
          recipient,
          timestamp,
          details: `SendGrid HTTP error ${res.status}`,
        };
      }

      return {
        success: true,
        status: 'EXTERNAL_SENT',
        provider: 'sendgrid',
        recipient,
        timestamp,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        status: 'FAILED',
        provider: 'sendgrid',
        recipient,
        timestamp,
        details: `Network error delivering via SendGrid: ${errorMsg}`,
      };
    }
  }

  /**
   * Retrieves test outbox entries for automated verification and inspection.
   */
  public getTestOutbox(): DeliveryResult[] {
    return [...this.testOutbox];
  }

  /**
   * Clears test outbox.
   */
  public clearTestOutbox(): void {
    this.testOutbox = [];
  }
}

export const deliveryService = NotificationDeliveryService.getInstance();
