const express = require('express');
const router = express.Router();

const Projeto = require('../models/Projeto');
const Tipologia = require('../models/Tipologia');
const CortePerfil = require('../models/CortePerfil');
const Folga = require('../models/Folga');
const MargemLucro = require('../models/MargemLucro');
const TemperaEnvio = require('../models/TemperaEnvio');

// Criar projeto
router.post('/', async (req, res) => {
  try {
    const projeto = await Projeto.create(req.body); // tipologia_id pode estar no body
    res.status(201).json(projeto);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Listar projetos com todas as relações (joins)
router.get('/', async (req, res) => {
  try {
    const projetos = await Projeto.findAll({
      include: [
        { model: Tipologia, as: 'tipologia' },
        { model: CortePerfil, as: 'cortes' },
        { model: Folga, as: 'folgas' },
        { model: MargemLucro, as: 'margem' },
        { model: TemperaEnvio, as: 'tempera_envios' }
      ]
    });
    res.json(projetos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Buscar projeto por ID com todas as relações
router.get('/:id', async (req, res) => {
  try {
    const projeto = await Projeto.findByPk(req.params.id, {
      include: [
        { model: Tipologia, as: 'tipologia' },
        { model: CortePerfil, as: 'cortes' },
        { model: Folga, as: 'folgas' },
        { model: MargemLucro, as: 'margem' },
        { model: TemperaEnvio, as: 'tempera_envios' }
      ]
    });
    if (!projeto) return res.status(404).json({ error: 'Projeto não encontrado' });
    res.json(projeto);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar projeto
router.put('/:id', async (req, res) => {
  try {
    await Projeto.update(req.body, { where: { id: req.params.id } });
    const projeto = await Projeto.findByPk(req.params.id, {
      include: [
        { model: Tipologia, as: 'tipologia' },
        { model: CortePerfil, as: 'cortes' },
        { model: Folga, as: 'folgas' },
        { model: MargemLucro, as: 'margem' },
        { model: TemperaEnvio, as: 'tempera_envios' }
      ]
    });
    res.json(projeto);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Adicionar corte ao projeto
router.post('/:id/cortes', async (req, res) => {
  try {
    const corte = await CortePerfil.create({
      ...req.body,
      projeto_id: req.params.id
    });
    res.status(201).json(corte);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Adicionar folga ao projeto
router.post('/:id/folgas', async (req, res) => {
  try {
    const folga = await Folga.create({
      ...req.body,
      projeto_id: req.params.id
    });
    res.status(201).json(folga);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Definir margem de lucro do projeto
router.post('/:id/margem', async (req, res) => {
  try {
    const margem = await MargemLucro.create({
      ...req.body,
      projeto_id: req.params.id
    });
    res.status(201).json(margem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Adicionar envio para tempera ao projeto
router.post('/:id/tempera_envios', async (req, res) => {
  try {
    const envio = await TemperaEnvio.create({
      ...req.body,
      projeto_id: req.params.id
    });
    res.status(201).json(envio);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;