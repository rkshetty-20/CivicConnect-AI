import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Department from '../models/Department.js';
import Issue from '../models/Issue.js';
import Vote from '../models/Vote.js';
import Comment from '../models/Comment.js';
import { computePriorityScore } from '../services/aiClient.js';

// Bengaluru reference coordinates (lat, lng)
const CITY = { lat: 12.9716, lng: 77.5946 };

// Slightly offset a base coordinate so demo issues cluster realistically around the city.
const at = (dLat, dLng) => ({
  lat: +(CITY.lat + dLat).toFixed(6),
  lng: +(CITY.lng + dLng).toFixed(6),
});

// Department registry mapped to the issue categories used by the AI classifier.
const DEPARTMENTS = [
  { name: 'Road & Infrastructure Dept', category: ['Roads', 'Public Transport'], contactEmail: 'roads@citygov.in' },
  { name: 'Sanitation & Waste Management', category: ['Garbage', 'Noise Pollution'], contactEmail: 'sanitation@citygov.in' },
  { name: 'Water Supply & Sewerage Board', category: ['Water', 'Sewage'], contactEmail: 'water@citygov.in' },
  { name: 'Electricity & Power Distribution', category: ['Electricity', 'Streetlights'], contactEmail: 'power@citygov.in' },
  { name: 'Parks & Recreation Authority', category: ['Parks', 'Building Safety'], contactEmail: 'parks@citygov.in' },
];

// Realistic demo complaints. Category + severity mirror the AI taxonomy so the
// dashboards, map and filters have meaningful, varied data to render.
const DEMO_ISSUES = [
  { title: 'Deep pothole cluster on MG Road', description: 'Multiple deep potholes near the MG Road metro exit are causing two-wheeler accidents, especially after rain. Needs urgent resurfacing.', category: 'Roads', severity: 'high', reporter: 'citizen1', loc: at(0.011, 0.014), address: 'MG Road, near Metro Exit', status: 'pending', votes: 24 },
  { title: 'Overflowing garbage bin for 5 days', description: 'The community dustbin at the 5th Cross corner has been overflowing since Monday. Foul smell and stray animals around the area.', category: 'Garbage', severity: 'medium', reporter: 'citizen2', loc: at(-0.008, 0.02), address: '5th Cross, Indiranagar', status: 'in_progress', votes: 12 },
  { title: 'Blocked storm drain causing waterlogging', description: 'The storm water drain near the market is fully blocked and the whole street floods even in light rain.', category: 'Sewage', severity: 'high', reporter: 'citizen3', loc: at(0.006, -0.015), address: 'City Market, Shivajinagar', status: 'acknowledged', votes: 16 },
  { title: 'Damaged footpath tiles', description: 'Broken and uneven footpath tiles along the main road are a tripping hazard for pedestrians.', category: 'Roads', severity: 'low', reporter: 'citizen1', loc: at(0.009, -0.007), address: 'Commercial Street', status: 'assigned', votes: 5 },
  { title: 'Open manhole with sewage overflow', description: 'A manhole near the school gate is open and sewage is flowing onto the footpath. Serious health hazard for children.', category: 'Sewage', severity: 'emergency', reporter: 'citizen1', loc: at(0.004, -0.01), address: 'School Gate, Jayanagar', status: 'pending', votes: 41 },
  { title: 'Burst pipeline flooding the street', description: 'A water pipeline has burst and is flooding the entire lane. Clean water is being wasted and the road is slushy.', category: 'Water', severity: 'high', reporter: 'citizen3', loc: at(-0.013, 0.006), address: '3rd Main, Malleshwaram', status: 'in_progress', votes: 18 },
  { title: 'Streetlights not working for a week', description: 'All four streetlights along the park walking path are off, making it unsafe for evening walkers.', category: 'Streetlights', severity: 'medium', reporter: 'citizen2', loc: at(0.017, -0.004), address: 'Cubbon Park path', status: 'resolved', votes: 9 },
  { title: 'Live electric wire hanging low', description: 'A snapped live wire is hanging very low near the bus stop. Extremely dangerous, sparks at night.', category: 'Electricity', severity: 'emergency', reporter: 'citizen3', loc: at(-0.003, 0.023), address: 'Bus Stop, Koramangala 5th Block', status: 'pending', votes: 37 },
  { title: 'Garbage not collected from alley', description: 'No garbage collection for the last three days in the service alley behind the shops. Piles are attracting flies.', category: 'Garbage', severity: 'low', reporter: 'citizen1', loc: at(0.007, 0.019), address: 'Service lane, Basavanagudi', status: 'pending', votes: 4 },
  { title: 'Road caving in near drainage', description: 'The road edge near the storm-water drain is caving in. A two-wheeler fell in yesterday.', category: 'Roads', severity: 'high', reporter: 'citizen2', loc: at(-0.017, -0.011), address: 'Outer Ring Road stretch', status: 'in_progress', votes: 22 },
  { title: 'Park benches broken and rusted', description: 'Several benches in the children\'s park are broken with exposed rusted metal. Unsafe for senior citizens.', category: 'Parks', severity: 'low', reporter: 'citizen3', loc: at(0.013, 0.008), address: 'LK Park, Rajajinagar', status: 'resolved', votes: 6 },
  { title: 'Noisy construction past midnight', description: 'Unauthorized night construction next door is generating heavy noise well past midnight despite the ban.', category: 'Noise Pollution', severity: 'medium', reporter: 'citizen1', loc: at(-0.005, -0.018), address: 'HSR Layout, Sector 2', status: 'pending', votes: 15 },
  { title: 'Bus shelter roof collapsed', description: 'The metal roof of the main bus shelter blew off in the storm. Commuters have no shade or rain cover.', category: 'Public Transport', severity: 'medium', reporter: 'citizen2', loc: at(0.002, 0.026), address: 'Shivajinagar Bus Stand', status: 'pending', votes: 11 },
  { title: 'Cracked wall on old building', description: 'A large crack has appeared on the compound wall of a dilapidated government building. Risk of collapse.', category: 'Building Safety', severity: 'high', reporter: 'citizen3', loc: at(-0.011, 0.013), address: 'Old Secretariat annex', status: 'in_progress', votes: 20 },
];

const hash = (pw) => bcrypt.hashSync(pw, 10);

// Advisory metadata mirroring the AI service output.
const SEVERITY_META = {
  low: { safetyRisk: 'Minimal public safety risk.', action: 'Schedule routine maintenance within the normal service window.' },
  medium: { safetyRisk: 'Moderate risk; may worsen if unattended.', action: 'Inspect within 48 hours and plan corrective work.' },
  high: { safetyRisk: 'Significant risk to public safety or health.', action: 'Prioritize inspection within 24 hours and arrange repair.' },
  emergency: { safetyRisk: 'Critical / immediate danger to life or property.', action: 'Dispatch an emergency crew immediately and cordon off the area.' },
};

// Canonical lifecycle path up to a given status.
const STATUS_PATH = {
  pending: ['pending'],
  acknowledged: ['pending', 'acknowledged'],
  assigned: ['pending', 'acknowledged', 'assigned'],
  in_progress: ['pending', 'acknowledged', 'assigned', 'in_progress'],
  resolved: ['pending', 'acknowledged', 'assigned', 'in_progress', 'resolved'],
  rejected: ['pending', 'rejected'],
};

const REMARKS = {
  pending: 'Issue reported by citizen.',
  acknowledged: 'Complaint received and verified by department.',
  assigned: 'Assigned to the responsible field crew.',
  in_progress: 'Work started on the ground.',
  resolved: 'Issue resolved and site restored.',
  rejected: 'Complaint did not meet acceptance criteria.',
};

const buildHistory = (status, reporterId) => {
  const path = STATUS_PATH[status] || ['pending'];
  let t = Date.now();
  return path.map((to, idx) => {
    const from = idx === 0 ? null : path[idx - 1];
    t += 1000 * 60 * 60 * (6 + idx * 4); // spaced a few hours apart
    return {
      from,
      to,
      updatedBy: idx === 0 ? reporterId : null,
      remarks: REMARKS[to] || '',
      timestamp: new Date(t),
    };
  });
};

export const seedDatabase = async () => {
  try {
    // Guard: skip if already seeded (sentinel admin account).
    const existingAdmin = await User.findOne({ email: 'admin@civicconnect.gov.in' });
    if (existingAdmin) {
      return;
    }

    console.log('[Seed] Seeding CivicConnect AI demo data...');

    // 1) Departments
    const deptMap = {};
    for (const d of DEPARTMENTS) {
      const dept = await Department.create(d);
      deptMap[d.name] = dept;
    }

    // 2) Users
    const admin = await User.create({
      name: 'City Administrator',
      email: 'admin@civicconnect.gov.in',
      phone: '9000000001',
      passwordHash: hash('Admin@123'),
      role: 'admin',
      isVerified: true,
    });

    const officerDefs = [
      { name: 'Ravi Kumar', email: 'roads.officer@citygov.in', phone: '9000000011', dept: 'Road & Infrastructure Dept' },
      { name: 'Anita Sharma', email: 'sanitation.officer@citygov.in', phone: '9000000012', dept: 'Sanitation & Waste Management' },
      { name: 'Mohan Das', email: 'water.officer@citygov.in', phone: '9000000013', dept: 'Water Supply & Sewerage Board' },
    ];
    const officers = [];
    for (const o of officerDefs) {
      const dept = deptMap[o.dept];
      const officer = await User.create({
        name: o.name,
        email: o.email,
        phone: o.phone,
        passwordHash: hash('Officer@123'),
        role: 'officer',
        isVerified: true,
        department: dept._id,
      });
      dept.officersCount = (dept.officersCount || 0) + 1;
      await dept.save();
      officers.push(officer);
    }

    const citizen1 = await User.create({ name: 'Priya N', email: 'citizen1@example.com', phone: '9111111111', passwordHash: hash('Citizen@123'), role: 'citizen', isVerified: true, reputationPoints: 40 });
    const citizen2 = await User.create({ name: 'Arjun R', email: 'citizen2@example.com', phone: '9222222222', passwordHash: hash('Citizen@123'), role: 'citizen', isVerified: true, reputationPoints: 30 });
    const citizen3 = await User.create({ name: 'Sneha K', email: 'citizen3@example.com', phone: '9333333333', passwordHash: hash('Citizen@123'), role: 'citizen', isVerified: true, reputationPoints: 20 });

    // Keep a stable default login used across the app + tests.
    await User.create({ name: 'Test User', email: 'test@example.com', phone: '1234567890', passwordHash: hash('Password123'), role: 'citizen', isVerified: true });

    const reporters = { citizen1, citizen2, citizen3 };

    // 3) Issues + votes + comments
    const catDept = (category) => {
      const dept = DEPARTMENTS.find((d) => d.category.includes(category));
      return dept ? deptMap[dept.name] : null;
    };

    for (const demo of DEMO_ISSUES) {
      const dept = catDept(demo.category);
      const createdAt = new Date(Date.now() - Math.floor(Math.random() * 20) * 24 * 60 * 60 * 1000);

      const issue = await Issue.create({
        title: demo.title,
        description: demo.description,
        category: demo.category,
        severity: demo.severity,
        aiConfidence: 0.85,
        summary: `${demo.title}. ${demo.description.split('.')[0]}.`,
        suggestedAction: SEVERITY_META[demo.severity].action,
        safetyRisk: SEVERITY_META[demo.severity].safetyRisk,
        recommendedDepartment: dept ? dept.name : 'General Administration',
        images: [],
        address: demo.address,
        location: { type: 'Point', coordinates: [demo.loc.lng, demo.loc.lat] },
        reportedBy: reporters[demo.reporter]._id,
        department: dept ? dept._id : null,
        status: demo.status,
        resolvedAt: demo.status === 'resolved' ? new Date() : null,
        resolutionNotes: demo.status === 'resolved' ? 'Work completed and site verified.' : '',
        statusHistory: buildHistory(demo.status, reporters[demo.reporter]._id),
        createdAt,
        updatedAt: createdAt,
      });

      // Priority score reflects votes + severity + age.
      issue.votesCount = demo.votes;
      issue.priorityScore = computePriorityScore(demo.votes, demo.severity, createdAt);
      await issue.save();

      // Create a handful of actual Vote documents (up to 6) so voting behaves realistically.
      const voters = [officers[0], citizen1, citizen2, citizen3, admin].filter((v) => v._id.toString() !== reporters[demo.reporter]._id.toString());
      const voteCount = Math.min(demo.votes, voters.length);
      for (let i = 0; i < voteCount; i++) {
        await Vote.create({ issue: issue._id, user: voters[i]._id });
      }

      // Add a couple of comments for engagement.
      await Comment.create([
        { issue: issue._id, user: citizen2._id, text: 'Same problem here, people are struggling daily.' },
        { issue: issue._id, user: citizen3._id, text: 'Please prioritize this, it is getting worse.' },
      ]);
    }

    console.log('[Seed] Demo data ready.');
    console.log('[Seed] ────────────────────────────────────────────');
    console.log('[Seed] Admin   : admin@civicconnect.gov.in / Admin@123');
    console.log('[Seed] Officer : roads.officer@citygov.in / Officer@123');
    console.log('[Seed] Officer : sanitation.officer@citygov.in / Officer@123');
    console.log('[Seed] Officer : water.officer@citygov.in / Officer@123');
    console.log('[Seed] Citizen : test@example.com / Password123');
    console.log('[Seed] Citizen : citizen1@example.com / Citizen@123');
    console.log('[Seed] ────────────────────────────────────────────');
  } catch (e) {
    console.error('[Seed] Error seeding database:', e);
  }
};
