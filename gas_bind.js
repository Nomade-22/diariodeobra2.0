// gas_bind.js — liga UI → GAS (checkout/return) sem mudar o main.js

import { sendToGAS, retryQueue } from './gas.js';

// Lê direto do localStorage a lista de saídas/retornos do site
const LS_CHECKS = 'mp_checkouts_v1';
const readChecks = ()=> { try{ return JSON.parse(localStorage.getItem(LS_CHECKS)||'[]'); }catch{ return []; } };

function bindOnce(id, fn){
  const el = document.getElementById(id);
  if(!el) return;
  if(el.dataset._gasbind==='1') return;
  el.dataset._gasbind = '1';
  el.addEventListener('click', fn);
}

const withDelay = (ms, fn)=> ()=> setTimeout(fn, ms);

// Envia a ÚLTIMA saída salva (a recém confirmada)
function sendLastOut(){
  const arr = readChecks();
  if(!arr.length) { console.warn('[GAS] Nenhuma saída local.'); return; }
  const out = arr[arr.length - 1];
  // payload do front: id, job, employees[], items[], kmOut, timeOut, ...
  sendToGAS('saida', out).then(r=>{
    if(r.queued) console.warn('[GAS] Saída enfileirada (offline).');
    else console.log('[GAS] Saída enviada.', r);
  }).catch(e=>console.warn('[GAS] Erro saída', e));
}

// Envia o ÚLTIMO retorno salvo (o próprio checkout, porém fechado)
function sendLastRet(){
  const arr = readChecks();
  if(!arr.length) { console.warn('[GAS] Nenhum retorno local.'); return; }
  const last = arr[arr.length - 1];
  if(!last.closed){ console.warn('[GAS] Último checkout ainda não está fechado.'); return; }

  // Monta o objeto de retorno esperado pelo backend
  const ret = {
    out_id: last.id,                  // identifica a saída aberta na planilha
    kmIn: last.kmIn || 0,
    timeIn: last.timeIn || last.timeI || new Date().toISOString(),
    notes: last.notes || '',
    // Usa os próprios itens do checkout (com cond/obsBack atualizados)
    checklist: last.items || []
  };

  sendToGAS('retorno', ret).then(r=>{
    if(r.queued) console.warn('[GAS] Retorno enfileirado (offline).');
    else console.log('[GAS] Retorno enviado.', r);
  }).catch(e=>console.warn('[GAS] Erro retorno', e));
}

window.addEventListener('DOMContentLoaded', ()=>{
  retryQueue(); // tenta reenviar pendentes
  bindOnce('btnCheckout',     withDelay(600, sendLastOut));
  bindOnce('btnFinishReturn', withDelay(600, sendLastRet));
});
