import { write, LS, uid } from './storage.js';
import { tools, outs, user } from './state.js';
import { updateSelCount } from './ui.js';

export function bindCheckout(context){
  const btn = document.getElementById('btnCheckout');
  if(!btn) return;
  btn.addEventListener('click', ()=>{
    // coleta múltiplos funcionários do select
    const sel = document.getElementById('outTeam');
    const employees = Array.from(sel?.options || []).filter(o=>o.selected).map(o=>o.value);
    const job  = document.getElementById('outJobsite').value;
    const driver = document.getElementById('outDriver').value;
    const vehicle= document.getElementById('outVehicle').value;
    const km = document.getElementById('outKm').value;
    const timeOut = new Date(document.getElementById('outTime').value).toISOString();
    const obs = document.getElementById('outObs').value;

    if(!employees.length || !job){ alert('Informe ao menos um Funcionário e a Obra/Cliente'); return; }
    if(!user){ alert('Você precisa estar logado.'); return; }

    const selected = Object.entries(context.pickState).filter(([,v])=>v.checked).map(([tid,v])=>{
      const t=tools.find(x=>x.id===tid);
      return { id:uid(), toolId:tid, name:t?.name||'', code:t?.code||'', qty: v.take, obs:t?.obs||'' }
    });
    if(selected.length===0){
      if(!confirm('Nenhuma ferramenta selecionada. Confirmar saída mesmo assim?')) return;
    }

    const rec = {
      id:uid(),
      // novo: array de funcionários
      employees,
      // retrocompatibilidade: mantém "team" com a primeira posição
      team: employees[0] || '',
      driver, job, vehicle, kmStart:km, timeOut, obs,
      photos: context.outPhotos.slice(),
      tools: selected,
      createdAt: new Date().toISOString(),
      createdBy: { name:user.name, id:user.id, role:user.role }
    };
    outs.unshift(rec); write(LS.outs, outs);

    context.currentReturn = {
      id:rec.id, timeIn:new Date().toISOString(), kmEnd:'', notes:'',
      photos:[],
      checklist: selected.map(i=>({ ...i, status:'voltou', condition:'ok', notes:'' })),
      createdBy: { name:user.name, id:user.id, role:user.role }
    };

    alert('Saída registrada!');
    context.outPhotos.length = 0; const pc=document.getElementById('outPhotoCount'); if(pc) pc.textContent='Nenhuma foto';
    document.getElementById('outDriver').value='';
    document.getElementById('outVehicle').value='';
    document.getElementById('outKm').value='';
    document.getElementById('outObs').value='';
    document.getElementById('outTime').value=new Date().toISOString().slice(0,16);
    context.pickState = {}; updateSelCount(context.pickState);
    context.refreshOpenOuts(); context.renderPicker();
  });
}
