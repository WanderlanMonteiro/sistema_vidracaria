const express = require('express');
const app = express();

// Importa a configuração do banco de dados
const sequelize = require('./config/db');

// Importa os models necessários
const Projeto = require('./models/Projeto');
const Tipologia = require('./models/Tipologia');
const Material = require('./models/Material');
const Usuario = require('./models/Usuario');
const Corte = require('./models/Corte');

// Testa conexão com o banco
sequelize.authenticate()
  .then(() => console.log('Conexão com o banco de dados estabelecida!'))
  .catch((err) => console.error('Erro na conexão com banco:', err));

// Permite receber JSON no body das requisições
app.use(express.json());

// Rotas Projeto
app.get('/projetos', async (req, res) => {
  try {
    const projetos = await Projeto.findAll();
    res.json(projetos);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar projetos', details: err });
  }
});

app.post('/projetos', async (req, res) => {
  try {
    const { nome, descricao } = req.body;
    const novoProjeto = await Projeto.create({ nome, descricao });
    res.status(201).json(novoProjeto);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar projeto', details: err });
  }
});

// Rotas Tipologia
app.get('/tipologias', async (req, res) => {
  try {
    const tipologias = await Tipologia.findAll();
    res.json(tipologias);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar tipologias', details: err });
  }
});

app.post('/tipologias', async (req, res) => {
  try {
    const { nome, descricao } = req.body;
    const novaTipologia = await Tipologia.create({ nome, descricao });
    res.status(201).json(novaTipologia);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar tipologia', details: err });
  }
});

// Rotas Material
app.get('/materiais', async (req, res) => {
  try {
    const materiais = await Material.findAll();
    res.json(materiais);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar materiais', details: err });
  }
});

app.post('/materiais', async (req, res) => {
  try {
    const { nome, tipo, descricao } = req.body;
    const novoMaterial = await Material.create({ nome, tipo, descricao });
    res.status(201).json(novoMaterial);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar material', details: err });
  }
});

// Rotas Usuario
app.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await Usuario.findAll();
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar usuários', details: err });
  }
});

app.post('/usuarios', async (req, res) => {
  try {
    const { nome, email, senha, tipo } = req.body;
    const novoUsuario = await Usuario.create({ nome, email, senha, tipo });
    res.status(201).json(novoUsuario);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar usuário', details: err });
  }
});

// Rotas Corte
app.get('/cortes', async (req, res) => {
  try {
    const cortes = await Corte.findAll();
    res.json(cortes);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar cortes', details: err });
  }
});

app.post('/cortes', async (req, res) => {
  try {
    const { projeto_id, tipologia_id, material_id, medida, observacao } = req.body;
    const novoCorte = await Corte.create({ projeto_id, tipologia_id, material_id, medida, observacao });
    res.status(201).json(novoCorte);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar corte', details: err });
  }
});

// Porta do servidor
const PORT = process.env.PORT || 3001;

// Sincroniza todos os models e inicia o servidor só depois
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Todos os models sincronizados com o banco!');
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Erro ao sincronizar models:', err);
  });