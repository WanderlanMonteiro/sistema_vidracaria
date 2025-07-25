const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('postgres', 'wmdshere', 'Idss2010@', {
  host: 'vidracaria-marmore.postgres.database.azure.com',
  dialect: 'postgres',
  port: 5432,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

module.exports = sequelize;