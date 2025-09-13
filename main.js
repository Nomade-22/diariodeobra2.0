// main.js — v3.0.5: Financeiro (Admin) + PDF real (print-to-PDF) + retorno com condição única
import { LS, write } from './state.js';
import { tools, teams, jobs } from './state.js';
import { currentUser, bindAuth, showApp, showLogin } from './auth.js';
import { fillSelect, renderTools, renderTeams, renderJobs, renderPicker, renderEmployeesChoice } from './ui.js';

const getUser = ()=> { try{return JSON.parse(localStorage.getItem(LS.user)||'null');}catch{return null;} };
const isAdmin = ()=> (getUser()?.role === 'Admin');

/* saídas/retornos */
const LS_CHECKS = 'mp_checkouts_v1';
const loadChecks    = ()=> { try{ return JSON.parse(localStorage.getItem(LS_CHECKS)||'[]'); }catch{ return []; } };
const saveChecks    = (arr)=> localStorage.setItem(LS_CHECKS, JSON.stringify(arr||[]));
const openCheckouts = ()=> loadChecks().filter(x=>!x.closed);

/* financeiro */
const LS_FIN = 'mp_finance_v1';
function loadFin(){ try{ return JSON.parse(localStorage.getItem(LS_FIN)||'{"ofs":[]}'); } catch{ return {ofs:[]}; } }
function saveFin(data){ localStorage.setItem(LS_FIN, JSON.stringify(data||{ofs:[]})); }

function money(n){ const v = Number(n||0); return isFinite(v) ? v : 0; }
function fmt(n){ return money(n).toLocaleString('pt-BR', {style:'currency', currency:'BRL'}); }

/* Tabs */
function setupTabs(){
  const buttons = document.querySelectorAll('.tabs .tab');
  const sections = {
    saida:     document.getElementById('tab-saida'),
    retorno:   document.getElementById('tab-retorno'),
    cadastros: document.getElementById('tab-cadastros'),
    finance:   document.getElementById('tab-finance'),
  };
  buttons.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      buttons.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      Object.keys(sections).forEach(k=>{
        sections[k].classList.toggle('hidden', k!==tab);
      });
      if(tab==='retorno') refreshReturnSelect(true);
      if(tab==='finance')  renderFinance();  // monta a UI do Financeiro
    });
  });
}

/* ---------- RETORNO: UI dinâmica do checklist ---------- */
function ensureRetToolsBox(){
  const sec = document.getElementById('tab-retorno');
  if(!sec) return null;
  let box = document.getElementById('retToolsBox');
  if(!box){
    box = document.createElement('div');
    box.id = 'retToolsBox';
    box.className = 'card mt';
    box.innerHTML = `
      <div class="between"><h3>Checklist de Ferramentas</h3>
        <span class="small">Escolha Retornou / Ficou / Defeito</span>
      </div>
      <div class="tableWrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>Ferramenta</th>
              <th>Qtd levada</th>
              <th>Condição</th>
              <th>Obs</th>
            </tr>
          </thead>
          <tbody id="retToolsTbody"></tbody>
        </table>
      </div>
    `;
    const notes = document.getElementById('retNotes')?.closest('.mt') || sec.lastElementChild;
    sec.insertBefore(box, notes);
  }
  return box;
}

function renderReturnChecklist(check){
  const box = ensureRetToolsBox(); if(!box) return;
  const tbody = document.getElementById('retToolsTbody'); if(!tbody) return;

  const items = check.items || [];

  tbody.innerHTML = items.map((it,idx)=>{
    const cond = it.cond || 'Retornou';
    const obs  = it.obsBack || '';
    return `
      <tr data-i="${idx}">
        <td>${it.name||'-'}</td>
        <td>${it.take??0}</td>
        <td>
          <select class="rt-cond">
            <option value="Retornou" ${cond==='Retornou'?'selected':''}>Retornou</option>
            <option value="Ficou" ${cond==='Ficou'?'selected':''}>Ficou</option>
            <option value="Defeito" ${cond==='Defeito'?'selected':''}>Defeito</option>
          </select>
        </td>
        <td><input class="rt-obs" value="${String(obs).replace(/"/g,'&quot;')}" placeholder="Observação" /></td>
      </tr>
    `;
  }).join('');

  if(!tbody.dataset.bound){
    tbody.dataset.bound = '1';
    tbody.addEventListener('input', (e)=>{
      const tr = e.target.closest('tr[data-i]'); if(!tr) return;
      const i  = Number(tr.dataset.i);
      const cond = tr.querySelector('.rt-cond').value;
      const obs  = tr.querySelector('.rt-obs').value;
      check.items[i].cond   = cond;
      check.items[i].obsBack= obs;
    });
    tbody.addEventListener('change',(e)=>{
      const tr = e.target.closest('tr[data-i]'); if(!tr) return;
      const i  = Number(tr.dataset.i);
      check.items[i].cond = tr.querySelector('.rt-cond').value;
    });
  }
}

/* ---------- RETORNO: carregar select ---------- */
function refreshReturnSelect(renderChecklist=false){
  const sel = document.getElementById('retOpen'); if(!sel) return;
  const list = openCheckouts();
  sel.innerHTML = '';
  list.forEach(ch=>{
    const o = document.createElement('option');
    const when = new Date(ch.timeOut).toLocaleString('pt-BR');
    o.value = ch.id;
    o.textContent = `${when} — ${ch.job} — ${ch.employees.join(', ')}`;
    sel.appendChild(o);
  });

  if(renderChecklist){
    const firstId = sel.value;
    const all = loadChecks();
    const check = all.find(x=>x.id===firstId);
    if(check) renderReturnChecklist(check);
  }
}

/* ---------- Financeiro (Admin) ---------- */
function renderFinance(){
  const sec = document.getElementById('tab-finance'); if(!sec) return;
  if(!isAdmin()){
    sec.innerHTML = `<p>Apenas Admin pode acessar o Financeiro.</p>`;
    return;
  }

  const data = loadFin();
  // Monta UI
  sec.innerHTML = `
    <h2>Financeiro (Admin)</h2>
    <div class="card">
      <h3>Nova OF</h3>
      <div class="row threecol">
        <div><label>Nº OF</label><input id="finOfNum" placeholder="Ex.: 1234"></div>
        <div><label>Obra/Cliente</label><select id="finOfJob"></select></div>
        <div><label>Valor contratado</label><input id="finOfVal" type="number" step="0.01" placeholder="0,00"></div>
      </div>
      <div class="mt"><button id="finAddOf" class="btn">Adicionar OF</button></div>
    </div>

    <div class="card">
      <h3>OFs cadastradas</h3>
      <div class="tableWrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>Nº OF</th>
              <th>Obra</th>
              <th>Contratado</th>
              <th>Gasto</th>
              <th>Saldo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody id="finList"></tbody>
        </table>
      </div>
    </div>

    <div class="card" id="finDetails" style="display:none"></div>
  `;

  // opções de obras
  fillSelect(document.getElementById('finOfJob'), (loadJobsSafe()));

  const finList = document.getElementById('finList');

  function calc(of){
    const contratado = money(of.value || 0);
    const gasto = (of.expenses||[]).reduce((a,e)=> a + money(e.amount), 0);
    const saldo = contratado - gasto;
    return { contratado, gasto, saldo };
  }

  function renderList(){
    const ofs = data.ofs || [];
    finList.innerHTML = ofs.map((of,idx)=>{
      const k = calc(of);
      return `
        <tr data-i="${idx}">
          <td>${of.number||'-'}</td>
          <td>${of.job||'-'}</td>
          <td>${fmt(k.contratado)}</td>
          <td>${fmt(k.gasto)}</td>
          <td>${fmt(k.saldo)}</td>
          <td>
            <button class="btn xs" data-act="open">Abrir</button>
            <button class="btn xs" data-act="del">Excluir</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderDetails(i){
    const wrap = document.getElementById('finDetails');
    const of = (data.ofs||[])[i];
    if(!of){ wrap.style.display='none'; wrap.innerHTML=''; return; }
    const k = calc(of);
    wrap.style.display='block';
    wrap.innerHTML = `
      <h3>OF ${of.number} — ${of.job}</h3>
      <p><b>Contratado:</b> ${fmt(k.contratado)} • <b>Gasto:</b> ${fmt(k.gasto)} • <b>Saldo:</b> ${fmt(k.saldo)}</p>
      <div class="row threecol">
        <div><label>Descrição</label><input id="finExpDesc" placeholder="Ex.: Material, Mão-de-obra"></div>
        <div><label>Valor</label><input id="finExpVal" type="number" step="0.01" placeholder="0,00"></div>
        <div style="align-self:end"><button id="finAddExp" class="btn">Adicionar lançamento</button></div>
      </div>
      <div class="tableWrap mt">
        <table class="tbl">
          <thead><tr><th>Data</th><th>Descrição</th><th>Valor</th><th>Ações</th></tr></thead>
          <tbody id="finExpList">
            ${(of.expenses||[]).map((e,ix)=>`
              <tr data-ix="${ix}">
                <td>${new Date(e.date||Date.now()).toLocaleString('pt-BR')}</td>
                <td>${e.desc||'-'}</td>
                <td>${fmt(e.amount)}</td>
                <td><button class="btn xs" data-act="del-exp">Excluir</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // bind add expense
    document.getElementById('finAddExp').onclick = ()=>{
      const desc = document.getElementById('finExpDesc').value.trim();
      const val  = money(document.getElementById('finExpVal').value);
      if(!desc || !val){ alert('Informe descrição e valor.'); return; }
      of.expenses = of.expenses || [];
      of.expenses.push({ date: new Date().toISOString(), desc, amount: val });
      saveFin(data);
      renderDetails(i);
      renderList();
    };

    // bind delete expense (delegação)
    document.getElementById('finExpList').onclick = (ev)=>{
      const btn = ev.target.closest('[data-act="del-exp"]'); if(!btn) return;
      const tr = btn.closest('tr[data-ix]'); const ix = Number(tr?.dataset.ix||-1);
      if(ix>=0){ of.expenses.splice(ix,1); saveFin(data); renderDetails(i); renderList(); }
    };
  }

  // bind add OF
  document.getElementById('finAddOf').onclick = ()=>{
    const num = document.getElementById('finOfNum').value.trim();
    const job = document.getElementById('finOfJob').value;
    const val = money(document.getElementById('finOfVal').value);
    if(!num || !job || !val){ alert('Preencha Nº da OF, Obra e Valor.'); return; }
    data.ofs = data.ofs || [];
    data.ofs.push({ number:num, job, value: val, expenses: [] });
    saveFin(data);
    // limpa
    document.getElementById('finOfNum').value='';
    document.getElementById('finOfVal').value='';
    renderList();
  };

  // delegação tabela OFs
  finList.onclick = (ev)=>{
    const btn = ev.target.closest('[data-act]'); if(!btn) return;
    const tr = btn.closest('tr[data-i]'); const i = Number(tr?.dataset.i||-1); if(i<0) return;
    if(btn.dataset.act==='del'){
      data.ofs.splice(i,1); saveFin(data); renderList(); renderDetails(-1); return;
    }
    if(btn.dataset.act==='open'){
      renderDetails(i); return;
    }
  };

  renderList();
  renderDetails(-1);
}

function loadJobsSafe(){
  try{
    const arr = JSON.parse(localStorage.getItem(LS.jobs) || '[]');
    return Array.isArray(arr) ? arr : [];
  }catch{ return []; }
}

/* -------- Exportações -------- */
function exportCSV(){
  const all = loadChecks();
  const rows = [
    ['id','data_saida','obra','funcionarios','itens(qtd)','itens_status','status','data_retorno','km_retorno','obs'],
    ...all.map(ch=>{
      const itens = ch.items.map(it=>`${it.name}:${it.take}`).join(' | ');
      const iStat = ch.items.map(it=>{
        const st = it.cond || 'Retornou';
        const ob = it.obsBack ? ` (${it.obsBack})` : '';
        return `${it.name}:${st}${ob}`;
      }).join(' | ');
      return [
        ch.id,
        ch.timeOut,
        ch.job,
        ch.employees.join('; '),
        itens,
        iStat,
        ch.closed?'Fechado':'Aberto',
        ch.timeIn || '',
        ch.kmIn || '',
        ch.notes || ''
      ];
    })
  ];
  const csv = rows.map(r=>r.map(v=>{
    const s = String(v??'');
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
  }).join(';')).join('\n');

  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url  = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `relatorio_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function exportPDF(){
  if(!isAdmin()){ alert('Somente Admin pode exportar PDF.'); return; }
  const u = getUser();
  const checks = loadChecks();
  const fin = loadFin();

  const html = `
<!DOCTYPE html><html><head>
<meta charset="utf-8">
<title>Relatório Diário</title>
<style>
  body{ font-family: Arial, sans-serif; margin:24px; }
  h1{ font-size:20px; margin:0 0 8px; }
  h2{ font-size:16px; margin:20px 0 8px; }
  table{ width:100%; border-collapse:collapse; font-size:12px; }
  th,td{ border:1px solid #ccc; padding:6px; }
  th{ background:#f3f4f6; text-align:left; }
  .meta{ font-size:12px; color:#555; margin-bottom:12px; }
  .small{ font-size:11px; color:#444; }
  @media print {
    @page { margin: 12mm; }
    button{ display:none }
  }
</style>
</head><body>
  <h1>Relatório Diário</h1>
  <div class="meta">Gerado em ${new Date().toLocaleString('pt-BR')} — Usuário: ${u?.name||'-'} (${u?.role||'-'})</div>

  <h2>Saídas & Retornos</h2>
  <table>
    <thead>
      <tr>
        <th>ID</th><th>Saída</th><th>Obra</th><th>Equipe</th><th>Itens (qtd)</th><th>Condição</th><th>Status</th><th>Retorno</th><th>KM</th>
      </tr>
    </thead>
    <tbody>
      ${checks.map(ch=>{
        const itens = ch.items.map(it=>`${it.name}:${it.take}`).join(' | ');
        const conds = ch.items.map(it=>{
          const st = it.cond || 'Retornou';
          const ob = it.obsBack ? ` (${it.obsBack})` : '';
          return `${it.name}:${st}${ob}`;
        }).join(' | ');
        return `
          <tr>
            <td>${ch.id}</td>
            <td>${ch.timeOut||''}</td>
            <td>${ch.job||''}</td>
            <td class="small">${(ch.employees||[]).join('; ')}</td>
            <td class="small">${itens}</td>
            <td class="small">${conds}</td>
            <td>${ch.closed?'Fechado':'Aberto'}</td>
            <td>${ch.timeIn||''}</td>
            <td>${ch.kmIn||''}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <h2>Financeiro</h2>
  <table>
    <thead>
      <tr>
        <th>Nº OF</th><th>Obra</th><th>Contratado</th><th>Gasto</th><th>Saldo</th>
      </tr>
    </thead>
    <tbody>
      ${(fin.ofs||[]).map(of=>{
        const gasto = (of.expenses||[]).reduce((a,e)=> a + (Number(e.amount)||0), 0);
        const saldo = (Number(of.value)||0) - gasto;
        return `
          <tr>
            <td>${of.number||'-'}</td>
            <td>${of.job||'-'}</td>
            <td>${fmt(of.value)}</td>
            <td>${fmt(gasto)}</td>
            <td>${fmt(saldo)}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <div class="small" style="margin-top:8px">Detalhes de lançamentos por OF:</div>
  ${(fin.ofs||[]).map(of=>`
    <div class="small"><b>OF ${of.number} — ${of.job}</b></div>
    <table>
      <thead><tr><th>Data</th><th>Descrição</th><th>Valor</th></tr></thead>
      <tbody>
        ${(of.expenses||[]).map(e=>`
          <tr><td>${new Date(e.date||Date.now()).toLocaleString('pt-BR')}</td><td>${e.desc||'-'}</td><td>${fmt(e.amount)}</td></tr>
        `).join('') || `<tr><td colspan="3" class="small">Sem lançamentos</td></tr>`}
      </tbody>
    </table>
  `).join('')}

  <button onclick="window.print()">Imprimir / Salvar como PDF</button>
</body></html>`.trim();

  const win = window.open('', '_blank');
  win.document.open(); win.document.write(html); win.document.close();
  // Em muitos navegadores, já abre com o botão "Imprimir". O usuário escolhe "Salvar como PDF".
}

/* ---------- Export CSV (Excel) ---------- */
function exportCSVHandler(){ exportCSV(); }

/* ---------- Cadastros: delegação estável ---------- */
function bindCadastrosActions(ctx){
  const sec = document.getElementById('tab-cadastros');
  if(!sec || sec.dataset.addBound) return;
  sec.dataset.addBound = '1';

  sec.addEventListener('click', (e)=>{
    if(e.target.closest('#toolAdd')){
      if(!isAdmin()) return alert('Somente Admin pode cadastrar.');
      tools.push({ name:'', code:'', qty:1, obs:'' });
      write(LS.tools, tools);
      renderTools(()=>ctx.renderPicker());
      ctx.renderPicker();
      return;
    }
    if(e.target.closest('#teamAdd')){
      if(!isAdmin()) return alert('Somente Admin pode cadastrar.');
      const inp = document.getElementById('teamNew');
      const val = (inp?.value||'').trim();
      if(!val) return;
      teams.push(val);
      write(LS.teams, teams);
      if(inp) inp.value='';
      renderTeams(()=>{});
      renderEmployeesChoice(ctx);
      return;
    }
    if(e.target.closest('#jobAdd')){
      if(!isAdmin()) return alert('Somente Admin pode cadastrar.');
      const inp = document.getElementById('jobNew');
      const val = (inp?.value||'').trim();
      if(!val) return;
      jobs.push(val);
      write(LS.jobs, jobs);
      if(inp) inp.value='';
      renderJobs(()=>{});
      fillSelect(document.getElementById('outJobsite'), jobs);
      return;
    }
  });
}

/* ---------- UI principal ---------- */
function initAppUI(){
  setupTabs();

  fillSelect(document.getElementById('outJobsite'), jobs);
  const outTime = document.getElementById('outTime');
  if(outTime) outTime.value = new Date().toISOString().slice(0,16);

  const ctx = {
    pickState:{},
    employeesSelected: new Set(),
    renderPicker: ()=> renderPicker(ctx.pickState),
  };

  renderEmployeesChoice(ctx);
  renderTools(()=>ctx.renderPicker());
  renderTeams(()=>{});
  renderJobs(()=>{});
  ctx.renderPicker();

  bindCadastrosActions(ctx);

  // Confirmar Saída
  document.getElementById('btnCheckout')?.addEventListener('click', ()=>{
    const items = Object.entries(ctx.pickState)
      .filter(([_,v])=> (v?.take||0)>0)
      .map(([k,v])=>{
        const i = Number(k.split('_')[1]||0);
        return {
          idx:i,
          name:(tools[i]?.name||''),
          take:Number(v.take||0),
          cond:'Retornou',
          obsBack:''
        };
      });
    if(items.length===0){ alert('Selecione ao menos uma ferramenta.'); return; }
    const job = document.getElementById('outJobsite')?.value || '';
    const time = document.getElementById('outTime')?.value || new Date().toISOString().slice(0,16);
    const employees = [...ctx.employeesSelected];
    const ch = { id:'ch_'+Date.now(), timeOut:time, job, employees, items, closed:false };
    const all = loadChecks(); all.push(ch); saveChecks(all);
    alert('Saída registrada!');
    refreshReturnSelect(true);
  });

  // troca de saída selecionada
  const retOpenSel = document.getElementById('retOpen');
  if(retOpenSel && !retOpenSel.dataset.bound){
    retOpenSel.dataset.bound='1';
    retOpenSel.addEventListener('change', ()=>{
      const all = loadChecks();
      const ch = all.find(x=>x.id===retOpenSel.value);
      if(ch) renderReturnChecklist(ch);
    });
  }

  // Confirmar Retorno
  document.getElementById('btnFinishReturn')?.addEventListener('click', ()=>{
    const sel = document.getElementById('retOpen');
    const id  = sel?.value; if(!id){ alert('Selecione a saída.'); return; }
    const km  = Number(document.getElementById('retKm')?.value||0);
    const tIn = document.getElementById('retTime')?.value || new Date().toISOString().slice(0,16);
    const obs = document.getElementById('retNotes')?.value || '';
    const all = loadChecks();
    const idx = all.findIndex(x=>x.id===id);
    if(idx>=0){
      all[idx].closed = true;
      all[idx].kmIn   = km;
      all[idx].timeIn = tIn;
      all[idx].notes  = obs;
      saveChecks(all);
      alert('Retorno confirmado!');
      refreshReturnSelect(true);
    }
  });

  // Exportações (Admin)
  document.getElementById('btnExportPDF')?.addEventListener('click', exportPDF);
  document.getElementById('btnExportXLS')?.addEventListener('click', exportCSVHandler);

  // Inicial
  refreshReturnSelect(true);
}

/* bootstrap */
function init(){
  bindAuth();
  const u = currentUser();
  if(u){ showApp(u); initAppUI(); } else { showLogin(); }
  document.addEventListener('user:login', ()=>{ initAppUI(); });
}
document.addEventListener('DOMContentLoaded', init);