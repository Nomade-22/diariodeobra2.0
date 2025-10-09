// gas.js
export const CONFIG = {
  GAS_URL: 'https://script.google.com/macros/s/AKfycbwVnR43pkbDsCAzr2RZZtfb3OAdQLV7IJIAd6G-6vBFUGTZyH93Spxl-eS8kDfyedXm/exec'
};

export async function sendToGAS(action, payload = {}) {
  const body = { action, ...payload };
  const res = await fetch(CONFIG.GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  if(!json.ok) throw new Error(json.error || 'Falha no GAS');
  return json.data;
}

// ---- Cadastros ----
export const salvarFerramenta = (row) =>
  sendToGAS('upsert_tool', { obj: {
    id: row.id || undefined,
    nome: row.nome,
    codigo: row.codigo || '',
    qtd_total: Number(row.qtd||0),
    obs: row.obs || '',
    ativo: 'sim'
  }});

export const salvarFuncionario = (row) =>
  sendToGAS('upsert_staff', { obj: {
    id: row.id || undefined,
    nome: row.nome,
    cargo: row.cargo || '',
    ativo: 'sim'
  }});

export const salvarObra = (row) =>
  sendToGAS('upsert_work', { obj: {
    id: row.id || undefined,
    nome: row.nome,          // “Obra/Cliente” que você digitou
    cliente: row.cliente || '',
    cidade: row.cidade || '',
    ativo: 'sim'
  }});

// ---- Carregar catálogos para os supervisores ----
export async function buscarCatalogos() {
  const res = await fetch(CONFIG.GAS_URL + '?action=list_catalogs');
  const json = await res.json();
  if(!json.ok) throw new Error(json.error || 'Erro list_catalogs');

  const funcs = (json.data.Funcionarios||[]).map(r => ({ id:r[0], nome:r[1], cargo:r[2], ativo:r[3] }));
  const ferrs = (json.data.Ferramentas||[]).map(r => ({ id:r[0], codigo:r[1], nome:r[2], qtd_total:r[3], obs:r[4], ativo:r[5] }));
  const obras = (json.data.Obras||[]).map(r => ({ id:r[0], nome:r[1], cliente:r[2], cidade:r[3], ativo:r[4] }));
  return { funcs, ferrs, obras };
}

// ---- Saída ----
export function confirmarSaida({obra, motorista, equipeArray, itensArray, kmOut, timeOut, obs, createdBy, of}) {
  return sendToGAS('saida', {
    data: {
      job: obra, driver: motorista,
      employees: equipeArray,     // array de nomes/ids
      items: itensArray,          // [{name, code, qtd, cond, obs}]
      kmOut, timeOut, obs,
      createdBy, of
    }
  });
}

// ---- Retorno ----
export function confirmarRetorno({out_id, kmIn, timeIn, items, notes}) {
  return sendToGAS('retorno', {
    data: { out_id, kmIn, timeIn, items, notes }
  });
}

// ---- Financeiro ----
export function salvarLancamento(lanc) { // campos devem bater com TABS.Lancamentos
  return sendToGAS('append_lanc', { data: lanc });
}
