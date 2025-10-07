// gas_debug.js — painel de diagnóstico
import { CONFIG } from './gas.js';

function notify(msg, ok=true){ alert((ok?'✅ ':'❌ ')+msg); }

async function testConnection(){
  try{
    const r = await fetch(CONFIG.GAS_URL+'?action=ping'); const txt = await r.text();
    let ok=false; try{ ok=(JSON.parse(txt)?.ok===true); }catch{}
    if(ok) notify('Conexão com a planilha OK!'); else { console.warn('Resp:', txt); notify('Sem resposta válida do Apps Script.', false); }
  }catch(e){ notify('Erro: '+e.message, false); }
}

async function forceSaida(){
  const payload = { type:'force_saida', data:{ job:'obra_pf', vehicle:'veh_gol', driver:'Debug', employees:['func_joao'], items:[{id:'tool_furadeira',qtdLevar:1}], kmOut:'123', timeOut:new Date().toISOString(), obs:'forcado via botão' } };
  const params = new URLSearchParams(); params.set('json', JSON.stringify(payload));
  const r = await fetch(CONFIG.GAS_URL,{ method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'}, body: params });
  const txt = await r.text(); console.log('force_saida ->', txt);
  let ok=false; try{ ok=(JSON.parse(txt)?.ok===true); }catch{}
  notify(ok?'Linha forçada gravada em Saidas. Verifique a planilha.':'Falha ao forçar gravação (veja console).', ok);
}

async function fetchAllData(){
  try{
    const r = await fetch(CONFIG.GAS_URL+'?action=load_all'); const j = await r.json();
    if(j.ok){ console.log('Sheets data:', j.data); notify('Dados carregados no console (F12 → Console).'); }
    else notify('Erro ao carregar: '+j.error, false);
  }catch(e){ notify('Erro: '+e.message, false); }
}

window.addEventListener('DOMContentLoaded', ()=>{
  const div=document.createElement('div');
  div.innerHTML=`
  <div style="position:fixed;bottom:10px;right:10px;z-index:9999;display:flex;gap:6px;">
    <button id="btnPing"    style="padding:6px 10px;">🔄 Testar conexão</button>
    <button id="btnForce"   style="padding:6px 10px;">🧪 Forçar saída (debug)</button>
    <button id="btnFetch"   style="padding:6px 10px;">📥 Buscar dados</button>
  </div>`;
  document.body.appendChild(div);
  document.getElementById('btnPing').onclick=testConnection;
  document.getElementById('btnForce').onclick=forceSaida;
  document.getElementById('btnFetch').onclick=fetchAllData;
});
