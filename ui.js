import { tools, teams, jobs, user } from './state.js';
import { write, LS, uid } from './storage.js';

const isAdmin = ()=> user && user.role === 'Admin';

export function fillSelect(sel, arr){
  if(!sel) return;
  sel.innerHTML = arr.map(v=>`<option value="${v}">${v}</option>`).join('');
}

export function renderTeams(refresh){
  const ul = document.getElementById('teamsList'); if(!ul) return;
  const admin = isAdmin();
  ul.innerHTML = teams.map((t,i)=>`<li style="display:flex;gap:6px;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)">
    <span>${t}</span>
    <span>
      ${admin ? `<button class="btn" data-edit-team="${i}">Editar</button><button class="btn danger" data-del-team="${i}">Excluir</button>` : ''}
    </span>
  </li>`).join('');
  if(admin){
    ul.querySelectorAll('[data-del-team]').forEach(b=> b.addEventListener('click', ()=>{ const i=+b.dataset.delTeam; teams.splice(i,1); write(LS.teams, teams); refresh(); }));
    ul.querySelectorAll('[data-edit-team]').forEach(b=> b.addEventListener('click', ()=>{ const i=+b.dataset.editTeam; const nv=prompt('Novo nome:', teams[i]); if(nv){ teams[i]=nv; write(LS.teams, teams); refresh(); } }));
  }
  const count = document.getElementById('toolsCount'); if(count) count.textContent = tools.length + ' itens';
}

export function renderJobs(refresh){
  const ul = document.getElementById('jobsList'); if(!ul) return;
  const admin = isAdmin();
  ul.innerHTML = jobs.map((t,i)=>`<li style="display:flex;gap:6px;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)">
    <span>${t}</span>
    <span>
      ${admin ? `<button class="btn" data-edit-job="${i}">Editar</button><button class="btn danger" data-del-job="${i}">Excluir</button>` : ''}
    </span>
  </li>`).join('');
  if(admin){
    ul.querySelectorAll('[data-del-job]').forEach(b=> b.addEventListener('click', ()=>{ const i=+b.dataset.delJob; jobs.splice(i,1); write(LS.jobs, jobs); refresh(); }));
    ul.querySelectorAll('[data-edit-job]').forEach(b=> b.addEventListener('click', ()=>{ const i=+b.dataset.editJob; const nv=prompt('Novo nome:', jobs[i]); if(nv){ jobs[i]=nv; write(LS.jobs, jobs); refresh(); } }));
  }
}

export function renderTools(afterRender){
  const list = document.getElementById('toolsList'); if(!list) return;
  const admin = isAdmin();
  list.innerHTML = tools.map((t,i)=>{
    if(!t.id) t.id = uid();
    return `<div class="gridrow">
      <div>${admin ? `<button class="btn danger" data-del-tool="${i}">✕</button>` : ''}</div>
      <div><input ${admin?'':'readonly'} data-name="${i}" value="${t.name||''}" placeholder="Ex.: Furadeira"/></div>
      <div><input ${admin?'':'readonly'} data-code="${i}" value="${t.code||''}" placeholder="Código"/></div>
      <div><input ${admin?'':'readonly'} data-qty="${i}" type="number" value="${t.qty||1}" /></div>
      <div><input ${admin?'':'readonly'} data-obs="${i}" value="${t.obs||''}" placeholder="Obs"/></div>
    </div>`;
  }).join('');

  if(!admin) return; // bloqueia todos os handlers para não-admin

  list.querySelectorAll('[data-name]').forEach(inp=> inp.addEventListener('input',()=>{ const i=+inp.dataset.name; tools[i].name=inp.value; write(LS.tools, tools); afterRender&&afterRender(); }));
  list.querySelectorAll('[data-code]').forEach(inp=> inp.addEventListener('input',()=>{ const i=+inp.dataset.code; tools[i].code=inp.value; write(LS.tools, tools); afterRender&&afterRender(); }));
  list.querySelectorAll('[data-qty]').forEach(inp=> inp.addEventListener('input',()=>{ const i=+inp.dataset.qty; tools[i].qty=+inp.value||0; write(LS.tools, tools); afterRender&&afterRender(); }));
  list.querySelectorAll('[data-obs]').forEach(inp=> inp.addEventListener('input',()=>{ const i=+inp.dataset.obs; tools[i].obs=inp.value; write(LS.tools, tools); afterRender&&afterRender(); }));
  list.querySelectorAll('[data-del-tool]').forEach(btn=> btn.addEventListener('click',()=>{ const i=+btn.dataset.delTool; tools.splice(i,1); write(LS.tools, tools); renderTools(afterRender); afterRender&&afterRender(); }));
}

/* ferramentas/seleção */
export function updateSelCount(pickState){
  const selCount = Object.values(pickState).filter(x=>x.checked).length;
  const el = document.getElementById('selCount'); if(el) el.textContent = selCount + ' selecionadas';
}
export function renderPicker(pickState){
  const el = document.getElementById('pickList'); if(!el) return;
  el.innerHTML = tools.map(t=>{
    if(!t.id) t.id = uid();
    const st = pickState[t.id] || {checked:false, take: 0};
    return `<div class="gridrow">
      <div><input type="checkbox" data-pick="${t.id}" ${st.checked?'checked':''}></div>
      <div>${t.name||'-'}</div>
      <div>${t.code||'-'}</div>
      <div>${t.qty??0}</div>
      <div><input type="number" min="0" data-take="${t.id}" value="${st.take||0}"></div>
    </div>`;
  }).join('');
  el.querySelectorAll('[data-pick]').forEach(ch=> ch.addEventListener('change',()=>{
    const id = ch.dataset.pick;
    pickState[id] = pickState[id] || {checked:false, take:0};
    pickState[id].checked = ch.checked;
    updateSelCount(pickState);
  }));
  el.querySelectorAll('[data-take]').forEach(inp=> inp.addEventListener('input',()=>{
    const id = inp.dataset.take;
    pickState[id] = pickState[id] || {checked:false, take:0};
    pickState[id].take = +inp.value||0;
  }));
  updateSelCount(pickState);
}

/* checkboxes de funcionários */
export function renderEmployeesChoice(ctx){
  const host = document.getElementById('outEmployees'); if(!host) return;
  host.innerHTML = teams.map(name => `
    <label style="display:flex;gap:8px;align-items:center;margin:4px 0">
      <input type="checkbox" data-emp="${name}" ${ctx.employeesSelected.has(name)?'checked':''}/>
      <span>${name}</span>
    </label>
  `).join('') || '<div class="small">Nenhum funcionário cadastrado ainda.</div>';
  host.querySelectorAll('[data-emp]').forEach(ch=>{
    ch.addEventListener('change', ()=>{
      const n = ch.dataset.emp;
      if(ch.checked) ctx.employeesSelected.add(n);
      else ctx.employeesSelected.delete(n);
    });
  });
}
