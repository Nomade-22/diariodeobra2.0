// main.js — v8 (Cadastros “oficial”: adicionar/editar/excluir funcionando)

import { setupTabs } from './tabs.js';
import { LS, write } from './state.js';
import { tools, teams, jobs, user, setState } from './state.js';
import {
  fillSelect,
  renderTools,
  renderTeams,
  renderJobs,
  renderPicker,
  renderEmployeesChoice,
  bindCadastroDelegation
} from './ui.js';
import { bindCheckout } from './checkout.js';
import { bindReturn } from './returns.js';
import { renderReturnList } from './render_return.js';
import { refreshOpenOuts } from './openouts.js';
import { bindExports } from './exports_bind.js';
import { currentUser, bindAuth, showApp, showLogin } from './auth.js';
// import { renderFinance, bindFinanceTop } from './finance.js';
// import { renderUsers, bindUserTop } from './ui_users.js';
// import { retryQueue } from './gas.js';

const chip = document.getElementById('diag');
const say  = (t)=> chip && (chip.textContent = t);

window.addEventListener('error', (e)=> say('Erro: ' + (e.message || 'desconhecido')));

// derruba SWs antigos e registra o novo (mantemos v=8)
(async ()=>{
  if ('serviceWorker' in navigator) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const r of regs) await r.unregister();
      const keys = await caches.keys();
      for (const k of keys) await caches.delete(k);
      await navigator.serviceWorker.register('./sw.js?v=8');
    } catch(e){}
  }
})();

function initAppUI(){
  setupTabs();

  // selects & horários padrão
  fillSelect(document.getElementById('outJobsite'), jobs);
  const outTime = document.getElementById('outTime');
  if(outTime) outTime.value = new Date().toISOString().slice(0,16);
  const outNow  = document.getElementById('outNow');
  if(outNow) outNow.textContent = 'Agora: ' + new Date().toLocaleString('pt-BR');
  const retTime = document.getElementById('retTime');
  if(retTime) retTime.value = new Date().toISOString().slice(0,16);

  // contexto da tela (saída & retorno)
  const ctx = {
    outPhotos:[], retPhotos:[],
    pickState:{}, currentReturn:null,
    employeesSelected: new Set(),
    renderPicker: () => renderPicker(ctx.pickState),
    refreshOpenOuts,
    renderReturnList: () => renderReturnList(ctx)
  };

  // render inicial
  renderEmployeesChoice(ctx);
  renderTools(()=>ctx.renderPicker());
  renderTeams(refreshAll);
  renderJobs(refreshAll);
  ctx.renderPicker();
  refreshOpenOuts();

  // exportações e fluxos principais
  bindExports();
  bindCheckout(ctx);
  bindReturn(ctx);

  // Delegação para CADASTROS (funciona mesmo após re-render)
  bindCadastroDelegation({
    onToolsChange: () => { write(LS.tools, tools); renderTools(()=>ctx.renderPicker()); ctx.renderPicker(); },
    onTeamsChange: () => { write(LS.teams, teams); renderTeams(refreshAll); renderEmployeesChoice(ctx); },
    onJobsChange:  () => { write(LS.jobs,  jobs);  renderJobs(refreshAll);  fillSelect(document.getElementById('outJobsite'), jobs); }
  });

  // Botões “Adicionar” (simples, só inserem; edição/exclusão é por delegação no ui.js)
  const isAdmin = ()=> user && user.role === 'Admin';
  const bindOnce = (id, fn)=>{
    const el = document.getElementById(id);
    if(!el || el.dataset.bound) return;
    el.dataset.bound = '1';
    el.addEventListener('click', fn);
  };

  bindOnce('toolAdd', ()=>{
    if(!isAdmin()) return alert('Somente Admin pode cadastrar.');
    tools.push({ name:'', code:'', qty:1, obs:'' });
    write(LS.tools, tools);
    renderTools(()=>ctx.renderPicker());
    ctx.renderPicker();
  });

  bindOnce('teamAdd', ()=>{
    if(!isAdmin()) return alert('Somente Admin pode cadastrar.');
    const val = (document.getElementById('teamNew').value||'').trim();
    if(!val) return;
    teams.push(val);
    document.getElementById('teamNew').value='';
    write(LS.teams, teams);
    renderTeams(refreshAll);
    renderEmployeesChoice(ctx);
  });

  bindOnce('jobAdd', ()=>{
    if(!isAdmin()) return alert('Somente Admin pode cadastrar.');
    const val = (document.getElementById('jobNew').value||'').trim();
    if(!val) return;
    jobs.push(val);
    document.getElementById('jobNew').value='';
    write(LS.jobs, jobs);
    renderJobs(refreshAll);
    fillSelect(document.getElementById('outJobsite'), jobs);
  });

  // if(isAdmin()){ bindFinanceTop(); renderFinance(); bindUserTop(); renderUsers(); }

  function refreshAll(){
    fillSelect(document.getElementById('outJobsite'), jobs);
    renderTools(()=>ctx.renderPicker());
    renderTeams(refreshAll);
    renderJobs(refreshAll);
    renderEmployeesChoice(ctx);
    ctx.renderPicker();
  }
}

function init(){
  say('iniciando…');
  bindAuth();
  // retryQueue(); // quando reativar GAS
  const u = currentUser();
  if(u){ showApp(u); initAppUI(); } else { showLogin(); }
  document.addEventListener('user:login', ()=>{ initAppUI(); /*retryQueue();*/ });
  say('pronto');
}

document.addEventListener('DOMContentLoaded', init);