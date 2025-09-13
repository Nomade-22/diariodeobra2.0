// main.js — v3.0.3-rev: retorno com select único (Retornou/Ficou/Defeito)
import { LS, write } from './state.js';
import { tools, teams, jobs, user } from './state.js';
import { currentUser, bindAuth, showApp, showLogin } from './auth.js';
import { fillSelect, renderTools, renderTeams, renderJobs, renderPicker, renderEmployeesChoice } from './ui.js';

const LS_CHECKS = 'mp_checkouts_v1';
const loadChecks    = ()=> { try{ return JSON.parse(localStorage.getItem(LS_CHECKS)||'[]'); }catch{ return []; } };
const saveChecks    = (arr)=> localStorage.setItem(LS_CHECKS, JSON.stringify(arr||[]));
const openCheckouts = ()=> loadChecks().filter(x=>!x.closed);

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
    const cond = it.cond || 'Retornou'; // valor padrão
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
        <td><input class="rt-obs" value="${obs.replace(/"/g,'&quot;')}" placeholder="Observação" /></td>
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

/* Export CSV (abre no Excel) */
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

/* UI principal */
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
          cond:'Retornou', // padrão
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

  // Exportações
  document.getElementById('btnExportPDF')?.addEventListener('click', ()=> alert('Relatório PDF: em breve.'));
  document.getElementById('btnExportXLS')?.addEventListener('click', exportCSV);

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