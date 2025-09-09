import { outs, rets, contracts } from './state.js';

function fmt(n){ return (Number(n)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function openPDF(title, html){
  const w = window.open('', '_blank');
  if(!w){ alert('Liberar pop-ups para exportar PDF.'); return; }
  w.document.write(`
    <html><head><title>${title}</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;padding:16px}
        h1{font-size:18px;margin:0 0 10px}
        h2{font-size:15px;margin:14px 0 6px}
        table{width:100%;border-collapse:collapse;margin-bottom:10px}
        th,td{border:1px solid #999;padding:6px 8px;font-size:12px}
        th{background:#eee}
        .right{text-align:right}
      </style>
    </head><body>
      ${html}
      <script>window.onload=()=>window.print()</script>
    </body></html>
  `);
  w.document.close();
}

export function bindExports(){
  const btn = document.getElementById('btnExportPDF');
  if(!btn || btn.dataset.bound) return;
  btn.dataset.bound = '1';

  btn.addEventListener('click', ()=>{
    const outRows = outs.map(o=>{
      const team = (o.employees||[]).join(', ');
      return `<tr><td>${new Date(o.timeOut).toLocaleString('pt-BR')}</td><td>${o.job||''}</td><td>${team}</td></tr>`;
    }).join('') || '<tr><td colspan="3">Sem saídas</td></tr>';

    const retRows = rets.map(r=>{
      return `<tr><td>${new Date(r.timeIn||r.createdAt).toLocaleString('pt-BR')}</td><td>${r.notes||''}</td></tr>`;
    }).join('') || '<tr><td colspan="2">Sem retornos</td></tr>';

    const finRows = contracts.map(c=>{
      const gasto = (c.expenses||[]).reduce((a,x)=>a+(Number(x.amount)||0),0);
      const saldo = (Number(c.value)||0)-gasto;
      return `<tr><td>${c.of}</td><td>${c.job}</td><td class="right">${fmt(c.value)}</td><td class="right">${fmt(gasto)}</td><td class="right">${fmt(saldo)}</td></tr>`;
    }).join('') || '<tr><td colspan="5">Sem contratos</td></tr>';

    const html = `
      <h1>Relatório Geral</h1>

      <h2>Saídas</h2>
      <table><thead><tr><th>Data/Hora</th><th>Obra</th><th>Funcionários</th></tr></thead><tbody>${outRows}</tbody></table>

      <h2>Retornos</h2>
      <table><thead><tr><th>Data/Hora</th><th>Observações</th></tr></thead><tbody>${retRows}</tbody></table>

      <h2>Financeiro</h2>
      <table><thead><tr><th>OF</th><th>Obra</th><th>Contratado</th><th>Gasto</th><th>Saldo</th></tr></thead><tbody>${finRows}</tbody></table>
    `;
    openPDF('Relatorio_Geral', html);
  });
}