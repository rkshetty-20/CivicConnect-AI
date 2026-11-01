import { reverseGeocode, forwardGeocode } from '../services/geocodeService.js';

// @desc    Reverse geocode coordinates to an address (offline-safe fallback)
// @route   GET /api/geo/reverse?lat=&lng=
// @access  Public
export const getReverseGeocode = async (req, res) => {
  const { lat, lng } = req.query;
  if (lat == null || lng == null || Number.isNaN(parseFloat(lat)) || Number.isNaN(parseFloat(lng))) {
    return res.status(400).json({ message: 'Valid lat and lng query params are required.' });
  }
  const result = await reverseGeocode(parseFloat(lat), parseFloat(lng));
  res.json(result);
};

// @desc    Forward geocode a free-text place query
// @route   GET /api/geo/search?q=
// @access  Public
export const getForwardGeocode = async (req, res) => {
  const { q } = req.query;
  const results = await forwardGeocode(q);
  res.json(results);
};
