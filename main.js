// main.js — v8r: login + tabs + cadastros funcionando (sem SW/GAS)

import { LS, write } from './state.js';
import { tools, teams, jobs, user, setState } from './state.js';
import { currentUser, bindAuth, showApp, showLogin } from './auth.js';
import { fillSelect, renderTools, renderTeams, renderJobs, renderPicker, renderEmployeesChoice } from './ui.js';

const chip = document.getElementById('diag');
const say  = (t)=> chip && (chip.textContent = t);
window.addEventListener('error', (e)=> say('Erro: ' + (e.message || 'desconhecido')));

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
    });
  });
}

function initAppUI(){
  setupTabs();

  // selects & hora padrão
  fillSelect(document.getElementById('outJobsite'), jobs);
  const outTime = document.getElementById('outTime');
  if(outTime) outTime.value = new Date().toISOString().slice(0,16);
  const outNow  = document.getElementById('outNow');
  if(outNow) outNow.textContent = 'Agora: ' + new Date().toLocaleString('pt-BR');

  // contexto (Saída)
  const ctx = {
    pickState:{},
    employeesSelected: new Set(),
    renderPicker: ()=> renderPicker(ctx.pickState),
  };

  // renders
  renderEmployeesChoice(ctx);
  renderTools(()=>ctx.renderPicker());
  renderTeams(()=>{});
  renderJobs(()=>{});
  ctx.renderPicker();

  // “Adicionar” (insere item + re-render)
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

  // Confirmar Saída (placeholder — mostra seleção)
  const btnCheckout = document.getElementById('btnCheckout');
  btnCheckout?.addEventListener('click', ()=>{
    const toolsTaken = Object.entries(ctx.pickState)
      .filter(([_,v])=> (v?.take||0)>0)
      .map(([k,v])=> `${k}: ${v.take}`);
    alert(`Saída registrada!\nFuncionários: ${[...ctx.employeesSelected].join(', ')||'-'}\nFerramentas: ${toolsTaken.join(', ')||'-'}`);
  });
}

function init(){
  say('iniciando…');
  bindAuth();
  const u = currentUser();
  if(u){ showApp(u); initAppUI(); } else { showLogin(); }
  document.addEventListener('user:login', ()=>{ initAppUI(); });
  say('pronto');
}

document.addEventListener('DOMContentLoaded', init);
