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

  async function viewAcessorios(params) {
    setLoading('acessórios');
    try {
      const categoryFilter = params.get('category') || '';
      const query = categoryFilter ? `?category=${categoryFilter}` : '';
      const [accessories, manufacturers, compat, drawings, typologies] = await Promise.all([
        api(`/acessorios${query}`),
        api('/fabricantes'),
        api('/acessorios-compatibilidades'),
        api('/desenhos-tecnicos?subject_type=ACCESSORY'),
        api('/tipologias'),
      ]);
      renderAcessorios(accessories, manufacturers, compat, drawings, typologies, categoryFilter);
    } catch (err) {
      setError(err);
    }
  }

  function renderAcessorios(accessories, manufacturers, compat, drawings, typologies, categoryFilter) {
    const manufacturerById = Object.fromEntries(manufacturers.map((m) => [String(m.id), m.name]));
    const typologyById = Object.fromEntries(typologies.map((t) => [String(t.id), t.name]));
    const drawingByAccessory = Object.fromEntries(drawings.map((d) => [String(d.subject_id), d]));
    const compatByAccessory = {};
    compat.forEach((c) => {
      if (!compatByAccessory[String(c.accessory_id)]) compatByAccessory[String(c.accessory_id)] = [];
      compatByAccessory[String(c.accessory_id)].push(c);
    });

    const categories = [...new Set(accessories.map((a) => a.category).filter(Boolean))].sort();

    const cards = accessories.map((a) => {
      const drawing = drawingByAccessory[String(a.id)];
      const applications = compatByAccessory[String(a.id)] || [];
      const appHtml = applications.map((c) => {
        const typ = c.typology_id ? typologyById[String(c.typology_id)] : null;
        return `<div class="sub">${typ ? `<span class="chip info">${esc(typ)}</span> ` : ''}${esc(c.notes || '')}</div>`;
      }).join('');
      return `
        <div class="card">
          ${drawing ? `<img src="/${esc(drawing.file_path)}" alt="" style="width:100%;border-radius:6px;margin-bottom:0.6rem;border:1px solid var(--border);" loading="lazy" />` : ''}
          <h2 class="mono" style="font-size:0.95rem;">${esc(a.code)}</h2>
          <div class="sub">${esc(a.name || '—')}</div>
          <div style="margin:0.4rem 0;"><span class="chip warn">${esc(a.category || 'OUTRO')}</span> <span class="sub">${esc(manufacturerById[String(a.manufacturer_id)] || '')}</span></div>
          ${appHtml}
        </div>
      `;
    }).join('');

    app.innerHTML = `
      <div class="page-head">
        <h1>Acessórios</h1>
        <p>${accessories.length} ferragem(ns)/acessório(s) catalogado(s). A aplicação (embaixo de cada item) vem do
        próprio catálogo; o selo colorido só aparece quando bate com uma tipologia já cadastrada.</p>
      </div>
      <div class="filters">
        <div class="field">
          <label for="ac-category">Categoria</label>
          <select id="ac-category">
            <option value="">Todas</option>
            ${categories.map((c) => `<option value="${c}" ${c === categoryFilter ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="card-grid">${cards || '<div class="state">Nenhum acessório encontrado.</div>'}</div>
    `;

    document.getElementById('ac-category').addEventListener('change', (ev) => {
      window.location.hash = ev.target.value ? `#/acessorios?category=${ev.target.value}` : '#/acessorios';
    });
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

  function maxOf(a, b) {
    const vals = [a, b].filter((v) => v !== null && v !== undefined && v !== '');
    if (vals.length === 0) return null;
    return Math.max(...vals.map(Number));
  }

  function lineAreaM2(item) {
    const w = maxOf(item.width_mm, item.width_mm_2);
    const h = maxOf(item.height_mm, item.height_mm_2);
    if (w === null || h === null) return null;
    return (w / 1000) * (h / 1000) * Number(item.quantity || 1);
  }

  async function viewOrcamentoDetail(id) {
    setLoading('orçamento');
    try {
      const [quote, items, accessories, formulas, glassTypes] = await Promise.all([
        api(`/orcamentos/${id}`),
        api(`/orcamentos-itens?quote_id=${id}`),
        api(`/orcamentos-acessorios?quote_id=${id}`),
        api('/formulas'),
        api('/vidros'),
      ]);
      const project = await api(`/projetos/${quote.project_id}`).catch(() => null);
      renderOrcamentoDetail(quote, items, project, accessories, formulas, glassTypes);
    } catch (err) {
      setError(err);
    }
  }

  function renderOrcamentoDetail(quote, items, project, accessories, formulas, glassTypes) {
    const rows = items.map((it) => {
      const area = lineAreaM2(it);
      return `
      <tr>
        <td class="wrap">${esc(it.description)}</td>
        <td>${area !== null ? fmtNum(area, 2) + ' m²' : '—'}</td>
        <td class="num">${esc(it.quantity)}</td>
        <td class="num">${fmtMoney(it.unit_price)}${it.pricing_unit === 'M2' ? '/m²' : ''}</td>
        <td class="num">${fmtMoney(it.total_price)}</td>
      </tr>`;
    }).join('');
    const total = items.reduce((sum, it) => sum + Number(it.total_price || 0), 0);

    const accessoryRows = accessories.map((a) => `
      <tr><td class="wrap">${esc(a.description)}</td><td class="num">${esc(a.quantity)}</td></tr>
    `).join('');

    app.innerHTML = `
      <p><a href="#/orcamentos" class="btn-ghost">&larr; Voltar para orçamentos</a></p>
      <div class="detail-head">
        <div>
          <h1>Orçamento #${quote.id}</h1>
          <div class="sub">${esc(project ? project.name : 'obra #' + quote.project_id)}</div>
        </div>
        ${statusPillForData(quote.status)}
      </div>

      <div class="form-grid" style="margin-bottom:1.2rem;">
        <a href="#/orcamentos/${quote.id}/imprimir" class="btn btn-ghost btn-small" style="text-decoration:none;">Imprimir</a>
        <a href="#/orcamentos/${quote.id}/compras" class="btn btn-ghost btn-small" style="text-decoration:none;">Relatório de compras</a>
        <a href="#/orcamentos/${quote.id}/tempera" class="btn btn-ghost btn-small" style="text-decoration:none;">Relatório de têmpera</a>
        <button class="btn btn-small" id="btn-criar-pedido-tempera">Criar pedido de têmpera</button>
      </div>

      <div class="section-title">Itens do orçamento (${items.length})</div>
      <div class="tablewrap">
        <table>
          <thead><tr><th>Descrição</th><th>M²</th><th>Qtd.</th><th>Valor unit.</th><th>Total</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5" style="color:var(--text-muted)">Sem itens ainda.</td></tr>'}</tbody>
          <tfoot><tr><td colspan="4" style="text-align:right;font-weight:600;">Total</td><td class="num" style="font-weight:600;">${fmtMoney(total)}</td></tr></tfoot>
        </table>
      </div>

      <div class="form-box" style="margin-top:1.2rem;">
        <form id="quote-item-form">
          <div class="form-grid" style="margin-bottom:0.7rem;">
            <div class="field" style="flex-basis:220px;"><label for="qi-desc">Descrição *</label><input id="qi-desc" type="text" required /></div>
            <div class="field"><label for="qi-formula">Fórmula (opcional)</label>
              <select id="qi-formula"><option value="">—</option>${optionsFrom(formulas.filter((f) => f.current_version_id), 'current_version_id', 'name')}</select>
            </div>
            <div class="field"><label for="qi-glass">Vidro (opcional)</label>
              <select id="qi-glass"><option value="">—</option>${optionsFrom(glassTypes, 'id', 'name')}</select>
            </div>
            <div class="field"><label for="qi-pricing">Tipo de preço</label>
              <select id="qi-pricing"><option value="UN">Valor fechado (R$)</option><option value="M2">Por m² (R$/m²)</option></select>
            </div>
          </div>
          <div class="form-grid" style="margin-bottom:0.4rem;">
            <div class="field"><label for="qi-w1">Largura 1 (mm)</label><input id="qi-w1" type="number" step="1" /></div>
            <div class="field"><label for="qi-w2">Largura 2 (mm, se fora de esquadro)</label><input id="qi-w2" type="number" step="1" /></div>
            <div class="field"><label for="qi-h1">Altura 1 (mm)</label><input id="qi-h1" type="number" step="1" /></div>
            <div class="field"><label for="qi-h2">Altura 2 (mm, se fora de esquadro)</label><input id="qi-h2" type="number" step="1" /></div>
          </div>
          <p id="qi-area-preview" style="font-size:0.85rem;color:var(--text-muted);margin:0 0 0.7rem;"></p>
          <div class="form-grid">
            <div class="field"><label for="qi-qty">Quantidade</label><input id="qi-qty" type="number" min="1" value="1" /></div>
            <div class="field"><label for="qi-price" id="qi-price-label">Valor unitário (R$)</label><input id="qi-price" type="number" step="0.01" min="0" value="0" /></div>
            <button class="btn" type="submit">Adicionar item</button>
          </div>
        </form>
        <div id="quote-item-form-error"></div>
      </div>

      <div class="section-title">Acessórios do orçamento (${accessories.length})</div>
      <div class="tablewrap">
        <table>
          <thead><tr><th>Descrição</th><th>Qtd.</th></tr></thead>
          <tbody>${accessoryRows || '<tr><td colspan="2" style="color:var(--text-muted)">Nenhum acessório lançado ainda.</td></tr>'}</tbody>
        </table>
      </div>
      <div class="form-box" style="margin-top:0.7rem;">
        <form class="form-grid" id="quote-accessory-form">
          <div class="field" style="flex-basis:220px;"><label for="qa-desc">Descrição *</label><input id="qa-desc" type="text" placeholder="ex: Dobradiça inox 3'" required /></div>
          <div class="field"><label for="qa-qty">Quantidade</label><input id="qa-qty" type="number" min="0.01" step="0.01" value="1" /></div>
          <button class="btn" type="submit">Adicionar acessório</button>
        </form>
        <div id="quote-accessory-form-error"></div>
      </div>
    `;

    function updatePriceLabelAndPreview() {
      const pricing = document.getElementById('qi-pricing').value;
      document.getElementById('qi-price-label').textContent = pricing === 'M2' ? 'Valor por m² (R$/m²)' : 'Valor unitário (R$)';
      const w = maxOf(numOrNull('qi-w1'), numOrNull('qi-w2'));
      const h = maxOf(numOrNull('qi-h1'), numOrNull('qi-h2'));
      const preview = document.getElementById('qi-area-preview');
      if (w !== null && h !== null) {
        preview.textContent = `Medida usada no cálculo: ${fmtNum(w, 0)} x ${fmtNum(h, 0)} mm (maior largura x maior altura) = ${fmtNum((w / 1000) * (h / 1000), 2)} m² por unidade.`;
      } else {
        preview.textContent = '';
      }
    }

    function numOrNull(id) {
      const v = document.getElementById(id).value;
      return v === '' ? null : Number(v);
    }

    ['qi-pricing', 'qi-w1', 'qi-w2', 'qi-h1', 'qi-h2'].forEach((id) => {
      document.getElementById(id).addEventListener('input', updatePriceLabelAndPreview);
    });

    document.getElementById('quote-item-form').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const errBox = document.getElementById('quote-item-form-error');
      errBox.innerHTML = '';
      const quantity = Number(document.getElementById('qi-qty').value || 1);
      const price = Number(document.getElementById('qi-price').value || 0);
      const pricingUnit = document.getElementById('qi-pricing').value;
      const width = numOrNull('qi-w1');
      const width2 = numOrNull('qi-w2');
      const height = numOrNull('qi-h1');
      const height2 = numOrNull('qi-h2');

      let totalPrice;
      if (pricingUnit === 'M2') {
        const w = maxOf(width, width2);
        const h = maxOf(height, height2);
        if (w === null || h === null) {
          errBox.innerHTML = `<div class="state error" style="padding:0.5rem 0;">Preço por m² exige largura e altura preenchidas.</div>`;
          return;
        }
        totalPrice = quantity * (w / 1000) * (h / 1000) * price;
      } else {
        totalPrice = quantity * price;
      }

      try {
        await apiPost('/orcamentos-itens', {
          quote_id: quote.id,
          description: document.getElementById('qi-desc').value,
          formula_version_id: document.getElementById('qi-formula').value || null,
          glass_type_id: document.getElementById('qi-glass').value || null,
          pricing_unit: pricingUnit,
          width_mm: width,
          width_mm_2: width2,
          height_mm: height,
          height_mm_2: height2,
          quantity,
          unit_price: price,
          total_price: totalPrice,
        });
        const freshItems = await api(`/orcamentos-itens?quote_id=${quote.id}`);
        const newTotal = freshItems.reduce((sum, it) => sum + Number(it.total_price || 0), 0);
        await apiSend('PUT', `/orcamentos/${quote.id}`, { total_value: newTotal });
        viewOrcamentoDetail(quote.id);
      } catch (err) {
        errBox.innerHTML = `<div class="state error" style="padding:0.5rem 0;">${esc(err.message)}</div>`;
      }
    });

    document.getElementById('quote-accessory-form').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const errBox = document.getElementById('quote-accessory-form-error');
      errBox.innerHTML = '';
      try {
        await apiPost('/orcamentos-acessorios', {
          quote_id: quote.id,
          description: document.getElementById('qa-desc').value,
          quantity: Number(document.getElementById('qa-qty').value || 1),
        });
        viewOrcamentoDetail(quote.id);
      } catch (err) {
        errBox.innerHTML = `<div class="state error" style="padding:0.5rem 0;">${esc(err.message)}</div>`;
      }
    });

    document.getElementById('btn-criar-pedido-tempera').addEventListener('click', async (ev) => {
      const btn = ev.target;
      btn.disabled = true;
      try {
        const order = await apiPost('/pedidos-tempera', { quote_id: quote.id });
        window.location.hash = `#/tempera/${order.id}`;
      } catch (err) {
        btn.disabled = false;
        window.alert(err.message);
      }
    });
  }

  async function viewOrcamentoCompras(id) {
    setLoading('relatório de compras');
    try {
      const report = await api(`/orcamentos/${id}/relatorio-compras`);
      renderOrcamentoCompras(id, report);
    } catch (err) {
      setError(err);
    }
  }

  function renderOrcamentoCompras(id, report) {
    const profileRows = report.profiles.map((p) => `
      <tr>
        <td class="mono">${esc(p.profile_code || '—')}</td>
        <td class="wrap">${esc(p.profile_name || '—')}</td>
        <td class="num">${fmtNum(p.total_length_m, 2)} m</td>
        <td>${p.estimativa_formula_nao_liberada ? '<span class="chip warn">estimativa (fórmula não liberada)</span>' : '<span class="chip ok">fórmula liberada</span>'}</td>
      </tr>
    `).join('');
    const glassRows = report.glass.map((g) => `
      <tr>
        <td class="wrap">${esc(g.glass_type || '—')}</td>
        <td>${esc(g.glass_category || '—')}</td>
        <td>${g.thickness_mm ? fmtNum(g.thickness_mm, 1) + ' mm' : '—'}</td>
        <td class="num">${fmtNum(g.total_area_m2, 2)} m²</td>
      </tr>
    `).join('');
    const accessoryRows = report.accessories.map((a) => `
      <tr><td class="wrap">${esc(a.description)}</td><td class="num">${fmtNum(a.total_quantity, 2)}</td></tr>
    `).join('');

    app.innerHTML = `
      <p><a href="#/orcamentos/${id}" class="btn-ghost">&larr; Voltar para o orçamento</a></p>
      <div class="page-head">
        <h1>Relatório de compras — Orçamento #${id}</h1>
        <p>Perfis calculados a partir da fórmula e das medidas de cada item (maior largura x maior altura).
        Itens marcados como estimativa usam fórmula ainda não liberada para produção — confira antes de comprar.</p>
      </div>

      <div class="section-title">Perfis (${report.profiles.length})</div>
      <div class="tablewrap">
        <table>
          <thead><tr><th>Código</th><th>Nome</th><th>Total a comprar</th><th>Origem</th></tr></thead>
          <tbody>${profileRows || '<tr><td colspan="4" style="color:var(--text-muted)">Nenhum item com fórmula e medida preenchidas.</td></tr>'}</tbody>
        </table>
      </div>

      <div class="section-title">Vidros (${report.glass.length})</div>
      <div class="tablewrap">
        <table>
          <thead><tr><th>Tipo</th><th>Categoria</th><th>Espessura</th><th>Área total</th></tr></thead>
          <tbody>${glassRows || '<tr><td colspan="4" style="color:var(--text-muted)">Nenhum item com vidro e medida preenchidas.</td></tr>'}</tbody>
        </table>
      </div>

      <div class="section-title">Acessórios (${report.accessories.length})</div>
      <div class="tablewrap">
        <table>
          <thead><tr><th>Descrição</th><th>Qtd.</th></tr></thead>
          <tbody>${accessoryRows || '<tr><td colspan="2" style="color:var(--text-muted)">Nenhum acessório lançado neste orçamento.</td></tr>'}</tbody>
        </table>
      </div>
    `;
  }

  async function viewOrcamentoTempera(id) {
    setLoading('relatório de têmpera');
    try {
      const pieces = await api(`/orcamentos/${id}/relatorio-tempera`);
      renderOrcamentoTempera(id, pieces);
    } catch (err) {
      setError(err);
    }
  }

  function renderOrcamentoTempera(id, pieces) {
    const rows = pieces.map((p) => `
      <tr>
        <td class="wrap">${esc(p.description)}</td>
        <td>${esc(p.glass_type)}</td>
        <td>${p.thickness_mm ? fmtNum(p.thickness_mm, 1) + ' mm' : '—'}</td>
        <td class="num">${fmtNum(p.width_mm, 0)} x ${fmtNum(p.height_mm, 0)} mm</td>
        <td class="num">${esc(p.quantity)}</td>
      </tr>
    `).join('');

    app.innerHTML = `
      <p><a href="#/orcamentos/${id}" class="btn-ghost">&larr; Voltar para o orçamento</a></p>
      <div class="page-head">
        <h1>Relatório de têmpera — Orçamento #${id}</h1>
        <p>${pieces.length} peça(s) de vidro temperado (categoria TEMPERADO), medida final já com a maior
        largura x maior altura de cada item. Lista pronta pra mandar pra têmpera.</p>
      </div>
      <div class="tablewrap">
        <table>
          <thead><tr><th>Item</th><th>Vidro</th><th>Espessura</th><th>Medida</th><th>Qtd.</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5" style="color:var(--text-muted)">Nenhuma peça de vidro temperado neste orçamento.</td></tr>'}</tbody>
        </table>
      </div>
    `;
  }

  async function viewOrcamentoImprimir(id) {
    setLoading('orçamento para impressão');
    try {
      const [quote, items] = await Promise.all([
        api(`/orcamentos/${id}`),
        api(`/orcamentos-itens?quote_id=${id}`),
      ]);
      const project = await api(`/projetos/${quote.project_id}`).catch(() => null);
      const customer = project ? await api(`/clientes/${project.customer_id}`).catch(() => null) : null;
      renderOrcamentoImprimir(quote, items, project, customer);
    } catch (err) {
      setError(err);
    }
  }

  function renderOrcamentoImprimir(quote, items, project, customer) {
    const rows = items.map((it) => {
      const area = lineAreaM2(it);
      return `
      <tr>
        <td class="wrap">${esc(it.description)}</td>
        <td>${area !== null ? fmtNum(area, 2) + ' m²' : '—'}</td>
        <td class="num">${esc(it.quantity)}</td>
        <td class="num">${fmtMoney(it.total_price)}</td>
      </tr>`;
    }).join('');
    const total = items.reduce((sum, it) => sum + Number(it.total_price || 0), 0);

    app.innerHTML = `
      <div class="no-print" style="margin-bottom:1rem;display:flex;gap:0.6rem;">
        <a href="#/orcamentos/${quote.id}" class="btn-ghost">&larr; Voltar</a>
        <button class="btn" id="btn-imprimir">Imprimir</button>
      </div>
      <div class="print-sheet">
        <h1>Orçamento #${quote.id}</h1>
        <p><strong>Cliente:</strong> ${esc(customer ? customer.name : '—')}</p>
        <p><strong>Obra:</strong> ${esc(project ? project.name : '—')}${project && project.address ? ' — ' + esc(project.address) : ''}</p>
        <p><strong>Data:</strong> ${esc((quote.created_at || '').slice(0, 10))}</p>
        <table>
          <thead><tr><th>Descrição</th><th>Metragem</th><th>Qtd.</th><th>Valor</th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr><td colspan="3" style="text-align:right;font-weight:600;">Total</td><td class="num" style="font-weight:600;">${fmtMoney(total)}</td></tr></tfoot>
        </table>
      </div>
    `;
    document.getElementById('btn-imprimir').addEventListener('click', () => window.print());
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

  // --- Editor de desenho (retângulo/linha/seta/texto sobre SVG) ------------
  // Formas guardadas como dado estruturado (não imagem), pra poder reabrir e
  // editar depois. Funciona com mouse e touch via Pointer Events.

  let svgMarkerSeq = 0;

  function shapesToSvgInner(shapes) {
    return shapes.map((s) => {
      if (s.type === 'rect') {
        const x = Math.min(s.x1, s.x2);
        const y = Math.min(s.y1, s.y2);
        const w = Math.abs(s.x2 - s.x1);
        const h = Math.abs(s.y2 - s.y1);
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="currentColor" stroke-width="2" />`;
      }
      if (s.type === 'line') {
        return `<line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" stroke="currentColor" stroke-width="2" />`;
      }
      if (s.type === 'arrow') {
        return `<line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" stroke="currentColor" stroke-width="2" marker-end="url(#${s._markerId})" />`;
      }
      if (s.type === 'text') {
        return `<text x="${s.x1}" y="${s.y1}" font-size="14" fill="currentColor">${esc(s.text)}</text>`;
      }
      return '';
    }).join('');
  }

  /** Monta o quadro de desenho dentro de containerEl (editável) ou só exibe (readOnly). */
  function mountDrawingEditor(containerEl, initialShapes, readOnly) {
    const markerId = `arrowhead-${svgMarkerSeq++}`;
    const width = 420;
    const height = 300;
    const shapes = (initialShapes || []).map((s) => ({ ...s, _markerId: markerId }));

    containerEl.innerHTML = `
      ${readOnly ? '' : `
        <div class="drawing-toolbar">
          <button type="button" class="btn btn-small tool-btn active" data-tool="rect">▭ Retângulo</button>
          <button type="button" class="btn btn-small tool-btn" data-tool="line">╱ Linha</button>
          <button type="button" class="btn btn-small tool-btn" data-tool="arrow">→ Seta</button>
          <button type="button" class="btn btn-small tool-btn" data-tool="text">T Texto</button>
          <button type="button" class="btn btn-ghost btn-small" id="dw-undo">Desfazer</button>
          <button type="button" class="btn btn-ghost btn-small" id="dw-clear">Limpar</button>
        </div>
      `}
      <svg viewBox="0 0 ${width} ${height}" width="100%" style="max-width:${width}px;height:auto;border:1px solid var(--border);border-radius:6px;background:var(--surface);color:var(--text);touch-action:none;display:block;">
        <defs><marker id="${markerId}" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="currentColor" /></marker></defs>
        <g id="dw-shapes-${markerId}"></g>
      </svg>
    `;

    const svgEl = containerEl.querySelector('svg');
    const groupEl = containerEl.querySelector(`#dw-shapes-${markerId}`);

    function redraw(tempShape) {
      groupEl.innerHTML = shapesToSvgInner(tempShape ? [...shapes, tempShape] : shapes);
    }
    redraw();

    if (readOnly) {
      return { getShapes: () => shapes };
    }

    let currentTool = 'rect';
    containerEl.querySelectorAll('.tool-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentTool = btn.dataset.tool;
        containerEl.querySelectorAll('.tool-btn').forEach((b) => b.classList.toggle('active', b === btn));
      });
    });

    containerEl.querySelector('#dw-undo').addEventListener('click', () => {
      shapes.pop();
      redraw();
    });
    containerEl.querySelector('#dw-clear').addEventListener('click', () => {
      if (shapes.length === 0 || window.confirm('Limpar todo o desenho?')) {
        shapes.length = 0;
        redraw();
      }
    });

    function pointFromEvent(ev) {
      const pt = svgEl.createSVGPoint();
      pt.x = ev.clientX;
      pt.y = ev.clientY;
      const transformed = pt.matrixTransform(svgEl.getScreenCTM().inverse());
      return { x: Math.round(transformed.x), y: Math.round(transformed.y) };
    }

    let dragStart = null;
    svgEl.addEventListener('pointerdown', (ev) => {
      const p = pointFromEvent(ev);
      if (currentTool === 'text') {
        const text = window.prompt('Texto do rótulo:');
        if (text) {
          shapes.push({ type: 'text', x1: p.x, y1: p.y, text, _markerId: markerId });
          redraw();
        }
        return;
      }
      dragStart = p;
      svgEl.setPointerCapture(ev.pointerId);
    });
    svgEl.addEventListener('pointermove', (ev) => {
      if (!dragStart) return;
      const p = pointFromEvent(ev);
      redraw({ type: currentTool, x1: dragStart.x, y1: dragStart.y, x2: p.x, y2: p.y, _markerId: markerId });
    });
    svgEl.addEventListener('pointerup', (ev) => {
      if (!dragStart) return;
      const p = pointFromEvent(ev);
      if (Math.abs(p.x - dragStart.x) > 3 || Math.abs(p.y - dragStart.y) > 3) {
        shapes.push({ type: currentTool, x1: dragStart.x, y1: dragStart.y, x2: p.x, y2: p.y, _markerId: markerId });
      }
      dragStart = null;
      redraw();
    });

    return { getShapes: () => shapes.map(({ _markerId, ...rest }) => rest) };
  }

  function drawingThumbnail(drawingDataJson) {
    if (!drawingDataJson) return '<span style="color:var(--text-muted);font-size:0.8rem;">sem desenho</span>';
    let shapes;
    try { shapes = JSON.parse(drawingDataJson); } catch { return '—'; }
    const markerId = `arrowhead-${svgMarkerSeq++}`;
    const withMarker = shapes.map((s) => ({ ...s, _markerId: markerId }));
    return `<svg viewBox="0 0 420 300" width="90" height="64" style="border:1px solid var(--border);border-radius:4px;background:var(--surface);color:var(--text);">
      <defs><marker id="${markerId}" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="currentColor" /></marker></defs>
      ${shapesToSvgInner(withMarker)}
    </svg>`;
  }

  async function viewTipologias() {
    setLoading('tipologias');
    try {
      const typologies = await api('/tipologias');
      renderTipologias(typologies, null);
    } catch (err) {
      setError(err);
    }
  }

  async function viewTipologiaEditar(id) {
    setLoading('tipologia');
    try {
      const [typologies, typology] = await Promise.all([api('/tipologias'), api(`/tipologias/${id}`)]);
      renderTipologias(typologies, typology);
    } catch (err) {
      setError(err);
    }
  }

  function renderTipologias(typologies, editing) {
    const rows = typologies.map((t) => `
      <tr>
        <td>${drawingThumbnail(t.drawing_data)}</td>
        <td>${esc(t.name)}</td>
        <td>${esc(t.category)}</td>
        <td>${t.has_baguete ? 'Sim' : 'Não'}</td>
        <td>${t.is_common_in_brazil ? 'Sim' : 'Não'}</td>
        <td><a href="#/tipologias/${t.id}/editar">Editar</a></td>
      </tr>
    `).join('');

    app.innerHTML = `
      <div class="page-head">
        <h1>Tipologias</h1>
        <p>${typologies.length} tipologia(s) cadastrada(s). Usadas em vãos e fórmulas. Desenhe o esquema (marco, folha,
        sentido de abertura) direto no quadro abaixo.</p>
      </div>
      <div class="form-box">
        <form id="typology-form">
          <div class="form-grid" style="margin-bottom:0.9rem;">
            <div class="field"><label for="ty-name">Nome *</label><input id="ty-name" type="text" value="${esc(editing ? editing.name : '')}" required /></div>
            <div class="field"><label for="ty-category">Categoria *</label>
              <select id="ty-category" required>${enumOptions(TYPOLOGY_CATEGORIES, editing ? editing.category : '')}</select>
            </div>
            <div class="field"><label for="ty-baguete">Tem baguete?</label>
              <select id="ty-baguete">
                <option value="0" ${editing && !editing.has_baguete ? 'selected' : ''}>Não</option>
                <option value="1" ${editing && editing.has_baguete ? 'selected' : ''}>Sim</option>
              </select>
            </div>
          </div>
          <div class="section-title" style="margin-top:0;">Desenho esquemático</div>
          <div id="typology-drawing"></div>
          <div style="margin-top:0.8rem;display:flex;gap:0.6rem;">
            <button class="btn" type="submit">${editing ? 'Salvar alterações' : 'Cadastrar tipologia'}</button>
            ${editing ? '<a href="#/tipologias" class="btn btn-ghost">Cancelar edição</a>' : ''}
          </div>
        </form>
        <div id="typology-form-error"></div>
      </div>
      <div class="tablewrap">
        <table>
          <thead><tr><th>Desenho</th><th>Nome</th><th>Categoria</th><th>Baguete</th><th>Comum no Brasil</th><th></th></tr></thead>
          <tbody>${rows || '<tr><td colspan="6" style="color:var(--text-muted)">Nenhuma tipologia cadastrada.</td></tr>'}</tbody>
        </table>
      </div>
    `;

    let initialShapes = [];
    if (editing && editing.drawing_data) {
      try { initialShapes = JSON.parse(editing.drawing_data); } catch { initialShapes = []; }
    }
    const editor = mountDrawingEditor(document.getElementById('typology-drawing'), initialShapes, false);

    document.getElementById('typology-form').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const errBox = document.getElementById('typology-form-error');
      errBox.innerHTML = '';
      const payload = {
        name: document.getElementById('ty-name').value,
        category: document.getElementById('ty-category').value,
        has_baguete: Number(document.getElementById('ty-baguete').value),
        is_common_in_brazil: 1,
        drawing_data: JSON.stringify(editor.getShapes()),
      };
      try {
        if (editing) {
          await apiSend('PUT', `/tipologias/${editing.id}`, payload);
        } else {
          await apiPost('/tipologias', payload);
        }
        window.location.hash = '#/tipologias';
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

  // --- Usuários --------------------------------------------------------

  const USER_ROLES = ['ADMIN', 'USER', 'TECNICO'];

  async function viewUsuarios() {
    setLoading('usuários');
    try {
      const users = await api('/usuarios');
      renderUsuarios(users);
    } catch (err) {
      setError(err);
    }
  }

  function renderUsuarios(users) {
    const rows = users.map((u) => `
      <tr>
        <td>${esc(u.name)}</td>
        <td>${esc(u.email)}</td>
        <td>
          <select data-role-for="${u.id}">${enumOptions(USER_ROLES, u.role)}</select>
        </td>
        <td>${u.active ? '<span class="chip ok">Ativo</span>' : '<span class="chip danger">Inativo</span>'}</td>
        <td>${esc((u.last_login_at || '—').toString().slice(0, 16).replace('T', ' '))}</td>
        <td><button class="btn btn-small toggle-active" data-id="${u.id}" data-active="${u.active}">${u.active ? 'Desativar' : 'Ativar'}</button></td>
      </tr>
    `).join('');

    app.innerHTML = `
      <div class="page-head">
        <h1>Usuários</h1>
        <p>${users.length} usuário(s). O papel (role) ainda não restringe acesso — todo usuário ativo vê o sistema inteiro.</p>
      </div>
      <div class="form-box">
        <form class="form-grid" id="user-form">
          <div class="field"><label for="us-name">Nome *</label><input id="us-name" type="text" required /></div>
          <div class="field"><label for="us-email">E-mail *</label><input id="us-email" type="email" required /></div>
          <div class="field"><label for="us-password">Senha inicial *</label><input id="us-password" type="password" minlength="8" required /></div>
          <div class="field"><label for="us-role">Papel</label><select id="us-role">${enumOptions(USER_ROLES, 'USER')}</select></div>
          <button class="btn" type="submit">Cadastrar usuário</button>
        </form>
        <div id="user-form-error"></div>
      </div>
      <div class="tablewrap">
        <table>
          <thead><tr><th>Nome</th><th>E-mail</th><th>Papel</th><th>Status</th><th>Último login</th><th></th></tr></thead>
          <tbody>${rows || '<tr><td colspan="6" style="color:var(--text-muted)">Nenhum usuário cadastrado.</td></tr>'}</tbody>
        </table>
      </div>
    `;

    document.getElementById('user-form').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const errBox = document.getElementById('user-form-error');
      errBox.innerHTML = '';
      try {
        await apiPost('/usuarios', {
          name: document.getElementById('us-name').value,
          email: document.getElementById('us-email').value,
          password: document.getElementById('us-password').value,
          role: document.getElementById('us-role').value,
        });
        viewUsuarios();
      } catch (err) {
        errBox.innerHTML = `<div class="state error" style="padding:0.5rem 0;">${esc(err.message)}</div>`;
      }
    });

    document.querySelectorAll('.toggle-active').forEach((btn) => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          await apiSend('PUT', `/usuarios/${btn.dataset.id}`, { active: btn.dataset.active !== '1' });
          viewUsuarios();
        } catch (err) {
          btn.disabled = false;
        }
      });
    });

    document.querySelectorAll('[data-role-for]').forEach((sel) => {
      sel.addEventListener('change', async () => {
        try {
          await apiSend('PUT', `/usuarios/${sel.dataset.roleFor}`, { role: sel.value });
        } catch (err) { /* ignora -- select volta a ficar visualmente errado até recarregar */ }
      });
    });
  }

  // --- Materiais ---------------------------------------------------------

  const MATERIAL_CATEGORIES = ['PERFIL', 'VIDRO', 'ACESSORIO', 'GUARNICAO', 'OUTRO'];

  async function viewMateriais() {
    setLoading('materiais');
    try {
      const materials = await api('/materiais');
      renderMateriais(materials);
    } catch (err) {
      setError(err);
    }
  }

  function renderMateriais(materials) {
    const rows = materials.map((m) => `
      <tr>
        <td class="wrap">${esc(m.name)}</td>
        <td>${esc(m.category)}</td>
        <td>${esc(m.unit)}</td>
        <td class="num">${fmtNum(m.min_stock, 2)}</td>
      </tr>
    `).join('');

    app.innerHTML = `
      <div class="page-head">
        <h1>Materiais</h1>
        <p>${materials.length} material(is) cadastrado(s). Usado no controle de estoque e no relatório de compras.</p>
      </div>
      <div class="form-box">
        <form class="form-grid" id="material-form">
          <div class="field" style="flex-basis:220px;"><label for="ma-name">Nome *</label><input id="ma-name" type="text" required /></div>
          <div class="field"><label for="ma-category">Categoria</label><select id="ma-category">${enumOptions(MATERIAL_CATEGORIES, 'OUTRO')}</select></div>
          <div class="field"><label for="ma-unit">Unidade</label><input id="ma-unit" type="text" value="un" style="width:70px;" /></div>
          <div class="field"><label for="ma-min">Estoque mínimo</label><input id="ma-min" type="number" step="0.01" min="0" value="0" /></div>
          <button class="btn" type="submit">Cadastrar material</button>
        </form>
        <div id="material-form-error"></div>
      </div>
      <div class="tablewrap">
        <table>
          <thead><tr><th>Nome</th><th>Categoria</th><th>Unidade</th><th>Estoque mínimo</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="4" style="color:var(--text-muted)">Nenhum material cadastrado.</td></tr>'}</tbody>
        </table>
      </div>
    `;

    document.getElementById('material-form').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const errBox = document.getElementById('material-form-error');
      errBox.innerHTML = '';
      try {
        await apiPost('/materiais', {
          name: document.getElementById('ma-name').value,
          category: document.getElementById('ma-category').value,
          unit: document.getElementById('ma-unit').value || 'un',
          min_stock: Number(document.getElementById('ma-min').value || 0),
        });
        viewMateriais();
      } catch (err) {
        errBox.innerHTML = `<div class="state error" style="padding:0.5rem 0;">${esc(err.message)}</div>`;
      }
    });
  }

  // --- Pedido de têmpera ---------------------------------------------------

  const TEMPERING_STATUS = ['PENDENTE', 'ENVIADO', 'RECEBIDO', 'CANCELADO'];

  async function viewPedidosTempera(params) {
    setLoading('pedidos de têmpera');
    try {
      const statusFilter = params.get('status') || '';
      const query = statusFilter ? `?status=${statusFilter}` : '';
      const [orders, suppliers] = await Promise.all([
        api(`/pedidos-tempera${query}`),
        api('/fornecedores'),
      ]);
      renderPedidosTempera(orders, suppliers, statusFilter);
    } catch (err) {
      setError(err);
    }
  }

  function renderPedidosTempera(orders, suppliers, statusFilter) {
    const supplierById = Object.fromEntries(suppliers.map((s) => [String(s.id), s.name]));
    const rows = orders.map((o) => `
      <tr>
        <td><a href="#/tempera/${o.id}">#${o.id}</a></td>
        <td>${o.quote_id ? `<a href="#/orcamentos/${o.quote_id}">#${o.quote_id}</a>` : '—'}</td>
        <td>${esc(supplierById[String(o.supplier_id)] || '—')}</td>
        <td>${statusPillForData(o.status)}</td>
        <td>${esc((o.created_at || '').slice(0, 10))}</td>
      </tr>
    `).join('');

    app.innerHTML = `
      <div class="page-head">
        <h1>Pedidos de têmpera</h1>
        <p>${orders.length} pedido(s). Criados a partir do relatório de têmpera de um orçamento (veja o botão na tela do orçamento).</p>
      </div>
      <div class="filters">
        <div class="field">
          <label for="tp-filter-status">Status</label>
          <select id="tp-filter-status">
            <option value="">Todos</option>
            ${enumOptions(TEMPERING_STATUS, statusFilter)}
          </select>
        </div>
      </div>
      <div class="tablewrap">
        <table>
          <thead><tr><th>#</th><th>Orçamento</th><th>Fornecedor</th><th>Status</th><th>Criado em</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5" style="color:var(--text-muted)">Nenhum pedido de têmpera ainda.</td></tr>'}</tbody>
        </table>
      </div>
    `;

    document.getElementById('tp-filter-status').addEventListener('change', (ev) => {
      window.location.hash = ev.target.value ? `#/tempera?status=${ev.target.value}` : '#/tempera';
    });
  }

  async function viewPedidoTemperaDetail(id) {
    setLoading('pedido de têmpera');
    try {
      const [order, suppliers] = await Promise.all([api(`/pedidos-tempera/${id}`), api('/fornecedores')]);
      renderPedidoTemperaDetail(order, suppliers);
    } catch (err) {
      setError(err);
    }
  }

  function renderPedidoTemperaDetail(order, suppliers) {
    const rows = order.items.map((it) => `
      <tr>
        <td class="wrap">${esc(it.description)}</td>
        <td class="num">${fmtNum(it.width_mm, 0)} x ${fmtNum(it.height_mm, 0)} mm</td>
        <td class="num">${esc(it.quantity)}</td>
      </tr>
    `).join('');

    const nextActions = {
      PENDENTE: [['ENVIADO', 'Marcar como enviado']],
      ENVIADO: [['RECEBIDO', 'Marcar como recebido'], ['CANCELADO', 'Cancelar']],
      RECEBIDO: [],
      CANCELADO: [],
    };
    const actions = (nextActions[order.status] || []).map(([status, label]) => `
      <button class="btn btn-small" data-next-status="${status}">${label}</button>
    `).join(' ');

    app.innerHTML = `
      <p><a href="#/tempera" class="btn-ghost">&larr; Voltar para pedidos de têmpera</a></p>
      <div class="detail-head">
        <div>
          <h1>Pedido de têmpera #${order.id}</h1>
          <div class="sub">${order.quote_id ? `Orçamento #${order.quote_id}` : 'Lançado manualmente'} · Fornecedor: ${esc((suppliers.find((s) => s.id === order.supplier_id) || {}).name || '—')}</div>
        </div>
        ${statusPillForData(order.status)}
      </div>
      <div style="display:flex;gap:0.6rem;margin:0.8rem 0 1.2rem;">${actions}</div>
      <div class="tablewrap">
        <table>
          <thead><tr><th>Peça</th><th>Medida</th><th>Qtd.</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="3" style="color:var(--text-muted)">Sem peças.</td></tr>'}</tbody>
        </table>
      </div>
    `;

    document.querySelectorAll('[data-next-status]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        const newStatus = btn.dataset.nextStatus;
        const payload = { status: newStatus };
        if (newStatus === 'ENVIADO') payload.sent_at = todayIso();
        if (newStatus === 'RECEBIDO') payload.received_at = todayIso();
        try {
          await apiSend('PUT', `/pedidos-tempera/${order.id}`, payload);
          viewPedidoTemperaDetail(order.id);
        } catch (err) {
          btn.disabled = false;
        }
      });
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
          <img src="logo-full.png" alt="MD Vidros &amp; Esquadrias" class="login-logo" />
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
    if (segments[0] === 'acessorios') {
      setActiveNav('acessorios');
      return viewAcessorios(params);
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
    if (segments[0] === 'tipologias' && segments[1] && segments[2] === 'editar') {
      setActiveNav('tipologias');
      return viewTipologiaEditar(segments[1]);
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
    if (segments[0] === 'orcamentos' && segments[1] && segments[2] === 'compras') {
      setActiveNav('orcamentos');
      return viewOrcamentoCompras(segments[1]);
    }
    if (segments[0] === 'orcamentos' && segments[1] && segments[2] === 'tempera') {
      setActiveNav('orcamentos');
      return viewOrcamentoTempera(segments[1]);
    }
    if (segments[0] === 'orcamentos' && segments[1] && segments[2] === 'imprimir') {
      setActiveNav('orcamentos');
      return viewOrcamentoImprimir(segments[1]);
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
    if (segments[0] === 'usuarios') {
      setActiveNav('usuarios');
      return viewUsuarios();
    }
    if (segments[0] === 'materiais') {
      setActiveNav('materiais');
      return viewMateriais();
    }
    if (segments[0] === 'tempera' && segments[1]) {
      setActiveNav('tempera');
      return viewPedidoTemperaDetail(segments[1]);
    }
    if (segments[0] === 'tempera') {
      setActiveNav('tempera');
      return viewPedidosTempera(params);
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
