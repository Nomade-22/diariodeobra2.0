// gas.js (compat: mantém sendToGAS(type, data) e retryQueue)
// Converte "type" legado → "action" do backend e envia para o /exec.
// Mantém fila offline (retryQueue) e não exige mudanças no resto do site.

import { user } from './estado.js';

export const CONFIG = {
  GAS_URL: 'https://script.google.com/macros/s/AKfycbztGARPKBSzr45WoWxV078OZ9Vj9CPSRmXQpMqOSEv0KR9DVtE_tf-TpsaqvaOUeqFz/exec'
};

const QKEY = 'syncQueue_v1';

function loadQ(){ try{ return JSON.parse(localStorage.getItem(QKEY)||'[]'); }catch{ return []; } }
function saveQ(q){ localStorage.setItem(QKEY, JSON.stringify(q)); }

// Mapeia os "type" usados no front para o contrato do backend (action + payload)
function mapTypeToPayload(type, data) {
  switch (type) {
    // Catálogos
    case 'upsert_tool':      return { action: 'upsert_tool',    obj: data };
    case 'upsert_staff':     return { action: 'upsert_staff',   obj: data };
    case 'upsert_work':      return { action: 'upsert_work',    obj: data };
    case 'upsert_vehicle':   return { action: 'upsert_vehicle', obj: data };

    // Saídas / Retornos
    case 'create_saida':     return { action: 'create_saida',   saida:   data };
    case 'remove_saida':     return { action: 'remove_saida',   id:      data?.id ?? data };
    case 'apply_return':     return { action: 'apply_return',   retorno: data };

    // Financeiro (CSV 9 colunas)
    case 'append_lanc':      return { action: 'append_lanc',    lanc:    data };

    // Utilidades
    case 'seed_minimo':      return { action: 'seed_minimo' };

    // Leituras comuns (se você estiver usando via POST)
    case 'list_open':        return { action: 'list_open' };
    case 'list_hist':        return { action: 'list_hist' };
    case 'list_catalogs':    return { action: 'list_catalogs' };
    case 'list_lanc':        return { action: 'list_lanc' };
    case 'load_all':         return { action: 'load_all' };
    case 'ping':             return { action: 'ping' };

    default:
      // fallback: envia como action = type e mescla data (para não quebrar nada legado)
      if (data && typeof data === 'object') return { action: type, ...data };
      return { action: type, value: data };
  }
}

export async function sendToGAS(type, data){
  if(!CONFIG.GAS_URL || CONFIG.GAS_URL.includes('COLE_AQUI')) {
    console.warn('GAS_URL não configurada; pulando envio.');
    return { ok:false, skip:true };
  }

  // monta payload compatível com o backend
  const mapped = mapTypeToPayload(type, data);
  // anexa usuário (só informativo; backend ignora se não usar)
  const payload = { ...mapped, _user: user?.name || 'desconhecido' };

  try{
    const res = await fetch(CONFIG.GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(()=>({}));
    if(!json?.ok) throw new Error(json?.error || 'erro no GAS');
    return { ok:true, data: json.data };
  }catch(err){
    // offline ou falha → empilha e mantém comportamento atual
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
      const json = await res.json().catch(()=>({}));
      if(!json?.ok) throw new Error(json?.error || 'erro no GAS');
    }catch(e){
      remain.push(item); // ainda não deu
    }
  }
  saveQ(remain);
}

window.addEventListener('online', ()=> retryQueue());
