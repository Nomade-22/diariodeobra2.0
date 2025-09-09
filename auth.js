import { LS, users, setState } from './state.js';

const norm = (s)=> (s||'').trim();

export function currentUser() {
  try { return JSON.parse(localStorage.getItem(LS.user) || 'null'); }
  catch { return null; }
}

export function showLogin() {
  document.getElementById('view-login').classList.remove('hidden');
  document.getElementById('view-app').classList.add('hidden');
}

export function showApp(u) {
  document.getElementById('view-login').classList.add('hidden');
  document.getElementById('view-app').classList.remove('hidden');
  document.getElementById('userName').textContent = u.name || 'Usuário';
  document.getElementById('userRole').textContent = u.role || 'Operação';
  document.getElementById('avatar').textContent = (u.name||'U').slice(0,1).toUpperCase();

  const isAdmin = u.role === 'Admin';
  const cadBtn = document.getElementById('tabCadButton');
  const cadSec = document.getElementById('tab-cadastros');
  const finBtn = document.getElementById('tabFinButton');
  const finSec = document.getElementById('tab-finance');
  const btnExportPDF = document.getElementById('btnExportPDF');
  if(!isAdmin){
    cadBtn?.classList.add('hidden'); cadSec?.classList.add('hidden');
    finBtn?.classList.add('hidden'); finSec?.classList.add('hidden');
    btnExportPDF?.classList.add('hidden');
  }else{
    cadBtn?.classList.remove('hidden');
    finBtn?.classList.remove('hidden');
    btnExportPDF?.classList.remove('hidden');
  }
}

export function bindAuth() {
  const btnLogin   = document.getElementById('btnLogin');
  const btnLogout  = document.getElementById('btnLogout');
  const passToggle = document.getElementById('passToggle');

  // 👁️ Mostrar/ocultar senha
  passToggle?.addEventListener('click', ()=>{
    const inp = document.getElementById('loginPass');
    if(!inp) return;
    inp.type = (inp.type === 'password') ? 'text' : 'password';
    passToggle.textContent = (inp.type === 'password') ? '👁️' : '🙈';
  });

  btnLogin?.addEventListener('click', () => {
    const nameTyped = norm(document.getElementById('loginName').value);
    const pass      = document.getElementById('loginPass').value;
    if (!nameTyped) { alert('Informe seu nome.'); return; }

    // Procura pelo PRIMEIRO NOME
    const first = nameTyped.split(/\s+/)[0];
    const acc = users.find(u => u.name.toLowerCase() === first.toLowerCase());
    if(!acc){ alert('Usuário não encontrado. Peça ao Admin para cadastrar.'); return; }
    if(pass !== acc.pass){ alert('Senha inválida.'); return; }

    const u = { name: first, role: acc.role, provider:'local', loggedAt:new Date().toISOString() };
    localStorage.setItem(LS.user, JSON.stringify(u));
    setState({ user: u });
    showApp(u);
    document.dispatchEvent(new CustomEvent('user:login', { detail: u }));
  });

  btnLogout?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem(LS.user);
    setState({ user: null });
    showLogin();
    document.dispatchEvent(new CustomEvent('user:logout'));
  });
}