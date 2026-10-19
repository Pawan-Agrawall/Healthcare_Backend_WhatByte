const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Doctor = sequelize.define(
  'Doctor',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    specialization: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    experienceYears: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { tableName: 'doctors', timestamps: true }
);

module.exports = Doctor;
