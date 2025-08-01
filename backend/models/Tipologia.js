const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Tipologia = sequelize.define('Tipologia', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nome: { type: DataTypes.STRING, allowNull: false },
  descricao: { type: DataTypes.TEXT }
}, {
  tableName: 'tipologias',
  timestamps: true
});

module.exports = Tipologia;