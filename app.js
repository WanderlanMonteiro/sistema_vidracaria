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