const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Marmoraria = sequelize.define('Marmoraria', {
  nome_peca: { type: DataTypes.STRING, allowNull: false },
  tipo_material: { type: DataTypes.STRING, allowNull: false },
  dimensoes: { type: DataTypes.STRING },
  acabamento: { type: DataTypes.STRING },
  preco: { type: DataTypes.FLOAT },
  observacoes: { type: DataTypes.TEXT }
}, {
  tableName: 'marmoraria',
  timestamps: false
});

module.exports = Marmoraria;