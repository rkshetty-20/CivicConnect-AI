import Vote from '../models/Vote.js';
import Issue from '../models/Issue.js';
import { computePriorityScore } from '../services/aiClient.js';

// Get identifier based on req.user or request deviceId header/body
const getVoteQuery = (req) => {
  if (req.user) {
    return { user: req.user._id };
  }
  const deviceId = req.headers['x-device-id'] || req.body.deviceId;
  if (!deviceId) {
    throw new Error('User authentication or Device ID is required to perform this action');
  }
  return { deviceId };
};

// @desc    Add vote (+1) to an issue
// @route   POST /api/issues/:id/vote
// @access  Public (anonymous allowed with Device ID)
export const addVote = async (req, res) => {
  const issueId = req.params.id;

  try {
    const query = getVoteQuery(req);
    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Check if user or device has already voted
    const existingVote = await Vote.findOne({ issue: issueId, ...query });
    if (existingVote) {
      return res.status(400).json({ message: 'You have already voted for this issue' });
    }

    // Create vote
    await Vote.create({ issue: issueId, ...query });

    // Update Issue votesCount & priorityScore
    issue.votesCount = (issue.votesCount || 0) + 1;
    issue.priorityScore = computePriorityScore(issue.votesCount, issue.severity, issue.createdAt);
    await issue.save();

    // Notify reporter if someone else upvoted their issue (only if reporter is registered)
    const userId = req.user?._id;
    if (userId && issue.reportedBy && issue.reportedBy.toString() !== userId.toString()) {
      try {
        const { createNotification } = await import('../services/notificationService.js');
        await createNotification(
          issue.reportedBy,
          issue._id,
          'new_vote',
          `👍 Someone upvoted your issue "${issue.title}". It now has ${issue.votesCount} votes!`
        );
      } catch (err) {
        console.warn('[Socket] Vote notification skipped:', err.message);
      }
    }

    res.status(201).json({
      message: 'Vote registered successfully',
      votesCount: issue.votesCount,
      priorityScore: issue.priorityScore,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Remove vote from an issue
// @route   DELETE /api/issues/:id/vote
// @access  Public (anonymous allowed with Device ID)
export const removeVote = async (req, res) => {
  const issueId = req.params.id;

  try {
    const query = getVoteQuery(req);
    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Check if vote exists
    const vote = await Vote.findOne({ issue: issueId, ...query });
    if (!vote) {
      return res.status(400).json({ message: 'You have not voted for this issue' });
    }

    await vote.deleteOne();

    // Update Issue votesCount & priorityScore
    issue.votesCount = Math.max(0, (issue.votesCount || 0) - 1);
    issue.priorityScore = computePriorityScore(issue.votesCount, issue.severity, issue.createdAt);
    await issue.save();

    res.status(200).json({
      message: 'Vote removed successfully',
      votesCount: issue.votesCount,
      priorityScore: issue.priorityScore,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get user/device vote status on an issue
// @route   GET /api/issues/:id/vote/status
// @access  Public
export const getVoteStatus = async (req, res) => {
  const issueId = req.params.id;

  try {
    const query = getVoteQuery(req);
    const vote = await Vote.findOne({ issue: issueId, ...query });
    res.status(200).json({ hasVoted: !!vote });
  } catch (error) {
    // If no identifier provided, just return hasVoted: false rather than throwing
    res.status(200).json({ hasVoted: false });
  }
};
