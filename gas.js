// gas.js — cliente do Apps Script (compatível com sendToGAS(type, data))
export const CONFIG = {
  GAS_URL: 'https://script.google.com/macros/s/AKfycbztGARPKBSzr45WoWxV078OZ9Vj9CPSRmXQpMqOSEv0KR9DVtE_tf-TpsaqvaOUeqFz/exec'
};

const QKEY = 'syncQueue_v1';
const loadQ = ()=> { try{ return JSON.parse(localStorage.getItem(QKEY)||'[]'); }catch{ return []; } };
const saveQ = (q)=> localStorage.setItem(QKEY, JSON.stringify(q||[]));

export async function sendToGAS(type, data){
  if(!CONFIG.GAS_URL) return { ok:false, error:'GAS_URL vazia' };

  // compat: front usa "type"; backend entende action/type/data
  const payload = { type, data };

  try{
    const res = await fetch(CONFIG.GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if(!json.ok) throw new Error(json.error || 'Erro no Apps Script');
    return { ok:true, data: json.data };
  }catch(err){
    // offline → enfileira p/ retry
    const q = loadQ();
    q.push({ t: Date.now(), payload });
    saveQ(q);
    return { ok:false, queued:true, error:String(err) };
  }
}

export async function retryQueue(){
  const q = loadQ(); if(!q.length) return;
  const remain = [];
  for(const item of q){
    try{
      const r = await fetch(CONFIG.GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
      });
      const j = await r.json();
      if(!j.ok) throw new Error(j.error || 'Erro no Apps Script');
    }catch(e){
      remain.push(item);
    }
  }
  saveQ(remain);
}

window.addEventListener('online', ()=> retryQueue());
