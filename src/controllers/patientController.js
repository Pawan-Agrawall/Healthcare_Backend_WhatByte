const { Patient } = require('../models');

const FIELDS = ['name', 'age', 'gender', 'phone', 'address', 'medicalHistory'];
const pick = (body) => Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

// Finds a patient only if it belongs to the logged-in user
const findOwned = (req) => Patient.findOne({ where: { id: req.params.id, createdBy: req.user.id } });

exports.create = async (req, res, next) => {
  try {
    const patient = await Patient.create({ ...pick(req.body), createdBy: req.user.id });
    res.status(201).json({ success: true, message: 'Patient created', data: patient });
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const patients = await Patient.findAll({ where: { createdBy: req.user.id }, order: [['id', 'ASC']] });
    res.json({ success: true, count: patients.length, data: patients });
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const patient = await findOwned(req);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    res.json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const patient = await findOwned(req);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    await patient.update(pick(req.body));
    res.json({ success: true, message: 'Patient updated', data: patient });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const patient = await findOwned(req);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    await patient.destroy();
    res.json({ success: true, message: 'Patient deleted' });
  } catch (err) {
    next(err);
  }
};
