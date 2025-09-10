// main.js — inicialização mínima segura (login e chip de erros)

import { currentUser, bindAuth, showApp, showLogin } from './auth.js';
// Se quiser reativar todo o app depois, reimporte seus módulos aqui:
// import { setupTabs } from './tabs.js';
// import { ... } from './ui.js';

const chip = document.getElementById('diag');
const say  = (t)=> chip && (chip.textContent = t);

// mostra erros no chip (útil no celular)
window.addEventListener('error', (e)=> say('Erro: ' + (e.message || 'desconhecido')));

async function registerSW(){
  try{
    if('serviceWorker' in navigator){
      // registre o SW v=10 (opcional; comente se não quiser PWA agora)
      await navigator.serviceWorker.register('./sw.js?v=10');
    }
  }catch(e){}
}

function init(){
  say('iniciando…');
  bindAuth();

  const u = currentUser();
  if(u){ showApp(u); /* aqui você chama setupTabs() e demais renders */ }
  else { showLogin(); }

  document.addEventListener('user:login', ()=>{
    // Aqui você pode inicializar o resto do app (abas, cadastros etc.)
    // setupTabs(); ...
  });

  registerSW(); // opcional
  say('pronto');
}

document.addEventListener('DOMContentLoaded', init);