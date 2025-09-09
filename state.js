export const LS = {
  tools: 'mp_tools',
  teams: 'mp_teams',
  jobs:  'mp_jobs',
  outs:  'mp_outs',
  rets:  'mp_rets',
  user:  'mp_user',
  contracts: 'mp_contracts'   // NOVO
};

function read(k, def){ try{ return JSON.parse(localStorage.getItem(k) || JSON.stringify(def)); }catch{ return def; } }
function write(k, v){ localStorage.setItem(k, JSON.stringify(v)); }

export let tools = read(LS.tools, []);
export let teams = read(LS.teams, []);
export let jobs  = read(LS.jobs,  []);
export let outs  = read(LS.outs,  []);
export let rets  = read(LS.rets,  []);
export let user  = read(LS.user,  null);

/* NOVO: contratos (financeiro)
   contrato: { id, of, job, value, expenses:[ {id, date, desc, amount} ], createdAt } */
export let contracts = read(LS.contracts, []);

export function setState(part){
  if(part.tools){ tools = part.tools; write(LS.tools, tools); }
  if(part.teams){ teams = part.teams; write(LS.teams, teams); }
  if(part.jobs ){ jobs  = part.jobs;  write(LS.jobs,  jobs ); }
  if(part.outs ){ outs  = part.outs;  write(LS.outs,  outs ); }
  if(part.rets ){ rets  = part.rets;  write(LS.rets,  rets ); }
  if(part.user ){ user  = part.user;  write(LS.user,  user ); }
  if(part.contracts){ contracts = part.contracts; write(LS.contracts, contracts); }
}

export { write, read };
