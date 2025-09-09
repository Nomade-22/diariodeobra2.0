import { outs, rets, contracts, user } from './state.js';

const isAdmin = ()=> user && user.role==='Admin';
const fmtMoney = (n)=> (Number(n)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

/* ========= Helpers de impressão ========= */
function openPDF(title, html){
  const w = window.open('', '_blank');
  if(!w){ alert('Liberar pop-ups para exportar PDF.'); return; }
  w.document.write(`
    <html><head><title>${title}</title>
      <meta charset="utf-8">
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

/* Excel simples via HTML compatível */
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

/* ========= Normalização dos dados ========= */
function listSaidas(){
  return outs.map(o=>{
    const emps = (o.employees||[]).join(', ');
    const tools = (o.tools||o.items||[]).map(t=>{
      const name = t.name || t.tool || '-';
      const code = t.code || t.cod || '-';
      const take = t.take ?? t.qty ?? 0;
      return `${name} (cod:${code}) x${take}`;
    }).join('; ');
    return {
      time: o.timeOut,
      job: o.job || '',
      employees: emps,
      driver: o.driver || '',
      vehicle: o.vehicle || '',
      kmOut: o.kmOut || o.km || '',
      tools,
      obs: o.obs || o.notes || ''
    };
  });
}

function extractReturnFromAny(x){
  // aceita formatos variados (return | ret | checkin)
  const r = x?.return ?? x?.ret ?? x?.checkin ?? null;
  if(!r) return null;
  return {
    time: r.timeIn || r.time || r.createdAt,
    kmIn: r.kmIn || r.km || '',
    notes: r.notes || r.obs || '',
    tools: (r.tools||r.items||r.checklist||[]).map(t=>{
      const name = t.name || t.tool || '-';
      const st = t.status || t.state || (t.back ? 'OK' : 'Faltou');
      return `${name}: ${st}`;
    }).join('; ')
  };
}

function listRetornos(){
  const rows = [];

  // 1) retornos salvos no array rets
  (rets||[]).forEach(r=>{
    rows.push({
      time: r.timeIn || r.time || r.createdAt,
      kmIn: r.kmIn || r.km || '',
      notes: r.notes || r.obs || '',
      tools: (r.tools||r.items||r.checklist||[]).map(t=>{
        const name = t.name || t.tool || '-';
        const st = t.status || t.state || (t.back ? 'OK' : 'Faltou');
        return `${name}: ${st}`;
      }).join('; ')
    });
  });

  // 2) retornos aninhados dentro de cada saída
  (outs||[]).forEach(o=>{
    const r = extractReturnFromAny(o);
    if(r) rows.push(r);
  });

  // ordena por data crescente
  rows.sort((a,b)=> new Date(a.time||0) - new Date(b.time||0));
  return rows;
}

function listFinanceiro(){
  return (contracts||[]).map(c=>{
    const gasto = (c.expenses||[]).reduce((a,x)=>a+(Number(x.amount)||0),0);
    const saldo = (Number(c.value)||0)-gasto;
    const det = (c.expenses||[]).map(e=>`${e.date||''} • ${e.desc||''}: ${fmtMoney(e.amount)}`).join('<br>');
    return { of:c.of, job:c.job, contratado:c.value, gasto, saldo, detalhes: det };
  });
}

/* ========= Tabelas HTML ========= */
function tableSaidasHTML(){
  const rows = listSaidas().map(o=>`
    <tr>
      <td>${o.time ? new Date(o.time).toLocaleString('pt-BR') : ''}</td>
      <td>${o.job}</td>
      <td>${o.employees}</td>
      <td>${o.driver}</td>
      <td>${o.vehicle}</td>
      <td>${o.kmOut}</td>
      <td>${o.tools}</td>
      <td>${o.obs}</td>
    </tr>
  `).join('') || '<tr><td colspan="8">Sem saídas</td></tr>';

  const head = '<tr><th>Data/Hora</th><th>Obra</th><th>Funcionários</th><th>Motorista</th><th>Veículo</th><th>KM Saída</th><th>Ferramentas</th><th>Observações</th></tr>';
  return `<table><thead>${head}</thead><tbody>${rows}</tbody></table>`;
}

function tableRetornosHTML(){
  const rows = listRetornos().map(r=>`
    <tr>
      <td>${r.time ? new Date(r.time).toLocaleString('pt-BR') : ''}</td>
      <td>${r.kmIn}</td>
      <td>${r.tools}</td>
      <td>${r.notes}</td>
    </tr>
  `).join('') || '<tr><td colspan="4">Sem retornos</td></tr>';

  const head = '<tr><th>Data/Hora</th><th>KM Retorno</th><th>Ferramentas (status)</th><th>Observações</th></tr>';
  return `<table><thead>${head}</thead><tbody>${rows}</tbody></table>`;
}

function tableFinanceiroHTML(){
  const rows = listFinanceiro().map(c=>`
    <tr>
      <td>${c.of}</td><td>${c.job}</td><td class="right">${fmtMoney(c.contratado)}</td>
      <td class="right">${fmtMoney(c.gasto)}</td><td class="right">${fmtMoney(c.saldo)}</td>
      <td>${c.detalhes || '<span class="small">Sem gastos</span>'}</td>
    </tr>
  `).join('') || '<tr><td colspan="6">Sem contratos</td></tr>';

  const head = '<tr><th>OF</th><th>Obra</th><th>Contratado</th><th>Gasto</th><th>Saldo</th><th>Detalhes dos gastos</th></tr>';
  return `<table><thead>${head}</thead><tbody>${rows}</tbody></table>`;
}

/* ========= Bind ========= */
export function bindExports(){
  const btnPDF = document.getElementById('btnExportPDF');
  const btnXLS = document.getElementById('btnExportXLS');

  if(btnPDF && !btnPDF.dataset.bound){
    btnPDF.dataset.bound='1';
    btnPDF.addEventListener('click', ()=>{
      if(!isAdmin()) return alert('Apenas Admin pode exportar.');
      const html = `
        <h1>Relatório Geral</h1>
        <h2>Saídas</h2>${tableSaidasHTML()}
        <h2>Retornos</h2>${tableRetornosHTML()}
        <h2>Financeiro</h2>${tableFinanceiroHTML()}
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
        <h2>Saídas</h2>${tableSaidasHTML()}
        <h2>Retornos</h2>${tableRetornosHTML()}
        <h2>Financeiro</h2>${tableFinanceiroHTML()}
      `;
      downloadExcel('Relatorio_Geral', html);
    });
  }
}