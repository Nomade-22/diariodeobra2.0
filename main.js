// main.js
// Inicialização da interface, binds e integrações (PDF/Excel + Google Sheets)

import { setupTabs } from './abas.js';
import { LS, write } from './estado.js';
import { tools, teams, jobs, user, setState } from './estado.js';
import { fillSelect, renderTools, renderTeams, renderJobs, renderPicker, renderEmployeesChoice } from './ui.js';
import { bindCheckout } from './checkout.js';
import { bindReturn } from './retoma.js';
import { renderReturnList } from './render_return.js';
import { refreshOpenOuts } from './openouts.js';
import { bindExports } from './exports_bind.js';
import { currentUser, bindAuth, showApp, showLogin } from './auth.js';
import { renderFinance, bindFinanceTop } from './finanças.js';
import { renderUsers, bindUserTop } from './ui_users.js';

// Integração Google (fila offline / reenviar)
import { retryQueue } from './gas.js';

const chip = document.getElementById('diag');
const say  = (t)=> chip && (chip.textContent = t);

async function registerSW(){
  try{
    if('serviceWorker' in navigator){
      await navigator.serviceWorker.register('./sw.js');
    }
  }catch(e){}
}

say('iniciando…');
registerSW();

bindAuth();
const u = currentUser();
if(u){ setState({user:u}); showApp(u); } else { showLogin(); }

// tenta reenviar o que ficou na fila (offline) ao abrir
retryQueue();

let initialized = false;
const initAppUI = ()=>{
  if(initialized) return;
  initialized = true;

  setupTabs();
  fillSelect(document.getElementById('outJobsite'), jobs);

  // datas padrão
  const outTime = document.getElementById('outTime');
  if(outTime) outTime.value = new Date().toISOString().slice(0,16);
  const outNow  = document.getElementById('outNow');
  if(outNow) outNow.textContent = 'Agora: ' + new Date().toLocaleString('pt-BR');

  const retTime = document.getElementById('retTime');
  if(retTime) retTime.value = new Date().toISOString().slice(0,16);

  // contexto compartilhado entre telas
  const ctx = {
    outPhotos:[], retPhotos:[],
    pickState:{}, currentReturn:null,
    employeesSelected: new Set(),
    renderPicker: () => renderPicker(ctx.pickState),
    refreshOpenOuts,
    renderReturnList: () => renderReturnList(ctx)
  };

  // renders iniciais
  renderEmployeesChoice(ctx);
  renderTools(()=>ctx.renderPicker());
  renderTeams(refreshAll);
  renderJobs(refreshAll);
  ctx.renderPicker();
  refreshOpenOuts();

  // binds principais
  bindExports();
  bindCheckout(ctx);
  bindReturn(ctx);

  // Admin-only
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

  // Botões "Adicionar" (evita listeners duplicados)
  const guardBind = (id, fn)=>{
    const el = document.getElementById(id);
    if(!el || el.dataset.bound) return;
    el.dataset.bound = '1';
    el.addEventListener('click', fn);
  };

  guardBind('toolAdd', ()=>{
    if(!isAdmin()) return alert('Somente Admin pode cadastrar.');
    tools.push({ name:'', code:'', qty:1, obs:'' });
    write(LS.tools, tools);
    const tcount = document.getElementById('toolsCount');
    if(tcount) tcount.textContent = `${tools.length} itens`;
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
    renderTeams(refreshAll);
    renderEmployeesChoice(ctx);
  });

  guardBind('jobAdd', ()=>{
    if(!isAdmin()) return alert('Somente Admin pode cadastrar.');
    const val = (document.getElementById('jobNew').value||'').trim();
    if(!val) return;
    jobs.push(val);
    write(LS.jobs, jobs);
    document.getElementById('jobNew').value='';
    renderJobs(refreshAll);
    fillSelect(document.getElementById('outJobsite'), jobs);
    bindFinanceTop(); // mantém select do financeiro sincronizado
  });
};

// se já está logado, sobe a UI
if(u){ initAppUI(); }
// reinit após login
document.addEventListener('user:login', ()=>{ initAppUI(); retryQueue(); });

say('pronto');
