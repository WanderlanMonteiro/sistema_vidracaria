import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import Cabecalho from './componentes/Cabecalho';
import OlaMundo from './componentes/OlaMundo';
import ListaProjetos from './componentes/ListaProjetos';
import Home from './componentes/Home';
import Sobre from './componentes/Sobre';

function App() {
  return (
    <Router>
      <Cabecalho />
      <nav>
        <Link to="/">Home</Link> |{" "}
        <Link to="/ola">Olá Mundo</Link> |{" "}
        <Link to="/projetos">Projetos</Link> |{" "}
        <Link to="/sobre">Sobre</Link>
      </nav>
      <hr />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ola" element={<OlaMundo />} />
        <Route path="/projetos" element={<ListaProjetos />} />
        <Route path="/sobre" element={<Sobre />} />
      </Routes>
    </Router>
  );
}

export default App;