import express from 'express';
import { getReverseGeocode, getForwardGeocode } from '../controllers/geoController.js';

const router = express.Router();

router.get('/reverse', getReverseGeocode);
router.get('/search', getForwardGeocode);

export default router;
