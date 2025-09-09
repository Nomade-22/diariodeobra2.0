import { users, setState, write, LS } from './state.js';

const ro = ['Operação','Supervisor','Admin'];
const isPrincipal = (u)=> u.name.toLowerCase()==='jhonatan';

function tplRow(u, i){
  const lock = isPrincipal(u);
  return `
    <div class="gridrow" style="grid-template-columns:1fr 160px 1fr 140px;gap:8px">
      <div><input data-u-name="${i}" value="${u.name}" ${lock?'readonly':''}></div>
      <div>
        <select data-u-role="${i}" ${lock?'disabled':''}>
          ${ro.map(r=>`<option ${u.role===r?'selected':''}>${r}</option>`).join('')}
        </select>
      </div>
      <div><input data-u-pass="${i}" value="${u.pass}" placeholder="Senha"></div>
      <div style="text-align:right">
        ${lock? '<span class="small">Admin principal</span>' : `<button class="btn danger" data-u-del="${i}">Excluir</button>`}
      </div>
    </div>
  `;
}

export function renderUsers(){
  const host = document.getElementById('usrList'); if(!host) return;
  host.innerHTML = users.map((u,i)=>tplRow(u,i)).join('') || '<div class="small">Nenhum usuário.</div>';

  // binds de edição por input
  host.querySelectorAll('[data-u-name]').forEach(inp=> inp.addEventListener('input', ()=>{
    const i = +inp.dataset.uName; users[i].name = inp.value.trim(); write(LS.users, users);
  }));
  host.querySelectorAll('[data-u-role]').forEach(sel=> sel.addEventListener('change', ()=>{
    const i = +sel.dataset.uRole; users[i].role = sel.value; 
    if(isPrincipal(users[i])) users[i].role='Admin'; // reforço
    write(LS.users, users);
    renderUsers();
  }));
  host.querySelectorAll('[data-u-pass]').forEach(inp=> inp.addEventListener('input', ()=>{
    const i = +inp.dataset.uPass; users[i].pass = inp.value; write(LS.users, users);
  }));
  host.querySelectorAll('[data-u-del]').forEach(btn=> btn.addEventListener('click', ()=>{
    const i = +btn.dataset.uDel;
    if(!confirm('Excluir este usuário?')) return;
    users.splice(i,1); write(LS.users, users); renderUsers();
  }));
}

export function bindUserTop(){
  const add = document.getElementById('usrAdd');
  add?.addEventListener('click', ()=>{
    const name = (document.getElementById('usrName').value||'').trim();
    const role = document.getElementById('usrRole').value;
    const pass = (document.getElementById('usrPass').value||'').trim();
    if(!name || !pass){ alert('Informe nome e senha.'); return; }

    const first = name.split(/\s+/)[0];
    let idx = users.findIndex(u=>u.name.toLowerCase()===first.toLowerCase());
    if(idx >= 0){
      users[idx].pass = pass;
      if(users[idx].name.toLowerCase()!=='jhonatan') users[idx].role = role; // Jhonatan sempre Admin
      users[idx].name = first;
    }else{
      users.push({ id:Math.random().toString(36).slice(2), name:first, role, pass });
    }
    write(LS.users, users);
    document.getElementById('usrName').value='';
    document.getElementById('usrPass').value='';
    renderUsers();
  });
}