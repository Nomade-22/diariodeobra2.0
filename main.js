import { setupTabs } from './tabs.js';
import { LS } from './storage.js';
import { teams, jobs, setState } from './state.js';
import { makeSignature } from './signature.js';
import { fillSelect, renderTools, renderTeams, renderJobs, renderPicker } from './ui.js';
import { bindCheckout } from './checkout.js';
import { bindReturn } from './returns.js';
import { renderReturnList } from './render_return.js';
import { refreshOpenOuts } from './openouts.js';
import { bindExports } from './exports_bind.js';
import { currentUser, bindAuth, showApp, showLogin } from './auth.js';

const chip = document.getElementById('diag');
const say = (t) => chip && (chip.textContent = t);

async function registerSW() {
  try {
    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.register('./sw.js');
    }
  } catch (e) {
    /* ignore */
  }
}

say('iniciando…');
registerSW();

// Auth
bindAuth();
const u = currentUser();
if (u) {
  setState({ user: u });
  showApp(u);
} else {
  showLogin();
}

let initialized = false;
const initAppUI = () => {
  if (initialized) return; // evita rodar duas vezes
  initialized = true;

  setupTabs();

  // preenche selects
  fillSelect(document.getElementById('outTeam'), teams);
  fillSelect(document.getElementById('outJobsite'), jobs);

  // assinaturas
  const outSign = makeSignature(document.getElementById('outSign'));
  const retSign = makeSignature(document.getElementById('retSign'));

  // horários padrão
  const outTime = document.getElementById('outTime');
  if (outTime) outTime.value = new Date().toISOString().slice(0, 16);
  const outNow = document.getElementById('outNow');
  if (outNow) outNow.textContent = 'Agora: ' + new Date().toLocaleString('pt-BR');
  const retTime = document.getElementById('retTime');
  if (retTime) retTime.value = new Date().toISOString().slice(0, 16);

  // contexto da tela
  const ctx = {
    outPhotos: [],
    retPhotos: [],
    pickState: {},
    outSign,
    retSign,
    currentReturn: null,
    renderPicker: () => renderPicker(ctx.pickState),
    refreshOpenOuts,
    renderReturnList: () => renderReturnList(ctx),
  };

  // uploads de fotos
  const outPhotoEl = document.getElementById('outPhoto');
  if (outPhotoEl) {
    outPhotoEl.addEventListener('change', async (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const b64 = await new Promise((res) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.readAsDataURL(f);
      });
      ctx.outPhotos.push(b64);
      const pc = document.getElementById('outPhotoCount');
      if (pc) pc.textContent = `${ctx.outPhotos.length} foto(s)`;
    });
  }

  const retPhotoEl = document.getElementById('retPhoto');
  if (retPhotoEl) {
    retPhotoEl.addEventListener('change', async (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const b64 = await new Promise((res) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.readAsDataURL(f);
      });
      ctx.retPhotos.push(b64);
      const pc = document.getElementById('retPhotoCount');
      if (pc) pc.textContent = `${ctx.retPhotos.length} foto(s)`;
    });
  }

  document.querySelectorAll('[data-clear]').forEach((btn) =>
    btn.addEventListener('click', () => {
      (btn.dataset.clear === 'outSign' ? outSign : retSign).clear();
    })
  );

  // renders
  renderTools(() => ctx.renderPicker());
  renderTeams(refreshAll);
  renderJobs(refreshAll);
  ctx.renderPicker();
  refreshOpenOuts();

  // ações
  bindExports();
  bindCheckout(ctx);
  bindReturn(ctx);

  function refreshAll() {
    fillSelect(document.getElementById('outTeam'), teams);
    fillSelect(document.getElementById('outJobsite'), jobs);
    renderTools(() => ctx.renderPicker());
    renderTeams(refreshAll);
    renderJobs(refreshAll);
    ctx.renderPicker();
  }
};

// Se já tinha usuário salvo, inicia UI
if (u) {
  initAppUI();
}

// Ouve login
document.addEventListener('user:login', () => {
  initAppUI();
});

say('pronto');
