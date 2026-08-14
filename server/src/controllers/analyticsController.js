import {
  getMunicipalityAnalytics,
  getGlobalAnalytics,
  generateCSVReport,
  generateJSONReport,
} from '../services/analyticsService.js';

/**
 * Validates and parses query parameters 'from' and 'to' into JavaScript Date objects.
 * Enforces ANALYTICS_MAX_RANGE_DAYS=366 limit and guards against operator injection ($gt, $ne, etc).
 */
const parseAndValidateDateRange = (query) => {
  let { from, to } = query;

  // Reject object inputs (e.g. from[$gt]=...) to prevent operator injection
  if (typeof from === 'object' || typeof to === 'object') {
    const error = new Error('Invalid query parameters. Operator injection is prohibited.');
    error.statusCode = 400;
    error.code = 'INVALID_QUERY_PARAMETER';
    throw error;
  }

  const now = new Date();
  const maxRangeDays = parseInt(process.env.ANALYTICS_MAX_RANGE_DAYS || '366', 10);

  let fromDate;
  let toDate;

  if (!from && !to) {
    // Default range: Start of current year to current date
    fromDate = new Date(now.getFullYear(), 0, 1);
    toDate = now;
  } else {
    if (from) {
      fromDate = new Date(from);
      if (isNaN(fromDate.getTime())) {
        const error = new Error('Invalid "from" date format. Please provide a valid ISO date string.');
        error.statusCode = 400;
        error.code = 'INVALID_DATE';
        throw error;
      }
    } else {
      fromDate = new Date(now.getFullYear(), 0, 1);
    }

    if (to) {
      toDate = new Date(to);
      if (isNaN(toDate.getTime())) {
        const error = new Error('Invalid "to" date format. Please provide a valid ISO date string.');
        error.statusCode = 400;
        error.code = 'INVALID_DATE';
        throw error;
      }
    } else {
      toDate = now;
    }
  }

  if (fromDate > toDate) {
    const error = new Error('"from" date must be earlier than or equal to "to" date.');
    error.statusCode = 400;
    error.code = 'INVALID_DATE_RANGE';
    throw error;
  }

  // Calculate range in days
  const diffDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > maxRangeDays) {
    const error = new Error(`The requested analytics date range is too large (${diffDays} days). Maximum allowed range is ${maxRangeDays} days.`);
    error.statusCode = 400;
    error.code = 'DATE_RANGE_TOO_LARGE';
    throw error;
  }

  return { from: fromDate, to: toDate };
};

/**
 * @desc    Get analytics metrics strictly for authenticated municipality jurisdiction
 * @route   GET /api/municipality/analytics
 * @access  Private (MUNICIPALITY_ADMIN, MUNICIPALITY_OFFICER, SUPER_ADMIN)
 */
export const getMunicipalityAnalyticsHandler = async (req, res, next) => {
  try {
    const dateRange = parseAndValidateDateRange(req.query);

    // STRICT TENANT ISOLATION: Super Admin can query via query param, but Municipality Admin/Officer is forced to req.user.municipalityId
    let municipalityId;
    if (req.user.role === 'SUPER_ADMIN') {
      municipalityId = req.query.municipalityId || null;
    } else {
      municipalityId = req.user.municipalityId;
      if (!municipalityId) {
        const error = new Error('User account is not associated with an authorized municipality jurisdiction');
        error.statusCode = 403;
        error.code = 'MUNICIPALITY_NOT_ASSIGNED';
        throw error;
      }
    }

    const analytics = await getMunicipalityAnalytics(municipalityId, dateRange);

    res.status(200).json({
      success: true,
      data: {
        dateRange: {
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString(),
        },
        analytics,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get global analytics metrics across all municipalities for Super Admin
 * @route   GET /api/admin/analytics
 * @access  Private (SUPER_ADMIN)
 */
export const getGlobalAnalyticsHandler = async (req, res, next) => {
  try {
    const dateRange = parseAndValidateDateRange(req.query);
    const analytics = await getGlobalAnalytics(dateRange);

    res.status(200).json({
      success: true,
      data: {
        dateRange: {
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString(),
        },
        analytics,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export municipal complaint report (CSV or JSON format)
 * @route   GET /api/municipality/reports/export
 * @access  Private (MUNICIPALITY_ADMIN, MUNICIPALITY_OFFICER, SUPER_ADMIN)
 */
export const exportMunicipalityReportHandler = async (req, res, next) => {
  try {
    const dateRange = parseAndValidateDateRange(req.query);
    const format = (req.query.format || 'csv').toLowerCase();

    let municipalityId;
    if (req.user.role === 'SUPER_ADMIN') {
      municipalityId = req.query.municipalityId || null;
    } else {
      municipalityId = req.user.municipalityId;
      if (!municipalityId) {
        const error = new Error('User account is not associated with an authorized municipality jurisdiction');
        error.statusCode = 403;
        error.code = 'MUNICIPALITY_NOT_ASSIGNED';
        throw error;
      }
    }

    if (format === 'json') {
      const reportObj = await generateJSONReport(municipalityId, dateRange);
      const filename = `FixMyRoad_Report_${new Date().toISOString().split('T')[0]}.json`;

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).json(reportObj);
    }

    const csvContent = await generateCSVReport(municipalityId, dateRange);
    const filename = `FixMyRoad_Report_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export global multi-tenant report (CSV or JSON format) for Super Admin
 * @route   GET /api/admin/reports/export
 * @access  Private (SUPER_ADMIN)
 */
export const exportGlobalReportHandler = async (req, res, next) => {
  try {
    const dateRange = parseAndValidateDateRange(req.query);
    const format = (req.query.format || 'csv').toLowerCase();

    if (format === 'json') {
      const reportObj = await generateJSONReport(null, dateRange);
      const filename = `FixMyRoad_Global_Report_${new Date().toISOString().split('T')[0]}.json`;

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).json(reportObj);
    }

    const csvContent = await generateCSVReport(null, dateRange);
    const filename = `FixMyRoad_Global_Report_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
