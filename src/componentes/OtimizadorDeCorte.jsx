import React, { useState } from 'react';

const OtimizadorDeCorte = () => {
  const [perfil, setPerfil] = useState('');
  const [barra, setBarra] = useState('');
  const [medidas, setMedidas] = useState('');
  const [resultado, setResultado] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Chamar API para otimização (POST /corte-perfis/otimizar)
    // Exemplo de payload: { perfil, barra, medidas: medidas.split(',') }
    // setResultado(response.data)
  };

  return (
    <div>
      <h2>Otimizador de Corte de Perfis</h2>
      <form onSubmit={handleSubmit}>
        <label>Tipo de Perfil:</label>
        <input value={perfil} onChange={e => setPerfil(e.target.value)} />

        <label>Comprimento da Barra (mm):</label>
        <input value={barra} onChange={e => setBarra(e.target.value)} type="number" />

        <label>Medidas dos Cortes (mm) [separadas por vírgula]:</label>
        <input value={medidas} onChange={e => setMedidas(e.target.value)} />

        <button type="submit">Otimizar Corte</button>
      </form>
      {resultado && (
        <div>
          <h3>Plano de Corte Otimizado</h3>
          {/* Renderizar resultado do otimizador */}
        </div>
      )}
    </div>
  );
};

export default OtimizadorDeCorte;