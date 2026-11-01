import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide an issue title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      enum: [
        'Garbage',
        'Roads',
        'Water',
        'Electricity',
        'Sewage',
        'Streetlights',
        'Parks',
        'Public Transport',
        'Building Safety',
        'Noise Pollution',
        'Other',
      ],
      default: 'Other',
    },
    images: {
      type: [String], // Cloudinary URLs
      default: [],
    },
    // GeoJSON Point for geospatial queries
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'acknowledged', 'assigned', 'in_progress', 'resolved', 'rejected'],
      default: 'pending',
    },
    priorityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // ── AI-generated intelligence fields ──────────────────────────────
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'emergency'],
      default: 'low',
    },
    summary: {
      type: String,
      trim: true,
      default: '',
    },
    suggestedAction: {
      type: String,
      trim: true,
      default: '',
    },
    safetyRisk: {
      type: String,
      trim: true,
      default: '',
    },
    recommendedDepartment: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    votesCount: {
      type: Number,
      default: 0,
    },
    isDuplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      default: null,
    },
    duplicateCandidates: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Issue' }],
      default: [],
    },
    // Full audit trail of every status change shown to citizens.
    statusHistory: [
      {
        from: { type: String, default: null },
        to: { type: String, required: true },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        remarks: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    resolutionNotes: {
      type: String,
      trim: true,
      default: '',
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
    isFake: {
      type: Boolean,
      default: false,
    },
    aiConfidence: {
      type: Number,
      default: null,
    },
    resolutionPhoto: {
      type: String,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere index for geospatial queries (geo-radius duplicate check)
issueSchema.index({ location: '2dsphere' });

// Compound index for filtering
issueSchema.index({ status: 1, category: 1, createdAt: -1 });

const Issue = mongoose.model('Issue', issueSchema);
export default Issue;
