import Comment from '../models/Comment.js';
import Issue from '../models/Issue.js';
import User from '../models/User.js';

// @desc    Add a comment to an issue
// @route   POST /api/issues/:id/comments
// @access  Public (Anonymous citizen allowed)
export const addComment = async (req, res) => {
  const issueId = req.params.id;
  const { text } = req.body;

  try {
    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Get or create anonymous reporter if user is not logged in
    let commenterId;
    if (req.user) {
      commenterId = req.user._id;
    } else {
      let anonUser = await User.findOne({ email: 'anonymous@civicconnect.ai' });
      if (!anonUser) {
        anonUser = await User.create({
          name: 'Anonymous Citizen',
          email: 'anonymous@civicconnect.ai',
          phone: '0000000000',
          passwordHash: 'anonymous_placeholder_hash_123',
          role: 'citizen',
          isVerified: true,
        });
      }
      commenterId = anonUser._id;
    }

    const comment = await Comment.create({
      issue: issueId,
      user: commenterId,
      text,
    });

    // Populate user info for immediate display
    await comment.populate('user', 'name role');

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get comments for an issue (paginated)
// @route   GET /api/issues/:id/comments
// @access  Public
export const getComments = async (req, res) => {
  const issueId = req.params.id;
  const { page = 1, limit = 10 } = req.query;

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [comments, total] = await Promise.all([
      Comment.find({ issue: issueId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user', 'name role'),
      Comment.countDocuments({ issue: issueId }),
    ]);

    res.status(200).json({
      comments,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
