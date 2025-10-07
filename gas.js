// gas.js — Cliente do Apps Script (CORS-safe)
// Estratégia: POST "application/x-www-form-urlencoded" com json=... (request simples, sem preflight)
// Fila offline + retry automáticos.

export const CONFIG = {
  GAS_URL: 'https://script.google.com/macros/s/AKfycbztGARPKBSzr45WoWxV078OZ9Vj9CPSRmXQpMqOSEv0KR9DVtE_tf-TpsaqvaOUeqFz/exec'
};

const QKEY = 'syncQueue_v1';

function loadQ(){ try{ return JSON.parse(localStorage.getItem(QKEY)||'[]'); }catch{ return []; } }
function saveQ(q){ localStorage.setItem(QKEY, JSON.stringify(q||[])); }

function toFormPayload(obj){
  const params = new URLSearchParams();
  params.set('json', JSON.stringify(obj));
  return params;
}

/**
 * Envia {type, data} para o GAS.
 * - Primeiro tenta como "application/x-www-form-urlencoded" (CORS-safe).
 * - Se algo falhar por formato, tenta fallback em JSON.
 */
export async function sendToGAS(type, data){
  if(!CONFIG.GAS_URL) return { ok:false, error:'GAS_URL vazia' };

  const payload = { type, data };

  // 1) Tentativa CORS-safe
  try{
    const res = await fetch(CONFIG.GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: toFormPayload(payload),
    });
    const text = await res.text();
    // tenta ler JSON
    let json;
    try { json = JSON.parse(text); } catch { json = null; }
    if(!json || json.ok !== true){
      throw new Error((json && json.error) || 'Resposta não-JSON/sem OK');
    }
    return { ok:true, data: json.data };
  }catch(err1){
    // 2) Fallback em JSON (se permitido; pode preflight)
    try{
      const res = await fetch(CONFIG.GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if(!json.ok) throw new Error(json.error || 'Erro no Apps Script');
      return { ok:true, data: json.data };
    }catch(err2){
      // offline / erro → empilha
      const q = loadQ();
      q.push({ t: Date.now(), payload });
      saveQ(q);
      return { ok:false, queued:true, error:String(err2 || err1) };
    }
  }
}

/** Reenvia tudo que ficou na fila (usar em 'online' e em botões manuais) */
export async function retryQueue(){
  const q = loadQ(); if(!q.length) return;
  const remain = [];
  for(const item of q){
    try{
      const res = await fetch(CONFIG.GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: toFormPayload(item.payload),
      });
      const text = await res.text();
      const json = JSON.parse(text);
      if(!json.ok) throw new Error(json.error || 'Erro no Apps Script');
    }catch(e){
      remain.push(item); // ainda não deu
    }
  }
  saveQ(remain);
}

window.addEventListener('online', ()=> retryQueue());
