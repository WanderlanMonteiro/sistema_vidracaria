import React, { useState } from 'react';
import TipologiasList from './components/TipologiasList';
import CadastrarTipologia from './components/CadastrarTipologia';

function App() {
  const [atualizar, setAtualizar] = useState(false);

  // Atualiza lista após cadastro
  const handleCadastro = () => {
    setAtualizar(!atualizar);
  };

  return (
    <div>
      <h1>Sistema Vidraçaria</h1>
      <CadastrarTipologia onCadastro={handleCadastro} />
      <TipologiasList atualizar={atualizar} />
    </div>
  );
}

export default App;