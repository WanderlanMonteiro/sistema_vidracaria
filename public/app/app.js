(() => {
  'use strict';

  const app = document.getElementById('app');

  function esc(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtNum(value, decimals = 0) {
    if (value === null || value === undefined || value === '') return '—';
    const n = Number(value);
    if (Number.isNaN(n)) return esc(value);
    return n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  async function api(path) {
    const res = await fetch(path, { headers: { Accept: 'application/json' } });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const message = (body && body.error) ? body.error : `Erro ${res.status} ao chamar ${path}`;
      throw new Error(message);
    }
    return body;
  }

  async function apiPost(path, payload) {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const message = (body && body.error) ? body.error : `Erro ${res.status} ao chamar ${path}`;
      throw new Error(message);
    }
    return body;
  }

  function setLoading(label) {
    app.innerHTML = `<div class="state">Carregando ${esc(label)}…</div>`;
  }

  function setError(err) {
    app.innerHTML = `<div class="state error">Não deu para carregar: ${esc(err.message || err)}</div>`;
  }

  function statusChip(released, lockedLabel) {
    if (released) return `<span class="chip ok">Liberada</span>`;
    return `<span class="chip danger">${esc(lockedLabel || 'Bloqueada')}</span>`;
  }

  // --- Views ---------------------------------------------------------

  async function viewFabricantes() {
    setLoading('fabricantes');
    try {
      const manufacturers = await api('/fabricantes');
      const cards = manufacturers.map((m) => {
        const lines = (m.product_lines || []).map((pl) => {
          const released = pl.status_code === 'LIBERADO_PRODUCAO' || pl.status_code === 'VALIDADO' || pl.status_code === 'CATALOGADO';
          const chipClass = pl.status_code === 'PENDENTE' || pl.status_code === 'NECESSITA_CONFERENCIA' ? 'warn' : (released ? 'info' : 'warn');
          return `<li>
            <a href="#/perfis?product_line_id=${pl.id}">${esc(pl.name)}</a>
            <span class="chip ${chipClass}">${esc(pl.status_code)}</span>
          </li>`;
        }).join('');
        return `<div class="card">
          <h2>${esc(m.name)}</h2>
          <div class="sub">${esc(m.legal_name || m.website || '')}</div>
          <ul class="lines">${lines || '<li style="color:var(--text-muted)">sem linhas cadastradas</li>'}</ul>
        </div>`;
      }).join('');

      app.innerHTML = `
        <div class="page-head">
          <h1>Fabricantes</h1>
          <p>Catálogos técnicos carregados no sistema, com suas linhas de produto e status de governança.</p>
        </div>
        <div class="card-grid">${cards}</div>
      `;
    } catch (err) {
      setError(err);
    }
  }

  async function viewPerfis(params) {
    setLoading('perfis');
    try {
      const [manufacturers, query] = await Promise.all([
        api('/fabricantes'),
        buildPerfisQuery(params),
      ]);
      const profiles = await api(`/perfis${query}`);

      const manufacturerOptions = manufacturers.map((m) =>
        `<option value="${m.id}" ${String(m.id) === params.get('manufacturer_id') ? 'selected' : ''}>${esc(m.name)}</option>`
      ).join('');

      const rows = profiles.map((p) => `
        <tr>
          <td class="mono">${esc(p.code)}</td>
          <td class="wrap">${esc(p.name || '—')}</td>
          <td>${esc(p.category || '—')}</td>
          <td class="num">${p.weight_kg_per_m ? fmtNum(p.weight_kg_per_m, 3) + ' kg/m' : '—'}</td>
          <td>${esc(p.manufacturer || '—')}</td>
          <td>${esc(p.product_line || '—')}</td>
          <td>${statusPillForData(p.status_code)}</td>
          <td class="mono">${p.page_number ? 'p.' + esc(p.page_number) : '—'}</td>
        </tr>
      `).join('');

      app.innerHTML = `
        <div class="page-head">
          <h1>Perfis</h1>
          <p>${profiles.length} perfil(is) encontrado(s) (máx. 200 por busca). Peso e página citam a fonte exata.</p>
        </div>
        <form class="filters" id="perfis-filters">
          <div class="field">
            <label for="f-manufacturer">Fabricante</label>
            <select id="f-manufacturer" name="manufacturer_id">
              <option value="">Todos</option>
              ${manufacturerOptions}
            </select>
          </div>
          <div class="field">
            <label for="f-code">Código</label>
            <input id="f-code" name="code" type="text" placeholder="ex: MP-300" value="${esc(params.get('code') || '')}" />
          </div>
          <button class="btn" type="submit">Filtrar</button>
        </form>
        <div class="tablewrap">
          <table>
            <thead><tr>
              <th>Código</th><th>Nome</th><th>Categoria</th><th>Peso</th>
              <th>Fabricante</th><th>Linha</th><th>Status</th><th>Fonte</th>
            </tr></thead>
            <tbody>${rows || '<tr><td colspan="8" style="color:var(--text-muted)">Nenhum perfil encontrado com esse filtro.</td></tr>'}</tbody>
          </table>
        </div>
      `;

      document.getElementById('perfis-filters').addEventListener('submit', (ev) => {
        ev.preventDefault();
        const data = new FormData(ev.target);
        const next = new URLSearchParams();
        for (const [key, value] of data.entries()) {
          if (value) next.set(key, value);
        }
        window.location.hash = `#/perfis?${next.toString()}`;
      });
    } catch (err) {
      setError(err);
    }
  }

  async function buildPerfisQuery(params) {
    const next = new URLSearchParams();
    ['manufacturer_id', 'product_line_id', 'code'].forEach((key) => {
      const value = params.get(key);
      if (value) next.set(key, value);
    });
    const qs = next.toString();
    return qs ? `?${qs}` : '';
  }

  function statusPillForData(statusCode) {
    if (!statusCode) return '<span class="chip warn">—</span>';
    if (statusCode === 'PENDENTE' || statusCode === 'NECESSITA_CONFERENCIA') {
      return `<span class="chip warn">${esc(statusCode)}</span>`;
    }
    if (statusCode === 'BLOQUEADO' || statusCode === 'OBSOLETO' || statusCode === 'CONFLITANTE') {
      return `<span class="chip danger">${esc(statusCode)}</span>`;
    }
    return `<span class="chip info">${esc(statusCode)}</span>`;
  }

  async function viewFormulas() {
    setLoading('fórmulas');
    try {
      const formulas = await api('/formulas');
      const rows = formulas.map((f) => {
        const released = f.version_status === 'LIBERADO_PRODUCAO' && Number(f.production_locked) === 0;
        return `<tr>
          <td class="wrap"><a href="#/formulas/${f.id}">${esc(f.name)}</a></td>
          <td>${esc(f.product_line || '—')}</td>
          <td>${esc(f.typology || '—')}</td>
          <td>${statusChip(released, f.version_status)}</td>
        </tr>`;
      }).join('');

      const releasedCount = formulas.filter((f) => f.version_status === 'LIBERADO_PRODUCAO' && Number(f.production_locked) === 0).length;

      app.innerHTML = `
        <div class="page-head">
          <h1>Fórmulas de corte</h1>
          <p>${releasedCount} de ${formulas.length} liberadas para produção. As demais têm o checklist de liberação detalhado na página de cada uma.</p>
        </div>
        <div class="tablewrap">
          <table>
            <thead><tr><th>Fórmula</th><th>Linha</th><th>Tipologia</th><th>Status</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    } catch (err) {
      setError(err);
    }
  }

  async function viewFormulaDetail(id) {
    setLoading('fórmula');
    try {
      const [formula, checklist] = await Promise.all([
        api(`/formulas/${id}`),
        api(`/formulas/${id}/checklist-producao`),
      ]);

      const labels = {
        possui_componentes: 'Tem componentes de corte cadastrados',
        descontos_folgas_validados: 'Descontos e folgas validados',
        validacoes_aprovadas: 'Validações técnicas aprovadas',
        prototipo_aprovado: 'Protótipo aprovado',
        responsavel_tecnico: 'Aprovação de responsável técnico registrada',
        versao_nao_bloqueada: 'Versão não está bloqueada/obsoleta',
      };
      const checks = Object.entries(checklist.checklist || {}).map(([key, ok]) => `
        <div class="check-item ${ok ? 'ok' : 'pending'}">
          <span class="dot"></span>
          <span>${esc(labels[key] || key)}</span>
        </div>
      `).join('');

      const components = (formula.components || []).map((c) => `
        <tr>
          <td class="mono">${esc(c.profile_code || '—')}</td>
          <td>${esc(c.component_role || '—')}</td>
          <td class="num">${esc(c.quantity)}</td>
          <td class="mono">${esc(c.expression)}</td>
        </tr>
      `).join('');

      const deductions = (formula.deductions || []).map((d) => `
        <tr>
          <td class="wrap">${esc(d.description || '—')}</td>
          <td>${statusPillForData(d.status_code)}</td>
        </tr>
      `).join('');

      app.innerHTML = `
        <p><a href="#/formulas" class="btn-ghost">&larr; Voltar para fórmulas</a></p>
        <div class="detail-head">
          <div>
            <h1>${esc(formula.name)}</h1>
            <div class="sub">${esc(formula.product_line || '—')} · ${esc(formula.typology || 'sem tipologia')}</div>
          </div>
          ${statusChip(checklist.released, formula.status_code)}
        </div>

        <div class="section-title">Checklist de liberação para produção</div>
        <div class="checklist-grid">${checks}</div>

        <div class="section-title">Componentes de corte (${components ? formula.components.length : 0})</div>
        <div class="tablewrap">
          <table>
            <thead><tr><th>Perfil</th><th>Peça</th><th>Qtd.</th><th>Expressão</th></tr></thead>
            <tbody>${components || '<tr><td colspan="4" style="color:var(--text-muted)">Sem componentes.</td></tr>'}</tbody>
          </table>
        </div>

        ${deductions ? `
          <div class="section-title">Descontos e folgas</div>
          <div class="tablewrap">
            <table>
              <thead><tr><th>Descrição</th><th>Status</th></tr></thead>
              <tbody>${deductions}</tbody>
            </table>
          </div>
        ` : ''}

        <div class="section-title">Calcular corte</div>
        <div id="calc-area"></div>
      `;

      renderCalculator(id, checklist.released);
    } catch (err) {
      setError(err);
    }
  }

  function renderCalculator(formulaId, released) {
    const area = document.getElementById('calc-area');
    if (!released) {
      area.innerHTML = `
        <div class="calc-locked">
          <strong>Cálculo bloqueado.</strong> Esta versão da fórmula ainda não passou pelo
          checklist de liberação para produção (ver acima o que falta). O sistema recusa
          calcular fórmulas não liberadas — não é uma limitação da tela, é a mesma regra
          aplicada na API.
        </div>
      `;
      return;
    }

    area.innerHTML = `
      <div class="calc-box">
        <form class="calc-fields" id="calc-form">
          <div class="field"><label for="c-L">Largura do vão (L, mm)</label><input id="c-L" name="L" type="number" step="1" required /></div>
          <div class="field"><label for="c-A">Altura do vão (A, mm)</label><input id="c-A" name="A" type="number" step="1" required /></div>
          <div class="field"><label for="c-N">Quantidade (N)</label><input id="c-N" name="N" type="number" step="1" value="1" /></div>
          <div class="field"><label for="c-E">Espessura vidro (E)</label><input id="c-E" name="E" type="number" step="1" value="0" /></div>
          <button class="btn" type="submit">Calcular</button>
        </form>
        <div class="calc-result" id="calc-result"></div>
      </div>
    `;

    document.getElementById('calc-form').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const data = new FormData(ev.target);
      const payload = {
        L: Number(data.get('L') || 0),
        A: Number(data.get('A') || 0),
        N: Number(data.get('N') || 0),
        E: Number(data.get('E') || 0),
        P: 0,
      };
      const resultBox = document.getElementById('calc-result');
      resultBox.innerHTML = '<div class="state">Calculando…</div>';
      try {
        const result = await apiPost(`/formulas/${formulaId}/calcular`, payload);
        const rows = (result.components || []).map((c) => `
          <tr>
            <td class="wrap">${esc(c.component_role)}</td>
            <td class="mono">${esc(c.notes ? c.notes.split('código original:')[1]?.trim() || '' : '')}</td>
            <td class="num">${esc(c.quantity)}</td>
            <td class="mono">${esc(c.expression)}</td>
            <td class="num">${fmtNum(c.result_mm)} mm</td>
          </tr>
        `).join('');
        resultBox.innerHTML = `
          <div class="tablewrap">
            <table>
              <thead><tr><th>Peça</th><th>Perfil</th><th>Qtd.</th><th>Expressão</th><th>Medida</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        `;
      } catch (err) {
        resultBox.innerHTML = `<div class="state error">${esc(err.message)}</div>`;
      }
    });
  }

  // --- Router ----------------------------------------------------------

  function setActiveNav(section) {
    document.querySelectorAll('.topnav a').forEach((a) => {
      a.classList.toggle('active', a.dataset.nav === section);
    });
  }

  function route() {
    const hash = window.location.hash.replace(/^#/, '') || '/fabricantes';
    const [pathPart, queryPart] = hash.split('?');
    const params = new URLSearchParams(queryPart || '');
    const segments = pathPart.split('/').filter(Boolean);

    if (segments.length === 0 || segments[0] === 'fabricantes') {
      setActiveNav('fabricantes');
      return viewFabricantes();
    }
    if (segments[0] === 'perfis') {
      setActiveNav('perfis');
      return viewPerfis(params);
    }
    if (segments[0] === 'formulas' && segments[1]) {
      setActiveNav('formulas');
      return viewFormulaDetail(segments[1]);
    }
    if (segments[0] === 'formulas') {
      setActiveNav('formulas');
      return viewFormulas();
    }

    app.innerHTML = `<div class="state">Página não encontrada.</div>`;
  }

  window.addEventListener('hashchange', route);
  window.addEventListener('DOMContentLoaded', route);
})();
