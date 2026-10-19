const { Mapping, Patient, Doctor } = require('../models');

// Assign a doctor to one of the user's own patients
exports.create = async (req, res, next) => {
  try {
    const { patientId, doctorId } = req.body;

    const patient = await Patient.findOne({ where: { id: patientId, createdBy: req.user.id } });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    const [mapping, created] = await Mapping.findOrCreate({ where: { patientId, doctorId } });
    if (!created) {
      return res.status(409).json({ success: false, message: 'This doctor is already assigned to this patient' });
    }

    res.status(201).json({ success: true, message: 'Doctor assigned to patient', data: mapping });
  } catch (err) {
    next(err);
  }
};

// All mappings for the logged-in user's patients
exports.list = async (req, res, next) => {
  try {
    const mappings = await Mapping.findAll({
      include: [
        { model: Patient, where: { createdBy: req.user.id }, attributes: ['id', 'name'] },
        { model: Doctor, attributes: ['id', 'name', 'specialization'] },
      ],
      order: [['id', 'ASC']],
    });
    res.json({ success: true, count: mappings.length, data: mappings });
  } catch (err) {
    next(err);
  }
};

// All doctors assigned to a specific patient
exports.byPatient = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ where: { id: req.params.patient_id, createdBy: req.user.id } });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const mappings = await Mapping.findAll({
      where: { patientId: patient.id },
      include: [{ model: Doctor }],
      order: [['id', 'ASC']],
    });

    res.json({
      success: true,
      patient: { id: patient.id, name: patient.name },
      count: mappings.length,
      data: mappings.map((m) => ({ mappingId: m.id, doctor: m.Doctor })),
    });
  } catch (err) {
    next(err);
  }
};

// Remove a doctor from a patient (by mapping id)
exports.remove = async (req, res, next) => {
  try {
    const mapping = await Mapping.findByPk(req.params.id, {
      include: [{ model: Patient, where: { createdBy: req.user.id }, attributes: ['id'] }],
    });
    if (!mapping) return res.status(404).json({ success: false, message: 'Mapping not found' });

    await mapping.destroy();
    res.json({ success: true, message: 'Doctor removed from patient' });
  } catch (err) {
    next(err);
  }
};
