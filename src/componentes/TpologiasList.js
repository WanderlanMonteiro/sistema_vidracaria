import React, { useEffect, useState } from 'react';

function TipologiasList({ atualizar }) {
  const [tipologias, setTipologias] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/tipologias')
      .then(res => res.json())
      .then(data => setTipologias(data));
  }, [atualizar]);

  return (
    <div>
      <h2>Tipologias cadastradas</h2>
      <ul>
        {tipologias.map(t => (
          <li key={t.id}>
            <strong>{t.nome}</strong>: {t.descricao}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TipologiasList;