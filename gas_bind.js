// gas_bind.js — envia a ÚLTIMA saída/retorno salvo localmente para o GAS
// (discreto: só dispara após você clicar nos botões de confirmar)

import { sendToGAS, retryQueue } from './gas.js';
import { LS, read as lsRead } from './storage.js';

// lê arrays do localStorage pelas chaves usadas no projeto
function readOuts(){ return lsRead(LS.outs, []); }   // mp_checkouts_v1
function readRets(){ return lsRead(LS.rets, []); }   // mp_returns_v1

function bindOnce(id, fn){
  const el = document.getElementById(id);
  if(!el) return;
  if(el.dataset._gasbind==='1') return;
  el.dataset._gasbind = '1';
  el.addEventListener('click', fn);
}

const withDelay = (ms, fn)=> ()=> setTimeout(fn, ms);

function sendLastOut(){
  const arr = readOuts();
  if(!arr.length) return;
  const out = arr[arr.length - 1];
  sendToGAS('saida', out).then(r=>{
    if(r.queued) console.warn('Saída sem internet — enfileirada.');
  }).catch(e=>console.warn('Erro GAS saída', e));
}

function sendLastRet(){
  const arr = readRets();
  if(!arr.length) return;
  const ret = arr[arr.length - 1];
  sendToGAS('retorno', ret).then(r=>{
    if(r.queued) console.warn('Retorno sem internet — enfileirado.');
  }).catch(e=>console.warn('Erro GAS retorno', e));
}

window.addEventListener('DOMContentLoaded', ()=>{
  retryQueue();
  bindOnce('btnCheckout',     withDelay(600, sendLastOut));   // após Confirmar Saída
  bindOnce('btnFinishReturn', withDelay(600, sendLastRet));   // após Confirmar Retorno
});
