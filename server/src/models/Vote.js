import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema(
  {
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    deviceId: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a single identity can only vote once on a specific issue.
// Partial indexes keep authenticated votes (user) and anonymous votes (deviceId)
// in separate uniqueness scopes so they never collide on a null other-identifier.
voteSchema.index(
  { issue: 1, user: 1 },
  { unique: true, partialFilterExpression: { user: { $type: 'objectId' } } }
);
voteSchema.index(
  { issue: 1, deviceId: 1 },
  { unique: true, partialFilterExpression: { deviceId: { $type: 'string' } } }
);

const Vote = mongoose.model('Vote', voteSchema);
export default Vote;
