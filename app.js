const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Projeto = sequelize.define('Projeto', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Adicione outros campos conforme sua necessidade
}, {
  tableName: 'projetos',
  timestamps: true // cria campos createdAt e updatedAt automaticamente
});

module.exports = Projeto;