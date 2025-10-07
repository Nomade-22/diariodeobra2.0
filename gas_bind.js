// gas_bind.js — integra botões do app com o GAS
import { sendToGAS, retryQueue } from './gas.js';

const LS_CHECKS = 'mp_checkouts_v1';
const readChecks = ()=> { try{ return JSON.parse(localStorage.getItem(LS_CHECKS)||'[]'); }catch{ return []; } };

function bindOnce(id, fn){
  const el = document.getElementById(id);
  if(!el) return; if(el.dataset._gasbind==='1') return;
  el.dataset._gasbind='1'; el.addEventListener('click', fn);
}
const withDelay = (ms, fn)=> ()=> setTimeout(fn, ms);

// Saída: envia o último checkout (aberto)
function sendLastOut(){
  const arr = readChecks(); if(!arr.length) return console.warn('[GAS] Sem saídas locais.');
  const out = arr[arr.length-1];
  sendToGAS('saida', out).then(r=>{
    if(r.queued) console.warn('[GAS] Saída enfileirada (offline).');
    else console.log('[GAS] Saída enviada:', r);
  }).catch(e=>console.warn('[GAS] Erro saída', e));
}

// Retorno: envia o último checkout FECHADO (closed=true)
function sendLastRet(){
  const arr = readChecks(); if(!arr.length) return console.warn('[GAS] Sem retornos locais.');
  const last = arr[arr.length-1];
  if(!last.closed){ console.warn('[GAS] Último checkout ainda não fechado.'); return; }
  const ret = {
    out_id: last.id,
    kmIn: last.kmIn || 0,
    timeIn: last.timeIn || new Date().toISOString(),
    notes: last.notes || '',
    checklist: last.items || []
  };
  sendToGAS('retorno', ret).then(r=>{
    if(r.queued) console.warn('[GAS] Retorno enfileirado (offline).');
    else console.log('[GAS] Retorno enviado:', r);
  }).catch(e=>console.warn('[GAS] Erro retorno', e));
}

window.addEventListener('DOMContentLoaded', ()=>{
  retryQueue();
  bindOnce('btnCheckout',     withDelay(600, sendLastOut));
  bindOnce('btnFinishReturn', withDelay(600, sendLastRet));
});
