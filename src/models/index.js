const sequelize = require('../config/db');
const User = require('./User');
const Patient = require('./Patient');
const Doctor = require('./Doctor');
const Mapping = require('./Mapping');

// User 1 --- * Patient (patients created by a user)
User.hasMany(Patient, { foreignKey: { name: 'createdBy', allowNull: false }, onDelete: 'CASCADE' });
Patient.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// User 1 --- * Doctor (doctors created by a user)
User.hasMany(Doctor, { foreignKey: { name: 'createdBy', allowNull: false }, onDelete: 'CASCADE' });
Doctor.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Patient * --- * Doctor through Mapping
Patient.hasMany(Mapping, { foreignKey: { name: 'patientId', allowNull: false }, onDelete: 'CASCADE' });
Mapping.belongsTo(Patient, { foreignKey: 'patientId' });
Doctor.hasMany(Mapping, { foreignKey: { name: 'doctorId', allowNull: false }, onDelete: 'CASCADE' });
Mapping.belongsTo(Doctor, { foreignKey: 'doctorId' });

module.exports = { sequelize, User, Patient, Doctor, Mapping };
