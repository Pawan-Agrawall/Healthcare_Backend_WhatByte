const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Mapping = sequelize.define(
  'Mapping',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  },
  {
    tableName: 'mappings',
    timestamps: true,
    // A doctor can be assigned to the same patient only once
    indexes: [{ unique: true, fields: ['patientId', 'doctorId'] }],
  }
);

module.exports = Mapping;
