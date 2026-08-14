import Complaint from '../models/Complaint.js';
import Municipality from '../models/Municipality.js';
import { getMunicipalityStats, getMunicipalityComplaints } from '../services/municipalityComplaintService.js';

/**
 * @desc    Get global complaint statistics for Super Admin
 * @route   GET /api/admin/dashboard/stats
 * @access  Private (SUPER_ADMIN)
 */
export const getGlobalStats = async (req, res, next) => {
  try {
    const { municipalityId } = req.query;

    if (municipalityId) {
      const stats = await getMunicipalityStats(municipalityId);
      return res.status(200).json({
        success: true,
        data: {
          stats,
        },
      });
    }

    const totalMunicipalities = await Municipality.countDocuments({ active: true });
    const stats = await getMunicipalityStats(null); // All municipalities

    res.status(200).json({
      success: true,
      data: {
        totalMunicipalities,
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get global multi-tenant complaints for Super Admin
 * @route   GET /api/admin/complaints
 * @access  Private (SUPER_ADMIN)
 */
export const getGlobalComplaints = async (req, res, next) => {
  try {
    const { municipalityId, page, limit, status, severity, issueType, search, sort, from, to } = req.query;

    const result = await getMunicipalityComplaints({
      municipalityId: municipalityId || null,
      page,
      limit,
      status,
      severity,
      issueType,
      search,
      sort,
      from,
      to,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
