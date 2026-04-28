const User = require('../models/User');
const { asyncHandler } = require('../utils/errorHandler');

// @desc    Create a new user
// @route   POST /api/users
// @access  Public (adjust as needed later)
const createUser = asyncHandler(async (req, res) => {
  const { name, email, role } = req.body;

  if (!name || !email || !role) {
    res.status(400);
    throw new Error('Name, email, and role are required');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(409);
    throw new Error('User with this email already exists');
  }

  const user = await User.create({ name, email, role });

  res.status(201).json(user);
});

// @desc    Get all users
// @route   GET /api/users
// @access  Public (adjust as needed later)
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.status(200).json(users);
});

module.exports = {
  createUser,
  getUsers,
};

