const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Corte = sequelize.define('Corte', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  projeto_id: { type: DataTypes.INTEGER },
  tipologia_id: { type: DataTypes.INTEGER },
  material_id: { type: DataTypes.INTEGER },
  medida: { type: DataTypes.FLOAT }, // milímetros, centímetros, etc.
  observacao: { type: DataTypes.TEXT }
}, {
  tableName: 'cortes',
  timestamps: true
});

module.exports = Corte;