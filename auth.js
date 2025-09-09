import { LS } from './storage.js';
import { setState } from './state.js';

const norm = (s)=> (s||'').trim().toLowerCase();

// Tabela de credenciais (nome exato + senha + cargo)
const USERS = [
  { name: 'jhonatan reck', pass: '152205', role: 'Admin' },
  { name: 'emerson iuri rangel veiga dias', pass: '121098', role: 'Supervisor' },
  { name: 'toni anderson de souza', pass: '041282', role: 'Supervisor' },
];

function findUserByName(name){
  const n = norm(name);
  return USERS.find(u => u.name === n) || null;
}

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

  // Esconde a aba "Cadastros" de quem não é Admin
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

  // 👁️ Olhinho da senha
  if(passToggle){
    passToggle.addEventListener('click', ()=>{
      const inp = document.getElementById('loginPass');
      if(!inp) return;
      inp.type = (inp.type === 'password') ? 'text' : 'password';
      // opcional: muda o ícone
      passToggle.textContent = (inp.type === 'password') ? '👁️' : '🙈';
    });
  }

  if (btnLogin) {
    btnLogin.addEventListener('click', () => {
      const name = document.getElementById('loginName').value.trim();
      const pass = document.getElementById('loginPass').value.trim();
      let roleSel = document.getElementById('loginRole').value; // o que o usuário escolheu no select

      if (!name) { alert('Informe seu nome.'); return; }

      // Verifica se é alguém da lista (Admin/Supervisor)
      const found = findUserByName(name);

      if (found) {
        // Para contas com papel elevado, senha é obrigatória e deve bater
        if (pass !== found.pass) {
          alert('Senha inválida.');
          return;
        }
        // força o cargo conforme a tabela (ignora o select)
        roleSel = found.role;
      } else {
        // Não está na lista → NÃO PODE Admin nem Supervisor
        if (roleSel === 'Admin' || roleSel === 'Supervisor') {
          alert('Somente usuários autorizados podem entrar com esse cargo.');
          roleSel = 'Operação';
        }
        // Para Operação, não exigimos senha
      }

      const user = { name, role: roleSel, provider: 'local', loggedAt: new Date().toISOString() };
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
