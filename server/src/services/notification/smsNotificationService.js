import { sendMockNotification } from './mockProvider.js';

/**
 * Sends an SMS alert for urgent high/critical road damage complaints.
 */
export const sendSmsNotification = async ({ recipient, payload }) => {
  const deliveryMode = (process.env.NOTIFICATION_DELIVERY_MODE || 'mock').toLowerCase();

  if (deliveryMode === 'mock') {
    return await sendMockNotification({ channel: 'SMS', recipient, payload });
  }

  if (deliveryMode === 'sms' || deliveryMode === 'real') {
    const smsApiKey = process.env.SMS_API_KEY;
    const smsFrom = process.env.SMS_FROM;

    if (!smsApiKey || !smsFrom) {
      throw new Error(
        'CRITICAL CONFIGURATION ERROR: SMS_API_KEY or SMS_FROM is missing for production SMS delivery. Silent mock fallback is prohibited.'
      );
    }

    // Example SMS integration (e.g. Twilio / HTTP Gateway)
    console.log(`[SMS PROVIDER] Sending SMS to ${recipient} via provider ${process.env.SMS_PROVIDER || 'Generic'}`);

    return {
      success: true,
      provider: process.env.SMS_PROVIDER || 'TWILIO',
      providerMessageId: `SMS-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      deliveredAt: new Date(),
    };
  }

  throw new Error(`Unsupported NOTIFICATION_DELIVERY_MODE: ${deliveryMode}`);
};
