import Issue from '../models/Issue.js';

// @desc    Get all complaints assigned to the logged-in officer's department
// @route   GET /api/officer/assigned
// @access  Private (Officer, Admin)
export const getAssignedComplaints = async (req, res) => {
  try {
    // If officer, query issues matching their department id
    if (req.user.role === 'officer' && !req.user.department) {
      return res.status(400).json({ message: 'Officer is not assigned to any department.' });
    }

    const filter = {};
    if (req.user.role === 'officer') {
      filter.department = req.user.department;
    }

    const complaints = await Issue.find(filter)
      .sort({ priorityScore: -1, createdAt: -1 })
      .populate('reportedBy', 'name email phone')
      .populate('assignedOfficer', 'name');

    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
