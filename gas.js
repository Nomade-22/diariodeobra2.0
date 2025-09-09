// gas.js
import { user } from './estado.js';  // ajustei pro nome que vi na sua pasta

export const CONFIG = {
  GAS_URL: 'https://script.google.com/macros/s/AKfycbyvfs5VHtI2achqgq9etIDF861fLbR3kqW9m6zy73swhYBmtmCgIX-Qx_NKwl-Pdrz2qg/exec' // substitua pela URL /exec do Google
};

const QKEY = 'syncQueue_v1';

function loadQ(){ try{ return JSON.parse(localStorage.getItem(QKEY)||'[]'); }catch{ return []; } }
function saveQ(q){ localStorage.setItem(QKEY, JSON.stringify(q)); }

export async function sendToGAS(type, data){
  if(!CONFIG.GAS_URL || CONFIG.GAS_URL.includes('COLE_AQUI')) {
    console.warn('GAS_URL não configurada; pulando envio.');
    return { ok:false, skip:true };
  }
  const payload = { type, data, user: user?.name || 'desconhecido' };

  try{
    const res = await fetch(CONFIG.GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if(!json.ok) throw new Error(json.error||'erro no GAS');
    return { ok:true };
  }catch(err){
    // offline → empilha
    const q = loadQ();
    q.push({ t: Date.now(), payload });
    saveQ(q);
    return { ok:false, queued:true, error:String(err) };
  }
}

export async function retryQueue(){
  const q = loadQ();
  if(!q.length) return;
  const remain = [];
  for(const item of q){
    try{
      const res = await fetch(CONFIG.GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
      });
      const json = await res.json();
      if(!json.ok) throw new Error(json.error||'erro no GAS');
    }catch(e){
      remain.push(item); // ainda não deu
    }
  }
  saveQ(remain);
}

window.addEventListener('online', ()=> retryQueue());
