import React, { useEffect, useState } from 'react';

function ListaProjetos() {
  const [projetos, setProjetos] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/projetos')
      .then(response => response.json())
      .then(data => setProjetos(data));
  }, []);

  return (
    <div>
      <h2>Projetos cadastrados</h2>
      <ul>
        {projetos.map((proj) => (
          <li key={proj.id}>{proj.nome} - {proj.descricao}</li>
        ))}
      </ul>
    </div>
  );
}

export default ListaProjetos;