const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Folga = sequelize.define('Folga', {
  projeto_id: { type: DataTypes.INTEGER },
  tipologia_id: { type: DataTypes.INTEGER },
  tipo_corte: { type: DataTypes.STRING }, // Perfil, vidro, etc.
  valor_mm: { type: DataTypes.FLOAT },
}, {
  tableName: 'folgas'
});

module.exports = Folga;