// ui.js — v3.1.4-ui
// - Paleta de botões (verde/vermelho) injetada por CSS
// - Grade de ferramentas (mobile) mantida
// - Cadastros: Ferramentas/Funcionários/Obras com botões coloridos
// - Cadastros: adiciona o card "Usuários" (Admin) com Add/Salvar/Excluir
import { LS, write } from './state.js';
import { tools, teams, jobs, users } from './state.js';

const byId = (id)=> document.getElementById(id);

/* ---------- estilos globais (verde/vermelho + responsivo) ---------- */
function ensureGlobalStyles(){
  if(document.getElementById('global-palette')) return;
  const css = `
    /* paleta */
    .btn-green{ background:#17612f !important; }
    .btn-green:hover{ filter:brightness(1.05); }
    .btn-red{ background:#7a1d1d !important; }
    .btn-red:hover{ filter:brightness(1.05); }

    /* picker: manter apenas nossa barra */
    #tab-saida .tableWrap thead{ display:none !important; }

    /* picker grid */
    .pickWrap{width:100%;}
    .pickHead,.pickRow{
      display:grid;
      grid-template-columns: 36px 1.6fr 1.1fr .8fr 100px;
      gap:10px; align-items:center;
    }
    .pickHead{ font-size:12px; opacity:.85; padding:6px 8px; }
    .pickRow{
      padding:8px; border-radius:10px; background:rgba(255,255,255,.03);
      margin-bottom:8px;
    }
    .pickRow input[type="number"]{ width:100%; height:36px; padding:4px 8px; }
    .pickRow input[type="checkbox"]{ width:20px; height:20px; }
    @media (min-width: 480px){
      .pickHead,.pickRow{ grid-template-columns: 40px 2fr 1fr .8fr 120px; }
    }

    /* Financeiro: rolagem horizontal só na tabela de OF */
    #tab-finance .tableWrap{ overflow-x:auto; }
    #tab-finance table.tbl th, #tab-finance table.tbl td{ white-space:nowrap; }
    #tab-finance table.tbl td:nth-child(2){ white-space:normal; }
    #tab-finance table.tbl td:last-child{ min-width:120px; }
  `;
  const style = document.createElement('style');
  style.id = 'global-palette';
  style.textContent = css;
  document.head.appendChild(style);
}

/* ---------- helpers ---------- */
export function fillSelect(sel, arr){
  if(!sel) return;
  sel.innerHTML = '';
  (arr||[]).forEach(v=>{
    const o = document.createElement('option');
    o.value = v; o.textContent = v; sel.appendChild(o);
  });
}

/* ---------- FERRAMENTAS (CATÁLOGO) ---------- */
export function renderTools(onChange){
  ensureGlobalStyles();
  const list  = byId('toolsList');
  const count = byId('toolsCount');
  if(count) count.textContent = `${tools.length} itens`;
  if(!list) return;

  // deixar "Adicionar" verde (se existir no HTML)
  const addBtn = byId('toolAdd'); if(addBtn) addBtn.classList.add('btn-green');

  list.innerHTML = '';
  tools.forEach((t, i)=>{
    const row = document.createElement('div');
    row.className = 'rowline';
    row.dataset.index = String(i);
    row.innerHTML = `
      <div>${i+1}</div>
      <div><input class="t-name" value="${t.name||''}" placeholder="Nome da ferramenta" /></div>
      <div><input class="t-code" value="${t.code||''}" placeholder="Código" /></div>
      <div><input class="t-qty"  type="number" min="0" value="${t.qty??1}" /></div>
      <div><input class="t-obs"  value="${t.obs||''}" placeholder="Observações" /></div>
      <div class="actions">
        <button class="btn xs btn-green act-save"><span>Salvar</span></button>
        <button class="btn xs btn-red   act-del"><span>Excluir</span></button>
      </div>
    `;
    list.appendChild(row);
  });

  if(!list.dataset.bound){
    list.dataset.bound='1';
    list.addEventListener('click', (e)=>{
      const row = e.target.closest('.rowline'); if(!row) return;
      const idx = Number(row.dataset.index||-1); if(idx<0) return;

      if(e.target.closest('.act-del')){
        tools.splice(idx,1); write(LS.tools,tools); renderTools(onChange);
        if(typeof onChange==='function') onChange();
        return;
      }
      if(e.target.closest('.act-save')){
        const name = row.querySelector('.t-name')?.value?.trim()||'';
        const code = row.querySelector('.t-code')?.value?.trim()||'';
        const qty  = Math.max(0, Number(row.querySelector('.t-qty')?.value||0));
        const obs  = row.querySelector('.t-obs')?.value?.trim()||'';
        tools[idx] = { name, code, qty, obs };
        write(LS.tools,tools);
        if(typeof onChange==='function') onChange();
      }
    });
  }

  if(typeof onChange==='function') onChange();
}

/* ---------- FUNCIONÁRIOS ---------- */
export function renderTeams(onChange){
  const ul = byId('teamsList'); if(!ul) return;
  const addBtn = byId('teamAdd'); if(addBtn) addBtn.classList.add('btn-green');

  ul.innerHTML = '';
  teams.forEach((name,i)=>{
    const li = document.createElement('li');
    li.className = 'rowline'; li.dataset.index = String(i);
    li.innerHTML = `
      <input class="tm-name" value="${name}" />
      <button class="btn xs btn-green act-save-team"><span>Salvar</span></button>
      <button class="btn xs btn-red   act-del-team"><span>Excluir</span></button>
    `;
    ul.appendChild(li);
  });
  if(!ul.dataset.bound){
    ul.dataset.bound='1';
    ul.addEventListener('click',(e)=>{
      const li = e.target.closest('li.rowline'); if(!li) return;
      const idx = Number(li.dataset.index||-1); if(idx<0) return;
      if(e.target.closest('.act-del-team')){
        teams.splice(idx,1); write(LS.teams,teams); renderTeams(onChange);
        if(typeof onChange==='function') onChange();
        return;
      }
      if(e.target.closest('.act-save-team')){
        const name = li.querySelector('.tm-name')?.value?.trim(); if(!name) return;
        teams[idx]=name; write(LS.teams,teams);
        if(typeof onChange==='function') onChange();
      }
    });
  }
  if(typeof onChange==='function') onChange();
}

/* ---------- OBRAS/CLIENTES ---------- */
export function renderJobs(onChange){
  const ul = byId('jobsList'); if(!ul) return;
  const addBtn = byId('jobAdd'); if(addBtn) addBtn.classList.add('btn-green');

  ul.innerHTML = '';
  jobs.forEach((name,i)=>{
    const li = document.createElement('li');
    li.className = 'rowline'; li.dataset.index = String(i);
    li.innerHTML = `
      <input class="jb-name" value="${name}" />
      <button class="btn xs btn-green act-save-job"><span>Salvar</span></button>
      <button class="btn xs btn-red   act-del-job"><span>Excluir</span></button>
    `;
    ul.appendChild(li);
  });
  if(!ul.dataset.bound){
    ul.dataset.bound='1';
    ul.addEventListener('click',(e)=>{
      const li = e.target.closest('li.rowline'); if(!li) return;
      const idx = Number(li.dataset.index||-1); if(idx<0) return;
      if(e.target.closest('.act-del-job')){
        jobs.splice(idx,1); write(LS.jobs,jobs); renderJobs(onChange);
        if(typeof onChange==='function') onChange();
        return;
      }
      if(e.target.closest('.act-save-job')){
        const name = li.querySelector('.jb-name')?.value?.trim(); if(!name) return;
        jobs[idx]=name; write(LS.jobs,jobs);
        if(typeof onChange==='function') onChange();
      }
    });
  }
  if(typeof onChange==='function') onChange();
}

/* ---------- PICKER (SAÍDA) ---------- */
export function renderPicker(state){
  ensureGlobalStyles();
  const box = byId('pickList'), selCount = byId('selCount');
  if(!box) return;

  let totalSel = 0;
  box.innerHTML = `
    <div class="pickWrap">
      <div class="pickHead">
        <div></div>
        <div>Ferramenta</div>
        <div>Código</div>
        <div>Qtd catálogo</div>
        <div>Qtd levar</div>
      </div>
      <div id="pickBody"></div>
    </div>
  `;
  const body = byId('pickBody');

  tools.forEach((t,i)=>{
    const id = `pick_${i}`;
    const take = state[id]?.take ?? 0;
    const checked = take>0;
    const row = document.createElement('div');
    row.className = 'pickRow';
    row.dataset.id = id;
    row.innerHTML = `
      <div><input type="checkbox" class="pk-check" ${checked?'checked':''} data-id="${id}"></div>
      <div>${t.name||'-'}</div>
      <div>${t.code||''}</div>
      <div>${t.qty??0}</div>
      <div><input class="pk-take" type="number" min="0" value="${take}" data-id="${id}"></div>
    `;
    body.appendChild(row);
    if(checked) totalSel++;
  });
  if(selCount) selCount.textContent = `${totalSel} selecionadas`;

  body.addEventListener('click', (ev)=>{
    const chk = ev.target.closest('.pk-check'); if(!chk) return;
    const id = chk.dataset.id;
    const val = chk.checked ? (state[id]?.take||1) : 0;
    state[id] = { take: val };
    const inp = body.querySelector(`.pk-take[data-id="${id}"]`); if(inp) inp.value = String(val);
    if(selCount){
      const c = [...body.querySelectorAll('.pk-check:checked')].length;
      selCount.textContent = `${c} selecionadas`;
    }
  });
  body.addEventListener('input', (ev)=>{
    const inp = ev.target.closest('.pk-take'); if(!inp) return;
    const id = inp.dataset.id;
    const val = Math.max(0, Number(inp.value||0));
    state[id] = { take: val };
    const chk = body.querySelector(`.pk-check[data-id="${id}"]`); if(chk) chk.checked = val>0;
    if(selCount){
      const c = [...body.querySelectorAll('.pk-check:checked')].length;
      selCount.textContent = `${c} selecionadas`;
    }
  });
}

/* ---------- Funcionários (checkboxes) ---------- */
export function renderEmployeesChoice(ctx){
  const box = byId('outEmployees'); if(!box) return;
  box.innerHTML = '';
  teams.forEach((n,i)=>{
    const id = `emp_${i}`;
    const row = document.createElement('label');
    row.className = 'empitem';
    row.innerHTML = `<input type="checkbox" class="emp-check" id="${id}" data-name="${n}"><span>${n}</span>`;
    box.appendChild(row);
  });
  if(!box.dataset.bound){
    box.dataset.bound='1';
    box.addEventListener('change', (e)=>{
      const chk = e.target.closest?.('.emp-check'); if(!chk) return;
      const nm = chk.dataset.name;
      if(chk.checked) ctx.employeesSelected.add(nm);
      else ctx.employeesSelected.delete(nm);
    });
  }
}

/* ---------- Usuários (novo card dinâmico) ---------- */
function ensureUsersCard(){
  let card = byId('usersCard');
  if(card) return card;
  const cadSec = byId('tab-cadastros');
  if(!cadSec) return null;
  card = document.createElement('div');
  card.className = 'card mt';
  card.id = 'usersCard';
  card.innerHTML = `
    <h3>Usuários</h3>
    <div class="row threecol">
      <div><label>Nome</label><input id="userNewName" placeholder="Ex.: Maria"></div>
      <div><label>Função</label>
        <select id="userNewRole">
          <option>Operação</option>
          <option>Supervisor</option>
          <option>Admin</option>
        </select>
      </div>
      <div><label>Senha</label><input id="userNewPass" type="password" placeholder="••••••"></div>
    </div>
    <div class="mt"><button id="userAdd" class="btn btn-green">Adicionar usuário</button></div>

    <div class="tableWrap mt">
      <table class="tbl">
        <thead>
          <tr><th>#</th><th>Nome</th><th>Função</th><th>Senha</th><th>Ações</th></tr>
        </thead>
        <tbody id="usersList"></tbody>
      </table>
    </div>
  `;
  cadSec.appendChild(card);
  return card;
}

export function renderUsers(){
  const card = ensureUsersCard(); if(!card) return;
  const list = byId('usersList'); if(!list) return;

  list.innerHTML = '';
  (users||[]).forEach((u,i)=>{
    const tr = document.createElement('tr');
    tr.dataset.index = String(i);
    tr.innerHTML = `
      <td>${i+1}</td>
      <td><input class="u-name" value="${u.name||''}" /></td>
      <td>
        <select class="u-role">
          <option ${u.role==='Operação'?'selected':''}>Operação</option>
          <option ${u.role==='Supervisor'?'selected':''}>Supervisor</option>
          <option ${u.role==='Admin'?'selected':''}>Admin</option>
        </select>
      </td>
      <td><input class="u-pass" value="${u.pass||''}" /></td>
      <td>
        <button class="btn xs btn-green act-save-u">Salvar</button>
        <button class="btn xs btn-red   act-del-u">Excluir</button>
      </td>
    `;
    list.appendChild(tr);
  });

  // Add
  const addBtn = byId('userAdd');
  if(addBtn && !addBtn.dataset.bound){
    addBtn.dataset.bound='1';
    addBtn.addEventListener('click', ()=>{
      const name = byId('userNewName')?.value?.trim();
      const role = byId('userNewRole')?.value || 'Operação';
      const pass = byId('userNewPass')?.value || '';
      if(!name || !pass){ alert('Informe nome e senha.'); return; }
      users.push({ name, role, pass });
      write(LS.users, users);
      byId('userNewName').value = '';
      byId('userNewPass').value = '';
      renderUsers();
    });
  }

  // Save/Delete per linha
  if(!list.dataset.bound){
    list.dataset.bound='1';
    list.addEventListener('click', (ev)=>{
      const tr  = ev.target.closest('tr'); if(!tr) return;
      const idx = Number(tr.dataset.index||-1); if(idx<0) return;
      if(ev.target.closest('.act-del-u')){
        users.splice(idx,1); write(LS.users, users); renderUsers(); return;
      }
      if(ev.target.closest('.act-save-u')){
        const name = tr.querySelector('.u-name')?.value?.trim()||'';
        const role = tr.querySelector('.u-role')?.value||'Operação';
        const pass = tr.querySelector('.u-pass')?.value||'';
        users[idx] = { name, role, pass };
        write(LS.users, users);
        renderUsers();
      }
    });
  }
}