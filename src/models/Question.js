const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    sphereId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sphere',
      required: true,
    },
    type: {
      type: String,
      enum: ['MCQ', 'CODE', 'TEXT', 'BOOL'],
      required: true,
      default: 'MCQ',
    },
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    // For MCQ: array of option strings
    options: [
      {
        type: String,
        trim: true,
      },
    ],
    // For MCQ: index of correct option, or string matching option
    // For CODE: expected output or test cases
    // For TEXT: expected answer string
    // For BOOL: true/false
    correctAnswer: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    // For CODE questions
    codeLanguage: {
      type: String,
      enum: ['javascript', 'python', 'cpp'],
    },
    starterCode: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;

