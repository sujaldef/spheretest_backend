const { body, validationResult } = require('express-validator');

/**
 * Validation middleware to check for errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(
      'Validation failed: ' +
        errors
          .array()
          .map((e) => `${e.param}: ${e.msg}`)
          .join(', '),
    );
  }
  next();
};

/**
 * Validation rules for user registration
 */
const validateRegister = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Email is invalid'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'student'])
    .withMessage('Role must be admin or student'),
  handleValidationErrors,
];

/**
 * Validation rules for user login
 */
const validateLogin = [
  body('email').isEmail().withMessage('Email is invalid'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

/**
 * Validation rules for creating a sphere
 */
const validateCreateSphere = [
  body('title').notEmpty().withMessage('Title is required'),
  body('type')
    .optional()
    .isIn(['mcq', 'coding', 'mixed'])
    .withMessage('Type must be mcq, coding, or mixed'),
  body('duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive number'),
  handleValidationErrors,
];

/**
 * Validation rules for creating a question
 */
const validateCreateQuestion = [
  body('sphereId').notEmpty().withMessage('SphereId is required'),
  body('questionText').notEmpty().withMessage('Question text is required'),
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['MCQ', 'CODE', 'TEXT', 'BOOL'])
    .withMessage('Type must be MCQ, CODE, TEXT, or BOOL'),
  handleValidationErrors,
];

/**
 * Validation rules for updating a question
 */
const validateUpdateQuestion = [
  body('questionText')
    .optional()
    .notEmpty()
    .withMessage('Question text cannot be empty'),
  body('type')
    .optional()
    .isIn(['MCQ', 'CODE', 'TEXT', 'BOOL'])
    .withMessage('Type must be MCQ, CODE, TEXT, or BOOL'),
  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateCreateSphere,
  validateCreateQuestion,
  validateUpdateQuestion,
  handleValidationErrors,
};
