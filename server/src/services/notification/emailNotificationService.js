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
