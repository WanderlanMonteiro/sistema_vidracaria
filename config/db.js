const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  'postgres', // nome do banco de dados (ou 'wmvidrosemarmore' se quiser usar o outro banco)
  'wmdshere', // usuário completo para conectar no Azure
  'idss2010@', // senha fornecida
  {
    host: 'vidracaria-marmore.postgres.database.azure.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false } // Azure exige SSL
    },
    logging: false // desabilita logs SQL; mude para true se quiser ver comandos executados
  }
);

module.exports = sequelize;