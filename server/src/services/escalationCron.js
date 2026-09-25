import Complaint from '../models/Complaint.js';
import HierarchyLevel from '../models/HierarchyLevel.js';
import AuditLog from '../models/AuditLog.js';
import ComplaintHistory from '../models/ComplaintHistory.js';
import Notification from '../models/Notification.js';

export const startEscalationCron = () => {
  console.log('⏱️ Escalation Cron Job initialized. Checking every 15 seconds for SLA breaches...');
  
  setInterval(async () => {
    try {
      const now = new Date();

      // Find complaints that are overdue (SLA breached) and not yet resolved/closed/rejected
      const overdueComplaints = await Complaint.find({
        status: { $nin: ['RESOLVED', 'CLOSED', 'REJECTED'] },
        slaDeadline: { $lt: now },
        currentHierarchyLevelId: { $ne: null }
      }).populate('currentHierarchyLevelId');

      if (overdueComplaints.length === 0) return;

      const allLevels = await HierarchyLevel.find().sort({ levelOrder: 1 });
      if (allLevels.length === 0) return;

      for (const complaint of overdueComplaints) {
        const currentLevel = complaint.currentHierarchyLevelId;
        if (!currentLevel) continue;

        const currentIndex = allLevels.findIndex(l => l._id.equals(currentLevel._id));
        const nextLevelIndex = currentIndex + 1;

        if (nextLevelIndex < allLevels.length) {
          const nextLevel = allLevels[nextLevelIndex];
          const previousLevel = currentLevel;
          
          // Set new deadline: 2 minutes from now for live demo
          const nextDeadline = new Date(now.getTime() + 2 * 60 * 1000);

          // Update complaint: escalate to next hierarchy level
          complaint.currentHierarchyLevelId = nextLevel._id;
          complaint.slaDeadline = nextDeadline;
          complaint.assignedTo = null; // Reset assignment on escalation

          await complaint.save();

          // Record in ComplaintHistory (visible on complaint details page)
          await ComplaintHistory.create({
            complaintId: complaint._id,
            oldStatus: complaint.status,
            newStatus: complaint.status, // Status unchanged, but hierarchy changed
            updatedBy: complaint.citizenId,
            comment: `⚠️ AUTO-ESCALATED: SLA breached at "${previousLevel.levelName}". Complaint escalated to "${nextLevel.levelName}". New SLA deadline: ${nextDeadline.toLocaleString('en-IN')}.`,
          });

          // Immutable Audit Log
          await AuditLog.create({
            actor: complaint.citizenId,
            action: 'AUTOMATIC_ESCALATION',
            entity: 'Complaint',
            entityId: complaint._id,
            metadata: {
              complaintId: complaint.complaintId,
              fromLevel: previousLevel.levelName,
              fromLevelOrder: previousLevel.levelOrder,
              toLevel: nextLevel.levelName,
              toLevelOrder: nextLevel.levelOrder,
              newDeadline: nextDeadline,
              escalatedAt: now,
            }
          });

          // In-app notification to the citizen
          try {
            await Notification.create({
              userId: complaint.citizenId,
              type: 'COMPLAINT_ESCALATED',
              title: '🚨 Complaint Escalated',
              message: `Your complaint ${complaint.complaintId} has been escalated from "${previousLevel.levelName}" to "${nextLevel.levelName}" due to SLA breach.`,
              relatedComplaintId: complaint._id,
              isRead: false,
            });
          } catch (notifErr) {
            // Non-critical — don't fail escalation if notification creation fails
            console.warn(`⚠️ Could not create escalation notification: ${notifErr.message}`);
          }

          console.log(`🚨 [ESCALATION] ${complaint.complaintId}: "${previousLevel.levelName}" (L${previousLevel.levelOrder}) → "${nextLevel.levelName}" (L${nextLevel.levelOrder})`);
        } else {
          // Already at highest level — just reset the SLA to avoid infinite looping
          // Mark as critically overdue but do not escalate further
          const nextDeadline = new Date(now.getTime() + 10 * 60 * 1000); // 10 min grace at top level
          complaint.slaDeadline = nextDeadline;
          await complaint.save();

          console.log(`⚠️ [MAX LEVEL] Complaint ${complaint.complaintId} is at highest hierarchy level "${currentLevel.levelName}". Awaiting resolution.`);
        }
      }

    } catch (error) {
      console.error('❌ Error in Escalation Cron:', error);
    }
  }, 15 * 1000); // Check every 15 seconds
};
