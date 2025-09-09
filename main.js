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

const chip = document.getElementById('diag'); const say = t=> chip && (chip.textContent=t);

async function registerSW(){
  try{ if('serviceWorker' in navigator){ await navigator.serviceWorker.register('./sw.js'); } }catch(e){}
}

say('iniciando…');
registerSW();

bindAuth();
const u = currentUser();
if(u){ setState({user:u}); showApp(u); } else { showLogin(); }

let initialized = false;
const initAppUI = ()=>{
  if(initialized) return; initialized = true;

  setupTabs();
  fillSelect(document.getElementById('outJobsite'), jobs);

  const outTime=document.getElementById('outTime'); if(outTime) outTime.value=new Date().toISOString().slice(0,16);
  const outNow=document.getElementById('outNow'); if(outNow) outNow.textContent='Agora: '+ new Date().toLocaleString('pt-BR');
  const retTime=document.getElementById('retTime'); if(retTime) retTime.value=new Date().toISOString().slice(0,16);

  const ctx = {
    outPhotos:[], retPhotos:[],
    pickState:{}, currentReturn:null,
    employeesSelected: new Set(),
    renderPicker:()=>renderPicker(ctx.pickState),
    refreshOpenOuts,
    renderReturnList:()=>renderReturnList(ctx)
  };

  renderEmployeesChoice(ctx);
  renderTools(()=>ctx.renderPicker());
  renderTeams(refreshAll);
  renderJobs(refreshAll);
  ctx.renderPicker();
  refreshOpenOuts();

  // Adições (somente Admin) já protegidas por UI específica no renderTools/renderTeams/renderJobs

  bindExports();
  bindCheckout(ctx);
  bindReturn(ctx);

  const isAdmin = ()=> user && user.role==='Admin';
  if(isAdmin()){
    bindFinanceTop(); renderFinance();
    bindUserTop(); renderUsers();
  }

  function refreshAll(){
    fillSelect(document.getElementById('outJobsite'), jobs);
    renderTools(()=>ctx.renderPicker());
    renderTeams(refreshAll);
    renderJobs(refreshAll);
    renderEmployeesChoice(ctx);
    ctx.renderPicker();
    if(isAdmin()){ bindFinanceTop(); renderFinance(); renderUsers(); }
  }
};

if(u){ initAppUI(); }
document.addEventListener('user:login', ()=>{ initAppUI(); });

say('pronto');