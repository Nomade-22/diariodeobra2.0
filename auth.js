import { LS } from './storage.js';
import { setState } from './state.js';

export function currentUser() {
  try {
    return JSON.parse(localStorage.getItem(LS.user) || 'null');
  } catch {
    return null;
  }
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
}

export function bindAuth() {
  const btnLogin = document.getElementById('btnLogin');
  const btnLogout = document.getElementById('btnLogout');

  if (btnLogin) {
    btnLogin.addEventListener('click', () => {
      const name = document.getElementById('loginName').value.trim();
      const id   = document.getElementById('loginId').value.trim();
      const role = document.getElementById('loginRole').value;
      if (!name) {
        alert('Informe seu nome.');
        return;
      }
      const user = {
        name,
        id,
        role,
        provider: 'local',
        loggedAt: new Date().toISOString()
      };
      localStorage.setItem(LS.user, JSON.stringify(user));
      setState({ user });
      showApp(user);

      // dispara evento para o main.js iniciar a UI
      document.dispatchEvent(new CustomEvent('user:login', { detail: user }));
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem(LS.user);
      setState({ user: null });
      showLogin();

      // dispara evento de logout
      document.dispatchEvent(new CustomEvent('user:logout'));
    });
  }
}
