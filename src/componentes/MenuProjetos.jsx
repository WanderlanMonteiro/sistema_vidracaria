import React from 'react';

const MenuProjetos = () => (
  <nav>
    <ul>
      <li>Projetos
        <ul>
          <li><a href="/projetos/novo">Novo Projeto</a></li>
          <li><a href="/projetos/prontos">Projetos Prontos</a></li>
          <li><a href="/projetos/customizacao">Customização</a></li>
          <li><a href="/projetos/tipologias">Tipologias Prontas</a></li>
        </ul>
      </li>
      <li>Plano de Corte
        <ul>
          <li><a href="/corte/otimizador">Otimizador de Corte</a></li>
          <li><a href="/corte/plano">Plano de Corte</a></li>
          <li><a href="/corte/folga">Configurar Folga</a></li>
        </ul>
      </li>
      <li>Compras
        <ul>
          <li><a href="/compras/relatorio">Relatório de Compras</a></li>
        </ul>
      </li>
      <li>Financeiro
        <ul>
          <li><a href="/financeiro/lucro">Margem de Lucro</a></li>
        </ul>
      </li>
      <li>Tempera
        <ul>
          <li><a href="/tempera/relatorio">Relatório para Tempera</a></li>
        </ul>
      </li>
    </ul>
  </nav>
);

export default MenuProjetos;