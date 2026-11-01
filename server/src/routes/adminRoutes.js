import express from 'express';
import {
  createDepartment,
  getDepartments,
  registerOfficer,
  getOfficers,
  getFakeReports,
  resolveFakeReport,
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.route('/departments')
  .post(createDepartment)
  .get(getDepartments);

router.route('/officers')
  .post(registerOfficer)
  .get(getOfficers);

router.get('/fake-reports', getFakeReports);
router.patch('/fake-reports/:id/resolve', resolveFakeReport);

export default router;
