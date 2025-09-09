// auth.js — usa state.js (LS, users, setState)
// Login por primeiro nome (normalizado) OU por campo `login` se existir.

import { LS, users, setState } from './state.js';

const norm = (s)=> (s||'')
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'') // remove acentos
  .trim().toLowerCase();

export function currentUser() {
  try { return JSON.parse(localStorage.getItem(LS.user) || 'null'); }
  catch { return null; }
}

export function showLogin() {
  document.getElementById('view-login')?.classList.remove('hidden');
  document.getElementById('view-app')?.classList.add('hidden');
}

export function showApp(u) {
  document.getElementById('view-login')?.classList.add('hidden');
  document.getElementById('view-app')?.classList.remove('hidden');

  // Header
  document.getElementById('userName').textContent = u.name || 'Usuário';
  document.getElementById('userRole').textContent = u.role || 'Operação';
  document.getElementById('avatar').textContent = (u.name||'U').slice(0,1).toUpperCase();

  // Permissões
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
    btnExportPDF?.classList.add('hidden');
    btnExportXLS?.classList.add('hidden');
  }else{
    cadBtn?.classList.remove('hidden'); cadSec?.classList.remove('hidden');
    finBtn?.classList.remove('hidden'); finSec?.classList.remove('hidden');
    btnExportPDF?.classList.remove('hidden');
    btnExportXLS?.classList.remove('hidden');
  }
}

// --- busca usuário por primeiro nome (ou campo login), com normalização
function findAccountByInput(nameTyped){
  const first = norm((nameTyped||'').split(/\s+/)[0] || '');

  // percorre a lista users (vinda do state.js)
  for(const u of (users||[])){
    const login = u.login ? norm(u.login) : norm((u.name||'').split(/\s+/)[0]||'');
    if(login === first) return u;
  }
  return null;
}

export function bindAuth() {
  const btnLogin   = document.getElementById('btnLogin');
  const btnLogout  = document.getElementById('btnLogout');
  const passToggle = document.getElementById('passToggle');
  const nameEl     = document.getElementById('loginName');
  const passEl     = document.getElementById('loginPass');

  // 👁️ Mostrar/ocultar senha (bind apenas 1x)
  if(passToggle && !passToggle.dataset.bound){
    passToggle.dataset.bound = '1';
    passToggle.addEventListener('click', ()=>{
      if(!passEl) return;
      passEl.type = (passEl.type === 'password') ? 'text' : 'password';
      passToggle.textContent = (passEl.type === 'password') ? '👁️' : '🙈';
    });
  }

  // Entrar
  if(btnLogin && !btnLogin.dataset.bound){
    btnLogin.dataset.bound = '1';
    btnLogin.addEventListener('click', (e) => {
      e.preventDefault();
      const nameTyped = (nameEl?.value || '').trim();
      const pass      = passEl?.value || '';

      if (!nameTyped) { alert('Informe seu nome.'); return; }

      const acc = findAccountByInput(nameTyped);
      if(!acc){ alert('Usuário não encontrado. Peça ao Admin para cadastrar.'); return; }

      // valida a senha exatamente
      if(String(pass) !== String(acc.pass)){ alert('Senha inválida.'); return; }

      // monta sessão (mantém nome completo se existir)
      const session = {
        name: acc.name || nameTyped.split(/\s+/)[0],
        role: acc.role || 'Operação',
        provider: 'local',
        loggedAt: new Date().toISOString()
      };

      localStorage.setItem(LS.user, JSON.stringify(session));
      setState({ user: session });
      showApp(session);
      document.dispatchEvent(new CustomEvent('user:login', { detail: session }));
    });
  }

  // Sair
  if(btnLogout && !btnLogout.dataset.bound){
    btnLogout.dataset.bound = '1';
    btnLogout.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem(LS.user);
      setState({ user: null });
      showLogin();
      document.dispatchEvent(new CustomEvent('user:logout'));
      // limpa campos
      if(nameEl) nameEl.value = '';
      if(passEl) { passEl.value = ''; passEl.type = 'password'; passToggle && (passToggle.textContent='👁️'); }
    });
  }
}