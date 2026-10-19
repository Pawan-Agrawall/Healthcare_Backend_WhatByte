const { Doctor } = require('../models');

const FIELDS = ['name', 'specialization', 'email', 'phone', 'experienceYears'];
const pick = (body) => Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

exports.create = async (req, res, next) => {
  try {
    const doctor = await Doctor.create({ ...pick(req.body), createdBy: req.user.id });
    res.status(201).json({ success: true, message: 'Doctor created', data: doctor });
  } catch (err) {
    next(err);
  }
};

// Any authenticated user can see all doctors
exports.list = async (req, res, next) => {
  try {
    const doctors = await Doctor.findAll({ order: [['id', 'ASC']] });
    res.json({ success: true, count: doctors.length, data: doctors });
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const doctor = await Doctor.findByPk(req.params.id);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, data: doctor });
  } catch (err) {
    next(err);
  }
};

// Only the user who added a doctor can edit or delete that doctor
exports.update = async (req, res, next) => {
  try {
    const doctor = await Doctor.findByPk(req.params.id);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    if (doctor.createdBy !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only modify doctors you created' });
    }
    await doctor.update(pick(req.body));
    res.json({ success: true, message: 'Doctor updated', data: doctor });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const doctor = await Doctor.findByPk(req.params.id);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    if (doctor.createdBy !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only delete doctors you created' });
    }
    await doctor.destroy();
    res.json({ success: true, message: 'Doctor deleted' });
  } catch (err) {
    next(err);
  }
};
