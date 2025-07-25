const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Importar modelos relacionados
const Tipologia = require('./Tipologia');
const CortePerfil = require('./CortePerfil');
const Folga = require('./Folga');
const MargemLucro = require('./MargemLucro');
const TemperaEnvio = require('./TemperaEnvio');

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
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tipologia_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true
  },
  margem_lucro: {
    type: DataTypes.DECIMAL(5,2),
    allowNull: true
  },
  customizacao: {
    type: DataTypes.JSON,
    allowNull: true
    // Exemplo: { medidas: '1000x2000', acessorios: 'Fechadura Y', folga: 3, observacoes: 'Vidro temperado' }
  }
}, {
  tableName: 'projetos'
});

// RELACIONAMENTOS
Projeto.belongsTo(Tipologia, { foreignKey: 'tipologia_id', as: 'tipologia' });
Tipologia.hasMany(Projeto, { foreignKey: 'tipologia_id', as: 'projetos' });

Projeto.hasMany(CortePerfil, { foreignKey: 'projeto_id', as: 'cortes' });
CortePerfil.belongsTo(Projeto, { foreignKey: 'projeto_id', as: 'projeto' });

Projeto.hasMany(Folga, { foreignKey: 'projeto_id', as: 'folgas' });
Folga.belongsTo(Projeto, { foreignKey: 'projeto_id', as: 'projeto' });

Projeto.hasOne(MargemLucro, { foreignKey: 'projeto_id', as: 'margem' });
MargemLucro.belongsTo(Projeto, { foreignKey: 'projeto_id', as: 'projeto' });

Projeto.hasMany(TemperaEnvio, { foreignKey: 'projeto_id', as: 'tempera_envios' });
TemperaEnvio.belongsTo(Projeto, { foreignKey: 'projeto_id', as: 'projeto' });

module.exports = Projeto;