const router = require('express').Router();
const { body, param } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { requireAnyField } = validate;
const c = require('../controllers/patientController');

const idParam = param('id').isInt({ min: 1 }).withMessage('id must be a positive integer');

const phoneRule = (chain) =>
  chain.matches(/^[0-9+\-\s()]{7,20}$/).withMessage('Phone must be 7-20 characters (digits, +, -, spaces, brackets)');

const createRules = [
  body('name').isString().trim().isLength({ min: 1, max: 100 }).withMessage('Name is required (max 100 characters)'),
  body('age').isInt({ min: 0, max: 150 }).withMessage('Age must be a whole number between 0 and 150'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Gender must be male, female or other'),
  phoneRule(body('phone').optional({ values: 'null' })),
  body('address').optional({ values: 'null' }).isString().isLength({ max: 500 }).withMessage('Address must be text (max 500 characters)'),
  body('medicalHistory').optional({ values: 'null' }).isString().isLength({ max: 2000 }).withMessage('Medical history must be text (max 2000 characters)'),
];

// Fields are optional on update, but validated whenever they are sent
const updateRules = [
  body('name').optional().isString().trim().isLength({ min: 1, max: 100 }).withMessage('Name cannot be empty (max 100 characters)'),
  body('age').optional().isInt({ min: 0, max: 150 }).withMessage('Age must be a whole number between 0 and 150'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Gender must be male, female or other'),
  phoneRule(body('phone').optional({ values: 'null' })),
  body('address').optional({ values: 'null' }).isString().isLength({ max: 500 }).withMessage('Address must be text (max 500 characters)'),
  body('medicalHistory').optional({ values: 'null' }).isString().isLength({ max: 2000 }).withMessage('Medical history must be text (max 2000 characters)'),
];

const UPDATABLE = ['name', 'age', 'gender', 'phone', 'address', 'medicalHistory'];

router.use(auth);
router.post('/', createRules, validate, c.create);
router.get('/', c.list);
router.get('/:id', idParam, validate, c.getOne);
router.put('/:id', idParam, requireAnyField(UPDATABLE), updateRules, validate, c.update);
router.delete('/:id', idParam, validate, c.remove);

module.exports = router;
