// gas_debug.js — painel de diagnóstico
import { CONFIG, sendToGAS, retryQueue } from './gas.js';

function notify(msg, ok=true){ alert((ok?'✅ ':'❌ ')+msg); }

async function testConnection(){
  try{
    const r = await fetch(CONFIG.GAS_URL+'?action=ping', { method:'GET' });
    const txt = await r.text(); let ok=false; try{ ok = (JSON.parse(txt)?.ok===true); }catch{}
    if(ok) notify('Conexão com a planilha OK!'); else { console.warn('Resp:', txt); notify('Sem resposta válida do Apps Script.', false); }
  }catch(e){ notify('Erro: '+e.message, false); }
}

async function sendAllPendentes(){
  const q = JSON.parse(localStorage.getItem('syncQueue_v1')||'[]');
  let enviados = 0;
  for(const it of q){ const r = await sendToGAS(it.payload?.type, it.payload?.data); if(r.ok||r.queued) enviados++; }
  await retryQueue();
  notify(`Envio completo: ${enviados} registros enviados.`);
}

async function fetchAllData(){
  try{
    const r = await fetch(CONFIG.GAS_URL+'?action=load_all'); const j = await r.json();
    if(j.ok){ console.log('Sheets data:', j.data); notify('Dados carregados no console (F12 → Console).'); }
    else notify('Erro ao carregar: '+j.error, false);
  }catch(e){ notify('Erro: '+e.message, false); }
}

window.addEventListener('DOMContentLoaded', ()=>{
  const div = document.createElement('div');
  div.innerHTML = `
  <div style="position:fixed;bottom:10px;right:10px;z-index:9999;display:flex;gap:6px;">
    <button id="btnPing"    style="padding:6px 10px;">🔄 Testar conexão</button>
    <button id="btnSendAll" style="padding:6px 10px;">📤 Enviar pendentes</button>
    <button id="btnFetch"   style="padding:6px 10px;">📥 Buscar dados</button>
  </div>`;
  document.body.appendChild(div);
  document.getElementById('btnPing').onclick = testConnection;
  document.getElementById('btnSendAll').onclick = sendAllPendentes;
  document.getElementById('btnFetch').onclick = fetchAllData;
});
