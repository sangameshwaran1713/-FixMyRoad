import axios from 'axios';
import { sendMockNotification } from './mockProvider.js';

/**
 * Validates a target webhook URL against SSRF threats (localhost, internal IP ranges, private subnets, file URIs).
 */
export const validateWebhookUrlSSRF = (targetUrl) => {
  if (!targetUrl || typeof targetUrl !== 'string') {
    throw new Error('Invalid webhook URL');
  }

  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch (e) {
    throw new Error('Malformed webhook URL');
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`Forbidden webhook protocol: ${parsed.protocol}`);
  }

  const hostname = parsed.hostname.toLowerCase();

  // Reject local & private IP ranges
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.startsWith('10.') ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('169.254.')
  ) {
    throw new Error(`SSRF Security Violation: Webhook URL ${hostname} resolves to a private or internal network interface.`);
  }

  // 172.16.0.0 - 172.31.255.255
  if (hostname.startsWith('172.')) {
    const parts = hostname.split('.');
    if (parts.length === 4) {
      const secondOctet = parseInt(parts[1], 10);
      if (secondOctet >= 16 && secondOctet <= 31) {
        throw new Error(`SSRF Security Violation: Webhook URL ${hostname} resolves to a private IP subnet.`);
      }
    }
  }
};

/**
 * Sends a structured HTTP POST webhook notification to a municipal API endpoint.
 */
export const sendApiNotification = async ({ recipient, payload }) => {
  const deliveryMode = (process.env.NOTIFICATION_DELIVERY_MODE || 'mock').toLowerCase();

  if (deliveryMode === 'mock') {
    return await sendMockNotification({ channel: 'API', recipient, payload });
  }

  if (deliveryMode === 'api' || deliveryMode === 'real') {
    // Validate target URL against SSRF
    validateWebhookUrlSSRF(recipient);

    const response = await axios.post(recipient, payload, {
      timeout: parseInt(process.env.NOTIFICATION_PROVIDER_TIMEOUT_MS || '10000', 10),
      maxRedirects: 0, // Block automatic redirects to prevent SSRF redirect bypasses
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FixMyRoad-Webhook-Dispatcher/1.0',
      },
    });

    return {
      success: true,
      provider: 'WEBHOOK_API',
      providerMessageId: `API-${response.status}-${Date.now()}`,
      deliveredAt: new Date(),
    };
  }

  throw new Error(`Unsupported NOTIFICATION_DELIVERY_MODE: ${deliveryMode}`);
};
