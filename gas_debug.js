// gas_debug.js — painel de debug: Testar conexão / Enviar pendentes / Buscar dados
import { CONFIG, sendToGAS, retryQueue } from './gas.js';
import { LS, read } from './storage.js';

function notify(msg, ok=true){ alert((ok ? '✅ ' : '❌ ') + msg); }

async function testConnection(){
  try {
    const url = CONFIG.GAS_URL + '?action=ping';
    const r = await fetch(url, { method: 'GET' });
    const txt = await r.text();
    let ok = false;
    try { ok = (JSON.parse(txt)?.ok === true); } catch { ok = false; }
    if (ok) notify('Conexão com a planilha OK!');
    else { console.warn('Resposta do GAS:', txt); notify('Sem resposta válida do Apps Script.', false); }
  } catch(e){ notify('Erro: ' + e.message, false); }
}

async function sendAllPendentes(){
  const outs = read(LS.outs, []);
  const rets = read(LS.rets, []);
  let enviados = 0;

  for(const o of outs){
    const r = await sendToGAS('saida', o);
    if(r.ok || r.queued) enviados++;
  }
  for(const r of rets){
    const x = await sendToGAS('retorno', r);
    if(x.ok || x.queued) enviados++;
  }
  retryQueue();
  notify(`Envio completo: ${enviados} registros enviados.`);
}

async function fetchAllData(){
  try {
    const url = CONFIG.GAS_URL + '?action=load_all';
    const r = await fetch(url, { method: 'GET' });
    const j = await r.json();
    if(j.ok){
      console.log('Dados (Sheets):', j.data);
      notify('Dados carregados no console (F12 → Console).');
    }else{
      notify('Erro ao carregar: ' + j.error, false);
    }
  } catch(e){ notify('Erro: ' + e.message, false); }
}

window.addEventListener('DOMContentLoaded', ()=>{
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div style="position:fixed;bottom:10px;right:10px;z-index:9999;display:flex;gap:6px;">
      <button id="btnPing"     style="padding:6px 10px;">🔄 Testar conexão</button>
      <button id="btnSendAll"  style="padding:6px 10px;">📤 Enviar pendentes</button>
      <button id="btnFetch"    style="padding:6px 10px;">📥 Buscar dados</button>
    </div>`;
  document.body.appendChild(wrap);

  document.getElementById('btnPing').onclick = testConnection;
  document.getElementById('btnSendAll').onclick = sendAllPendentes;
  document.getElementById('btnFetch').onclick = fetchAllData;
});
