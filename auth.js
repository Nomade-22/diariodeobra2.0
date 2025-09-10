// auth.js — login seguro + permissões (usa state.js)
import { LS, users as USERS_FROM_STATE, setState } from './state.js';

const norm  = (s)=> (s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
const FIRST = (s)=> (String(s||'').trim().split(/\s+/)[0]||'');

const USERS_KEY = 'mp_users_v1';
const DEFAULT_USERS = [
  { login: 'jhonatan', name: 'Jhonatan reck', role: 'Admin',      pass: '152205' },
  { login: 'emerson',  name: 'Emerson Iuri Rangel Veiga Dias', role: 'Supervisor', pass: '121098' },
  { login: 'toni',     name: 'Toni Anderson de Souza',          role: 'Supervisor', pass: '041282' },
];

function seedFromState(list){
  const arr = Array.isArray(list)? list : [];
  return arr.map(u=>{
    const login = u.login ? norm(u.login) : norm(FIRST(u.name));
    return { login, name: u.name || FIRST(u.login||''), role: u.role || 'Operação', pass: u.pass || '' };
  }).filter(u=>u.login);
}
function mergeByLogin(a,b){
  const m = new Map();
  for(const x of a) m.set(norm(x.login), {...x, login:norm(x.login)});
  for(const y of b){
    const k = norm(y.login);
    m.set(k, { ...(m.get(k)||{}), ...y, login:k });
  }
  return [...m.values()];
}
function ensureDefaults(arr){
  if(!arr.find(u=>u.login==='jhonatan')) arr.push(DEFAULT_USERS[0]);
  if(!arr.find(u=>u.login==='emerson'))  arr.push(DEFAULT_USERS[1]);
  if(!arr.find(u=>u.login==='toni'))     arr.push(DEFAULT_USERS[2]);
  return arr;
}
function loadUsers(){
  try{
    const saved = JSON.parse(localStorage.getItem(USERS_KEY) || 'null');
    if(saved && Array.isArray(saved) && saved.length) return ensureDefaults(saved);
    const fromState = seedFromState(USERS_FROM_STATE);
    const merged = ensureDefaults(mergeByLogin(DEFAULT_USERS, fromState));
    localStorage.setItem(USERS_KEY, JSON.stringify(merged));
    return merged;
  }catch{
    localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS.slice();
  }
}

export function currentUser(){
  try{ return JSON.parse(localStorage.getItem(LS.user) || 'null'); }catch{ return null; }
}
function setSession(u){ if(u) localStorage.setItem(LS.user, JSON.stringify(u)); else localStorage.removeItem(LS.user); }

export function showLogin(){
  document.getElementById('view-login')?.classList.remove('hidden');
  document.getElementById('view-app')?.classList.add('hidden');
}
export function showApp(u){
  document.getElementById('view-login')?.classList.add('hidden');
  document.getElementById('view-app')?.classList.remove('hidden');

  document.getElementById('userName').textContent = u.name || 'Usuário';
  document.getElementById('userRole').textContent = u.role || 'Operação';
  document.getElementById('avatar').textContent   = (u.name||'U').slice(0,1).toUpperCase();

  const isAdmin = u.role === 'Admin';
  const cadBtn = document.getElementById('tabCadButton');
  const cadSec = document.getElementById('tab-cadastros');
  const finBtn = document.getElementById('tabFinButton');
  const finSec = document.getElementById('tab-finance');
  const btnExportPDF = document.getElementById('btnExportPDF');
  const btnExportXLS = document.getElementById('btnExportXLS');

  if(!isAdmin){
    cadBtn?.classList.add('hidden'); cadSec?.classList.add('hidden');
    finBtn?.classList.add('hidden'); finSec?.classList.add('hidden');
    btnExportPDF?.classList.add('hidden'); btnExportXLS?.classList.add('hidden');
  }else{
    cadBtn?.classList.remove('hidden'); cadSec?.classList.remove('hidden');
    finBtn?.classList.remove('hidden'); finSec?.classList.remove('hidden');
    btnExportPDF?.classList.remove('hidden'); btnExportXLS?.classList.remove('hidden');
  }
}

function findAccountByInput(nameTyped){
  const loginTry = norm(FIRST(nameTyped));
  const list = loadUsers();
  for(const u of list){
    const login = norm(u.login || FIRST(u.name));
    if(login === loginTry) return u;
  }
  return null;
}
function doLogin(nameTyped, pass){
  if(!nameTyped) return { ok:false, msg:'Informe seu nome.' };
  const acc = findAccountByInput(nameTyped);
  if(!acc) return { ok:false, msg:'Usuário não encontrado. Peça ao Admin para cadastrar.' };
  if(!acc.pass) return { ok:false, msg:'Usuário cadastrado sem senha. Peça ao Admin para definir uma senha.' };
  if(String(pass) !== String(acc.pass)) return { ok:false, msg:'Senha inválida.' };

  const session = { name: acc.name || FIRST(nameTyped), role: acc.role || 'Operação', loggedAt: new Date().toISOString() };
  setSession(session); setState({ user: session });
  return { ok:true, user: session };
}
function doLogout(){
  setSession(null); setState({ user: null }); showLogin();
  document.dispatchEvent(new CustomEvent('user:logout'));
}

export function bindAuth(){
  const start = Date.now();
  const MAX_MS = 8000;

  const timer = setInterval(()=>{
    const btnLogin   = document.getElementById('btnLogin');
    const btnLogout  = document.getElementById('btnLogout');
    const passToggle = document.getElementById('passToggle');
    const nameEl     = document.getElementById('loginName');
    const passEl     = document.getElementById('loginPass');

    if(passToggle && !passToggle.dataset.bound){
      passToggle.dataset.bound='1';
      passToggle.addEventListener('click', ()=>{
        if(!passEl) return;
        passEl.type = (passEl.type === 'password') ? 'text' : 'password';
        passToggle.textContent = (passEl.type === 'password') ? '👁️' : '🙈';
      });
    }
    if(btnLogin && !btnLogin.dataset.bound){
      btnLogin.dataset.bound='1';
      btnLogin.addEventListener('click', (e)=>{
        e.preventDefault();
        const res = doLogin(nameEl?.value||'', passEl?.value||'');
        if(!res.ok){ alert(res.msg); return; }
        showApp(res.user);
        document.dispatchEvent(new CustomEvent('user:login', { detail: res.user }));
      });
    }
    if(btnLogout && !btnLogout.dataset.bound){
      btnLogout.dataset.bound='1';
      btnLogout.addEventListener('click', (e)=>{
        e.preventDefault();
        doLogout();
        if(nameEl) nameEl.value = '';
        if(passEl){ passEl.value=''; passEl.type='password'; passToggle && (passToggle.textContent = '👁️'); }
      });
    }

    const ok = btnLogin?.dataset.bound && passToggle?.dataset.bound;
    if(ok || (Date.now()-start)>MAX_MS){ clearInterval(timer); }
  }, 150);
}