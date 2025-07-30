const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Tipologia = sequelize.define('Tipologia', {
  nome: { type: DataTypes.STRING, allowNull: false },
  descricao: { type: DataTypes.TEXT },
  linhas_mercado: { type: DataTypes.STRING }, // Ex: Suprema, Gold, etc.
  modelo: { type: DataTypes.STRING },
  medidas_padrao: { type: DataTypes.JSON }, // Ex: { altura: 1000, largura: 2000 }
}, {
  tableName: 'tipologias'
});

module.exports = Tipologia;