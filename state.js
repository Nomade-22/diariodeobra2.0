export const LS = {
  tools: 'mp_tools',
  teams: 'mp_teams',
  jobs:  'mp_jobs',
  outs:  'mp_outs',
  rets:  'mp_rets',
  user:  'mp_user',
  contracts: 'mp_contracts',
  users: 'mp_users' // ⇐ NOVO
};

function read(k, def){ try{ return JSON.parse(localStorage.getItem(k) || JSON.stringify(def)); }catch{ return def; } }
export function write(k, v){ localStorage.setItem(k, JSON.stringify(v)); }

/* seed inicial de usuários */
const seedUsers = [
  { id:'u1', name:'Jhonatan',  role:'Admin',      pass:'152205' },
  { id:'u2', name:'Emerson',   role:'Supervisor', pass:'121098' },
  { id:'u3', name:'Toni',      role:'Supervisor', pass:'041282' },
];

export let tools = read(LS.tools, []);
export let teams = read(LS.teams, []);
export let jobs  = read(LS.jobs,  []);
export let outs  = read(LS.outs,  []);
export let rets  = read(LS.rets,  []);
export let user  = read(LS.user,  null);
export let contracts = read(LS.contracts, []);
export let users = read(LS.users, seedUsers);

export function setState(part){
  if(part.tools){ tools = part.tools; write(LS.tools, tools); }
  if(part.teams){ teams = part.teams; write(LS.teams, teams); }
  if(part.jobs ){ jobs  = part.jobs;  write(LS.jobs,  jobs ); }
  if(part.outs ){ outs  = part.outs;  write(LS.outs,  outs ); }
  if(part.rets ){ rets  = part.rets;  write(LS.rets,  rets ); }
  if(part.user ){ user  = part.user;  write(LS.user,  user ); }
  if(part.contracts){ contracts = part.contracts; write(LS.contracts, contracts); }
  if(part.users){ users = part.users; write(LS.users, users); }
}