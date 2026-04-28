const mongoose = require('mongoose');

const sphereSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['mcq', 'coding', 'mixed'],
      default: 'mcq',
    },
    gameCode: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number,
      default: 60, // minutes (used if endTime not set)
    },
    maxPlayers: {
      type: Number,
      default: 50,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    security: {
      faceId: {
        type: Boolean,
        default: false,
      },
      fullscreen: {
        type: Boolean,
        default: false,
      },
      tabSwitchDetection: {
        type: Boolean,
        default: false,
      },
    },
    sessionStatus: {
      type: String,
      enum: ['DRAFT', 'UPCOMING', 'ACTIVE', 'ENDED'],
      default: 'DRAFT', // DRAFT: no startTime, UPCOMING: waiting for startTime, ACTIVE: session started, ENDED: session completed
    },
    actualStartTime: {
      type: Date, // Records when session actually started (via manual button or auto-start)
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
  },
);

// Generate unique game code before saving (always generate if not provided)
sphereSchema.pre('save', async function (next) {
  if (!this.gameCode || this.gameCode.trim() === '') {
    // Generate a 6-character alphanumeric code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const existing = await mongoose
        .model('Sphere')
        .findOne({ gameCode: code });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return next(new Error('Failed to generate unique game code'));
    }

    this.gameCode = code;
  }
  next();
});

const Sphere = mongoose.model('Sphere', sphereSchema);

module.exports = Sphere;
