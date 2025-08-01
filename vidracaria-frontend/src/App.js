import React from 'react';
import Cabecalho from './componentes/Cabecalho';
import OlaMundo from './componentes/OlaMundo';
import ListaProjetos from './componentes/ListaProjetos';
import Home from './componentes/Home';
import Sobre from './componentes/Sobre';

function App() {
  return (
    <div>
      <Cabecalho />
      <OlaMundo />
      <ListaProjetos />
    </div>
  );
}

export default App;