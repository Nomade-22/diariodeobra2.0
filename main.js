// main.js — inicialização em modo seguro (sem GAS agora)

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
// import { renderFinance, bindFinanceTop } from './finance.js';
// import { renderUsers, bindUserTop } from './ui_users.js';
// import { retryQueue } from './gas.js';

const chip = document.getElementById('diag');
const say  = (t)=> chip && (chip.textContent = t);

window.addEventListener('error', (e)=> say('Erro: ' + (e.message || 'desconhecido')));

// derruba SWs antigos e caches no primeiro load
(async ()=>{
  if ('serviceWorker' in navigator) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const r of regs) await r.unregister();
      const keys = await caches.keys();
      for (const k of keys) await caches.delete(k);
      // registra o novo SW
      await navigator.serviceWorker.register('./sw.js?v=8');
    } catch(e){}
  }
})();

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
  renderTeams(()=>{});
  renderJobs(()=>{});
  ctx.renderPicker();
  refreshOpenOuts();

  bindExports();
  bindCheckout(ctx);
  bindReturn(ctx);

  // Se quiser reativar Financeiro/Usuários depois:
  // const isAdmin = ()=> user && user.role === 'Admin';
  // if(isAdmin()){
  //   bindFinanceTop(); renderFinance();
  //   bindUserTop();    renderUsers();
  // }
}

function init(){
  say('iniciando…');
  bindAuth();              // login + olhinho
  const u = currentUser(); // restaura sessão
  if(u){ showApp(u); initAppUI(); }
  else { showLogin(); }
  document.addEventListener('user:login', ()=>{ initAppUI(); });
  say('pronto');
}

document.addEventListener('DOMContentLoaded', init);