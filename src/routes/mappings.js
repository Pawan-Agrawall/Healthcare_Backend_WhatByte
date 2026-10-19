const router = require('express').Router();
const { body, param } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const c = require('../controllers/mappingController');

router.use(auth);

router.post(
  '/',
  [
    body('patientId').isInt({ min: 1 }).withMessage('patientId must be a positive integer'),
    body('doctorId').isInt({ min: 1 }).withMessage('doctorId must be a positive integer'),
  ],
  validate,
  c.create
);
router.get('/', c.list);
router.get('/:patient_id', param('patient_id').isInt({ min: 1 }).withMessage('patient_id must be a positive integer'), validate, c.byPatient);
router.delete('/:id', param('id').isInt({ min: 1 }).withMessage('id must be a positive integer'), validate, c.remove);

module.exports = router;
