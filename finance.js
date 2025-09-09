import { LS, contracts, jobs, user, write } from './state.js';

const isAdmin = ()=> user && user.role === 'Admin';
const uid = () => Math.random().toString(36).slice(2,10);
const fmtMoney = (n)=> (Number(n)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const sum = (arr, f)=> arr.reduce((a,x)=> a + (Number(f?f(x):x)||0), 0);

/* ====== helpers de PDF (abre janela e chama print) ====== */
function openPDF(title, html){
  const w = window.open('', '_blank');
  if(!w){ alert('Liberar pop-ups para exportar PDF.'); return; }
  w.document.write(`
    <html><head><title>${title}</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;padding:16px}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #999;padding:6px 8px;font-size:12px}
        th{background:#eee}
        h1{font-size:18px;margin:0 0 10px}
        .right{text-align:right}
      </style>
    </head><body>
      ${html}
      <script>window.onload=()=>window.print()</script>
    </body></html>
  `);
  w.document.close();
}

/* ====== Render ====== */
export function renderFinance(){
  if(!isAdmin()) return;
  const host = document.getElementById('finList'); if(!host) return;

  const rows = contracts.map(c=>{
    const total = sum(c.expenses||[], e=>e.amount);
    const saldo = (Number(c.value)||0) - total;

    const expensesHTML = (c.expenses||[]).map(e=>`
      <tr>
        <td>${e.date?.slice(0,10) || ''}</td>
        <td>${e.desc||''}</td>
        <td class="right">${fmtMoney(e.amount)}</td>
        <td class="right"><button class="btn danger" data-del-exp="${c.id}:${e.id}">Excluir</button></td>
      </tr>
    `).join('') || `<tr><td colspan="4" class="small">Nenhum gasto lançado.</td></tr>`;

    return `
      <div class="card mb8">
        <div style="display:grid;grid-template-columns:120px 1fr 140px 140px 140px 160px;gap:8px;align-items:center">
          <div><b>OF:</b> ${c.of}</div>
          <div><b>Obra:</b> ${c.job}</div>
          <div><b>Contratado:</b> ${fmtMoney(c.value)}</div>
          <div><b>Gasto:</b> ${fmtMoney(total)}</div>
          <div><b>Saldo:</b> ${fmtMoney(saldo)}</div>
          <div class="right">
            <button class="btn" data-edit="${c.id}">Editar</button>
            <button class="btn danger" data-del="${c.id}">Excluir</button>
          </div>
        </div>

        <div class="card" style="margin-top:8px;background:#0f1833">
          <div class="row finrow">
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
            <div class="alignEnd">
              <button class="btn primary w100" data-exp-add="${c.id}">Lançar gasto</button>
            </div>
          </div>

          <table>
            <thead>
              <tr class="small" style="color:#333;background:#dfe7ff">
                <th>Data</th><th>Descrição</th><th class="right">Valor</th><th></th>
              </tr>
            </thead>
            <tbody>${expensesHTML}</tbody>
          </table>
        </div>
      </div>
    `;
  }).join('') || `<div class="small">Nenhum contrato cadastrado.</div>`;

  host.innerHTML = rows;

  // binds contratos
  host.querySelectorAll('[data-del]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      if(!confirm('Excluir contrato/OF e todos os seus gastos?')) return;
      const id = btn.dataset.del;
      const idx = contracts.findIndex(c=>c.id===id);
      if(idx>=0){ contracts.splice(idx,1); write(LS.contracts, contracts); renderFinance(); }
    });
  });
  host.querySelectorAll('[data-edit]').forEach(btn=>{
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

  // binds despesas
  host.querySelectorAll('[data-exp-add]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.dataset.expAdd;
      const date = (host.querySelector(`[data-exp-date="${id}"]`)?.value)||'';
      const desc = (host.querySelector(`[data-exp-desc="${id}"]`)?.value||'').trim();
      const val  = Number(host.querySelector(`[data-exp-value="${id}"]`)?.value||0);
      if(!val){ alert('Informe um valor.'); return; }
      const c = contracts.find(x=>x.id===id); if(!c) return;
      c.expenses = c.expenses || [];
      c.expenses.unshift({ id:uid(), date: date||new Date().toISOString().slice(0,10), desc, amount: val });
      write(LS.contracts, contracts); renderFinance();
    });
  });
  host.querySelectorAll('[data-del-exp]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const [cid,eid] = btn.dataset.delExp.split(':');
      const c = contracts.find(x=>x.id===cid); if(!c) return;
      const idx = (c.expenses||[]).findIndex(e=>e.id===eid);
      if(idx>=0){ c.expenses.splice(idx,1); write(LS.contracts, contracts); renderFinance(); }
    });
  });
}

/* ====== Topo (preenche Obra e botão Adicionar + Export PDF) ====== */
export function bindFinanceTop(){
  if(!isAdmin()) return;

  const jobSel = document.getElementById('finJob');
  if(jobSel){
    jobSel.innerHTML = jobs.map(j=>`<option value="${j}">${j}</option>`).join('');
  }

  const addBtn = document.getElementById('finAdd');
  if(addBtn && !addBtn.dataset.bound){
    addBtn.dataset.bound = '1';
    addBtn.addEventListener('click', ()=>{
      const of  = (document.getElementById('finOf').value||'').trim();
      const job = (document.getElementById('finJob').value||'').trim();
      const val = Number(document.getElementById('finValue').value||0);
      if(!of || !job || !val){ alert('Preencha Nº OF, Obra e Valor.'); return; }
      contracts.unshift({ id:uid(), of, job, value: val, expenses: [], createdAt: new Date().toISOString() });
      write(LS.contracts, contracts);
      document.getElementById('finOf').value='';
      document.getElementById('finValue').value='';
      renderFinance();
    });
  }

  const expBtn = document.getElementById('finExportPDF');
  if(expBtn && !expBtn.dataset.bound){
    expBtn.dataset.bound = '1';
    expBtn.addEventListener('click', ()=>{
      const rows = contracts.map(c=>{
        const gasto = sum(c.expenses||[], e=>e.amount);
        const saldo = (Number(c.value)||0) - gasto;
        return `<tr><td>${c.of}</td><td>${c.job}</td><td class="right">${fmtMoney(c.value)}</td><td class="right">${fmtMoney(gasto)}</td><td class="right">${fmtMoney(saldo)}</td></tr>`;
      }).join('') || '<tr><td colspan="5">Sem contratos</td></tr>';

      const html = `
        <h1>Relatório Financeiro</h1>
        <table>
          <thead><tr><th>OF</th><th>Obra/Cliente</th><th>Contratado</th><th>Gasto</th><th>Saldo</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      `;
      openPDF('Financeiro', html);
    });
  }
}