const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Material = sequelize.define('Material', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nome: { type: DataTypes.STRING, allowNull: false },
  tipo: { type: DataTypes.STRING }, // vidro, perfil, acessório, etc.
  descricao: { type: DataTypes.TEXT }
}, {
  tableName: 'materiais',
  timestamps: true
});

module.exports = Material;