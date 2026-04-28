const express = require('express');
const {
  createQuestion,
  getQuestionsBySphere,
  updateQuestion,
  deleteQuestion,
} = require('../controllers/questionController');
const { protect } = require('../middleware/auth');
const {
  validateCreateQuestion,
  validateUpdateQuestion,
} = require('../middleware/validation');

const router = express.Router();

router.post('/', protect, validateCreateQuestion, createQuestion);
router.get('/:sphereId', getQuestionsBySphere);
router.put('/:id', protect, validateUpdateQuestion, updateQuestion);
router.delete('/:id', protect, deleteQuestion);

module.exports = router;
