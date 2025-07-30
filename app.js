const express = require('express');
const app = express();

// Importa a configuração do banco de dados
const sequelize = require('./config/db');

// Importa os models necessários
const Projeto = require('./models/Projeto');
// Adicione os outros models que você criou:
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

// Suas rotas aqui...
app.get('/', (req, res) => {
  res.send('Backend rodando!');
});

// Exemplo rota de projetos
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
  const express = require('express');
const app = express();

// Importa a configuração do banco de dados
const sequelize = require('./config/db');

// Importa os models necessários
const Projeto = require('./models/Projeto');
// Adicione os outros models que você criou:
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

// Suas rotas aqui...
app.get('/', (req, res) => {
  res.send('Backend rodando!');
});

// Exemplo rota de projetos
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
  const express = require('express');
const app = express();

// Importa a configuração do banco de dados
const sequelize = require('./config/db');

// Importa os models necessários
const Projeto = require('./models/Projeto');
// Adicione os outros models que você criou:
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

// Suas rotas aqui...
app.get('/', (req, res) => {
  res.send('Backend rodando!');
});

// Exemplo rota de projetos
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
  const express = require('express');
const app = express();

// Importa a configuração do banco de dados
const sequelize = require('./config/db');

// Importa os models necessários
const Projeto = require('./models/Projeto');
// Adicione os outros models que você criou:
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

// Suas rotas aqui...
app.get('/', (req, res) => {
  res.send('Backend rodando!');
});

// Exemplo rota de projetos
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
  const express = require('express');
const app = express();

// Importa a configuração do banco de dados
const sequelize = require('./config/db');

// Importa os models necessários
const Projeto = require('./models/Projeto');
// Adicione os outros models que você criou:
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

// Suas rotas aqui...
app.get('/', (req, res) => {
  res.send('Backend rodando!');
});

// Exemplo rota de projetos
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