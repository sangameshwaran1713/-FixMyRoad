import NotificationEvent from '../../models/NotificationEvent.js';
import NotificationDelivery from '../../models/NotificationDelivery.js';
import User from '../../models/User.js';

/**
 * Creates outbox NotificationEvent and NotificationDelivery records upon complaint creation.
 */
export const createMunicipalityOutboxEvents = async ({ complaint, municipality, session = null }) => {
  const eventId = `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const eventData = {
    eventId,
    eventType: 'NEW_COMPLAINT',
    complaintId: complaint._id,
    municipalityId: municipality._id,
    status: 'PENDING',
  };

  let eventDoc;
  if (session) {
    const [created] = await NotificationEvent.create([eventData], { session });
    eventDoc = created;
  } else {
    eventDoc = await NotificationEvent.create(eventData);
  }

  // Find active MUNICIPALITY_ADMIN users assigned to this municipality
  const admins = await User.find({
    role: 'MUNICIPALITY_ADMIN',
    municipalityId: municipality._id,
    isActive: true,
  });

  const method = (municipality.notificationMethod || 'DASHBOARD').toUpperCase();
  const deliveries = [];

  const payload = {
    complaintId: complaint.complaintId,
    complaintMongoId: complaint._id,
    issueType: complaint.issueType,
    severity: complaint.severity,
    aiConfidence: complaint.aiConfidence,
    address: complaint.address,
    latitude: complaint.location?.coordinates?.[1],
    longitude: complaint.location?.coordinates?.[0],
    municipalityName: municipality.name,
    municipalityCode: municipality.code,
    description: complaint.description,
  };

  // 1. DASHBOARD Deliveries
  if (method === 'DASHBOARD' || method === 'MULTIPLE') {
    if (admins.length > 0) {
      for (const admin of admins) {
        deliveries.push({
          notificationEventId: eventDoc._id,
          channel: 'DASHBOARD',
          recipient: admin._id.toString(),
          status: 'PENDING',
          payload,
        });
      }
    }
  }

  // 2. EMAIL Deliveries
  if (method === 'EMAIL' || method === 'MULTIPLE') {
    const emailRecipients = new Set();
    admins.forEach((a) => a.email && emailRecipients.add(a.email));
    if (municipality.contactEmail) emailRecipients.add(municipality.contactEmail);

    for (const email of emailRecipients) {
      deliveries.push({
        notificationEventId: eventDoc._id,
        channel: 'EMAIL',
        recipient: email,
        status: 'PENDING',
        payload,
      });
    }
  }

  // 3. SMS Deliveries
  if (method === 'SMS' || method === 'MULTIPLE') {
    const phoneRecipients = new Set();
    admins.forEach((a) => a.phone && phoneRecipients.add(a.phone));
    if (municipality.contactPhone) phoneRecipients.add(municipality.contactPhone);

    for (const phone of phoneRecipients) {
      deliveries.push({
        notificationEventId: eventDoc._id,
        channel: 'SMS',
        recipient: phone,
        status: 'PENDING',
        payload,
      });
    }
  }

  // 4. API Deliveries
  if ((method === 'API' || method === 'MULTIPLE') && municipality.apiEndpoint) {
    deliveries.push({
      notificationEventId: eventDoc._id,
      channel: 'API',
      recipient: municipality.apiEndpoint,
      status: 'PENDING',
      payload,
    });
  }

  if (deliveries.length > 0) {
    if (session) {
      await NotificationDelivery.create(deliveries, { session });
    } else {
      await NotificationDelivery.create(deliveries);
    }
  }

  return { event: eventDoc, deliveryCount: deliveries.length };
};

/**
 * Updates aggregate status of a NotificationEvent based on individual channel delivery states.
 */
export const updateAggregateEventStatus = async (notificationEventId) => {
  const deliveries = await NotificationDelivery.find({ notificationEventId });

  if (deliveries.length === 0) return;

  const statuses = deliveries.map((d) => d.status);

  let aggregateStatus = 'PENDING';

  if (statuses.every((s) => s === 'SENT')) {
    aggregateStatus = 'SENT';
  } else if (statuses.some((s) => s === 'RETRYING' || s === 'PENDING' || s === 'PROCESSING')) {
    aggregateStatus = 'RETRYING';
  } else if (statuses.every((s) => s === 'FAILED')) {
    aggregateStatus = 'FAILED';
  } else if (statuses.some((s) => s === 'FAILED')) {
    aggregateStatus = 'PARTIAL_FAILED';
  }

  await NotificationEvent.findByIdAndUpdate(notificationEventId, { status: aggregateStatus });
};
