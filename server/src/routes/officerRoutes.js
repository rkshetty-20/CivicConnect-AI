import express from 'express';
import { getAssignedComplaints } from '../controllers/officerController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('officer', 'admin'));

router.get('/assigned', getAssignedComplaints);

export default router;
