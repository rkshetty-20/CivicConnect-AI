import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const SEVERITY_BASE = { low: 20, medium: 45, high: 70, emergency: 90 };

const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));

const DEPARTMENT_MAP = {
  Roads: 'Road & Infrastructure',
  'Public Transport': 'Transport Authority',
  Garbage: 'Sanitation & Waste Management',
  'Noise Pollution': 'Pollution Control Board',
  Water: 'Water Supply & Sewerage Board',
  Sewage: 'Water Supply & Sewerage Board',
  Electricity: 'Electricity & Power Distribution',
  Streetlights: 'Electricity & Power Distribution',
  Parks: 'Parks & Recreation Authority',
  'Building Safety': 'Building Safety / Municipal Engineering',
  Other: 'General Administration',
};

const SAFETY_RISK = {
  low: 'Minimal public safety risk.',
  medium: 'Moderate risk; may worsen if unattended.',
  high: 'Significant risk to public safety or health.',
  emergency: 'Critical / immediate danger to life or property.',
};

const SUGGESTED_ACTION = {
  low: 'Schedule routine maintenance within the normal service window.',
  medium: 'Inspect within 48 hours and plan corrective work.',
  high: 'Prioritize inspection within 24 hours and arrange repair.',
  emergency: 'Dispatch an emergency crew immediately and cordon off the area.',
};

// Fallback classifier used only when the FastAPI microservice is unreachable.
const fallbackClassify = (title, description) => {
  const text = `${title} ${description}`.toLowerCase();
  let category = 'Other';
  let severity = 'low';

  const keywords = {
    Garbage: ['trash', 'garbage', 'waste', 'litter', 'dump', 'bin'],
    Roads: ['pothole', 'road', 'street', 'asphalt'],
    Water: ['water', 'leak', 'pipe', 'supply'],
    Electricity: ['power', 'electricity', 'transformer', 'wire'],
    Sewage: ['sewage', 'gutter', 'drainage'],
    Streetlights: ['streetlight', 'dark', 'bulb'],
    Parks: ['park', 'bench', 'tree'],
    'Public Transport': ['bus', 'metro', 'station'],
    'Building Safety': ['collapse', 'building', 'wall'],
    'Noise Pollution': ['noise', 'loud'],
  };

  for (const [cat, words] of Object.entries(keywords)) {
    if (words.some((word) => text.includes(word))) {
      category = cat;
      break;
    }
  }

  if (text.includes('live wire') || text.includes('collapse') || text.includes('emergency') || text.includes('accident')) {
    severity = 'emergency';
  } else if (text.includes('blocked') || text.includes('overflowing') || text.includes('burst')) {
    severity = 'high';
  } else if (text.includes('broken') || text.includes('pothole') || text.includes('not working')) {
    severity = 'medium';
  }

  const confidence = 0.5;
  let base = SEVERITY_BASE[severity];
  if (/(school|hospital|children|elderly|accident)/.test(text)) base += 8;
  const summary = (description || title).trim().split('. ').slice(0, 2).join('. ').slice(0, 280);

  return {
    category,
    severity,
    confidence,
    priority_score: clamp(base),
    summary: summary.endsWith('.') ? summary : `${summary}.`,
    recommended_department: DEPARTMENT_MAP[category] || 'General Administration',
    suggested_action: SUGGESTED_ACTION[severity],
    safety_risk: SAFETY_RISK[severity],
  };
};

/**
 * Classifies an issue by calling the FastAPI AI Microservice.
 * Falls back gracefully to an offline rule engine if the microservice is offline.
 * Returns the full intelligence payload.
 */
export const classifyIssue = async (title, description, imageUrl = null) => {
  try {
    const res = await axios.post(
      `${AI_SERVICE_URL}/classify`,
      { title, description, image_url: imageUrl },
      { timeout: 4000 }
    );
    const d = res.data || {};
    // Guarantee a numeric priority even if the service omits it.
    if (typeof d.priority_score !== 'number') {
      d.priority_score = clamp(SEVERITY_BASE[d.severity] ?? 20);
    }
    // Normalize the FastAPI snake_case payload to camelCase for the app.
    return {
      category: d.category,
      severity: d.severity,
      confidence: d.confidence,
      priority_score: d.priority_score,
      summary: d.summary || '',
      recommendedDepartment: d.recommended_department || d.recommendedDepartment || '',
      suggestedAction: d.suggested_action || d.suggestedAction || '',
      safetyRisk: d.safety_risk || d.safetyRisk || '',
    };
  } catch (error) {
    console.warn('[AI Client] FastAPI /classify down, falling back to local rule-engine.');
    return fallbackClassify(title, description);
  }
};

/**
 * Check for duplicate issues by comparing coordinates and image pHashes.
 */
export const checkDuplicate = async (imageUrl, lat, lng) => {
  try {
    const res = await axios.post(
      `${AI_SERVICE_URL}/check-duplicate`,
      { image_url: imageUrl, lat: parseFloat(lat), lng: parseFloat(lng) },
      { timeout: 4000 }
    );
    return res.data; // { isDuplicate, matchedIssueId }
  } catch (error) {
    console.warn('[AI Client] FastAPI /check-duplicate down. Skipping image duplicate check.');
    return { isDuplicate: false, matchedIssueId: null };
  }
};

/**
 * Audit submissions for fake telemetry / emulated submissions.
 */
export const checkFakeReport = async (lat, lng, deviceMetadata = null, imageUrl = null) => {
  try {
    const res = await axios.post(
      `${AI_SERVICE_URL}/fake-report-check`,
      { image_url: imageUrl, lat: parseFloat(lat), lng: parseFloat(lng), device_metadata: deviceMetadata },
      { timeout: 4000 }
    );
    return res.data; // { isFake, reasons }
  } catch (error) {
    console.warn('[AI Client] FastAPI /fake-report-check down. Skipping fake audit.');
    return { isFake: false, reasons: [] };
  }
};

/**
 * Compute a normalized priority score (0-100) from severity, community votes and age.
 */
export const computePriorityScore = (votesCount, severity, createdAt) => {
  const base = SEVERITY_BASE[severity] ?? 20;
  const votesContribution = Math.min(12, (votesCount || 0) * 0.4);
  const hoursPending = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  const ageContribution = Math.min(3, hoursPending * 0.02);
  return clamp(base + votesContribution + ageContribution);
};
