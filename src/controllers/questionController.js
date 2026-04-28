const Question = require('../models/Question');
const Sphere = require('../models/Sphere');
const { asyncHandler } = require('../utils/errorHandler');

// @desc    Create a new question
// @route   POST /api/questions
// @access  Private
const createQuestion = asyncHandler(async (req, res) => {
  const {
    sphereId,
    type,
    questionText,
    options,
    correctAnswer,
    codeLanguage,
    starterCode,
  } = req.body;

  if (!sphereId || !questionText || !type) {
    res.status(400);
    throw new Error('sphereId, type, and questionText are required');
  }

  // Verify sphere exists
  const sphere = await Sphere.findById(sphereId);
  if (!sphere) {
    res.status(404);
    throw new Error('Sphere not found');
  }

  // Validate based on question type
  let questionData = {
    sphereId,
    type,
    questionText,
  };

  if (type === 'MCQ') {
    if (!options || !Array.isArray(options) || options.length < 2) {
      res.status(400);
      throw new Error('MCQ questions require at least 2 options');
    }
    if (correctAnswer === undefined || correctAnswer === null) {
      res.status(400);
      throw new Error('correctAnswer is required for MCQ');
    }
    questionData.options = options;
    questionData.correctAnswer = correctAnswer; // Can be index or string
  } else if (type === 'CODE') {
    if (!codeLanguage) {
      res.status(400);
      throw new Error('codeLanguage is required for CODE questions');
    }
    questionData.codeLanguage = codeLanguage;
    questionData.starterCode = starterCode || '';
    questionData.correctAnswer = correctAnswer || ''; // Expected output or test cases
  } else if (type === 'TEXT') {
    if (!correctAnswer) {
      res.status(400);
      throw new Error('correctAnswer is required for TEXT questions');
    }
    questionData.correctAnswer = correctAnswer; // Expected text answer
  } else if (type === 'BOOL') {
    if (typeof correctAnswer !== 'boolean') {
      res.status(400);
      throw new Error('correctAnswer must be boolean for BOOL questions');
    }
    questionData.correctAnswer = correctAnswer;
  } else {
    res.status(400);
    throw new Error('Invalid question type');
  }

  const question = await Question.create(questionData);

  res.status(201).json(question);
});

// @desc    Get all questions for a sphere
// @route   GET /api/questions/:sphereId
// @access  Public
const getQuestionsBySphere = asyncHandler(async (req, res) => {
  const { sphereId } = req.params;

  const questions = await Question.find({ sphereId }).sort({ createdAt: 1 });

  res.status(200).json(questions);
});

// @desc    Update a question
// @route   PUT /api/questions/:id
// @access  Private
const updateQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const question = await Question.findById(id);

  if (!question) {
    res.status(404);
    throw new Error('Question not found');
  }

  const sphere = await Sphere.findById(question.sphereId);
  if (!sphere) {
    res.status(404);
    throw new Error('Sphere not found');
  }

  if (sphere.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Forbidden');
  }

  // Update fields
  Object.keys(req.body).forEach((key) => {
    if (key !== '_id' && key !== 'sphereId') {
      question[key] = req.body[key];
    }
  });

  await question.save();

  res.status(200).json(question);
});

// @desc    Delete a question
// @route   DELETE /api/questions/:id
// @access  Private
const deleteQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const question = await Question.findById(id);

  if (!question) {
    res.status(404);
    throw new Error('Question not found');
  }

  const sphere = await Sphere.findById(question.sphereId);
  if (!sphere) {
    res.status(404);
    throw new Error('Sphere not found');
  }

  if (sphere.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Forbidden');
  }

  await question.deleteOne();

  res.status(200).json({ message: 'Question deleted successfully' });
});

module.exports = {
  createQuestion,
  getQuestionsBySphere,
  updateQuestion,
  deleteQuestion,
};
