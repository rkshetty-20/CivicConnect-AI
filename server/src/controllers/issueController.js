import Issue from '../models/Issue.js';
import Comment from '../models/Comment.js';
import Department from '../models/Department.js';
import User from '../models/User.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import { classifyIssue, computePriorityScore } from '../services/aiClient.js';
import { reverseGeocode } from '../services/geocodeService.js';

// ── Duplicate detection helpers ─────────────────────────────────────────────
// Tokenize free text into a normalized set of meaningful words.
const tokenize = (text = '') =>
  new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );

// Jaccard similarity between two token sets.
const jaccard = (a, b) => {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  return inter / (a.size + b.size - inter);
};

/**
 * Finds likely duplicate complaints: same category, unresolved, within a
 * configurable radius, ranked by textual similarity. Does NOT auto-merge.
 */
const findDuplicateCandidates = async (lng, lat, category, description, radius = 500) => {
  const nearby = await Issue.find({
    isFake: false,
    category,
    status: { $nin: ['resolved', 'rejected'] },
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: radius,
      },
    },
  })
    .limit(15)
    .select('_id description');

  const tokens = tokenize(description);
  return nearby
    .map((d) => ({ id: d._id, score: jaccard(tokens, tokenize(d.description)) }))
    .filter((d) => d.score >= 0.2)
    .sort((a, b) => b.score - a.score)
    .map((d) => d.id);
};

// ─── Create Issue ────────────────────────────────────────────────────────────
// @route  POST /api/issues
// @access Private (citizen)
export const createIssue = async (req, res) => {
  try {
    const { title, description, address, lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ message: 'GPS coordinates (lat, lng) are required.' });
    }

    // 1. Upload images to Cloudinary
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer, file.originalname, file.mimetype);
        imageUrls.push(url);
      }
    }

    // 2. AI Classification & Audits
    const mainImageUrl = imageUrls.length > 0 ? imageUrls[0] : null;
    const { category, severity, confidence, priority_score: aiPriority, summary, suggestedAction, safetyRisk, recommendedDepartment } = await classifyIssue(title, description, mainImageUrl);

    // 2b. Check duplicates (real geospatial + text similarity; no auto-merge)
    let duplicateCandidates = [];
    try {
      duplicateCandidates = await findDuplicateCandidates(
        parseFloat(lng),
        parseFloat(lat),
        category,
        description
      );
    } catch (err) {
      console.error('[Duplicate Detection Error]', err.message);
    }

    // 2c. Check fake complaints
    let isFake = false;
    try {
      const { checkFakeReport: checkFake } = await import('../services/aiClient.js');
      const fakeRes = await checkFake(lat, lng, req.body.deviceMetadata || null, mainImageUrl);
      isFake = fakeRes.isFake;
    } catch (err) {
      console.error('[Fake Audit Error]', err.message);
    }

    // 2d. Map to Department
    const matchedDept = await Department.findOne({ category: category });
    const departmentId = matchedDept ? matchedDept._id : null;

    // 3. Compute initial priority score (0-100). Prefer the AI-scored value.
    const priorityScore =
      typeof confidence === 'number' && Number.isFinite(aiPriority) && aiPriority >= 0
        ? Math.max(0, Math.min(100, Math.round(aiPriority)))
        : computePriorityScore(0, severity, new Date());

    // Get or create anonymous reporter if user is not logged in
    let reporterId;
    if (req.user) {
      reporterId = req.user._id;
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
      reporterId = anonUser._id;
    }

    // 3b. Resolve a human-readable address (reverse geocode) when the citizen
    // did not type one. Falls back to a coordinate label when offline.
    let resolvedAddress = (address || '').trim();
    if (!resolvedAddress) {
      try {
        const geo = await reverseGeocode(lat, lng);
        resolvedAddress = geo.address;
      } catch {
        resolvedAddress = '';
      }
    }

    // 4. Save Issue
    const issue = await Issue.create({
      title,
      description,
      category,
      severity,
      aiConfidence: confidence,
      summary: summary || '',
      suggestedAction: suggestedAction || '',
      safetyRisk: safetyRisk || '',
      recommendedDepartment: recommendedDepartment || '',
      priorityScore,
      images: imageUrls,
      address: resolvedAddress,
      location: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)], // GeoJSON: [lng, lat]
      },
      reportedBy: reporterId,
      department: departmentId,
      isFake,
      duplicateCandidates,
      statusHistory: [
        {
          from: null,
          to: 'pending',
          updatedBy: reporterId,
          remarks: 'Issue reported by citizen.',
          timestamp: new Date(),
        },
      ],
    });

    await issue.populate('reportedBy', 'name email role');
    await issue.populate('duplicateCandidates', 'title category severity status address votesCount');

    // 5. Broadcast new issue to all city-wide socket subscribers
    try {
      const { broadcastCityEvent } = await import('../services/notificationService.js');
      broadcastCityEvent('issue:created', {
        _id: issue._id,
        title: issue.title,
        category: issue.category,
        severity: issue.severity,
        status: issue.status,
        location: issue.location,
      });
    } catch (err) {
      console.warn('[Socket] Broadcast skipped:', err.message);
    }

    res.status(201).json(issue);
  } catch (error) {
    console.error('[createIssue]', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ─── Get All Issues (with filters) ──────────────────────────────────────────
// @route  GET /api/issues
// @access Private
export const getIssues = async (req, res) => {
  try {
    const { category, status, search, lat, lng, radius = 5000, page = 1, limit = 20 } = req.query;

    const filter = { isFake: false };
    if (category) filter.category = category;
    if (status) filter.status = status;

    if (search?.trim()) {
      const term = search.trim();
      filter.$or = [
        { title: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { address: { $regex: term, $options: 'i' } },
      ];
    }

    // Geo-radius filter (radius in metres)
    if (lat && lng) {
      filter.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius),
        },
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const pageLimit = parseInt(limit);

    const [issues, total] = await Promise.all([
      Issue.find(filter)
        .sort({ priorityScore: -1, createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .populate('reportedBy', 'name')
        .populate('assignedOfficer', 'name')
        .populate('department', 'name'),
      Issue.countDocuments(filter),
    ]);

    const issueIds = issues.map((issue) => issue._id);
    const commentCounts = issueIds.length
      ? await Comment.aggregate([
          { $match: { issue: { $in: issueIds } } },
          { $group: { _id: '$issue', count: { $sum: 1 } } },
        ])
      : [];

    const countMap = Object.fromEntries(
      commentCounts.map((row) => [row._id.toString(), row.count])
    );

    const issuesWithCounts = issues.map((issue) => ({
      ...issue.toObject(),
      commentsCount: countMap[issue._id.toString()] || 0,
    }));

    res.json({
      issues: issuesWithCounts,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / pageLimit),
    });
  } catch (error) {
    console.error('[getIssues]', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ─── Get Single Issue ────────────────────────────────────────────────────────
// @route  GET /api/issues/:id
// @access Private
export const getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reportedBy', 'name email reputationPoints')
      .populate('assignedOfficer', 'name email')
      .populate('department', 'name')
      .populate('statusHistory.updatedBy', 'name')
      .populate('duplicateCandidates', 'title category severity status address votesCount');

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    const commentsCount = await Comment.countDocuments({ issue: issue._id });

    res.json({ ...issue.toObject(), commentsCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Update Issue Status ─────────────────────────────────────────────────────
// @route  PATCH /api/issues/:id/status
// @access Private (officer, admin)
export const updateIssueStatus = async (req, res) => {
  try {
    const {
      status,
      remarks,
      resolutionPhoto,
      resolutionNotes,
      departmentId,
      assignedOfficerId,
      priorityScore: newPriority,
      priorityReason,
    } = req.body;

    const VALID = ['pending', 'acknowledged', 'assigned', 'in_progress', 'resolved', 'rejected'];
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    const prevStatus = issue.status;
    const hasStatusChange = status && status !== prevStatus;

    if (status && !VALID.includes(status)) {
      return res.status(400).json({ message: `Invalid status: ${status}` });
    }

    // Business rules for the lifecycle.
    if (hasStatusChange) {
      if (status === 'rejected' && !String(remarks || '').trim()) {
        return res.status(400).json({ message: 'A reason is mandatory when rejecting a complaint.' });
      }
      if (status === 'assigned' && !departmentId && !issue.department) {
        return res.status(400).json({ message: 'A department is required to assign a complaint.' });
      }
    }

    // Priority change (requires a recorded reason).
    if (typeof newPriority === 'number' && !Number.isNaN(newPriority)) {
      if (!String(priorityReason || remarks || '').trim()) {
        return res.status(400).json({ message: 'A reason is required to change the priority score.' });
      }
      issue.priorityScore = Math.max(0, Math.min(100, Math.round(newPriority)));
    }

    // Optional re-severity.
    if (req.body.severity && ['low', 'medium', 'high', 'emergency'].includes(req.body.severity)) {
      issue.severity = req.body.severity;
    }

    // Department / officer assignment.
    if (departmentId) issue.department = departmentId;
    if (assignedOfficerId) issue.assignedOfficer = assignedOfficerId;

    if (resolutionPhoto) issue.resolutionPhoto = resolutionPhoto;
    if (resolutionNotes) issue.resolutionNotes = resolutionNotes;

    if (hasStatusChange) {
      issue.status = status;

      if (status === 'resolved') {
        issue.resolvedAt = new Date();
        await User.findByIdAndUpdate(issue.reportedBy, { $inc: { reputationPoints: 10 } });
      }
      if (status === 'rejected') {
        issue.rejectionReason = remarks;
      }

      issue.statusHistory.push({
        from: prevStatus,
        to: status,
        updatedBy: req.user._id,
        remarks: remarks || '',
        timestamp: new Date(),
      });
    } else if (typeof newPriority === 'number') {
      // Log a priority-change entry so the audit trail reflects it.
      issue.statusHistory.push({
        from: prevStatus,
        to: prevStatus,
        updatedBy: req.user._id,
        remarks: `Priority updated to ${issue.priorityScore}. Reason: ${priorityReason || remarks}`,
        timestamp: new Date(),
      });
    }

    const updatedIssue = await issue.save();
    await updatedIssue.populate('department', 'name');

    // Notify the original reporter about status change.
    if (hasStatusChange) {
      try {
        const { createNotification, broadcastCityEvent } = await import('../services/notificationService.js');
        const notifType = status === 'resolved' ? 'issue_resolved' : 'status_update';
        const readable = status.replace('_', ' ');
        const notifMsg =
          status === 'resolved'
            ? `🎉 Your issue "${updatedIssue.title}" has been resolved! +10 reputation points awarded.`
            : status === 'rejected'
              ? `⚠️ Your issue "${updatedIssue.title}" was not accepted. Reason: ${remarks}`
              : `📋 Your issue "${updatedIssue.title}" is now ${readable}.`;

        await createNotification(updatedIssue.reportedBy, updatedIssue._id, notifType, notifMsg);
        broadcastCityEvent('issue:statusUpdated', {
          _id: updatedIssue._id,
          status: updatedIssue.status,
        });
      } catch (err) {
        console.warn('[Socket] Status notification skipped:', err.message);
      }
    }

    res.json(updatedIssue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Delete Issue ────────────────────────────────────────────────────────────
// @route  DELETE /api/issues/:id
// @access Private (admin)
export const deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    await issue.deleteOne();
    res.json({ message: 'Issue removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get Issues for Map (all minimal) ───────────────────────────────────────
// @route  GET /api/issues/map
// @access Private
export const getIssuesForMap = async (req, res) => {
  try {
    const issues = await Issue.find({ isFake: false })
      .select('title category status severity location votesCount createdAt')
      .sort({ createdAt: -1 })
      .limit(500);

    res.json(issues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
