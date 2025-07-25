const express = require('express');
const app = express();
const sequelize = require('./config/db');

// Testar conexão com o banco
sequelize.authenticate()
  .then(() => console.log('Conexão com o banco de dados estabelecida!'))
  .catch((err) => console.error('Erro na conexão com banco:', err));

app.use(express.json());

// Endpoint de teste
app.get('/', (req, res) => {
  res.send('Backend rodando!');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});


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
// Listar todos os projetos
app.get('/projetos', async (req, res) => {
  try {
    const projetos = await Projeto.findAll();
    res.json(projetos);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar projetos', details: err });
  }
});

// Criar um novo projeto
app.post('/projetos', async (req, res) => {
  try {
    const { nome, descricao } = req.body;
    const novoProjeto = await Projeto.create({ nome, descricao });
    res.status(201).json(novoProjeto);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar projeto', details: err });
  }
});