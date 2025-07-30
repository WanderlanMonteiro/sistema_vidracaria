const Projeto = require('../models/Projeto');
const Corte = require('../models/Corte');
const Material = require('../models/Material');
const Tipologia = require('../models/Tipologia');

// Lista todos os projetos
exports.listarProjetos = async (req, res) => {
  try {
    const projetos = await Projeto.findAll();
    res.json(projetos);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar projetos', details: err });
  }
};

// Cria um novo projeto
exports.criarProjeto = async (req, res) => {
  try {
    const { nome, descricao } = req.body;
    const novoProjeto = await Projeto.create({ nome, descricao });
    res.status(201).json(novoProjeto);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar projeto', details: err });
  }
};

// Calcula o orçamento de um projeto
exports.calcularOrcamento = async (req, res) => {
  try {
    const projetoId = req.params.id;
    const projeto = await Projeto.findByPk(projetoId, {
      include: [
        { model: Corte, include: [Material, Tipologia] }
      ]
    });

    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    let total = 0;

    // Percorre todos os cortes do projeto
    projeto.Cortes.forEach(corte => {
      const precoMaterial = corte.Material.preco || 0; // Certifique-se que Material tem campo preco
      let precoCorte = corte.medida * precoMaterial;

      // Tipologia pode influenciar no preço (exemplo)
      if (corte.Tipologia && corte.Tipologia.nome === "Temperado") precoCorte *= 1.2;
      if (corte.Tipologia && corte.Tipologia.nome === "Blindex") precoCorte *= 1.5;

      total += precoCorte;
    });

    res.json({ valor_total: total });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao calcular orçamento', details: err });
  }
};