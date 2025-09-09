// main.js — inicialização da UI e binds principais

import { setupTabs } from './tabs.js';
import { LS, write } from './state.js';
import { tools, teams, jobs, user, setState } from './state.js';
import { fillSelect, renderTools, renderTeams, renderJobs, renderPicker, renderEmployeesChoice } from './ui.js';
import { bindCheckout } from './checkout.js';
import { bindReturn } from './returns.js';
import { renderReturnList } from './render_return.js';
import { refreshOpenOuts } from './openouts.js';
import { bindExports } from './exports_bind.js';
import { currentUser, bindAuth, showApp, showLogin } from './auth.js';
import { renderFinance, bindFinanceTop } from './finance.js';
import { renderUsers, bindUserTop } from './ui_users.js';
import { retryQueue } from './gas.js';

const chip = document.getElementById('diag');
const say  = (t)=> chip && (chip.textContent = t);

// Mostra erro no chip se algo quebrar
window.addEventListener('error', (e)=> say('Erro: ' + (e.message || 'desconhecido')));

async function registerSW(){
  try{ if('serviceWorker' in navigator){ await navigator.serviceWorker.register('./sw.js?v=6'); } }catch(e){}
}

function initAppUI(){
  setupTabs();

  fillSelect(document.getElementById('outJobsite'), jobs);

  const outTime = document.getElementById('outTime');
  if(outTime) outTime.value = new Date().toISOString().slice(0,16);
  const outNow  = document.getElementById('outNow');
  if(outNow) outNow.textContent = 'Agora: ' + new Date().toLocaleString('pt-BR');

  const retTime = document.getElementById('retTime');
  if(retTime) retTime.value = new Date().toISOString().slice(0,16);

  const ctx = {
    outPhotos:[], retPhotos:[],
    pickState:{}, currentReturn:null,
    employeesSelected: new Set(),
    renderPicker: () => renderPicker(ctx.pickState),
    refreshOpenOuts,
    renderReturnList: () => renderReturnList(ctx)
  };

  renderEmployeesChoice(ctx);
  renderTools(()=>ctx.renderPicker());
  renderTeams(refreshAll);
  renderJobs(refreshAll);
  ctx.renderPicker();
  refreshOpenOuts();

  bindExports();
  bindCheckout(ctx);
  bindReturn(ctx);

  const isAdmin = ()=> user && user.role === 'Admin';
  if(isAdmin()){
    bindFinanceTop(); renderFinance();
    bindUserTop();    renderUsers();
  }

  function refreshAll(){
    fillSelect(document.getElementById('outJobsite'), jobs);
    renderTools(()=>ctx.renderPicker());
    renderTeams(refreshAll);
    renderJobs(refreshAll);
    renderEmployeesChoice(ctx);
    ctx.renderPicker();
    if(isAdmin()){
      bindFinanceTop(); renderFinance();
      renderUsers();
    }
  }

  // Botões "Adicionar"
  const guardBind = (id, fn)=>{
    const el = document.getElementById(id);
    if(!el || el.dataset.bound) return;
    el.dataset.bound = '1';
    el.addEventListener('click', fn);
  };

  guardBind('toolAdd', ()=>{
    if(!(user && user.role === 'Admin')) return alert('Somente Admin pode cadastrar.');
    tools.push({ name:'', code:'', qty:1, obs:'' });
    write(LS.tools, tools);
    const tcount = document.getElementById('toolsCount');
    if(tcount) tcount.textContent = `${tools.length} itens`;
    renderTools(()=>ctx.renderPicker());
    ctx.renderPicker();
  });

  guardBind('teamAdd', ()=>{
    if(!(user && user.role === 'Admin')) return alert('Somente Admin pode cadastrar.');
    const val = (document.getElementById('teamNew').value||'').trim();
    if(!val) return;
    teams.push(val);
    write(LS.teams, teams);
    document.getElementById('teamNew').value='';
    renderTeams(()=>{});
    renderEmployeesChoice(ctx);
  });

  guardBind('jobAdd', ()=>{
    if(!(user && user.role === 'Admin')) return alert('Somente Admin pode cadastrar.');
    const val = (document.getElementById('jobNew').value||'').trim();
    if(!val) return;
    jobs.push(val);
    write(LS.jobs, jobs);
    document.getElementById('jobNew').value='';
    renderJobs(()=>{});
    fillSelect(document.getElementById('outJobsite'), jobs);
    bindFinanceTop();
  });
}

function init(){
  say('iniciando…');
  registerSW();
  bindAuth();              // liga login/olhinho (resiliente no auth.js)
  retryQueue();            // tenta enviar fila offline
  const u = currentUser(); // restaura sessão
  if(u){ showApp(u); initAppUI(); }
  else { showLogin(); }
  document.addEventListener('user:login', ()=>{ initAppUI(); retryQueue(); });
  say('pronto');
}

document.addEventListener('DOMContentLoaded', init);