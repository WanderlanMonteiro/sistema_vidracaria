const Marmoraria = require('../models/marmoraria');

// Listar peças (web)
exports.listar = async (req, res) => {
  const pecas = await Marmoraria.findAll();
  res.render('marmoraria', { pecas });
};

// Cadastrar peça (web)
exports.cadastrar = async (req, res) => {
  await Marmoraria.create(req.body);
  res.redirect('/marmoraria');
};

// Listar peças (API)
exports.apiListar = async (req, res) => {
  const pecas = await Marmoraria.findAll();
  res.json(pecas);
};

// Cadastrar peça (API)
exports.apiCadastrar = async (req, res) => {
  const nova = await Marmoraria.create(req.body);
  res.status(201).json(nova);
};