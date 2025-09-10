// main.js — v11: inicialização mínima + diagnóstico no chip

import { currentUser, bindAuth, showApp, showLogin } from './auth.js';

const chip = document.getElementById('diag');
const say  = (t)=> chip && (chip.textContent = t);

window.addEventListener('error', (e)=> say('Erro: ' + (e.message || 'desconhecido')));

async function registerSW(){
  // opcional: registre o SW v=11 (só se quiser PWA agora)
  try{
    if('serviceWorker' in navigator){
      await navigator.serviceWorker.register('./sw.js?v=11');
    }
  }catch(e){}
}

function init(){
  say('iniciando…');

  // Liga autenticação (botão Entrar + olhinho)
  bindAuth();

  // Restaura sessão, se existir
  const u = currentUser();
  if(u){ showApp(u); }
  else { showLogin(); }

  document.addEventListener('user:login', ()=>{
    // Aqui você inicia o restante do app (abas, cadastros, etc) quando quiser
    // Ex: setupTabs(); renderizações...
  });

  registerSW(); // opcional
  say('pronto');
}

document.addEventListener('DOMContentLoaded', init);