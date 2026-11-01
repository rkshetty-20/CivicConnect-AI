import express from 'express';
import { addVote, removeVote, getVoteStatus } from '../controllers/voteController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(protect);

router.route('/')
  .post(addVote)
  .delete(removeVote);

router.get('/status', getVoteStatus);

export default router;
