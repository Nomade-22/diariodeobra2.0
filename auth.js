import { LS } from './storage.js';
import { setState } from './state.js';

const norm = (s)=> (s||'').trim().toLowerCase();
const firstName = (s)=> norm(s).split(/\s+/)[0] || "";

/* Lista branca por PRIMEIRO NOME */
const USERS = {
  jhonatan: { pass: '152205', role: 'Admin' },
  emerson:  { pass: '121098', role: 'Supervisor' },
  toni:     { pass: '041282', role: 'Supervisor' },
};

export function currentUser() {
  try { return JSON.parse(localStorage.getItem(LS.user) || 'null'); }
  catch { return null; }
}

export function showLogin() {
  document.getElementById('view-login').classList.remove('hidden');
  document.getElementById('view-app').classList.add('hidden');
}

export function showApp(user) {
  document.getElementById('view-login').classList.add('hidden');
  document.getElementById('view-app').classList.remove('hidden');
  document.getElementById('userName').textContent = user.name || 'Usuário';
  document.getElementById('userRole').textContent = user.role || 'Operação';
  const av = document.getElementById('avatar');
  av.textContent = (user.name || 'U').slice(0, 1).toUpperCase();

  // Esconde "Cadastros" e "Financeiro" de quem não é Admin
  const cadBtn = document.getElementById('tabCadButton');
  const cadSec = document.getElementById('tab-cadastros');
  const finBtn = document.getElementById('tabFinButton');
  const finSec = document.getElementById('tab-finance');

  if(user.role !== 'Admin'){
    cadBtn?.classList.add('hidden'); cadSec?.classList.add('hidden');
    finBtn?.classList.add('hidden'); finSec?.classList.add('hidden');
  } else {
    cadBtn?.classList.remove('hidden');
    finBtn?.classList.remove('hidden');
  }
}

export function bindAuth() {
  const btnLogin   = document.getElementById('btnLogin');
  const btnLogout  = document.getElementById('btnLogout');
  const passToggle = document.getElementById('passToggle');

  if (passToggle) {
    passToggle.addEventListener('click', ()=>{
      const inp = document.getElementById('loginPass');
      if(!inp) return;
      inp.type = (inp.type === 'password') ? 'text' : 'password';
      passToggle.textContent = (inp.type === 'password') ? '👁️' : '🙈';
    });
  }

  if (btnLogin) {
    btnLogin.addEventListener('click', () => {
      const nameTyped = document.getElementById('loginName').value.trim();
      const pass      = document.getElementById('loginPass').value.trim();
      if (!nameTyped) { alert('Informe seu nome.'); return; }

      const key     = firstName(nameTyped);
      const account = USERS[key] || null;

      let finalRole = 'Operação';
      if (account) {
        if (pass !== account.pass) { alert('Senha inválida.'); return; }
        finalRole = account.role;
      } else {
        finalRole = 'Operação';
      }

      const user = { name: nameTyped, role: finalRole, provider: 'local', loggedAt: new Date().toISOString() };
      localStorage.setItem(LS.user, JSON.stringify(user));
      setState({ user });
      showApp(user);
      document.dispatchEvent(new CustomEvent('user:login', { detail: user }));
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem(LS.user);
      setState({ user: null });
      showLogin();
      document.dispatchEvent(new CustomEvent('user:logout'));
    });
  }
}
