/**
 * Mock Notification Provider for safe development and demonstration without external credentials.
 */
export const sendMockNotification = async ({ channel, recipient, payload }) => {
  console.log(`[MOCK NOTIFICATION PROVIDER] Channel: ${channel} | Recipient: ${recipient}`);
  console.log(`  └─ Details: Complaint ${payload.complaintId || 'N/A'} - ${payload.issueType || 'ROAD DEFECT'} (${payload.severity || 'MEDIUM'})`);

  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 100));

  return {
    success: true,
    provider: 'MOCK',
    providerMessageId: `MOCK-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    deliveredAt: new Date(),
  };
};
