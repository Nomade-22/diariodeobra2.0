// gas_bind.js
// Faz o "bind" discreto: após você salvar localmente, mandamos o último
// item de Saídas/Retornos para o Google Apps Script.

import { sendToGAS, retryQueue } from './gas.js';

// chaves que você usa no localStorage (do seu projeto atual)
const KEY_OUTS = 'mp_outs';
const KEY_RETS = 'mp_rets';

function read(key){
  try{ return JSON.parse(localStorage.getItem(key)||'[]'); }catch{ return []; }
}

function bindOnce(id, fn){
  const el = document.getElementById(id);
  if(!el || el.dataset.gasBound) return;
  el.dataset.gasBound = '1';
  el.addEventListener('click', fn);
}

// tenta enviar último registro algum tempo depois do clique (para dar
// tempo do seu código salvar no localStorage primeiro)
function withDelay(ms, f){ return ()=> setTimeout(f, ms); }

function sendLastOut(){
  const arr = read(KEY_OUTS);
  if(!arr.length) return;
  const out = arr[arr.length - 1];
  sendToGAS('saida', out).then(r=>{
    if(r.queued) console.warn('Saída sem internet — enfileirada.');
  }).catch(e=>console.warn('Erro GAS saída', e));
}

function sendLastRet(){
  const arr = read(KEY_RETS);
  if(!arr.length) return;
  const ret = arr[arr.length - 1];
  sendToGAS('retorno', ret).then(r=>{
    if(r.queued) console.warn('Retorno sem internet — enfileirado.');
  }).catch(e=>console.warn('Erro GAS retorno', e));
}

// liga os botões quando a página carrega
window.addEventListener('DOMContentLoaded', ()=>{
  retryQueue(); // tenta enviar o que estava na fila
  bindOnce('btnCheckout',    withDelay(600, sendLastOut)); // após confirmar saída
  bindOnce('btnFinishReturn',withDelay(600, sendLastRet)); // após confirmar retorno
});
