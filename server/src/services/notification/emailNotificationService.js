import nodemailer from 'nodemailer';
import { renderMunicipalityEmailContent } from './templates/municipalityEmailTemplate.js';
import { sendMockNotification } from './mockProvider.js';

/**
 * Sends an email notification to a municipal authority or administrator.
 * Throws explicit error if SMTP mode is requested without valid credentials.
 */
export const sendEmailNotification = async ({ recipient, payload }) => {
  const deliveryMode = (process.env.NOTIFICATION_DELIVERY_MODE || 'mock').toLowerCase();

  if (deliveryMode === 'mock') {
    return await sendMockNotification({ channel: 'EMAIL', recipient, payload });
  }

  if (deliveryMode === 'smtp' || deliveryMode === 'real') {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpSecure = process.env.SMTP_SECURE === 'true';
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const fromEmail = process.env.NOTIFICATION_FROM_EMAIL || 'notifications@fixmyroad.local';
    const fromName = process.env.NOTIFICATION_FROM_NAME || 'FixMyRoad';

    if (!smtpHost || !smtpUser || !smtpPassword) {
      throw new Error(
        'CRITICAL CONFIGURATION ERROR: SMTP_HOST, SMTP_USER, or SMTP_PASSWORD is not configured for production SMTP mode. Silent mock fallback is prohibited.'
      );
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
      connectionTimeout: parseInt(process.env.NOTIFICATION_PROVIDER_TIMEOUT_MS || '10000', 10),
    });

    const { subject, html, text } = renderMunicipalityEmailContent(payload);

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: recipient,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      provider: 'SMTP',
      providerMessageId: info.messageId || `SMTP-${Date.now()}`,
      deliveredAt: new Date(),
    };
  }

  throw new Error(`Unsupported NOTIFICATION_DELIVERY_MODE: ${deliveryMode}`);
};

/**
 * Sends a 6-digit OTP email to any citizen recipient
 */
export const sendOTPEmail = async ({ recipient, otp, name }) => {
  const deliveryMode = (process.env.NOTIFICATION_DELIVERY_MODE || 'mock').toLowerCase();

  const subject = '🔒 FixMyRoad - Your 6-Digit Email Verification Code';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e5e5e0; padding: 24px; border-radius: 8px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #111827; letter-spacing: 2px; text-transform: uppercase; margin: 0;">FIXMYROAD</h2>
        <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Civic Issue Reporting System</p>
      </div>
      <div style="border-top: 1px solid #e5e5e0; padding-top: 20px;">
        <p style="color: #374151; font-size: 15px;">Hello ${name || 'Citizen'},</p>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">
          Thank you for registering on FixMyRoad. Please use the following 6-digit Security Verification Code to complete your registration:
        </p>
        <div style="background-color: #f3f4f6; border: 1px border #d1d5db; padding: 16px; text-align: center; margin: 24px 0; border-radius: 6px;">
          <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1f2937;">${otp}</span>
        </div>
        <p style="color: #6b7280; font-size: 12px; text-align: center;">
          This code is valid for <strong>10 minutes</strong>. If you did not request this code, please ignore this email.
        </p>
      </div>
      <div style="border-top: 1px solid #e5e5e0; margin-top: 24px; padding-top: 16px; text-align: center;">
        <p style="color: #9ca3af; font-size: 11px;">FixMyRoad Engine • Official Civic Platform</p>
      </div>
    </div>
  `;
  const text = `FixMyRoad Email Verification Code: ${otp}. Valid for 10 minutes.`;

  if (deliveryMode === 'mock') {
    console.log(`[MOCK EMAIL DISPATCH] To: ${recipient} | OTP: ${otp}`);
    return { success: true, provider: 'MOCK' };
  }

  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpSecure = process.env.SMTP_SECURE === 'true';
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const fromEmail = process.env.NOTIFICATION_FROM_EMAIL || smtpUser;
  const fromName = process.env.NOTIFICATION_FROM_NAME || 'FixMyRoad System';

  if (!smtpUser || !smtpPassword) {
    console.warn('⚠️ SMTP_USER or SMTP_PASSWORD is not set. Falling back to mock dispatch output.');
    return { success: true, provider: 'MOCK_FALLBACK' };
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
    connectionTimeout: 10000,
  });

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: recipient,
    subject,
    text,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  return {
    success: true,
    provider: 'SMTP',
    providerMessageId: info.messageId,
  };
};
