const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TemperaEnvio = sequelize.define('TemperaEnvio', {
  projeto_id: { type: DataTypes.INTEGER },
  descricao_peca: { type: DataTypes.STRING },
  quantidade: { type: DataTypes.INTEGER },
  status: { type: DataTypes.STRING }, // Enviado, Aguardando, Recebido
  data_envio: { type: DataTypes.DATE },
}, {
  tableName: 'tempera_envios'
});

module.exports = TemperaEnvio;