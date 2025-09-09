import { outs, rets, contracts, user } from './state.js';

const isAdmin = ()=> user && user.role==='Admin';
const fmtMoney = (n)=> (Number(n)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

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
        th,td{border:1px solid #999;padding:6px 8px;font-size:12px;vertical-align:top}
        th{background:#eee}
        .right{text-align:right}
        .small{color:#666;font-size:11px}
      </style>
    </head><body>
      ${html}
      <script>window.onload=()=>window.print()</script>
    </body></html>
  `);
  w.document.close();
}

/* Excel: HTML “compatível” com Excel (.xls) */
function downloadExcel(filename, htmlTable){
  const blob = new Blob(
    [`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"></head><body>${htmlTable}</body></html>`],
    { type: 'application/vnd.ms-excel' }
  );
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename.endsWith('.xls')? filename : `${filename}.xls`;
  document.body.appendChild(a); a.click(); a.remove();
}

function tableSaidas(){
  const rows = outs.map(o=>{
    const emps = (o.employees||[]).join(', ');
    const tools = (o.tools||[]).map(t=>`${t.name} (cod:${t.code||'-'}) x${t.take||0}`).join('; ');
    return `<tr>
      <td>${new Date(o.timeOut).toLocaleString('pt-BR')}</td>
      <td>${o.job||''}</td>
      <td>${emps}</td>
      <td>${o.driver||''}</td>
      <td>${o.vehicle||''}</td>
      <td>${o.kmOut||''}</td>
      <td>${tools}</td>
      <td>${o.obs||''}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="8">Sem saídas</td></tr>';

  const head = '<tr><th>Data/Hora</th><th>Obra</th><th>Funcionários</th><th>Motorista</th><th>Veículo</th><th>KM Saída</th><th>Ferramentas</th><th>Observações</th></tr>';
  return `<table><thead>${head}</thead><tbody>${rows}</tbody></table>`;
}

function tableRetornos(){
  const rows = rets.map(r=>{
    const tools = (r.tools||[]).map(t=>`${t.name}: ${t.status||'-'}`).join('; ');
    return `<tr>
      <td>${new Date(r.timeIn||r.createdAt).toLocaleString('pt-BR')}</td>
      <td>${r.kmIn||''}</td>
      <td>${tools}</td>
      <td>${r.notes||''}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="4">Sem retornos</td></tr>';

  const head = '<tr><th>Data/Hora</th><th>KM Retorno</th><th>Ferramentas (status)</th><th>Observações</th></tr>';
  return `<table><thead>${head}</thead><tbody>${rows}</tbody></table>`;
}

function tableFinanceiro(){
  const rows = contracts.map(c=>{
    const gasto = (c.expenses||[]).reduce((a,x)=>a+(Number(x.amount)||0),0);
    const saldo = (Number(c.value)||0)-gasto;
    const det = (c.expenses||[]).map(e=>`${e.date||''} • ${e.desc||''}: ${fmtMoney(e.amount)}`).join('<br>');
    return `<tr>
      <td>${c.of}</td><td>${c.job}</td><td class="right">${fmtMoney(c.value)}</td>
      <td class="right">${fmtMoney(gasto)}</td><td class="right">${fmtMoney(saldo)}</td>
      <td>${det||'<span class="small">Sem gastos</span>'}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="6">Sem contratos</td></tr>';

  const head = '<tr><th>OF</th><th>Obra</th><th>Contratado</th><th>Gasto</th><th>Saldo</th><th>Detalhes dos gastos</th></tr>';
  return `<table><thead>${head}</thead><tbody>${rows}</tbody></table>`;
}

export function bindExports(){
  const btnPDF = document.getElementById('btnExportPDF');
  const btnXLS = document.getElementById('btnExportXLS');

  if(btnPDF && !btnPDF.dataset.bound){
    btnPDF.dataset.bound='1';
    btnPDF.addEventListener('click', ()=>{
      if(!isAdmin()) return alert('Apenas Admin pode exportar.');
      const html = `
        <h1>Relatório Geral</h1>
        <h2>Saídas</h2>${tableSaidas()}
        <h2>Retornos</h2>${tableRetornos()}
        <h2>Financeiro</h2>${tableFinanceiro()}
      `;
      openPDF('Relatorio_Geral', html);
    });
  }

  if(btnXLS && !btnXLS.dataset.bound){
    btnXLS.dataset.bound='1';
    btnXLS.addEventListener('click', ()=>{
      if(!isAdmin()) return alert('Apenas Admin pode exportar.');
      const html = `
        <h1>Relatório Geral</h1>
        <h2>Saídas</h2>${tableSaidas()}
        <h2>Retornos</h2>${tableRetornos()}
        <h2>Financeiro</h2>${tableFinanceiro()}
      `;
      downloadExcel('Relatorio_Geral', html);
    });
  }
}