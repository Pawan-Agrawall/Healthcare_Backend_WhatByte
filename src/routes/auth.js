const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { register, login } = require('../controllers/authController');

router.post(
  '/register',
  [
    body('name').isString().trim().isLength({ min: 1, max: 100 }).withMessage('Name is required (max 100 characters)'),
    body('email').isString().trim().isEmail().withMessage('A valid email is required'),
    body('password').isString().isLength({ min: 6, max: 72 }).withMessage('Password must be 6-72 characters'),
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    body('email').isString().trim().isEmail().withMessage('A valid email is required'),
    body('password').isString().notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

module.exports = router;
