const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Patient = sequelize.define(
  'Patient',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    age: { type: DataTypes.INTEGER, allowNull: false },
    gender: { type: DataTypes.ENUM('male', 'female', 'other'), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    medicalHistory: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'patients', timestamps: true }
);

module.exports = Patient;
