import { outs } from './state.js';

export function refreshOpenOuts(){
  const sel = document.getElementById('retOpen'); if(!sel) return;
  const open = outs.filter(o=> !o.returnedAt);
  sel.innerHTML = '<option value="">Selecione...</option>' + open.map(o=>{
    const nomes = (o.employees && o.employees.length) ? o.employees.join(', ') : (o.team || '-');
    const ts = (o.timeOut||'').slice(0,16).replace('T',' ');
    return `<option value="${o.id}">${ts} - ${nomes} - ${o.job}</option>`;
  }).join('');
}
