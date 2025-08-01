import React, { useState } from 'react';

function CadastrarTipologia({ onCadastro }) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [mensagem, setMensagem] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem('');
    try {
      const resposta = await fetch('http://localhost:3001/tipologias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, descricao }),
      });
      if (resposta.ok) {
        setMensagem('Tipologia cadastrada com sucesso!');
        setNome('');
        setDescricao('');
        if (onCadastro) onCadastro();
      } else {
        setMensagem('Erro ao cadastrar tipologia.');
      }
    } catch (error) {
      setMensagem('Erro de conexão com o servidor.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Cadastrar nova tipologia</h2>
      <div>
        <label>Nome:</label>
        <input
          type="text"
          value={nome}
          onChange={e => setNome(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Descrição:</label>
        <input
          type="text"
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
          required
        />
      </div>
      <button type="submit">Cadastrar</button>
      {mensagem && <p>{mensagem}</p>}
    </form>
  );
}

export default CadastrarTipologia;