// state.js — estado básico + usuários padrão

export const LS = {
  user:  'mp_user',
  tools: 'mp_tools',
  teams: 'mp_teams',
  jobs:  'mp_jobs',
};

export let user = null;

function load(key, def){
  try{
    const v = JSON.parse(localStorage.getItem(key) || 'null');
    return Array.isArray(def) ? (Array.isArray(v) ? v : def) : (v ?? def);
  }catch{ return def; }
}

export let tools = load(LS.tools, []);
export let teams = load(LS.teams, []);
export let jobs  = load(LS.jobs,  []);

export function write(key, val){
  localStorage.setItem(key, JSON.stringify(val));
}

export function setState(partial){
  if(Object.prototype.hasOwnProperty.call(partial,'user')) user = partial.user;
}

// Usuários do sistema (para o auth.js)
export const users = [
  { login:'jhonatan', name:'Jhonatan reck', role:'Admin',      pass:'152205' },
  { login:'emerson',  name:'Emerson Iuri Rangel Veiga Dias', role:'Supervisor', pass:'121098' },
  { login:'toni',     name:'Toni Anderson de Souza',          role:'Supervisor', pass:'041282' },
];