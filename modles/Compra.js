const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Compra = sequelize.define('Compra', {
  fornecedor: { type: DataTypes.STRING, allowNull: false },
  tipo_material: { type: DataTypes.STRING }, // Perfil, vidro, acessório
  descricao: { type: DataTypes.STRING },
  quantidade: { type: DataTypes.FLOAT },
  valor_total: { type: DataTypes.DECIMAL(10,2) },
  data_compra: { type: DataTypes.DATE },
}, {
  tableName: 'compras'
});

module.exports = Compra;