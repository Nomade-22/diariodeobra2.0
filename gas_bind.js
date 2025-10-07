// gas_bind.js — liga UI → GAS (usa chaves reais do projeto, storage.js)

import { sendToGAS, retryQueue } from './gas.js';
import { LS, read } from './storage.js';

// As chaves corretas estão em storage.js
const readOuts = ()=> read(LS.outs, []); // mp_checkouts_v1
const readRets = ()=> read(LS.rets, []); // mp_returns_v1

function bindOnce(id, fn){
  const el = document.getElementById(id);
  if(!el) return;
  if(el.dataset._gasbind==='1') return;
  el.dataset._gasbind = '1';
  el.addEventListener('click', fn);
}

const withDelay = (ms, fn)=> ()=> setTimeout(fn, ms);

// Envia a ÚLTIMA saída salva localmente
function sendLastOut(){
  const arr = readOuts();
  if(!arr.length) { console.warn('[GAS] Nenhuma saída local encontrada.'); return; }
  const out = arr[arr.length - 1];
  sendToGAS('saida', out).then(r=>{
    if(r.queued) console.warn('[GAS] Saída enfileirada (offline).');
    else console.log('[GAS] Saída enviada.', r);
  }).catch(e=>console.warn('[GAS] Erro saída', e));
}

// Envia o ÚLTIMO retorno salvo localmente
function sendLastRet(){
  const arr = readRets();
  if(!arr.length) { console.warn('[GAS] Nenhum retorno local encontrado.'); return; }
  const ret = arr[arr.length - 1];
  sendToGAS('retorno', ret).then(r=>{
    if(r.queued) console.warn('[GAS] Retorno enfileirado (offline).');
    else console.log('[GAS] Retorno enviado.', r);
  }).catch(e=>console.warn('[GAS] Erro retorno', e));
}

window.addEventListener('DOMContentLoaded', ()=>{
  retryQueue(); // tenta reenviar o que ficou pendente
  bindOnce('btnCheckout',     withDelay(600, sendLastOut));   // Confirmar Saída
  bindOnce('btnFinishReturn', withDelay(600, sendLastRet));   // Confirmar Retorno
});
