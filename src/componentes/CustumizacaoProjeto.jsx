import React, { useState } from 'react';

const CustomizacaoProjeto = ({ projeto }) => {
  const [medidas, setMedidas] = useState(projeto?.customizacao?.medidas || '');
  const [acessorios, setAcessorios] = useState(projeto?.customizacao?.acessorios || '');
  const [folga, setFolga] = useState(projeto?.customizacao?.folga || '');
  const [observacoes, setObservacoes] = useState(projeto?.customizacao?.observacoes || '');

  const handleSave = async () => {
    // Chamar API para atualizar customização do projeto (PUT /projetos/:id)
    // Enviar customizacao: { medidas, acessorios, folga, observacoes }
  };

  return (
    <div>
      <h2>Customização do Projeto</h2>
      <label>Medidas Especiais:</label>
      <input value={medidas} onChange={e => setMedidas(e.target.value)} />

      <label>Acessórios:</label>
      <input value={acessorios} onChange={e => setAcessorios(e.target.value)} />

      <label>Folga (mm):</label>
      <input value={folga} onChange={e => setFolga(e.target.value)} type="number" />

      <label>Observações:</label>
      <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} />

      <button onClick={handleSave}>Salvar Customização</button>
    </div>
  );
};

export default CustomizacaoProjeto;