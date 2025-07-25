const express = require('express');
const app = express();

// Importa a configuração do banco de dados
const sequelize = require('./config/db');

// Importa o model Projeto
const Projeto = require('./models/Projeto');

// Testa conexão com o banco
sequelize.authenticate()
  .then(() => console.log('Conexão com o banco de dados estabelecida!'))
  .catch((err) => console.error('Erro na conexão com banco:', err));

// Sincroniza os models com o banco de dados
sequelize.sync()
  .then(() => console.log('Model Projeto sincronizado com o banco!'))
  .catch((err) => console.error('Erro ao sincronizar modelo Projeto:', err));

// Permite receber JSON no body das requisições
app.use(express.json());

// Rota de teste
app.get('/', (req, res) => {
  res.send('Backend rodando!');
});

// Rota para listar todos os projetos
app.get('/projetos', async (req, res) => {
  try {
    const projetos = await Projeto.findAll();
    res.json(projetos);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar projetos', details: err });
  }
});

// Rota para criar um novo projeto
app.post('/projetos', async (req, res) => {
  try {
    const { nome, descricao } = req.body;
    const novoProjeto = await Projeto.create({ nome, descricao });
    res.status(201).json(novoProjeto);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar projeto', details: err });
  }
});

// Porta do servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});