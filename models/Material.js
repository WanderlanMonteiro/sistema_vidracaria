const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Importação dos outros models para criar os relacionamentos
const Corte = require('./Corte');

// Definição do model Material
const Material = sequelize.define('Material', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tipo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  descricao: {
    type: DataTypes.STRING,
    allowNull: true
  },
  preco: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'materiais',
  timestamps: false
});

// RELACIONAMENTOS
// Um Material pode estar em vários Cortes
Material.hasMany(Corte, {
  foreignKey: 'material_id',
  as: 'cortes'
});
Corte.belongsTo(Material, {
  foreignKey: 'material_id',
  as: 'material'
});

module.exports = Material;