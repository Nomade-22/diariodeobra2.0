import { LS } from './storage.js';
import { setState } from './state.js';

const norm = (s)=> (s||'').trim().toLowerCase();

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

  // esconder Cadastros para não-admin
  const cadBtn = document.getElementById('tabCadButton');
  const cadSec = document.getElementById('tab-cadastros');
  if(user.role !== 'Admin'){
    cadBtn?.classList.add('hidden');
    cadSec?.classList.add('hidden');
  }else{
    cadBtn?.classList.remove('hidden');
  }
}

export function bindAuth() {
  const btnLogin = document.getElementById('btnLogin');
  const btnLogout = document.getElementById('btnLogout');
  const passToggle = document.getElementById('passToggle');

  // olhinho da senha
  if(passToggle){
    passToggle.addEventListener('click', ()=>{
      const inp = document.getElementById('loginPass');
      inp.type = (inp.type === 'password') ? 'text' : 'password';
    });
  }

  if (btnLogin) {
    btnLogin.addEventListener('click', () => {
      const name = document.getElementById('loginName').value.trim();
      const pass = document.getElementById('loginPass').value.trim();
      let role = document.getElementById('loginRole').value;

      if (!name) { alert('Informe seu nome.'); return; }

      // Somente "Jhonatan reck" pode ser Admin (senha obrigatória)
      if (norm(name) === 'jhonatan reck') {
        if (pass !== '152205') { alert('Senha inválida para Admin.'); return; }
        role = 'Admin';
      } else {
        // impede outros de entrarem como Admin
        if (role === 'Admin') {
          alert('Somente o Admin autorizado pode entrar como Admin.');
          role = 'Operação';
        }
        // para Operação/Supervisor a senha pode ficar vazia
      }

      const user = { name, role, provider: 'local', loggedAt: new Date().toISOString() };
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
