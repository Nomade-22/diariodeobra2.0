// gas.js
export const CONFIG = {
  GAS_URL: 'https://script.google.com/macros/s/AKfycbxOq3uL09Ttdkh6-QF9bcwb95yV3QA-juKywgekFLsEZbCxzV3ifqgaheIquObCz48Z/exec' // troque pela URL do Web App (/exec)
};

async function httpGet(url){
  const r = await fetch(url); const j = await r.json();
  if(!j.ok) throw new Error(j.error||'Erro'); return j.data;
}
async function httpPost(action, data){
  const r = await fetch(CONFIG.GAS_URL, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ action, ...data })
  });
  const j = await r.json(); if(!j.ok) throw new Error(j.error||'Erro'); return j.data;
}

// ping (cria/ajusta as abas)
export async function testarConexao(){ return httpGet(CONFIG.GAS_URL+'?action=ping'); }

// catálogos (para preencher combos da tela)
export async function buscarCatalogos(){ return httpGet(CONFIG.GAS_URL+'?action=list_catalogs'); }

// cadastros
export function salvarFuncionario({id,nome,cargo,ativo='sim'}) {
  return httpPost('upsert_staff', { obj:{id,nome,cargo,ativo} });
}
export function salvarFerramenta({id,nome,codigo,qtd_total=0,obs='',ativo='sim'}) {
  return httpPost('upsert_tool', { obj:{id,nome,codigo,qtd_total,obs,ativo} });
}
export function salvarObra({id,nome,cliente='',cidade='',ativo='sim'}) {
  return httpPost('upsert_work', { obj:{id,nome,cliente,cidade,ativo} });
}

// movimentação
export function confirmarSaida({id,obra,createdBy='',motorista='',equipeArray=[],itensArray=[],kmOut='',timeOut='',obs=''}) {
  const employees = equipeArray; // array de nomes/ids
  const items     = itensArray;  // [{name, code, qtd, cond}]
  return httpPost('saida', { data:{ id, job:obra, createdBy, driver:motorista, employees, items, kmOut, timeOut, obs } });
}
export function confirmarRetorno({out_id,kmIn,timeIn,items=[],notes=''}) {
  return httpPost('retorno', { data:{ out_id, kmIn, timeIn, items, notes } });
}

// financeiro
export function salvarFinanceiroResumo({of_id,obra,contratado,gasto,saldo}) {
  return httpPost('append_lanc', { data:{ of_id, obra, contratado, gasto, saldo } });
}
export function salvarFinanceiroItem({of_id,data,descricao,valor}) {
  return httpPost('append_lanc', { data:{ of_id, data, descricao, valor } });
}
