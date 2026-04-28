const express = require('express');
const { createUser, getUsers } = require('../controllers/userController');
const { protect, roleCheck } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, roleCheck('admin'), createUser);
router.get('/', protect, getUsers);

module.exports = router;
