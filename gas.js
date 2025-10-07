// gas.js — cliente do Apps Script (CORS-safe: x-www-form-urlencoded)
export const CONFIG = {
  GAS_URL: 'https://script.google.com/macros/s/AKfycbzCyPtzsN9c66qUH1hNxW75UDu9jvTl7R154z6IsKVSPXlg8VVXBGpKc9VQw1K7b1Q3/exec'
};

const QKEY = 'syncQueue_v1';
const loadQ = ()=> { try{ return JSON.parse(localStorage.getItem(QKEY)||'[]'); }catch{ return []; } };
const saveQ = (q)=> localStorage.setItem(QKEY, JSON.stringify(q||[]));
const toForm = (obj)=>{ const p = new URLSearchParams(); p.set('json', JSON.stringify(obj)); return p; };

export async function sendToGAS(type, data){
  const payload = { type, data };
  try{
    const r = await fetch(CONFIG.GAS_URL, {
      method:'POST',
      headers:{ 'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8' },
      body: toForm(payload),
    });
    const txt = await r.text(); let j=null; try{ j=JSON.parse(txt); }catch{}
    if(!j || j.ok!==true) throw new Error((j && j.error) || 'Resposta inválida');
    return { ok:true, data:j.data };
  }catch(err){
    const q = loadQ(); q.push({ t:Date.now(), payload }); saveQ(q);
    return { ok:false, queued:true, error:String(err) };
  }
}

export async function retryQueue(){
  const q = loadQ(); if(!q.length) return;
  const remain=[];
  for(const it of q){
    try{
      const r = await fetch(CONFIG.GAS_URL, {
        method:'POST',
        headers:{ 'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8' },
        body: toForm(it.payload)
      });
      const j = JSON.parse(await r.text()); if(!j.ok) throw new Error(j.error||'Erro');
    }catch(e){ remain.push(it); }
  }
  saveQ(remain);
}

window.addEventListener('online', ()=> retryQueue());
