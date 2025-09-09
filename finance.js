import { LS, contracts, jobs, user, setState, write } from './state.js';
import { toCSV, downloadCSV } from './exports.js';

// Helpers
const isAdmin = ()=> user && user.role === 'Admin';
const uid = () => Math.random().toString(36).slice(2,10);
const fmtMoney = (n)=> (Number(n)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const sum = (arr, f)=> arr.reduce((a,x)=> a + (Number(f?f(x):x)||0), 0);

// Render principal
export function renderFinance(){
  if(!isAdmin()) return; // segurança extra
  const list = document.getElementById('finList'); if(!list) return;

  const rows = contracts.map(c=>{
    const total = sum(c.expenses||[], e=>e.amount);
    const saldo = (Number(c.value)||0) - total;

    const expensesHTML = (c.expenses||[]).map(e=>`
      <tr>
        <td>${e.date?.slice(0,10) || ''}</td>
        <td>${e.desc||''}</td>
        <td style="text-align:right">${fmtMoney(e.amount)}</td>
        <td style="text-align:right"><button class="btn danger" data-del-exp="${c.id}:${e.id}">Excluir</button></td>
      </tr>
    `).join('') || `<tr><td colspan="4" class="small">Nenhum gasto lançado.</td></tr>`;

    return `
      <div class="card" style="margin-bottom:10px">
        <div style="display:grid;grid-template-columns:140px 1fr 160px 160px 160px 160px;gap:8px;align-items:center">
          <div><b>OF:</b> ${c.of}</div>
          <div><b>Obra:</b> ${c.job}</div>
          <div><b>Contratado:</b> ${fmtMoney(c.value)}</div>
          <div><b>Gasto:</b> ${fmtMoney(total)}</div>
          <div><b>Saldo:</b> ${fmtMoney(saldo)}</div>
          <div style="text-align:right">
            <button class="btn" data-edit="${c.id}">Editar</button>
            <button class="btn danger" data-del="${c.id}">Excluir</button>
          </div>
        </div>

        <div class="card" style="margin-top:8px;background:#0f1833">
          <div style="display:grid;grid-template-columns:130px 1fr 160px 140px;gap:8px;align-items:end;margin-bottom:8px">
            <div>
              <label>Data</label>
              <input type="date" data-exp-date="${c.id}" />
            </div>
            <div>
              <label>Descrição</label>
              <input placeholder="Ex.: diesel, refeição, material..." data-exp-desc="${c.id}" />
            </div>
            <div>
              <label>Valor (R$)</label>
              <input type="number" step="0.01" data-exp-value="${c.id}" />
            </div>
            <div>
              <button class="btn primary" style="width:100%" data-exp-add="${c.id}">Lançar gasto</button>
            </div>
          </div>

          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr class="small" style="color:#9fb3d9">
                <th style="text-align:left;border-bottom:1px solid var(--border);padding:6px 0">Data</th>
                <th style="text-align:left;border-bottom:1px solid var(--border);padding:6px 0">Descrição</th>
                <th style="text-align:right;border-bottom:1px solid var(--border);padding:6px 0">Valor</th>
                <th style="border-bottom:1px solid var(--border)"></th>
              </tr>
            </thead>
            <tbody>${expensesHTML}</tbody>
          </table>
        </div>
      </div>
    `;
  }).join('') || `<div class="small">Nenhum contrato cadastrado.</div>`;

  list.innerHTML = rows;

  // binds de contrato
  list.querySelectorAll('[data-del]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      if(!confirm('Excluir contrato/OF e todos os seus gastos?')) return;
      const id = btn.dataset.del;
      const idx = contracts.findIndex(c=>c.id===id);
      if(idx>=0){ contracts.splice(idx,1); write(LS.contracts, contracts); renderFinance(); }
    });
  });
  list.querySelectorAll('[data-edit]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.dataset.edit;
      const c = contracts.find(x=>x.id===id); if(!c) return;
      const nof = prompt('Número da OF:', c.of); if(!nof) return;
      const nj  = prompt('Obra/Cliente:', c.job) ?? c.job;
      const nv  = prompt('Valor contratado (R$):', c.value) ?? c.value;
      c.of = nof.trim(); c.job = (nj||'').trim(); c.value = Number(nv)||0;
      write(LS.contracts, contracts); renderFinance();
    });
  });

  // binds de despesas
  list.querySelectorAll('[data-exp-add]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.dataset.expAdd;
      const date = (list.querySelector(`[data-exp-date="${id}"]`)?.value)||'';
      const desc = (list.querySelector(`[data-exp-desc="${id}"]`)?.value||'').trim();
      const val  = Number(list.querySelector(`[data-exp-value="${id}"]`)?.value||0);
      if(!val){ alert('Informe um valor.'); return; }
      const c = contracts.find(x=>x.id===id); if(!c) return;
      c.expenses = c.expenses || [];
      c.expenses.unshift({ id:uid(), date: date||new Date().toISOString().slice(0,10), desc, amount: val });
      write(LS.contracts, contracts); renderFinance();
    });
  });
  list.querySelectorAll('[data-del-exp]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const [cid,eid] = btn.dataset.delExp.split(':');
      const c = contracts.find(x=>x.id===cid); if(!c) return;
      const idx = (c.expenses||[]).findIndex(e=>e.id===eid);
      if(idx>=0){ c.expenses.splice(idx,1); write(LS.contracts, contracts); renderFinance(); }
    });
  });
}

// Bind do topo (add + export)
export function bindFinanceTop(){
  if(!isAdmin()) return;
  const jobSel = document.getElementById('finJob');
  if(jobSel){ jobSel.innerHTML = jobs.map(j=>`<option value="${j}">${j}</option>`).join(''); }

  const addBtn = document.getElementById('finAdd');
  if(addBtn){
    addBtn.addEventListener('click', ()=>{
      const of  = (document.getElementById('finOf').value||'').trim();
      const job = document.getElementById('finJob').value||'';
      const val = Number(document.getElementById('finValue').value||0);
      if(!of || !job || !val){ alert('Preencha Nº OF, Obra e Valor.'); return; }
      contracts.unshift({ id:uid(), of, job, value: val, expenses: [], createdAt: new Date().toISOString() });
      write(LS.contracts, contracts);
      document.getElementById('finOf').value='';
      document.getElementById('finValue').value='';
      renderFinance();
    });
  }

  const expBtn = document.getElementById('finExport');
  if(expBtn){
    expBtn.addEventListener('click', ()=>{
      const rows = [];
      contracts.forEach(c=>{
        const gasto = sum(c.expenses||[], e=>e.amount);
        rows.push({ tipo:'contrato', of:c.of, obra:c.job, contratado:c.value, gasto, saldo:(Number(c.value)||0)-gasto });
        (c.expenses||[]).forEach(e=>{
          rows.push({ tipo:'gasto', of:c.of, data:e.date, descricao:e.desc, valor:e.amount });
        });
      });
      downloadCSV('financeiro', rows);
    });
  }
}
