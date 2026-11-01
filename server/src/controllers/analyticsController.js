import Issue from '../models/Issue.js';
import User from '../models/User.js';
import Department from '../models/Department.js';

const STATUSES = ['pending', 'acknowledged', 'assigned', 'in_progress', 'resolved', 'rejected'];
const SEVERITIES = ['low', 'medium', 'high', 'emergency'];

// @desc    Get system-wide analytics summary
// @route   GET /api/analytics/summary
// @access  Private (Admin, Officer)
export const getSystemSummary = async (req, res) => {
  try {
    const [
      totalIssues,
      pendingIssues,
      acknowledgedIssues,
      assignedIssues,
      progressIssues,
      resolvedIssues,
      rejectedIssues,
      criticalIssues,
      totalOfficers,
      totalCitizens,
      totalDepartments,
    ] = await Promise.all([
      Issue.countDocuments({}),
      Issue.countDocuments({ status: 'pending' }),
      Issue.countDocuments({ status: 'acknowledged' }),
      Issue.countDocuments({ status: 'assigned' }),
      Issue.countDocuments({ status: 'in_progress' }),
      Issue.countDocuments({ status: 'resolved' }),
      Issue.countDocuments({ status: 'rejected' }),
      Issue.countDocuments({ severity: 'emergency' }),
      User.countDocuments({ role: 'officer' }),
      User.countDocuments({ role: 'citizen' }),
      Department.countDocuments({}),
    ]);

    // Category-wise counts
    const categoryStats = await Issue.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Severity distribution (fill zeros so the chart always renders every level)
    const sevRaw = await Issue.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]);
    const sevMap = Object.fromEntries(sevRaw.map((s) => [s._id, s.count]));
    const severityDistribution = SEVERITIES.map((s) => ({ severity: s, count: sevMap[s] || 0 }));

    // Status distribution
    const statusDistribution = STATUSES.map((s) => ({
      status: s,
      count:
        s === 'pending' ? pendingIssues
        : s === 'acknowledged' ? acknowledgedIssues
        : s === 'assigned' ? assignedIssues
        : s === 'in_progress' ? progressIssues
        : s === 'resolved' ? resolvedIssues
        : rejectedIssues,
    }));

    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    const trendRaw = await Issue.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
    const monthlyTrend = trendRaw.map((t) => ({
      label: `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][t._id.month - 1]} ${t._id.year}`,
      total: t.total,
      resolved: t.resolved,
    }));

    // Most-voted issues
    const topVoted = await Issue.find({})
      .sort({ votesCount: -1 })
      .limit(5)
      .select('title category severity votesCount status');

    // Department performance
    const departmentPerformance = await Issue.aggregate([
      { $group: { _id: '$department', total: { $sum: 1 }, resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } } } },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'deptInfo' } },
      { $unwind: { path: '$deptInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          departmentName: { $ifNull: ['$deptInfo.name', 'Unassigned'] },
          total: 1,
          resolved: 1,
          resolutionRate: {
            $cond: [{ $gt: ['$total', 0] }, { $multiply: [{ $divide: ['$resolved', '$total'] }, 100] }, 0],
          },
        },
      },
      { $sort: { resolutionRate: -1 } },
    ]);

    res.json({
      summary: {
        totalIssues,
        pendingIssues,
        acknowledgedIssues,
        assignedIssues,
        progressIssues,
        resolvedIssues,
        rejectedIssues,
        criticalIssues,
        totalOfficers,
        totalCitizens,
        totalDepartments,
        overallResolutionRate: totalIssues > 0 ? (resolvedIssues / totalIssues) * 100 : 0,
      },
      categories: categoryStats,
      severityDistribution,
      statusDistribution,
      monthlyTrend,
      topVoted,
      departments: departmentPerformance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
