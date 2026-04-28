const Sphere = require('../models/Sphere');
const User = require('../models/User');
const { asyncHandler } = require('../utils/errorHandler');

// @desc    Create a new sphere
// @route   POST /api/spheres
// @access  Private
const createSphere = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    type,
    startTime,
    endTime,
    duration,
    maxPlayers,
    difficulty,
    security,
  } = req.body;

  if (!title) {
    res.status(400);
    throw new Error('Title is required');
  }

  const sphere = await Sphere.create({
    title,
    description,
    type: type || 'mcq',
    createdBy: req.user._id,
    participants: [],
    startTime: startTime ? new Date(startTime) : undefined,
    endTime: endTime ? new Date(endTime) : undefined,
    duration: duration || 60,
    maxPlayers: maxPlayers || 50,
    difficulty: difficulty || 'medium',
    security: {
      faceId: security?.faceId || false,
      fullscreen: security?.fullscreen || false,
      tabSwitchDetection: security?.tabSwitchDetection || false,
    },
  });

  await sphere.populate('createdBy', 'name email');
  await sphere.populate('participants', 'name email');

  res.status(201).json(sphere);
});

// @desc    Get all spheres
// @route   GET /api/spheres
// @access  Public
const getSpheres = asyncHandler(async (req, res) => {
  const spheres = await Sphere.find()
    .populate('createdBy', 'name email')
    .populate('participants', 'name email')
    .sort({ createdAt: -1 });
  res.status(200).json(spheres);
});

// @desc    Get a single sphere by ID
// @route   GET /api/spheres/:id
// @access  Public
const getSphereById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sphere = await Sphere.findById(id)
    .populate('createdBy', 'name email')
    .populate('participants', 'name email');

  if (!sphere) {
    res.status(404);
    throw new Error('Sphere not found');
  }

  res.status(200).json(sphere);
});

// @desc    Get sphere by game code
// @route   GET /api/spheres/code/:code
// @access  Public
const getSphereByCode = asyncHandler(async (req, res) => {
  const { code } = req.params;
  const sphere = await Sphere.findOne({ gameCode: code.toUpperCase() })
    .populate('createdBy', 'name email')
    .populate('participants', 'name email');

  if (!sphere) {
    res.status(404);
    throw new Error('Sphere not found');
  }

  res.status(200).json(sphere);
});

// @desc    Join a sphere by game code
// @route   POST /api/spheres/join
// @access  Private
const joinSphere = asyncHandler(async (req, res) => {
  const { gameCode } = req.body;

  if (!gameCode) {
    res.status(400);
    throw new Error('Game code is required');
  }

  const sphere = await Sphere.findOne({ gameCode: gameCode.toUpperCase() });

  if (!sphere) {
    res.status(404);
    throw new Error('Sphere not found');
  }

  // ✅ FIX #1: Prevent admin from joining their own sphere as participant
  if (sphere.createdBy.toString() === req.user._id.toString()) {
    res.status(403);
    throw new Error('Admin cannot join their own sphere as a participant');
  }

  // Check if user is already a participant
  if (sphere.participants.some((id) => id.equals(req.user._id))) {
    res.status(400);
    throw new Error('Already joined this sphere');
  }

  // Check max players
  if (sphere.participants.length >= sphere.maxPlayers) {
    res.status(400);
    throw new Error('Sphere is full');
  }

  // ✅ FIX #3: Compute current session state using time-based logic
  const now = new Date();
  let sessionStatus = 'DRAFT';
  let calculatedEndTime = sphere.endTime;

  if (sphere.startTime) {
    const startTime = new Date(sphere.startTime);

    // Determine endTime: explicit endTime takes priority over duration
    if (!calculatedEndTime) {
      calculatedEndTime = new Date(
        startTime.getTime() + sphere.duration * 60 * 1000,
      );
    } else {
      calculatedEndTime = new Date(calculatedEndTime);
    }

    // Determine current state: UPCOMING / ACTIVE / ENDED
    if (now < startTime) {
      sessionStatus = 'UPCOMING';
    } else if (now >= startTime && now < calculatedEndTime) {
      sessionStatus = 'ACTIVE';
      // ✅ FIX #3: Set actualStartTime automatically if not already set
      if (!sphere.actualStartTime) {
        sphere.actualStartTime = now;
        sphere.sessionStatus = 'ACTIVE';
        // Don't await, just update in background
        Sphere.findByIdAndUpdate(sphere._id, {
          actualStartTime: now,
          sessionStatus: 'ACTIVE',
        }).catch((err) =>
          console.error('Error updating actualStartTime:', err),
        );
      }
    } else {
      sessionStatus = 'ENDED';
    }

    // Reject join if session has already ended
    if (sessionStatus === 'ENDED') {
      res.status(400);
      throw new Error('Session has ended. No new joins allowed');
    }
  }
  // If no startTime, sphere is on-demand/always-open - allow join anytime (as long as not full)

  sphere.participants.push(req.user._id);
  await sphere.save();

  await sphere.populate('createdBy', 'name email');
  await sphere.populate('participants', 'name email');

  // ✅ FIX #1: Return sessionStatus for frontend to decide redirect
  res.status(200).json({
    ...sphere.toObject(),
    sessionStatus,
    startTime: sphere.startTime,
    endTime: calculatedEndTime,
    actualStartTime: sphere.actualStartTime,
  });
});

// @desc    Update a sphere by ID
// @route   PUT /api/spheres/:id
// @access  Private (only creator)
const updateSphere = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    type,
    startTime,
    endTime,
    duration,
    maxPlayers,
    difficulty,
    security,
  } = req.body;

  const sphere = await Sphere.findById(id);

  if (!sphere) {
    res.status(404);
    throw new Error('Sphere not found');
  }

  // Check if user is the creator
  if (sphere.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this sphere');
  }

  // Update allowed fields
  if (title) sphere.title = title;
  if (description) sphere.description = description;
  if (type) sphere.type = type;
  if (startTime) sphere.startTime = new Date(startTime);
  if (endTime) sphere.endTime = new Date(endTime);
  if (duration) sphere.duration = Number(duration);
  if (maxPlayers) sphere.maxPlayers = Number(maxPlayers);
  if (difficulty) sphere.difficulty = difficulty;
  if (security) sphere.security = security;

  await sphere.save();

  // Populate references and return
  await sphere.populate('createdBy', 'name email');
  await sphere.populate('participants', 'name email');

  res.status(200).json(sphere);
});

// @desc    Delete a sphere by ID
// @route   DELETE /api/spheres/:id
// @access  Private (only creator)
const deleteSphere = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const sphere = await Sphere.findById(id);

  if (!sphere) {
    res.status(404);
    throw new Error('Sphere not found');
  }

  // Check if user is the creator
  if (sphere.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this sphere');
  }

  await sphere.deleteOne();

  res.status(200).json({ message: 'Sphere deleted successfully' });
});

module.exports = {
  createSphere,
  getSpheres,
  getSphereById,
  getSphereByCode,
  joinSphere,
  updateSphere,
  deleteSphere,
};
