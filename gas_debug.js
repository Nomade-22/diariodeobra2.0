// gas_debug.js
import { sendToGAS, retryQueue } from './gas.js';
import { LS, read } from './storage.js';

function notify(msg, ok=true){
  alert((ok ? '✅ ' : '❌ ') + msg);
}

async function testConnection(){
  try {
    const r = await sendToGAS('ping');
    if (r.ok || r.skip) notify('Conexão com a planilha OK!');
    else notify('Sem resposta válida do Apps Script.', false);
  } catch(e){
    notify('Erro: ' + e.message, false);
  }
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
    const res = await fetch(CONFIG.GAS_URL + '?action=load_all');
    const json = await res.json();
    if(json.ok){
      console.log('Dados recebidos da planilha:', json.data);
      alert('✅ Dados carregados no console (F12 > Console).');
    }else{
      notify('Erro ao carregar: ' + json.error, false);
    }
  }catch(e){
    notify('Erro: ' + e.message, false);
  }
}

window.addEventListener('DOMContentLoaded', ()=>{
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div style="position:fixed;bottom:10px;right:10px;z-index:9999;display:flex;gap:5px;">
      <button id="btnPing"   style="padding:6px 10px;">🔄 Testar conexão</button>
      <button id="btnSendAll" style="padding:6px 10px;">📤 Enviar pendentes</button>
      <button id="btnFetch"  style="padding:6px 10px;">📥 Buscar dados</button>
    </div>`;
  document.body.appendChild(wrap);

  document.getElementById('btnPing').onclick = testConnection;
  document.getElementById('btnSendAll').onclick = sendAllPendentes;
  document.getElementById('btnFetch').onclick = fetchAllData;
});
