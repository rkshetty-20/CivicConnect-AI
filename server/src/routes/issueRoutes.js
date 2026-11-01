import express from 'express';
import {
  createIssue,
  getIssues,
  getIssueById,
  updateIssueStatus,
  deleteIssue,
  getIssuesForMap,
} from '../controllers/issueController.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

import voteRoutes from './voteRoutes.js';
import commentRoutes from './commentRoutes.js';

const router = express.Router();

// Nested routes - optional authentication for public voting/comments
router.use('/:id/vote', optionalProtect, voteRoutes);
router.use('/:id/comments', optionalProtect, commentRoutes);

// Public citizen feed and mapping routes
router.get('/map', optionalProtect, getIssuesForMap);
router.get('/', optionalProtect, getIssues);
router.post('/', optionalProtect, upload.array('images', 4), createIssue);
router.get('/:id', optionalProtect, getIssueById);

// Staff and Admin ONLY actions
router.patch('/:id/status', protect, authorize('officer', 'admin'), updateIssueStatus);
router.delete('/:id', protect, authorize('admin'), deleteIssue);

export default router;
