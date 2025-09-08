import { setupTabs } from './tabs.js';
import { LS, write } from './storage.js';
import { tools, teams, jobs, outs, rets, user, setState } from './state.js';
import { fillSelect, renderTools, renderTeams, renderJobs, renderPicker, renderEmployeesChoice } from './ui.js';
import { bindCheckout } from './checkout.js';
import { bindReturn } from './returns.js';
import { renderReturnList } from './render_return.js';
import { refreshOpenOuts } from './openouts.js';
import { bindExports } from './exports_bind.js';
import { currentUser, bindAuth, showApp, showLogin } from './auth.js';

const chip = document.getElementById('diag'); const say = t=> chip && (chip.textContent=t);

async function registerSW(){
  try{ if('serviceWorker' in navigator){ await navigator.serviceWorker.register('./sw.js'); } }catch(e){/*ignore*/}
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
  // Obras/Clientes ainda é select simples
  fillSelect(document.getElementById('outJobsite'), jobs);

  const outTime=document.getElementById('outTime'); if(outTime) outTime.value=new Date().toISOString().slice(0,16);
  const outNow=document.getElementById('outNow'); if(outNow) outNow.textContent='Agora: '+ new Date().toLocaleString('pt-BR');
  const retTime=document.getElementById('retTime'); if(retTime) retTime.value=new Date().toISOString().slice(0,16);

  // Contexto
  const ctx = {
    outPhotos:[], retPhotos:[],
    pickState:{}, currentReturn:null,
    employeesSelected: new Set(), // <<< funcionários marcados
    renderPicker:()=>renderPicker(ctx.pickState),
    refreshOpenOuts,
    renderReturnList:()=>renderReturnList(ctx)
  };

  // Renderiza checkboxes de funcionários
  renderEmployeesChoice(ctx);

  // Fotos
  const outPhotoEl=document.getElementById('outPhoto'); if(outPhotoEl){ outPhotoEl.addEventListener('change', async (e)=>{ const f=e.target.files?.[0]; if(!f) return; const b64=await new Promise(res=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.readAsDataURL(f); }); ctx.outPhotos.push(b64); const pc=document.getElementById('outPhotoCount'); if(pc) pc.textContent=`${ctx.outPhotos.length} foto(s)`; }); }
  const retPhotoEl=document.getElementById('retPhoto'); if(retPhotoEl){ retPhotoEl.addEventListener('change', async (e)=>{ const f=e.target.files?.[0]; if(!f) return; const b64=await new Promise(res=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.readAsDataURL(f); }); ctx.retPhotos.push(b64); const pc=document.getElementById('retPhotoCount'); if(pc) pc.textContent=`${ctx.retPhotos.length} foto(s)`; }); }

  // Listas
  renderTools(()=>ctx.renderPicker());
  renderTeams(refreshAll);
  renderJobs(refreshAll);
  ctx.renderPicker();
  refreshOpenOuts();

  // Adicionar itens
  const btnToolAdd = document.getElementById('toolAdd');
  if(btnToolAdd){
    btnToolAdd.addEventListener('click', ()=>{
      tools.push({ name:'', code:'', qty:1, obs:'' });
      write(LS.tools, tools);
      renderTools(()=>ctx.renderPicker());
      ctx.renderPicker();
      const tcount=document.getElementById('toolsCount'); if(tcount) tcount.textContent=`${tools.length} itens`;
    });
  }
  const btnTeamAdd = document.getElementById('teamAdd');
  if(btnTeamAdd){
    btnTeamAdd.addEventListener('click', ()=>{
      const val = (document.getElementById('teamNew').value||'').trim();
      if(!val) return;
      teams.push(val); write(LS.teams, teams);
      document.getElementById('teamNew').value='';
      renderTeams(refreshAll);
      renderEmployeesChoice(ctx); // <<< atualizar checkboxes
    });
  }
  const btnJobAdd = document.getElementById('jobAdd');
  if(btnJobAdd){
    btnJobAdd.addEventListener('click', ()=>{
      const val = (document.getElementById('jobNew').value||'').trim();
      if(!val) return;
      jobs.push(val); write(LS.jobs, jobs);
      document.getElementById('jobNew').value='';
      renderJobs(refreshAll); fillSelect(document.getElementById('outJobsite'), jobs);
    });
  }

  bindExports();
  bindCheckout(ctx);
  bindReturn(ctx);

  function refreshAll(){
    fillSelect(document.getElementById('outJobsite'), jobs);
    renderTools(()=>ctx.renderPicker());
    renderTeams(refreshAll);
    renderJobs(refreshAll);
    renderEmployeesChoice(ctx); // <<< re-render funcionários
    ctx.renderPicker();
  }
};

if(u){ initAppUI(); }
document.addEventListener('user:login', ()=>{ initAppUI(); });

say('pronto');
