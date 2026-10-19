const router = require('express').Router();
const { body, param } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { requireAnyField } = validate;
const c = require('../controllers/doctorController');

const idParam = param('id').isInt({ min: 1 }).withMessage('id must be a positive integer');

const phoneRule = (chain) =>
  chain.matches(/^[0-9+\-\s()]{7,20}$/).withMessage('Phone must be 7-20 characters (digits, +, -, spaces, brackets)');

const createRules = [
  body('name').isString().trim().isLength({ min: 1, max: 100 }).withMessage('Name is required (max 100 characters)'),
  body('specialization').isString().trim().isLength({ min: 1, max: 100 }).withMessage('Specialization is required (max 100 characters)'),
  body('email').isString().trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  phoneRule(body('phone').optional({ values: 'null' })),
  body('experienceYears').optional().isInt({ min: 0, max: 70 }).withMessage('experienceYears must be a whole number between 0 and 70'),
];

const updateRules = [
  body('name').optional().isString().trim().isLength({ min: 1, max: 100 }).withMessage('Name cannot be empty (max 100 characters)'),
  body('specialization').optional().isString().trim().isLength({ min: 1, max: 100 }).withMessage('Specialization cannot be empty (max 100 characters)'),
  body('email').optional().isString().trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  phoneRule(body('phone').optional({ values: 'null' })),
  body('experienceYears').optional().isInt({ min: 0, max: 70 }).withMessage('experienceYears must be a whole number between 0 and 70'),
];

const UPDATABLE = ['name', 'specialization', 'email', 'phone', 'experienceYears'];

router.use(auth);
router.post('/', createRules, validate, c.create);
router.get('/', c.list);
router.get('/:id', idParam, validate, c.getOne);
router.put('/:id', idParam, requireAnyField(UPDATABLE), updateRules, validate, c.update);
router.delete('/:id', idParam, validate, c.remove);

module.exports = router;
