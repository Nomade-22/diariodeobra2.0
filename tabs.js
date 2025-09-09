export function setupTabs(){
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(t => t.addEventListener('click', ()=>{
    // se o botão estiver escondido, ignora
    if (t.id === 'tabCadButton' && t.classList.contains('hidden')) return;

    tabs.forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    const name = t.dataset.tab;
    document.querySelectorAll('section[id^=tab-]').forEach(s=> s.classList.add('hidden'));
    document.getElementById('tab-' + name).classList.remove('hidden');
  }));
}
