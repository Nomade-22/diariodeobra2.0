// ui.js — v3.0.5: sem mudanças de layout; mantém cadastros e picker
import { LS, write } from './state.js';
import { tools, teams, jobs } from './state.js';

const byId = (id)=> document.getElementById(id);

export function fillSelect(sel, arr){
  if(!sel) return;
  sel.innerHTML = '';
  (arr||[]).forEach(v=>{
    const o = document.createElement('option');
    o.value = v; o.textContent = v; sel.appendChild(o);
  });
}

/* --------- FERRAMENTAS (CATÁLOGO) --------- */
export function renderTools(onChange){
  const list  = byId('toolsList');
  const count = byId('toolsCount');
  if(count) count.textContent = `${tools.length} itens`;
  if(!list) return;

  list.innerHTML = '';
  tools.forEach((t, i)=>{
    const row = document.createElement('div');
    row.className = 'rowline';
    row.dataset.index = String(i);
    row.innerHTML = `
      <div>${i+1}</div>
      <div><input class="t-name" value="${t.name||''}" placeholder="Nome da ferramenta" /></div>
      <div><input class="t-code" value="${t.code||''}" placeholder="Código" /></div>
      <div><input class="t-qty"  type="number" min="0" value="${t.qty??1}" /></div>
      <div><input class="t-obs"  value="${t.obs||''}" placeholder="Observações" /></div>
      <div class="actions">
        <button class="btn xs act-save"><span>Salvar</span></button>
        <button class="btn xs act-del"><span>Excluir</span></button>
      </div>
    `;
    list.appendChild(row);
  });

  if(!list.dataset.bound){
    list.dataset.bound='1';
    list.addEventListener('click', (e)=>{
      const row = e.target.closest('.rowline'); if(!row) return;
      const idx = Number(row.dataset.index||-1); if(idx<0) return;

      if(e.target.closest('.act-del')){
        tools.splice(idx,1); write(LS.tools,tools); renderTools(onChange);
        if(typeof onChange==='function') onChange();
        return;
      }
      if(e.target.closest('.act-save')){
        const name = row.querySelector('.t-name')?.value?.trim()||'';
        const code = row.querySelector('.t-code')?.value?.trim()||'';
        const qty  = Math.max(0, Number(row.querySelector('.t-qty')?.value||0));
        const obs  = row.querySelector('.t-obs')?.value?.trim()||'';
        tools[idx] = { name, code, qty, obs };
        write(LS.tools,tools);
        if(typeof onChange==='function') onChange();
      }
    });
  }

  if(typeof onChange==='function') onChange();
}

/* --------- FUNCIONÁRIOS --------- */
export function renderTeams(onChange){
  const ul = byId('teamsList'); if(!ul) return;
  ul.innerHTML = '';
  teams.forEach((name,i)=>{
    const li = document.createElement('li');
    li.className = 'rowline'; li.dataset.index = String(i);
    li.innerHTML = `
      <input class="tm-name" value="${name}" />
      <button class="btn xs act-save-team"><span>Salvar</span></button>
      <button class="btn xs act-del-team"><span>Excluir</span></button>
    `;
    ul.appendChild(li);
  });
  if(!ul.dataset.bound){
    ul.dataset.bound='1';
    ul.addEventListener('click',(e)=>{
      const li = e.target.closest('li.rowline'); if(!li) return;
      const idx = Number(li.dataset.index||-1); if(idx<0) return;
      if(e.target.closest('.act-del-team')){
        teams.splice(idx,1); write(LS.teams,teams); renderTeams(onChange);
        if(typeof onChange==='function') onChange();
        return;
      }
      if(e.target.closest('.act-save-team')){
        const name = li.querySelector('.tm-name')?.value?.trim(); if(!name) return;
        teams[idx]=name; write(LS.teams,teams);
        if(typeof onChange==='function') onChange();
      }
    });
  }
  if(typeof onChange==='function') onChange();
}

/* --------- OBRAS/CLIENTES --------- */
export function renderJobs(onChange){
  const ul = byId('jobsList'); if(!ul) return;
  ul.innerHTML = '';
  jobs.forEach((name,i)=>{
    const li = document.createElement('li');
    li.className = 'rowline'; li.dataset.index = String(i);
    li.innerHTML = `
      <input class="jb-name" value="${name}" />
      <button class="btn xs act-save-job"><span>Salvar</span></button>
      <button class="btn xs act-del-job"><span>Excluir</span></button>
    `;
    ul.appendChild(li);
  });
  if(!ul.dataset.bound){
    ul.dataset.bound='1';
    ul.addEventListener('click',(e)=>{
      const li = e.target.closest('li.rowline'); if(!li) return;
      const idx = Number(li.dataset.index||-1); if(idx<0) return;
      if(e.target.closest('.act-del-job')){
        jobs.splice(idx,1); write(LS.jobs,jobs); renderJobs(onChange);
        if(typeof onChange==='function') onChange();
        return;
      }
      if(e.target.closest('.act-save-job')){
        const name = li.querySelector('.jb-name')?.value?.trim(); if(!name) return;
        jobs[idx]=name; write(LS.jobs,jobs);
        if(typeof onChange==='function') onChange();
      }
    });
  }
  if(typeof onChange==='function') onChange();
}

/* --------- PICKER (SAÍDA) — alinhado no mobile --------- */
export function renderPicker(state){
  const box = byId('pickList'); const selCount = byId('selCount');
  if(!box) return;
  box.innerHTML = '';
  let totalSel = 0;

  tools.forEach((t,i)=>{
    const id = `pick_${i}`;
    const take = state[id]?.take ?? 0;
    const checked = take>0;
    const row = document.createElement('div');
    row.className = 'rowline';
    row.style.display = 'grid';
    row.style.gridTemplateColumns = '40px 1.3fr 1fr .7fr 1.1fr';
    row.style.alignItems = 'center';
    row.innerHTML = `
      <div><input type="checkbox" class="pk-check" ${checked?'checked':''} data-id="${id}"></div>
      <div>${t.name||'-'}</div>
      <div>${t.code||''}</div>
      <div>${t.qty??0}</div>
      <div><input class="pk-take" type="number" min="0" value="${take}" data-id="${id}" style="width:100%"></div>
    `;
    box.appendChild(row);
    if(checked) totalSel++;
  });

  if(selCount) selCount.textContent = `${totalSel} selecionadas`;

  box.onclick = (ev)=>{
    const chk = ev.target.closest?.('.pk-check'); if(!chk) return;
    const id = chk.dataset.id;
    const val = chk.checked ? (state[id]?.take||1) : 0;
    state[id] = { take: val };
    const inp = box.querySelector(`.pk-take[data-id="${id}"]`); if(inp) inp.value = String(val);
    if(selCount){
      const c = [...box.querySelectorAll('.pk-check:checked')].length;
      selCount.textContent = `${c} selecionadas`;
    }
  };
  box.oninput = (ev)=>{
    const inp = ev.target.closest?.('.pk-take'); if(!inp) return;
    const id = inp.dataset.id;
    const val = Math.max(0, Number(inp.value||0));
    state[id] = { take: val };
    const chk = box.querySelector(`.pk-check[data-id="${id}"]`); if(chk) chk.checked = val>0;
    if(selCount){
      const c = [...box.querySelectorAll('.pk-check:checked')].length;
      selCount.textContent = `${c} selecionadas`;
    }
  };
}

/* --------- Funcionários (checkboxes) --------- */
export function renderEmployeesChoice(ctx){
  const box = byId('outEmployees'); if(!box) return;
  box.innerHTML = '';
  teams.forEach((n,i)=>{
    const id = `emp_${i}`;
    const row = document.createElement('label');
    row.className = 'empitem';
    row.innerHTML = `<input type="checkbox" class="emp-check" id="${id}" data-name="${n}"><span>${n}</span>`;
    box.appendChild(row);
  });
  if(!box.dataset.bound){
    box.dataset.bound='1';
    box.addEventListener('change', (e)=>{
      const chk = e.target.closest?.('.emp-check'); if(!chk) return;
      const nm = chk.dataset.name;
      if(chk.checked) ctx.employeesSelected.add(nm);
      else ctx.employeesSelected.delete(nm);
    });
  }
}