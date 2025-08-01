import React, { useState } from 'react';
import TipologiasList from './components/TipologiasList';
import CadastrarTipologia from './components/CadastrarTipologia';

function App() {
  const [atualizar, setAtualizar] = useState(false);

  const handleCadastro = () => {
    setAtualizar(!atualizar);
  };

  return (
    <div style={{ maxWidth: 600, margin: 'auto' }}>
      <h1>Sistema Vidraçaria</h1>
      <CadastrarTipologia onCadastro={handleCadastro} />
      <TipologiasList atualizar={atualizar} />
    </div>
  );
}

export default App;