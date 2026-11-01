import User from '../models/User.js';

// @desc    Get top users by reputation points
// @route   GET /api/users/leaderboard
// @access  Public (or Private if we only want logged-in users to see it)
export const getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    // Fetch top users sorted by reputationPoints descending
    // Only return citizen roles to avoid showing admins/officers on the leaderboard
    const topUsers = await User.find({ role: 'citizen' })
      .select('name reputationPoints createdAt')
      .sort({ reputationPoints: -1, createdAt: 1 })
      .limit(limit);

    res.json(topUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
