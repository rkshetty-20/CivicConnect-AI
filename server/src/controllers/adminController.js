import bcrypt from 'bcryptjs';
import Department from '../models/Department.js';
import User from '../models/User.js';
import Issue from '../models/Issue.js';

// @desc    Create a new department
// @route   POST /api/admin/departments
// @access  Private (Admin)
export const createDepartment = async (req, res) => {
  const { name, category, contactEmail } = req.body;

  try {
    const existing = await Department.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: 'Department already exists' });
    }

    const dept = await Department.create({
      name,
      category: category || [],
      contactEmail,
    });

    res.status(201).json(dept);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all departments
// @route   GET /api/admin/departments
// @access  Private (Admin)
export const getDepartments = async (req, res) => {
  try {
    const depts = await Department.find({}).sort({ name: 1 });
    res.json(depts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register a new government officer
// @route   POST /api/admin/officers
// @access  Private (Admin)
export const registerOfficer = async (req, res) => {
  const { name, email, phone, password, departmentId } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const dept = await Department.findById(departmentId);
    if (!dept) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const officer = await User.create({
      name,
      email,
      phone,
      passwordHash,
      role: 'officer',
      isVerified: true, // Officers are auto-verified
      department: departmentId,
    });

    // Increment officersCount in Department
    dept.officersCount = (dept.officersCount || 0) + 1;
    await dept.save();

    res.status(201).json({
      _id: officer._id,
      name: officer.name,
      email: officer.email,
      role: officer.role,
      department: dept.name,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all officers
// @route   GET /api/admin/officers
// @access  Private (Admin)
export const getOfficers = async (req, res) => {
  try {
    const officers = await User.find({ role: 'officer' })
      .populate('department', 'name')
      .sort({ createdAt: -1 });
    res.json(officers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get flagged fake reports
// @route   GET /api/admin/fake-reports
// @access  Private (Admin)
export const getFakeReports = async (req, res) => {
  try {
    const fakes = await Issue.find({ isFake: true })
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(fakes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resolve or dismiss flagged fake report
// @route   PATCH /api/admin/fake-reports/:id/resolve
// @access  Private (Admin)
export const resolveFakeReport = async (req, res) => {
  const { action } = req.body; // 'dismiss' (keep issue, mark isFake = false) or 'delete' (remove issue)

  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    if (action === 'delete') {
      await issue.deleteOne();
      return res.json({ message: 'Flagged issue deleted successfully' });
    } else if (action === 'dismiss') {
      issue.isFake = false;
      await issue.save();
      return res.json({ message: 'Flagged issue cleared of fake status', issue });
    } else {
      return res.status(400).json({ message: 'Invalid action. Must be delete or dismiss.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
