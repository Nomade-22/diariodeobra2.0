export const esc = (v)=>{ if(v==null) return ''; const s=String(v).replaceAll('"','""'); return '"'+s+'"' };
export const toCSV = (rows)=> rows.length? [Object.keys(rows[0]).map(esc).join(',')].concat(rows.map(r=>Object.keys(rows[0]).map(h=>esc(r[h])).join(','))).join('\n'):'';
export const downloadCSV=(name,rows)=>{ const csv=toCSV(rows); const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name+'_'+new Date().toISOString().slice(0,19).replaceAll(':','-')+'.csv'; a.click(); };

// -------- XML --------
function xmlEscape(s){ return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/\'/g,'&apos;'); }

export function buildXML(outs, rets){
  const x = [];
  x.push('<?xml version="1.0" encoding="UTF-8"?>');
  x.push('<diarios>');
  // Saídas
  outs.forEach(o=>{
    x.push(`  <saida id="${xmlEscape(o.id)}">`);
    x.push(`    <equipe>${xmlEscape(o.team)}</equipe>`);
    x.push(`    <motorista>${xmlEscape(o.driver)}</motorista>`);
    x.push(`    <obra>${xmlEscape(o.job)}</obra>`);
    x.push(`    <veiculo>${xmlEscape(o.vehicle)}</veiculo>`);
    x.push(`    <km_saida>${xmlEscape(o.kmStart)}</km_saida>`);
    x.push(`    <hora_saida>${xmlEscape(o.timeOut)}</hora_saida>`);
    x.push(`    <obs_saida>${xmlEscape(o.obs)}</obs_saida>`);
    if(o.createdBy){ x.push(`    <criado_por nome="${xmlEscape(o.createdBy.name)}" id="${xmlEscape(o.createdBy.id)}" role="${xmlEscape(o.createdBy.role)}"/>`); }
    x.push(`    <ferramentas>`);
    (o.tools||[]).forEach(t=>{
      x.push(`      <item>`);
      x.push(`        <nome>${xmlEscape(t.name)}</nome>`);
      x.push(`        <codigo>${xmlEscape(t.code)}</codigo>`);
      x.push(`        <quantidade>${xmlEscape(t.qty)}</quantidade>`);
      x.push(`      </item>`);
    });
    x.push(`    </ferramentas>`);
    x.push(`  </saida>`);
  });
  // Retornos
  rets.forEach(r=>{
    x.push(`  <retorno id="${xmlEscape(r.id)}">`);
    x.push(`    <hora_retorno>${xmlEscape(r.timeIn)}</hora_retorno>`);
    x.push(`    <km_retorno>${xmlEscape(r.kmEnd)}</km_retorno>`);
    x.push(`    <obs_retorno>${xmlEscape(r.notes)}</obs_retorno>`);
    if(r.closedBy){ x.push(`    <fechado_por nome="${xmlEscape(r.closedBy.name)}" id="${xmlEscape(r.closedBy.id)}" role="${xmlEscape(r.closedBy.role)}"/>`); }
    x.push(`    <checklist>`);
    (r.checklist||[]).forEach(i=>{
      x.push(`      <item>`);
      x.push(`        <nome>${xmlEscape(i.name)}</nome>`);
      x.push(`        <codigo>${xmlEscape(i.code)}</codigo>`);
      x.push(`        <quantidade>${xmlEscape(i.qty)}</quantidade>`);
      x.push(`        <status>${xmlEscape(i.status)}</status>`);
      x.push(`        <condicao>${xmlEscape(i.condition)}</condicao>`);
      x.push(`        <obs_item>${xmlEscape(i.notes)}</obs_item>`);
      x.push(`      </item>`);
    });
    x.push(`    </checklist>`);
    x.push(`  </retorno>`);
  });
  x.push('</diarios>');
  return x.join('\n');
}

export function downloadXML(name, outs, rets){
  const xml = buildXML(outs, rets);
  const blob=new Blob([xml],{type:'application/xml;charset=utf-8;'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name+'_'+new Date().toISOString().slice(0,19).replaceAll(':','-')+'.xml'; a.click();
}
