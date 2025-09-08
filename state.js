import { LS, read } from './storage.js';

export let tools = read(LS.tools, []);
export let teams = read(LS.teams, ["Equipe 1","Equipe 2"]);
export let jobs  = read(LS.jobs,  ["JBS","BRF","Obra Interna"]);
export let outs  = read(LS.outs,  []);
export let rets  = read(LS.rets,  []);
export let user  = read(LS.user,  null);

// Atualiza variáveis exportadas (sem usar 'exports')
export function setState(part = {}) {
  if ('tools' in part) tools = part.tools;
  if ('teams' in part) teams = part.teams;
  if ('jobs'  in part) jobs  = part.jobs;
  if ('outs'  in part) outs  = part.outs;
  if ('rets'  in part) rets  = part.rets;
  if ('user'  in part) user  = part.user;
}
