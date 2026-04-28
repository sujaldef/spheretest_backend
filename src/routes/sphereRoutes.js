const express = require('express');
const {
  createSphere,
  getSpheres,
  getSphereById,
  getSphereByCode,
  joinSphere,
  updateSphere,
  deleteSphere,
} = require('../controllers/sphereController');
const { protect } = require('../middleware/auth');
const { validateCreateSphere } = require('../middleware/validation');

const router = express.Router();

router.post('/', protect, validateCreateSphere, createSphere);
router.get('/', getSpheres);
router.get('/code/:code', getSphereByCode);
router.get('/:id', getSphereById);
router.put('/:id', protect, updateSphere);
router.post('/join', protect, joinSphere);
router.delete('/:id', protect, deleteSphere);

module.exports = router;
