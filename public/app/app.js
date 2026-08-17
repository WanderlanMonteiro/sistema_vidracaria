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

  class AuthRequiredError extends Error {}

  function failFrom(res, body, path) {
    const message = (body && body.error) ? body.error : `Erro ${res.status} ao chamar ${path}`;
    return res.status === 401 ? new AuthRequiredError(message) : new Error(message);
  }

  async function api(path) {
    const res = await fetch(path, { headers: { Accept: 'application/json' } });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw failFrom(res, body, path);
    return body;
  }

  async function apiSend(method, path, payload) {
    const res = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload || {}),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw failFrom(res, body, path);
    return body;
  }

  const apiPost = (path, payload) => apiSend('POST', path, payload);

  function setLoading(label) {
    app.innerHTML = `<div class="state">Carregando ${esc(label)}…</div>`;
  }

  function setError(err) {
    if (err instanceof AuthRequiredError) {
      renderLogin('Sua sessão expirou. Entre novamente.');
      return;
    }
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
        <div class="page-head" style="display:flex;justify-content:space-between;align-items:flex-end;gap:1rem;flex-wrap:wrap;">
          <div>
            <h1>Fórmulas de corte</h1>
            <p>${releasedCount} de ${formulas.length} liberadas para produção. As demais têm o checklist de liberação detalhado na página de cada uma.</p>
          </div>
          <a href="#/formulas/nova" class="btn" style="text-decoration:none;">+ Nova fórmula</a>
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

  async function viewChangePassword() {
    app.innerHTML = `
      <div class="page-head">
        <h1>Trocar senha</h1>
        <p>A senha precisa ter 8 ou mais caracteres.</p>
      </div>
      <div class="calc-box" style="max-width:360px;">
        <form id="change-password-form">
          <div class="field" style="margin-bottom:0.9rem;">
            <label for="cp-current">Senha atual</label>
            <input id="cp-current" name="current_password" type="password" required />
          </div>
          <div class="field" style="margin-bottom:0.9rem;">
            <label for="cp-new">Nova senha</label>
            <input id="cp-new" name="new_password" type="password" minlength="8" required />
          </div>
          <button class="btn" type="submit">Salvar nova senha</button>
        </form>
        <div id="change-password-result" style="margin-top:0.9rem;"></div>
      </div>
    `;

    document.getElementById('change-password-form').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const data = new FormData(ev.target);
      const resultBox = document.getElementById('change-password-result');
      const submitBtn = ev.target.querySelector('button[type=submit]');
      submitBtn.disabled = true;
      try {
        await apiSend('PUT', '/auth/senha', {
          current_password: data.get('current_password'),
          new_password: data.get('new_password'),
        });
        resultBox.innerHTML = `<div class="state" style="color:var(--ok);padding:0;">Senha alterada com sucesso.</div>`;
        ev.target.reset();
      } catch (err) {
        resultBox.innerHTML = `<div class="state error" style="padding:0;">${esc(err.message)}</div>`;
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  // --- Helpers comuns a comercial/financeiro ------------------------------

  function fmtMoney(value) {
    const n = Number(value || 0);
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function todayIso() {
    return new Date().toISOString().slice(0, 10);
  }

  function optionsFrom(list, valueKey, labelKey, selected) {
    return list.map((item) => `
      <option value="${esc(item[valueKey])}" ${String(item[valueKey]) === String(selected || '') ? 'selected' : ''}>
        ${esc(item[labelKey])}
      </option>
    `).join('');
  }

  function enumOptions(values, selected) {
    return values.map((v) => `<option value="${v}" ${v === selected ? 'selected' : ''}>${v}</option>`).join('');
  }

  // --- Clientes ------------------------------------------------------------

  async function viewClientes() {
    setLoading('clientes');
    try {
      const customers = await api('/clientes');
      renderClientes(customers);
    } catch (err) {
      setError(err);
    }
  }

  function renderClientes(customers) {
    const rows = customers.map((c) => `
      <tr>
        <td class="wrap">${esc(c.name)}</td>
        <td class="mono">${esc(c.document_number || '—')}</td>
        <td>${esc(c.phone || '—')}</td>
        <td>${esc(c.email || '—')}</td>
        <td class="wrap">${esc(c.address || '—')}</td>
      </tr>
    `).join('');

    app.innerHTML = `
      <div class="page-head">
        <h1>Clientes</h1>
        <p>${customers.length} cliente(s) cadastrado(s).</p>
      </div>
      <div class="form-box">
        <form class="form-grid" id="customer-form">
          <div class="field"><label for="cu-name">Nome *</label><input id="cu-name" name="name" type="text" required /></div>
          <div class="field"><label for="cu-doc">CPF/CNPJ</label><input id="cu-doc" name="document_number" type="text" /></div>
          <div class="field"><label for="cu-phone">Telefone</label><input id="cu-phone" name="phone" type="text" /></div>
          <div class="field"><label for="cu-email">E-mail</label><input id="cu-email" name="email" type="email" /></div>
          <div class="field" style="flex-basis:220px;"><label for="cu-address">Endereço</label><input id="cu-address" name="address" type="text" /></div>
          <button class="btn" type="submit">Cadastrar cliente</button>
        </form>
        <div id="customer-form-error"></div>
      </div>
      <div class="tablewrap">
        <table>
          <thead><tr><th>Nome</th><th>Documento</th><th>Telefone</th><th>E-mail</th><th>Endereço</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5" style="color:var(--text-muted)">Nenhum cliente cadastrado ainda.</td></tr>'}</tbody>
        </table>
      </div>
    `;

    document.getElementById('customer-form').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const data = new FormData(ev.target);
      const errBox = document.getElementById('customer-form-error');
      errBox.innerHTML = '';
      try {
        await apiPost('/clientes', {
          name: data.get('name'),
          document_number: data.get('document_number') || null,
          phone: data.get('phone') || null,
          email: data.get('email') || null,
          address: data.get('address') || null,
        });
        viewClientes();
      } catch (err) {
        errBox.innerHTML = `<div class="state error" style="padding:0.5rem 0;">${esc(err.message)}</div>`;
      }
    });
  }

  // --- Obras (projetos) -----------------------------------------------------

  const PROJECT_STATUS = ['LEVANTAMENTO', 'ORCAMENTO', 'APROVADO', 'EM_PRODUCAO', 'ENTREGUE', 'CANCELADO'];

  async function viewObras() {
    setLoading('obras');
    try {
      const [projects, customers] = await Promise.all([api('/projetos'), api('/clientes')]);
      renderObras(projects, customers);
    } catch (err) {
      setError(err);
    }
  }

  function renderObras(projects, customers) {
    const customerById = Object.fromEntries(customers.map((c) => [String(c.id), c.name]));
    const rows = projects.map((p) => `
      <tr>
        <td class="wrap"><a href="#/orcamentos?project_id=${p.id}">${esc(p.name)}</a></td>
        <td>${esc(customerById[String(p.customer_id)] || '—')}</td>
        <td>${esc(p.address || '—')}</td>
        <td>${statusPillForData(p.status)}</td>
      </tr>
    `).join('');

    app.innerHTML = `
      <div class="page-head">
        <h1>Obras</h1>
        <p>${projects.length} obra(s) cadastrada(s). Clique numa obra para ver os orçamentos ligados a ela.</p>
      </div>
      <div class="form-box">
        <form class="form-grid" id="project-form">
          <div class="field"><label for="pr-customer">Cliente *</label>
            <select id="pr-customer" name="customer_id" required>
              <option value="">Selecione…</option>
              ${optionsFrom(customers, 'id', 'name')}
            </select>
          </div>
          <div class="field"><label for="pr-name">Nome da obra *</label><input id="pr-name" name="name" type="text" required /></div>
          <div class="field" style="flex-basis:220px;"><label for="pr-address">Endereço</label><input id="pr-address" name="address" type="text" /></div>
          <div class="field"><label for="pr-status">Status</label>
            <select id="pr-status" name="status">${enumOptions(PROJECT_STATUS, 'LEVANTAMENTO')}</select>
          </div>
          <button class="btn" type="submit">Cadastrar obra</button>
        </form>
        <div id="project-form-error"></div>
      </div>
      <div class="tablewrap">
        <table>
          <thead><tr><th>Obra</th><th>Cliente</th><th>Endereço</th><th>Status</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="4" style="color:var(--text-muted)">Nenhuma obra cadastrada ainda.</td></tr>'}</tbody>
        </table>
      </div>
    `;

    document.getElementById('project-form').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const data = new FormData(ev.target);
      const errBox = document.getElementById('project-form-error');
      errBox.innerHTML = '';
      try {
        await apiPost('/projetos', {
          customer_id: Number(data.get('customer_id')),
          name: data.get('name'),
          address: data.get('address') || null,
          status: data.get('status'),
        });
        viewObras();
      } catch (err) {
        errBox.innerHTML = `<div class="state error" style="padding:0.5rem 0;">${esc(err.message)}</div>`;
      }
    });
  }

  // --- Orçamentos ------------------------------------------------------------

  const QUOTE_STATUS = ['RASCUNHO', 'ENVIADO', 'APROVADO', 'REJEITADO', 'EXPIRADO'];

  async function viewOrcamentos(params) {
    setLoading('orçamentos');
    try {
      const projectFilter = params ? params.get('project_id') : null;
      const query = projectFilter ? `?project_id=${projectFilter}` : '';
      const [quotes, projects, customers] = await Promise.all([
        api(`/orcamentos${query}`), api('/projetos'), api('/clientes'),
      ]);
      renderOrcamentos(quotes, projects, customers, projectFilter);
    } catch (err) {
      setError(err);
    }
  }

  function renderOrcamentos(quotes, projects, customers, projectFilter) {
    const projectById = Object.fromEntries(projects.map((p) => [String(p.id), p]));
    const customerById = Object.fromEntries(customers.map((c) => [String(c.id), c]));

    const rows = quotes.map((q) => `
      <tr>
        <td><a href="#/orcamentos/${q.id}">#${q.id}</a></td>
        <td class="wrap">${esc(projectById[String(q.project_id)]?.name || '—')}</td>
        <td>${statusPillForData(q.status)}</td>
        <td class="num">${fmtMoney(q.total_value)}</td>
      </tr>
    `).join('');

    const presetProject = projectFilter ? (projectById[String(projectFilter)] || null) : null;
    const presetCustomer = presetProject ? (customerById[String(presetProject.customer_id)] || null) : null;

    app.innerHTML = `
      <div class="page-head">
        <h1>Orçamentos</h1>
        <p>${quotes.length} orçamento(s)${projectFilter ? ' para esta obra' : ''}. Busque o cliente pelo nome — se ele
        ou a obra ainda não existirem, dá pra cadastrar sem sair desta tela.</p>
      </div>
      <div class="form-box">
        <div class="form-grid" style="margin-bottom:0.6rem;">
          <div class="field" style="flex-basis:260px;">
            <label for="qt-customer-search">Cliente *</label>
            <input id="qt-customer-search" type="text" list="qt-customer-list" placeholder="Digite pra buscar…"
                   autocomplete="off" value="${esc(presetCustomer ? presetCustomer.name : '')}" />
            <datalist id="qt-customer-list">
              ${customers.map((c) => `<option value="${esc(c.name)}">`).join('')}
            </datalist>
          </div>
          <button type="button" class="btn btn-ghost btn-small" id="qt-new-customer-toggle">+ Cliente novo</button>
        </div>
        <div class="form-box" id="qt-new-customer-box" hidden style="background:var(--surface-2);">
          <div class="form-grid">
            <div class="field"><label for="qt-nc-name">Nome *</label><input id="qt-nc-name" type="text" /></div>
            <div class="field"><label for="qt-nc-phone">Telefone</label><input id="qt-nc-phone" type="text" /></div>
            <button type="button" class="btn btn-small" id="qt-nc-save">Salvar cliente</button>
          </div>
        </div>

        <div class="form-grid" style="margin-bottom:0.6rem;" id="qt-project-area" ${presetCustomer ? '' : 'hidden'}>
          <div class="field" style="flex-basis:260px;">
            <label for="qt-project-select">Obra *</label>
            <select id="qt-project-select"><option value="">Selecione…</option></select>
          </div>
          <button type="button" class="btn btn-ghost btn-small" id="qt-new-project-toggle">+ Obra nova</button>
        </div>
        <div class="form-box" id="qt-new-project-box" hidden style="background:var(--surface-2);">
          <div class="form-grid">
            <div class="field"><label for="qt-np-name">Nome da obra *</label><input id="qt-np-name" type="text" /></div>
            <div class="field"><label for="qt-np-address">Endereço</label><input id="qt-np-address" type="text" /></div>
            <div class="field"><label for="qt-np-status">Status</label>
              <select id="qt-np-status">${enumOptions(PROJECT_STATUS, 'LEVANTAMENTO')}</select>
            </div>
            <button type="button" class="btn btn-small" id="qt-np-save">Salvar obra</button>
          </div>
        </div>

        <form class="form-grid" id="quote-form">
          <div class="field"><label for="qt-status">Status do orçamento</label>
            <select id="qt-status">${enumOptions(QUOTE_STATUS, 'RASCUNHO')}</select>
          </div>
          <button class="btn" type="submit">Criar orçamento</button>
        </form>
        <div id="quote-form-error"></div>
      </div>
      <div class="tablewrap">
        <table>
          <thead><tr><th>#</th><th>Obra</th><th>Status</th><th>Valor total</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="4" style="color:var(--text-muted)">Nenhum orçamento ainda.</td></tr>'}</tbody>
        </table>
      </div>
    `;

    let selectedCustomerId = presetCustomer ? presetCustomer.id : null;
    let selectedProjectId = presetProject ? presetProject.id : null;
    const errBox = document.getElementById('quote-form-error');

    async function loadProjectsForCustomer(customerId, preselectId) {
      const custProjects = await api(`/projetos?customer_id=${customerId}`);
      const sel = document.getElementById('qt-project-select');
      sel.innerHTML = `<option value="">Selecione…</option>${optionsFrom(custProjects, 'id', 'name', preselectId)}`;
      document.getElementById('qt-project-area').hidden = false;
      selectedProjectId = preselectId || null;
    }

    if (presetCustomer) {
      loadProjectsForCustomer(presetCustomer.id, presetProject.id);
    }

    document.getElementById('qt-customer-search').addEventListener('change', async (ev) => {
      errBox.innerHTML = '';
      const name = ev.target.value.trim();
      const match = customers.find((c) => c.name.toLowerCase() === name.toLowerCase());
      document.getElementById('qt-new-customer-box').hidden = true;
      if (match) {
        selectedCustomerId = match.id;
        await loadProjectsForCustomer(match.id);
      } else {
        selectedCustomerId = null;
        selectedProjectId = null;
        document.getElementById('qt-project-area').hidden = true;
      }
    });

    document.getElementById('qt-new-customer-toggle').addEventListener('click', () => {
      const box = document.getElementById('qt-new-customer-box');
      box.hidden = !box.hidden;
      if (!box.hidden) {
        document.getElementById('qt-nc-name').value = document.getElementById('qt-customer-search').value;
      }
    });

    document.getElementById('qt-nc-save').addEventListener('click', async () => {
      errBox.innerHTML = '';
      const name = document.getElementById('qt-nc-name').value.trim();
      if (!name) return;
      try {
        const customer = await apiPost('/clientes', {
          name,
          phone: document.getElementById('qt-nc-phone').value || null,
        });
        customers.push(customer);
        selectedCustomerId = customer.id;
        document.getElementById('qt-customer-search').value = customer.name;
        document.getElementById('qt-new-customer-box').hidden = true;
        await loadProjectsForCustomer(customer.id);
      } catch (err) {
        errBox.innerHTML = `<div class="state error" style="padding:0.5rem 0;">${esc(err.message)}</div>`;
      }
    });

    document.getElementById('qt-project-select').addEventListener('change', (ev) => {
      selectedProjectId = ev.target.value ? Number(ev.target.value) : null;
    });

    document.getElementById('qt-new-project-toggle').addEventListener('click', () => {
      document.getElementById('qt-new-project-box').hidden = !document.getElementById('qt-new-project-box').hidden;
    });

    document.getElementById('qt-np-save').addEventListener('click', async () => {
      errBox.innerHTML = '';
      if (!selectedCustomerId) {
        errBox.innerHTML = `<div class="state error" style="padding:0.5rem 0;">Escolha ou cadastre o cliente antes de criar a obra.</div>`;
        return;
      }
      const name = document.getElementById('qt-np-name').value.trim();
      if (!name) return;
      try {
        const project = await apiPost('/projetos', {
          customer_id: selectedCustomerId,
          name,
          address: document.getElementById('qt-np-address').value || null,
          status: document.getElementById('qt-np-status').value,
        });
        await loadProjectsForCustomer(selectedCustomerId, project.id);
        document.getElementById('qt-new-project-box').hidden = true;
      } catch (err) {
        errBox.innerHTML = `<div class="state error" style="padding:0.5rem 0;">${esc(err.message)}</div>`;
      }
    });

    document.getElementById('quote-form').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      errBox.innerHTML = '';
      if (!selectedProjectId) {
        errBox.innerHTML = `<div class="state error" style="padding:0.5rem 0;">Escolha (ou cadastre) a obra antes de criar o orçamento.</div>`;
        return;
      }
      try {
        const quote = await apiPost('/orcamentos', {
          project_id: selectedProjectId,
          status: document.getElementById('qt-status').value,
          total_value: 0,
        });
        window.location.hash = `#/orcamentos/${quote.id}`;
      } catch (err) {
        errBox.innerHTML = `<div class="state error" style="padding:0.5rem 0;">${esc(err.message)}</div>`;
      }
    });
  }

  async function viewOrcamentoDetail(id) {
    setLoading('orçamento');
    try {
      const [quote, items] = await Promise.all([
        api(`/orcamentos/${id}`),
        api(`/orcamentos-itens?quote_id=${id}`),
      ]);
      const project = await api(`/projetos/${quote.project_id}`).catch(() => null);
      renderOrcamentoDetail(quote, items, project);
    } catch (err) {
      setError(err);
    }
  }

  function renderOrcamentoDetail(quote, items, project) {
    const rows = items.map((it) => `
      <tr>
        <td class="wrap">${esc(it.description)}</td>
        <td class="num">${esc(it.quantity)}</td>
        <td class="num">${fmtMoney(it.unit_price)}</td>
        <td class="num">${fmtMoney(it.total_price)}</td>
      </tr>
    `).join('');
    const total = items.reduce((sum, it) => sum + Number(it.total_price || 0), 0);

    app.innerHTML = `
      <p><a href="#/orcamentos" class="btn-ghost">&larr; Voltar para orçamentos</a></p>
      <div class="detail-head">
        <div>
          <h1>Orçamento #${quote.id}</h1>
          <div class="sub">${esc(project ? project.name : 'obra #' + quote.project_id)}</div>
        </div>
        ${statusPillForData(quote.status)}
      </div>

      <div class="section-title">Itens do orçamento (${items.length})</div>
      <div class="tablewrap">
        <table>
          <thead><tr><th>Descrição</th><th>Qtd.</th><th>Valor unit.</th><th>Total</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="4" style="color:var(--text-muted)">Sem itens ainda.</td></tr>'}</tbody>
          <tfoot><tr><td colspan="3" style="text-align:right;font-weight:600;">Total</td><td class="num" style="font-weight:600;">${fmtMoney(total)}</td></tr></tfoot>
        </table>
      </div>

      <div class="form-box" style="margin-top:1.2rem;">
        <form class="form-grid" id="quote-item-form">
          <div class="field" style="flex-basis:220px;"><label for="qi-desc">Descrição *</label><input id="qi-desc" name="description" type="text" required /></div>
          <div class="field"><label for="qi-qty">Quantidade</label><input id="qi-qty" name="quantity" type="number" min="1" value="1" /></div>
          <div class="field"><label for="qi-price">Valor unitário (R$)</label><input id="qi-price" name="unit_price" type="number" step="0.01" min="0" value="0" /></div>
          <button class="btn" type="submit">Adicionar item</button>
        </form>
        <div id="quote-item-form-error"></div>
      </div>
    `;

    document.getElementById('quote-item-form').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const data = new FormData(ev.target);
      const errBox = document.getElementById('quote-item-form-error');
      errBox.innerHTML = '';
      const quantity = Number(data.get('quantity') || 1);
      const unitPrice = Number(data.get('unit_price') || 0);
      try {
        await apiPost('/orcamentos-itens', {
          quote_id: quote.id,
          description: data.get('description'),
          quantity,
          unit_price: unitPrice,
          total_price: quantity * unitPrice,
        });
        const freshItems = await api(`/orcamentos-itens?quote_id=${quote.id}`);
        const newTotal = freshItems.reduce((sum, it) => sum + Number(it.total_price || 0), 0);
        await apiSend('PUT', `/orcamentos/${quote.id}`, { total_value: newTotal });
        viewOrcamentoDetail(quote.id);
      } catch (err) {
        errBox.innerHTML = `<div class="state error" style="padding:0.5rem 0;">${esc(err.message)}</div>`;
      }
    });
  }

  // --- Financeiro --------------------------------------------------------

  const FINANCIAL_STATUS = ['PENDENTE', 'PAGO', 'CANCELADO'];
  const FINANCIAL_CATEGORIES = ['MATERIAL', 'MAO_DE_OBRA', 'FRETE', 'VENDA', 'OUTRO'];

  async function viewFinanceiro(params) {
    setLoading('financeiro');
    try {
      const statusFilter = params ? params.get('status') : null;
      const query = statusFilter ? `?status=${statusFilter}` : '';
      const entries = await api(`/lancamentos-financeiros${query}`);
      renderFinanceiro(entries, statusFilter);
    } catch (err) {
      setError(err);
    }
  }

  function renderFinanceiro(entries, statusFilter) {
    const totalReceita = entries.filter((e) => e.entry_type === 'RECEITA' && e.status !== 'CANCELADO')
      .reduce((s, e) => s + Number(e.amount || 0), 0);
    const totalDespesa = entries.filter((e) => e.entry_type === 'DESPESA' && e.status !== 'CANCELADO')
      .reduce((s, e) => s + Number(e.amount || 0), 0);
    const saldo = totalReceita - totalDespesa;

    const rows = entries.map((e) => `
      <tr>
        <td>${e.entry_type === 'RECEITA' ? '<span class="chip ok">Receita</span>' : '<span class="chip danger">Despesa</span>'}</td>
        <td>${esc(e.category)}</td>
        <td class="wrap">${esc(e.description)}</td>
        <td class="num">${fmtMoney(e.amount)}</td>
        <td>${esc(e.due_date || '—')}</td>
        <td>${statusPillForData(e.status)}</td>
        <td>${e.status === 'PENDENTE' ? `<button class="btn btn-small mark-paid" data-id="${e.id}">Marcar pago</button>` : ''}</td>
      </tr>
    `).join('');

    app.innerHTML = `
      <div class="page-head">
        <h1>Financeiro</h1>
        <p>Lançamentos de receita e despesa, filtráveis por status.</p>
      </div>
      <div class="stat-row">
        <div class="stat-tile ok"><div class="label">Receitas</div><div class="value">${fmtMoney(totalReceita)}</div></div>
        <div class="stat-tile danger"><div class="label">Despesas</div><div class="value">${fmtMoney(totalDespesa)}</div></div>
        <div class="stat-tile"><div class="label">Saldo</div><div class="value">${fmtMoney(saldo)}</div></div>
      </div>
      <div class="form-box">
        <form class="form-grid" id="financial-form">
          <div class="field"><label for="fi-type">Tipo</label>
            <select id="fi-type" name="entry_type"><option value="DESPESA">Despesa</option><option value="RECEITA">Receita</option></select>
          </div>
          <div class="field"><label for="fi-category">Categoria</label>
            <select id="fi-category" name="category">${enumOptions(FINANCIAL_CATEGORIES, 'MATERIAL')}</select>
          </div>
          <div class="field" style="flex-basis:220px;"><label for="fi-desc">Descrição *</label><input id="fi-desc" name="description" type="text" required /></div>
          <div class="field"><label for="fi-amount">Valor (R$) *</label><input id="fi-amount" name="amount" type="number" step="0.01" min="0" required /></div>
          <div class="field"><label for="fi-due">Vencimento</label><input id="fi-due" name="due_date" type="date" /></div>
          <button class="btn" type="submit">Lançar</button>
        </form>
        <div id="financial-form-error"></div>
      </div>
      <div class="filters">
        <div class="field">
          <label for="fi-filter-status">Filtrar por status</label>
          <select id="fi-filter-status">
            <option value="">Todos</option>
            ${enumOptions(FINANCIAL_STATUS, statusFilter || '')}
          </select>
        </div>
      </div>
      <div class="tablewrap">
        <table>
          <thead><tr><th>Tipo</th><th>Categoria</th><th>Descrição</th><th>Valor</th><th>Vencimento</th><th>Status</th><th></th></tr></thead>
          <tbody>${rows || '<tr><td colspan="7" style="color:var(--text-muted)">Nenhum lançamento ainda.</td></tr>'}</tbody>
        </table>
      </div>
    `;

    document.getElementById('financial-form').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const data = new FormData(ev.target);
      const errBox = document.getElementById('financial-form-error');
      errBox.innerHTML = '';
      try {
        await apiPost('/lancamentos-financeiros', {
          entry_type: data.get('entry_type'),
          category: data.get('category'),
          description: data.get('description'),
          amount: Number(data.get('amount')),
          due_date: data.get('due_date') || null,
          status: 'PENDENTE',
        });
        viewFinanceiro();
      } catch (err) {
        errBox.innerHTML = `<div class="state error" style="padding:0.5rem 0;">${esc(err.message)}</div>`;
      }
    });

    document.getElementById('fi-filter-status').addEventListener('change', (ev) => {
      window.location.hash = ev.target.value ? `#/financeiro?status=${ev.target.value}` : '#/financeiro';
    });

    document.querySelectorAll('.mark-paid').forEach((btn) => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          await apiSend('PUT', `/lancamentos-financeiros/${btn.dataset.id}`, {
            status: 'PAGO',
            paid_date: todayIso(),
          });
          viewFinanceiro(new URLSearchParams(window.location.hash.split('?')[1] || ''));
        } catch (err) {
          btn.disabled = false;
        }
      });
    });
  }

  // --- Materiais a comprar -------------------------------------------------

  async function viewCompras() {
    setLoading('materiais a comprar');
    try {
      const [materials, balances] = await Promise.all([api('/materiais'), api('/saldos-estoque')]);
      renderCompras(materials, balances);
    } catch (err) {
      setError(err);
    }
  }

  function renderCompras(materials, balances) {
    const stockByMaterial = {};
    balances.forEach((b) => {
      const key = String(b.material_id);
      stockByMaterial[key] = (stockByMaterial[key] || 0) + Number(b.quantity || 0);
    });

    const short = materials
      .map((m) => ({ ...m, currentStock: stockByMaterial[String(m.id)] || 0 }))
      .filter((m) => m.currentStock < Number(m.min_stock || 0));

    const rows = short.map((m) => `
      <tr>
        <td class="wrap">${esc(m.name)}</td>
        <td>${esc(m.category)}</td>
        <td class="num">${fmtNum(m.currentStock, 2)} ${esc(m.unit)}</td>
        <td class="num">${fmtNum(m.min_stock, 2)} ${esc(m.unit)}</td>
        <td class="num">${fmtNum(Number(m.min_stock) - m.currentStock, 2)} ${esc(m.unit)}</td>
      </tr>
    `).join('');

    app.innerHTML = `
      <div class="page-head">
        <h1>Materiais a comprar</h1>
        <p>${short.length} material(is) abaixo do estoque mínimo cadastrado (comparando \`/materiais\` × \`/saldos-estoque\`).</p>
      </div>
      <div class="tablewrap">
        <table>
          <thead><tr><th>Material</th><th>Categoria</th><th>Estoque atual</th><th>Estoque mínimo</th><th>Falta comprar</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5" style="color:var(--text-muted)">Nada abaixo do mínimo no momento.</td></tr>'}</tbody>
        </table>
      </div>
    `;
  }

  // --- Tipologias ----------------------------------------------------------

  const TYPOLOGY_CATEGORIES = ['CORRER', 'GIRO', 'MAXIM_AR', 'OSCILOBATENTE', 'PIVOTANTE', 'RIBANTA', 'CAMARAO', 'GUILHOTINA', 'BASCULANTE'];

  async function viewTipologias() {
    setLoading('tipologias');
    try {
      const typologies = await api('/tipologias');
      renderTipologias(typologies);
    } catch (err) {
      setError(err);
    }
  }

  function renderTipologias(typologies) {
    const rows = typologies.map((t) => `
      <tr>
        <td>${esc(t.name)}</td>
        <td>${esc(t.category)}</td>
        <td>${t.has_baguete ? 'Sim' : 'Não'}</td>
        <td>${t.is_common_in_brazil ? 'Sim' : 'Não'}</td>
      </tr>
    `).join('');

    app.innerHTML = `
      <div class="page-head">
        <h1>Tipologias</h1>
        <p>${typologies.length} tipologia(s) cadastrada(s). Usadas em vãos e fórmulas.</p>
      </div>
      <div class="form-box">
        <form class="form-grid" id="typology-form">
          <div class="field"><label for="ty-name">Nome *</label><input id="ty-name" name="name" type="text" required /></div>
          <div class="field"><label for="ty-category">Categoria *</label>
            <select id="ty-category" name="category" required>${enumOptions(TYPOLOGY_CATEGORIES)}</select>
          </div>
          <div class="field"><label for="ty-baguete">Tem baguete?</label>
            <select id="ty-baguete" name="has_baguete"><option value="0">Não</option><option value="1">Sim</option></select>
          </div>
          <button class="btn" type="submit">Cadastrar tipologia</button>
        </form>
        <div id="typology-form-error"></div>
      </div>
      <div class="tablewrap">
        <table>
          <thead><tr><th>Nome</th><th>Categoria</th><th>Baguete</th><th>Comum no Brasil</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="4" style="color:var(--text-muted)">Nenhuma tipologia cadastrada.</td></tr>'}</tbody>
        </table>
      </div>
    `;

    document.getElementById('typology-form').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const data = new FormData(ev.target);
      const errBox = document.getElementById('typology-form-error');
      errBox.innerHTML = '';
      try {
        await apiPost('/tipologias', {
          name: data.get('name'),
          category: data.get('category'),
          has_baguete: Number(data.get('has_baguete')),
          is_common_in_brazil: 1,
        });
        viewTipologias();
      } catch (err) {
        errBox.innerHTML = `<div class="state error" style="padding:0.5rem 0;">${esc(err.message)}</div>`;
      }
    });
  }

  // --- Nova fórmula ----------------------------------------------------------

  let formulaComponentCount = 0;

  function componentRowHtml(index) {
    return `
      <div class="component-row" data-row="${index}">
        <div class="field"><label>Peça</label><input name="c${index}_role" type="text" placeholder="ex: MARCO, FOLHA_LARGURA" required /></div>
        <div class="field"><label>Qtd.</label><input name="c${index}_qty" type="number" min="1" value="1" /></div>
        <div class="field" style="flex-basis:200px;"><label>Expressão (opcional)</label><input name="c${index}_expr" type="text" placeholder="ex: (L - 10) / 2" /></div>
        <div class="field"><label>ID do perfil (opcional)</label><input name="c${index}_profile" type="number" /></div>
        <button type="button" class="btn btn-small btn-danger remove-component" data-row="${index}">Remover</button>
      </div>
    `;
  }

  async function viewFormulaNova() {
    setLoading('formulário de nova fórmula');
    try {
      const [typologies, manufacturers] = await Promise.all([api('/tipologias'), api('/fabricantes')]);
      renderFormulaNova(typologies, manufacturers);
    } catch (err) {
      setError(err);
    }
  }

  function renderFormulaNova(typologies, manufacturers) {
    const productLines = manufacturers.flatMap((m) =>
      (m.product_lines || []).map((pl) => ({ id: pl.id, label: `${m.name} — ${pl.name}` }))
    );

    formulaComponentCount = 0;
    const firstRow = componentRowHtml(formulaComponentCount++);

    app.innerHTML = `
      <p><a href="#/formulas" class="btn-ghost">&larr; Voltar para fórmulas</a></p>
      <div class="page-head">
        <h1>Nova fórmula</h1>
        <p>A fórmula nasce <strong>PENDENTE e bloqueada para produção</strong> — o cálculo de corte só é liberado depois
        que o checklist da página de detalhe estiver 100% completo (protótipo aprovado, validações, aprovação técnica).
        Isso é a mesma regra usada em todas as fórmulas do sistema, não uma limitação deste formulário.</p>
      </div>
      <div class="form-box">
        <form id="formula-form">
          <div class="form-grid" style="margin-bottom:1rem;">
            <div class="field" style="flex-basis:260px;"><label for="fo-name">Nome *</label><input id="fo-name" name="name" type="text" required /></div>
            <div class="field"><label for="fo-typology">Tipologia</label>
              <select id="fo-typology" name="typology_id"><option value="">—</option>${optionsFrom(typologies, 'id', 'name')}</select>
            </div>
            <div class="field" style="flex-basis:220px;"><label for="fo-line">Linha de produto</label>
              <select id="fo-line" name="product_line_id"><option value="">—</option>${optionsFrom(productLines, 'id', 'label')}</select>
            </div>
            <div class="field"><label for="fo-rounding">Arredondamento</label>
              <select id="fo-rounding" name="rounding_mode">${enumOptions(['ROUND', 'FLOOR', 'CEIL', 'NONE'], 'ROUND')}</select>
            </div>
          </div>
          <div class="field" style="margin-bottom:1rem;"><label for="fo-desc">Descrição / observações</label><textarea id="fo-desc" name="description"></textarea></div>

          <div class="section-title">Componentes de corte</div>
          <div id="formula-components">${firstRow}</div>
          <button type="button" class="btn btn-ghost btn-small" id="add-component" style="margin:0.6rem 0 1.2rem;">+ Adicionar componente</button>

          <button class="btn" type="submit">Criar fórmula</button>
        </form>
        <div id="formula-form-error"></div>
      </div>
    `;

    document.getElementById('add-component').addEventListener('click', () => {
      document.getElementById('formula-components').insertAdjacentHTML('beforeend', componentRowHtml(formulaComponentCount++));
      bindRemoveButtons();
    });
    bindRemoveButtons();

    function bindRemoveButtons() {
      document.querySelectorAll('.remove-component').forEach((btn) => {
        btn.onclick = () => {
          const rows = document.querySelectorAll('.component-row');
          if (rows.length <= 1) return;
          btn.closest('.component-row').remove();
        };
      });
    }

    document.getElementById('formula-form').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const form = ev.target;
      const data = new FormData(form);
      const errBox = document.getElementById('formula-form-error');
      errBox.innerHTML = '';

      const components = [];
      document.querySelectorAll('.component-row').forEach((row) => {
        const idx = row.dataset.row;
        const role = data.get(`c${idx}_role`);
        if (!role) return;
        components.push({
          component_role: role,
          quantity: Number(data.get(`c${idx}_qty`) || 1),
          expression: data.get(`c${idx}_expr`) || null,
          profile_id: data.get(`c${idx}_profile`) ? Number(data.get(`c${idx}_profile`)) : null,
        });
      });

      const submitBtn = form.querySelector('button[type=submit]');
      submitBtn.disabled = true;
      try {
        const formula = await apiPost('/formulas', {
          name: data.get('name'),
          typology_id: data.get('typology_id') ? Number(data.get('typology_id')) : null,
          product_line_id: data.get('product_line_id') ? Number(data.get('product_line_id')) : null,
          description: data.get('description') || null,
          rounding_mode: data.get('rounding_mode'),
          components,
        });
        window.location.hash = `#/formulas/${formula.id}`;
      } catch (err) {
        submitBtn.disabled = false;
        errBox.innerHTML = `<div class="state error" style="padding:0.5rem 0;">${esc(err.message)}</div>`;
      }
    });
  }

  // --- Autenticação ------------------------------------------------------

  function showTopnav(user) {
    const topnav = document.getElementById('topnav');
    const topbarUser = document.getElementById('topbar-user');
    if (user) {
      topnav.hidden = false;
      topbarUser.hidden = false;
      document.getElementById('user-name').textContent = user.name || user.email;
    } else {
      topnav.hidden = true;
      topbarUser.hidden = true;
    }
  }

  function renderLogin(message) {
    showTopnav(null);
    app.innerHTML = `
      <div class="login-wrap">
        <div class="login-box">
          <div class="brand-mark" style="width:40px;height:40px;font-size:1.3rem;">V</div>
          <h1>Entrar no sistema</h1>
          ${message ? `<div class="login-error">${esc(message)}</div>` : ''}
          <form id="login-form">
            <div class="field">
              <label for="login-email">E-mail</label>
              <input id="login-email" name="email" type="email" required autofocus />
            </div>
            <div class="field">
              <label for="login-password">Senha</label>
              <input id="login-password" name="password" type="password" required />
            </div>
            <button class="btn" type="submit">Entrar</button>
          </form>
        </div>
      </div>
    `;

    document.getElementById('login-form').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const data = new FormData(ev.target);
      const submitBtn = ev.target.querySelector('button[type=submit]');
      submitBtn.disabled = true;
      try {
        const result = await apiPost('/auth/login', {
          email: data.get('email'),
          password: data.get('password'),
        });
        showTopnav(result.user);
        route();
      } catch (err) {
        submitBtn.disabled = false;
        renderLogin(err.message || 'Não foi possível entrar.');
      }
    });
  }

  document.getElementById('logout-link').addEventListener('click', async (ev) => {
    ev.preventDefault();
    try { await apiPost('/auth/logout', {}); } catch (err) { /* segue para o login de qualquer forma */ }
    renderLogin();
  });

  // --- Router ----------------------------------------------------------

  function setActiveNav(section) {
    document.querySelectorAll('.topnav a').forEach((a) => {
      a.classList.toggle('active', a.dataset.nav === section);
    });
  }

  async function route() {
    let session;
    try {
      session = await api('/auth/me');
    } catch (err) {
      return renderLogin();
    }
    showTopnav(session.user);

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
    if (segments[0] === 'formulas' && segments[1] === 'nova') {
      setActiveNav('formulas');
      return viewFormulaNova();
    }
    if (segments[0] === 'formulas' && segments[1]) {
      setActiveNav('formulas');
      return viewFormulaDetail(segments[1]);
    }
    if (segments[0] === 'formulas') {
      setActiveNav('formulas');
      return viewFormulas();
    }
    if (segments[0] === 'tipologias') {
      setActiveNav('tipologias');
      return viewTipologias();
    }
    if (segments[0] === 'clientes') {
      setActiveNav('clientes');
      return viewClientes();
    }
    if (segments[0] === 'obras') {
      setActiveNav('obras');
      return viewObras();
    }
    if (segments[0] === 'orcamentos' && segments[1]) {
      setActiveNav('orcamentos');
      return viewOrcamentoDetail(segments[1]);
    }
    if (segments[0] === 'orcamentos') {
      setActiveNav('orcamentos');
      return viewOrcamentos(params);
    }
    if (segments[0] === 'financeiro') {
      setActiveNav('financeiro');
      return viewFinanceiro(params);
    }
    if (segments[0] === 'compras') {
      setActiveNav('compras');
      return viewCompras();
    }
    if (segments[0] === 'senha') {
      setActiveNav('');
      return viewChangePassword();
    }

    app.innerHTML = `<div class="state">Página não encontrada.</div>`;
  }

  window.addEventListener('hashchange', route);
  window.addEventListener('DOMContentLoaded', route);
})();
