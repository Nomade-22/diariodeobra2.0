// state.js — estado básico + usuários padrão

export const LS = {
  user:  'mp_user',
  tools: 'mp_tools',
  teams: 'mp_teams',
  jobs:  'mp_jobs',
};

export let user = null;

// carrega listas do localStorage (ou vazio)
function load(key, def){
  try{
    const v = JSON.parse(localStorage.getItem(key) || 'null');
    return Array.isArray(def) ? (Array.isArray(v) ? v : def) : (v ?? def);
  }catch{ return def; }
}

export let tools = load(LS.tools, []);  // [{name, code, qty, obs}]
export let teams = load(LS.teams, []);  // ['nome1', 'nome2']
export let jobs  = load(LS.jobs,  []);  // ['obra1', 'obra2']

export function write(key, val){
  localStorage.setItem(key, JSON.stringify(val));
}

export function setState(partial){
  if(partial.hasOwnProperty('user')) user = partial.user;
}

// ===== Usuários do sistema (para auth.js sem depender de outra tela) =====
export const users = [
  { login: 'jhonatan', name: 'Jhonatan reck', role: 'Admin',      pass: '152205' },
  { login: 'emerson',  name: 'Emerson Iuri Rangel Veiga Dias', role: 'Supervisor', pass: '121098' },
  { login: 'toni',     name: 'Toni Anderson de Souza',          role: 'Supervisor', pass: '041282' }
];