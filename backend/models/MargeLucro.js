const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MargemLucro = sequelize.define('MargemLucro', {
  projeto_id: { type: DataTypes.INTEGER },
  percentual: { type: DataTypes.DECIMAL(5,2) },
}, {
  tableName: 'margens_lucro'
});

module.exports = MargemLucro;