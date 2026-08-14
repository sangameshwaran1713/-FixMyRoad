import Complaint from '../models/Complaint.js';
import ReopenRequest from '../models/ReopenRequest.js';
import ComplaintFeedback from '../models/ComplaintFeedback.js';

/**
 * Calculates analytics & reporting metrics strictly scoped to a municipalityId (or global if null).
 */
export const getMunicipalityAnalytics = async (municipalityId = null, dateRange = {}) => {
  const matchQuery = {};
  if (municipalityId) {
    matchQuery.municipalityId = municipalityId;
  }

  if (dateRange.from && dateRange.to) {
    matchQuery.createdAt = {
      $gte: dateRange.from,
      $lte: dateRange.to,
    };
  }

  const [aggregationResult] = await Complaint.aggregate([
    { $match: matchQuery },
    {
      $facet: {
        // 1. Defect Distribution by issueType
        defectDistribution: [
          { $group: { _id: '$issueType', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],

        // 2. Severity Breakdown
        severityDistribution: [
          { $group: { _id: '$severity', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],

        // 3. Status Breakdown for all 8 categories
        statusDistribution: [
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ],

        // 4. Monthly Complaint Trends (YYYY-MM)
        monthlyTrends: [
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } },
        ],

        // 5. Monthly Issue Type Trends
        monthlyIssueTrends: [
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                issueType: '$issueType',
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } },
        ],

        // 6. Resolution Turnaround Velocity (Durations in Hours)
        resolutionDurations: [
          {
            $match: {
              status: { $in: ['RESOLVED', 'CLOSED'] },
              resolvedAt: { $ne: null },
            },
          },
          {
            $project: {
              issueType: '$issueType',
              hours: {
                $divide: [
                  { $subtract: ['$resolvedAt', '$createdAt'] },
                  1000 * 60 * 60,
                ],
              },
            },
          },
          { $match: { hours: { $gte: 0 } } },
        ],

        // 7. Resolution Velocity per Issue Type
        resolutionByIssueType: [
          {
            $match: {
              status: { $in: ['RESOLVED', 'CLOSED'] },
              resolvedAt: { $ne: null },
            },
          },
          {
            $project: {
              issueType: '$issueType',
              hours: {
                $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 1000 * 60 * 60],
              },
            },
          },
          { $match: { hours: { $gte: 0 } } },
          {
            $group: {
              _id: '$issueType',
              avgHours: { $avg: '$hours' },
              count: { $sum: 1 },
            },
          },
        ],

        // 8. Citizen Satisfaction Metrics
        citizenSatisfaction: [
          {
            $group: {
              _id: null,
              avgRating: { $avg: '$citizenRating' },
              verifiedCount: { $sum: { $cond: ['$citizenVerified', 1, 0] } },
              totalRated: { $sum: { $cond: [{ $ne: ['$citizenRating', null] }, 1, 0] } },
              fiveStarCount: { $sum: { $cond: [{ $eq: ['$citizenRating', 5] }, 1, 0] } },
              fourStarCount: { $sum: { $cond: [{ $eq: ['$citizenRating', 4] }, 1, 0] } },
              threeStarCount: { $sum: { $cond: [{ $eq: ['$citizenRating', 3] }, 1, 0] } },
              twoStarCount: { $sum: { $cond: [{ $eq: ['$citizenRating', 2] }, 1, 0] } },
              oneStarCount: { $sum: { $cond: [{ $eq: ['$citizenRating', 1] }, 1, 0] } },
            },
          },
        ],

        // 9. Resolution Cycle Breakdown
        resolutionCycleMetrics: [
          {
            $group: {
              _id: null,
              cycle1Count: { $sum: { $cond: [{ $eq: ['$resolutionCycle', 1] }, 1, 0] } },
              cycle2Count: { $sum: { $cond: [{ $eq: ['$resolutionCycle', 2] }, 1, 0] } },
              cycle3PlusCount: { $sum: { $cond: [{ $gte: ['$resolutionCycle', 3] }, 1, 0] } },
              avgCycle: { $avg: '$resolutionCycle' },
            },
          },
        ],

        // 10. Overall Summary
        summary: [
          {
            $group: {
              _id: null,
              totalComplaints: { $sum: 1 },
              resolvedCount: { $sum: { $cond: [{ $in: ['$status', ['RESOLVED', 'CLOSED']] }, 1, 0] } },
              criticalCount: { $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] } },
              highCount: { $sum: { $cond: [{ $eq: ['$severity', 'HIGH'] }, 1, 0] } },
              criticalUnresolved: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ['$severity', 'CRITICAL'] },
                        { $in: ['$status', ['SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'ASSIGNED', 'IN_PROGRESS']] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ],
      },
    },
  ]);

  // Reopen Request Analysis
  const reopenQuery = municipalityId ? { municipalityId } : {};
  if (dateRange.from && dateRange.to) {
    reopenQuery.createdAt = { $gte: dateRange.from, $lte: dateRange.to };
  }

  const reopenStats = await ReopenRequest.aggregate([
    { $match: reopenQuery },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const reopenSummary = {
    pending: 0,
    accepted: 0,
    rejected: 0,
    total: 0,
  };
  reopenStats.forEach((r) => {
    const st = (r._id || '').toLowerCase();
    if (reopenSummary[st] !== undefined) {
      reopenSummary[st] = r.count;
    }
    reopenSummary.total += r.count;
  });

  const sum = aggregationResult.summary?.[0] || {
    totalComplaints: 0,
    resolvedCount: 0,
    criticalCount: 0,
    highCount: 0,
    criticalUnresolved: 0,
  };

  // Build complete statusDistribution map with 0 default for missing categories
  const allStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
  const statusMap = {};
  allStatuses.forEach((st) => (statusMap[st] = 0));
  (aggregationResult.statusDistribution || []).forEach((item) => {
    if (statusMap[item._id] !== undefined) {
      statusMap[item._id] = item.count;
    }
  });

  // Calculate severityPercentages
  const severityMap = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  const severityPercentages = {};
  (aggregationResult.severityDistribution || []).forEach((item) => {
    severityMap[item._id] = item.count;
  });
  Object.keys(severityMap).forEach((sev) => {
    const count = severityMap[sev];
    const percentage = sum.totalComplaints > 0 ? Math.round((count / sum.totalComplaints) * 10000) / 100 : 0;
    severityPercentages[sev] = { count, percentage };
  });

  // Calculate Average & Median Resolution Hours
  const durations = (aggregationResult.resolutionDurations || []).map((d) => d.hours).sort((a, b) => a - b);
  let avgHours = 0;
  let medianHours = 0;
  if (durations.length > 0) {
    const totalHours = durations.reduce((acc, h) => acc + h, 0);
    avgHours = Math.round((totalHours / durations.length) * 10) / 10;

    const mid = Math.floor(durations.length / 2);
    if (durations.length % 2 === 0) {
      medianHours = Math.round(((durations[mid - 1] + durations[mid]) / 2) * 10) / 10;
    } else {
      medianHours = Math.round(durations[mid] * 10) / 10;
    }
  }

  // Calculate Reopen Rate: (acceptedReopenRequests / resolvedComplaints) * 100
  const resolvedCount = sum.resolvedCount || 0;
  const reopenRate = resolvedCount > 0 ? Math.round((reopenSummary.accepted / resolvedCount) * 10000) / 100 : 0;

  // Calculate Resolution Rate: (resolvedCount / totalComplaints) * 100
  const resolutionRate = sum.totalComplaints > 0 ? Math.round((resolvedCount / sum.totalComplaints) * 10000) / 100 : 0;

  const sat = aggregationResult.citizenSatisfaction?.[0] || {
    avgRating: 0,
    verifiedCount: 0,
    totalRated: 0,
    fiveStarCount: 0,
    fourStarCount: 0,
    threeStarCount: 0,
    twoStarCount: 0,
    oneStarCount: 0,
  };

  const citizenVerificationRate = resolvedCount > 0 ? Math.round((sat.verifiedCount / resolvedCount) * 10000) / 100 : 0;

  const cycle = aggregationResult.resolutionCycleMetrics?.[0] || {
    cycle1Count: 0,
    cycle2Count: 0,
    cycle3PlusCount: 0,
    avgCycle: 1,
  };

  // Format monthlyTrends YYYY-MM
  const formattedMonthlyTrends = (aggregationResult.monthlyTrends || []).map((item) => {
    const mStr = String(item._id.month).padStart(2, '0');
    return {
      month: `${item._id.year}-${mStr}`,
      count: item.count,
    };
  });

  return {
    totalComplaints: sum.totalComplaints,
    resolutionRate,
    statusDistribution: statusMap,
    issueTypeDistribution: aggregationResult.defectDistribution || [],
    severityDistribution: severityPercentages,
    monthlyTrends: formattedMonthlyTrends,
    resolutionMetrics: {
      resolvedComplaints: resolvedCount,
      averageResolutionHours: avgHours,
      medianResolutionHours: medianHours,
      resolutionByIssueType: (aggregationResult.resolutionByIssueType || []).map((item) => ({
        issueType: item._id,
        averageHours: Math.round(item.avgHours * 10) / 10,
        count: item.count,
      })),
    },
    reopenMetrics: {
      totalReopenRequests: reopenSummary.total,
      pendingReopenRequests: reopenSummary.pending,
      acceptedReopenRequests: reopenSummary.accepted,
      rejectedReopenRequests: reopenSummary.rejected,
      reopenRate,
    },
    satisfactionMetrics: {
      averageRating: Math.round((sat.avgRating || 0) * 100) / 100,
      totalFeedback: sat.totalRated,
      ratingDistribution: {
        1: sat.oneStarCount || 0,
        2: sat.twoStarCount || 0,
        3: sat.threeStarCount || 0,
        4: sat.fourStarCount || 0,
        5: sat.fiveStarCount || 0,
      },
    },
    citizenVerificationMetrics: {
      citizenVerifiedCount: sat.verifiedCount,
      citizenUnverifiedResolvedCount: Math.max(0, resolvedCount - sat.verifiedCount),
      citizenVerificationRate,
    },
    resolutionCycleMetrics: {
      cycle1Complaints: cycle.cycle1Count || 0,
      cycle2Complaints: cycle.cycle2Count || 0,
      cycle3PlusComplaints: cycle.cycle3PlusCount || 0,
      averageResolutionCycle: Math.round((cycle.avgCycle || 1) * 10) / 10,
    },
    criticalMetrics: {
      criticalComplaints: sum.criticalCount,
      highSeverityComplaints: sum.highCount,
      criticalUnresolved: sum.criticalUnresolved,
    },
  };
};

/**
 * Super Admin Multi-Tenant Global Analytics with Municipality Comparison
 */
export const getGlobalAnalytics = async (dateRange = {}) => {
  const globalStats = await getMunicipalityAnalytics(null, dateRange);

  const matchQuery = {};
  if (dateRange.from && dateRange.to) {
    matchQuery.createdAt = { $gte: dateRange.from, $lte: dateRange.to };
  }

  // Municipality Comparison
  const municipalityComparison = await Complaint.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$municipalityId',
        totalComplaints: { $sum: 1 },
        resolvedCount: { $sum: { $cond: [{ $in: ['$status', ['RESOLVED', 'CLOSED']] }, 1, 0] } },
      },
    },
    {
      $lookup: {
        from: 'municipalities',
        localField: '_id',
        foreignField: '_id',
        as: 'municipality',
      },
    },
    { $unwind: '$municipality' },
    {
      $project: {
        municipalityCode: '$municipality.code',
        municipalityName: '$municipality.name',
        complaints: '$totalComplaints',
        resolved: '$resolvedCount',
        resolutionRate: {
          $cond: [
            { $gt: ['$totalComplaints', 0] },
            { $multiply: [{ $divide: ['$resolvedCount', '$totalComplaints'] }, 100] },
            0,
          ],
        },
      },
    },
    { $sort: { complaints: -1 } },
  ]);

  return {
    ...globalStats,
    municipalityComparison,
  };
};

/**
 * Escapes dangerous formula characters (=, +, -, @) to prevent CSV Formula Injection vulnerability
 */
const escapeCSVField = (val) => {
  if (val === null || val === undefined) return '""';
  let str = String(val).replace(/"/g, '""');
  // Prefix dangerous formula triggers with '
  if (/^[=+@-]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str}"`;
};

/**
 * Generates formatted CSV string for municipal complaint audit report with limit enforcement.
 */
export const generateCSVReport = async (municipalityId = null, dateRange = {}) => {
  const query = {};
  if (municipalityId) query.municipalityId = municipalityId;
  if (dateRange.from && dateRange.to) {
    query.createdAt = { $gte: dateRange.from, $lte: dateRange.to };
  }

  const maxExportRecords = parseInt(process.env.MAX_EXPORT_RECORDS || '10000', 10);
  const totalRecords = await Complaint.countDocuments(query);

  if (totalRecords > maxExportRecords) {
    const error = new Error(`Export size exceeds maximum record limit (${totalRecords} > ${maxExportRecords}). Please refine your date range.`);
    error.statusCode = 400;
    error.code = 'EXPORT_LIMIT_EXCEEDED';
    throw error;
  }

  const complaints = await Complaint.find(query)
    .sort({ createdAt: -1 })
    .populate('citizenId', 'name email')
    .populate('municipalityId', 'name code')
    .exec();

  const headers = [
    'Complaint ID',
    'Municipality',
    'Issue Type',
    'Severity',
    'Status',
    'Address',
    'Latitude',
    'Longitude',
    'Resolution Cycle',
    'Citizen Verified',
    'Citizen Rating',
    'Created At',
    'Resolved At',
  ];

  const rows = complaints.map((c) => [
    escapeCSVField(c.complaintId),
    escapeCSVField(c.municipalityId?.name || 'Local Authority'),
    escapeCSVField(c.issueType),
    escapeCSVField(c.severity),
    escapeCSVField(c.status),
    escapeCSVField(c.address || ''),
    c.location?.coordinates?.[1] || '',
    c.location?.coordinates?.[0] || '',
    c.resolutionCycle || 1,
    c.citizenVerified ? 'YES' : 'NO',
    c.citizenRating || 'N/A',
    escapeCSVField(c.createdAt.toISOString()),
    escapeCSVField(c.resolvedAt ? c.resolvedAt.toISOString() : 'N/A'),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
};

/**
 * Generates formatted JSON object for municipal complaint audit report with limit enforcement.
 */
export const generateJSONReport = async (municipalityId = null, dateRange = {}) => {
  const query = {};
  if (municipalityId) query.municipalityId = municipalityId;
  if (dateRange.from && dateRange.to) {
    query.createdAt = { $gte: dateRange.from, $lte: dateRange.to };
  }

  const maxExportRecords = parseInt(process.env.MAX_EXPORT_RECORDS || '10000', 10);
  const totalRecords = await Complaint.countDocuments(query);

  if (totalRecords > maxExportRecords) {
    const error = new Error(`Export size exceeds maximum record limit (${totalRecords} > ${maxExportRecords}). Please refine your date range.`);
    error.statusCode = 400;
    error.code = 'EXPORT_LIMIT_EXCEEDED';
    throw error;
  }

  const complaints = await Complaint.find(query)
    .sort({ createdAt: -1 })
    .populate('citizenId', 'name email')
    .populate('municipalityId', 'name code')
    .exec();

  return {
    reportType: 'FixMyRoad Civic Complaint Audit Report',
    generatedAt: new Date().toISOString(),
    recordCount: complaints.length,
    complaints: complaints.map((c) => ({
      complaintId: c.complaintId,
      municipality: c.municipalityId?.name || 'Local Authority',
      issueType: c.issueType,
      severity: c.severity,
      status: c.status,
      address: c.address || '',
      latitude: c.location?.coordinates?.[1] || null,
      longitude: c.location?.coordinates?.[0] || null,
      resolutionCycle: c.resolutionCycle || 1,
      citizenVerified: c.citizenVerified,
      citizenRating: c.citizenRating,
      createdAt: c.createdAt.toISOString(),
      resolvedAt: c.resolvedAt ? c.resolvedAt.toISOString() : null,
    })),
  };
};
