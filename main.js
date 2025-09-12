// main.js — v3.0.1
import { LS, write } from './state.js';
import { tools, teams, jobs, user } from './state.js';
import { currentUser, bindAuth, showApp, showLogin } from './auth.js';
import { fillSelect, renderTools, renderTeams, renderJobs, renderPicker, renderEmployeesChoice } from './ui.js';

const chip = document.getElementById('diag');
const say  = (t)=> chip && (chip.textContent = t);
window.addEventListener('error', (e)=> say('Erro: ' + (e.message || 'desconhecido')));

/* armazenamento de saídas/retornos */
const LS_CHECKS = 'mp_checkouts_v1';
function loadChecks(){ try{ return JSON.parse(localStorage.getItem(LS_CHECKS)||'[]'); }catch{ return []; } }
function saveChecks(arr){ localStorage.setItem(LS_CHECKS, JSON.stringify(arr||[])); }
function openCheckouts(){ return loadChecks().filter(x=>!x.closed); }

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
      if(tab==='retorno') refreshReturnSelect();
    });
  });
}

function refreshReturnSelect(){
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
}

function exportCSV(){
  // Planilha simples: Saídas (abertas/fechadas)
  const all = loadChecks();
  const rows = [
    ['id','data_saida','obra','funcionarios','itens(qtd)','status','data_retorno'],
    ...all.map(ch=>[
      ch.id,
      ch.timeOut,
      ch.job,
      ch.employees.join('; '),
      ch.items.map(it=>`${it.name}:${it.take}`).join(' | '),
      ch.closed?'Fechado':'Aberto',
      ch.timeIn || ''
    ])
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
  const outNow  = document.getElementById('outNow');
  if(outNow) outNow.textContent = 'Agora: ' + new Date().toLocaleString('pt-BR');

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

  // Adicionar nos cadastros
  const guardBind = (id, fn)=>{
    const el = document.getElementById(id);
    if(!el || el.dataset.bound) return;
    el.dataset.bound = '1';
    el.addEventListener('click', fn);
  };

  const isAdmin = ()=> user && user.role==='Admin';

  guardBind('toolAdd', ()=>{
    if(!isAdmin()) return alert('Somente Admin pode cadastrar.');
    tools.push({ name:'', code:'', qty:1, obs:'' });
    write(LS.tools, tools);
    renderTools(()=>ctx.renderPicker());
    ctx.renderPicker();
  });

  guardBind('teamAdd', ()=>{
    if(!isAdmin()) return alert('Somente Admin pode cadastrar.');
    const val = (document.getElementById('teamNew').value||'').trim();
    if(!val) return;
    teams.push(val);
    write(LS.teams, teams);
    document.getElementById('teamNew').value='';
    renderTeams(()=>{});
    renderEmployeesChoice(ctx);
  });

  guardBind('jobAdd', ()=>{
    if(!isAdmin()) return alert('Somente Admin pode cadastrar.');
    const val = (document.getElementById('jobNew').value||'').trim();
    if(!val) return;
    jobs.push(val);
    write(LS.jobs, jobs);
    document.getElementById('jobNew').value='';
    renderJobs(()=>{});
    fillSelect(document.getElementById('outJobsite'), jobs);
  });

  // Confirmar Saída → salva um registro "em aberto"
  const btnCheckout = document.getElementById('btnCheckout');
  btnCheckout?.addEventListener('click', ()=>{
    const items = Object.entries(ctx.pickState)
      .filter(([_,v])=> (v?.take||0)>0)
      .map(([k,v])=>{
        const i = Number(k.split('_')[1]||0);
        return { idx:i, name:(tools[i]?.name||''), take:Number(v.take||0) };
      });

    const job = document.getElementById('outJobsite')?.value || '';
    const time = document.getElementById('outTime')?.value || new Date().toISOString().slice(0,16);
    const employees = [...ctx.employeesSelected];

    const ch = {
      id: 'ch_' + Date.now(),
      timeOut: time,
      job,
      employees,
      items,
      closed: false
    };
    const all = loadChecks(); all.push(ch); saveChecks(all);
    alert('Saída registrada!');
    refreshReturnSelect();
  });

  // Confirmar Retorno → fecha o registro
  const btnFinishReturn = document.getElementById('btnFinishReturn');
  btnFinishReturn?.addEventListener('click', ()=>{
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
      refreshReturnSelect();
    }else{
      alert('Registro não encontrado.');
    }
  });

  // Exportações
  const btnPDF = document.getElementById('btnExportPDF');
  const btnXLS = document.getElementById('btnExportXLS');
  btnPDF?.addEventListener('click', ()=> alert('Relatório PDF: em breve.'));
  btnXLS?.addEventListener('click', exportCSV);

  // Inicializa select de retornos
  refreshReturnSelect();
}

/* bootstrap */
function init(){
  say('iniciando…');
  bindAuth();
  const u = currentUser();
  if(u){ showApp(u); initAppUI(); } else { showLogin(); }
  document.addEventListener('user:login', ()=>{ initAppUI(); });
  say('pronto');
}
document.addEventListener('DOMContentLoaded', init);