// gas_bind.js
import {
  CONFIG,
  testarConexao,
  buscarCatalogos,
  confirmarSaida,
  confirmarRetorno,
  salvarFerramenta,
  salvarFuncionario,
  salvarObra,
} from './gas.js';

const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/* ---------- Estado simples p/ preencher UI ---------- */
const state = {
  funcs: [],
  ferrs: [],
  obras: [],
};

/* ---------- Util ---------- */
function numberVal(el){ const v=(el?.value||'').toString().trim(); const n=Number(v.replace(',','.')); return isFinite(n)?n:''; }
function textVal(el){ return (el?.value||'').toString().trim(); }
function alertOk(msg){ alert('✅ ' + msg); }
function alertErr(e){ alert('❌ ' + (e?.message||e||'Erro desconhecido')); }

/* ---------- Preenche UI a partir dos catálogos ---------- */
function renderCatalogs(){
  // Obras → select
  const selObra = $('#selObra');
  if(selObra){
    selObra.innerHTML = '';
    state.obras.forEach(o=>{
      const opt = document.createElement('option');
      opt.value = o.nome; // usamos o nome como "obra"
      opt.textContent = o.nome;
      selObra.appendChild(opt);
    });
  }

  // Funcionários → lista de checkboxes
  const ulFunc = $('#listaFuncionarios');
  if(ulFunc){
    ulFunc.innerHTML = '';
    state.funcs.forEach(f=>{
      const li = document.createElement('li');
      const id = 'func_' + f.id;
      li.innerHTML = `
        <label>
          <input type="checkbox" class="chk-func" value="${f.nome}" id="${id}"/>
          ${f.nome}
        </label>`;
      ulFunc.appendChild(li);
    });
  }

  // Ferramentas → tabela com checkbox + qtd levar
  const tbl = $('#tabelaFerramentas');
  if(tbl){
    tbl.innerHTML = `
      <thead><tr><th></th><th>Ferramenta</th><th>Código</th><th>Qtd levar</th></tr></thead>
      <tbody></tbody>`;
    const tbody = tbl.querySelector('tbody');
    state.ferrs.forEach(f=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="checkbox" class="chk-ferr" data-name="${f.nome}" data-code="${f.codigo||''}"></td>
        <td class="nome">${f.nome}</td>
        <td class="codigo">${f.codigo||''}</td>
        <td><input type="number" class="qtd" value="1" min="0" style="width:80px"></td>
      `;
      tbody.appendChild(tr);
    });
  }
}

/* ---------- COLETA da tela Saída ---------- */
function coletarSaidaDaTela(){
  const obra       = textVal($('#selObra'));
  const motorista  = textVal($('#inpMotorista'));
  const timeOut    = textVal($('#inpTimeOut'));
  const kmOut      = textVal($('#inpKmOut'));
  const obs        = textVal($('#inpObsSaida'));

  const equipeArray = $$('.chk-func:checked').map(chk => chk.value);
  const itensArray  = $$('.chk-ferr:checked').map(chk => {
    const tr  = chk.closest('tr');
    const qtd = numberVal(tr.querySelector('.qtd')) || 0;
    return { name: chk.dataset.name, code: chk.dataset.code||'', qtd };
  });

  return { obra, motorista, timeOut, kmOut, obs, equipeArray, itensArray };
}

/* ---------- COLETA da tela Retorno ---------- */
function coletarRetornoDaTela(){
  const out_id = textVal($('#inpOutId'));
  const timeIn = textVal($('#inpTimeIn'));
  const kmIn   = textVal($('#inpKmIn'));
  const notes  = textVal($('#inpObsRet'));

  // Se quiser marcar condição item a item, adapte aqui; por enquanto só fecha a saída.
  const items  = []; // [{name,qtd,cond}] se tiver checklist

  return { out_id, timeIn, kmIn, items, notes };
}

/* ---------- AÇÕES ---------- */
async function acaoTestarConexao(){
  try{
    await testarConexao(); 
    alertOk('Conexão com a planilha OK! (abas/cabeçalhos garantidos)');
  }catch(e){ alertErr(e); }
}

async function acaoBuscarDados(){
  try{
    const cats = await buscarCatalogos();
    state.funcs = cats.Funcionarios || [];
    state.ferrs = cats.Ferramentas || [];
    state.obras = cats.Obras || [];
    renderCatalogs();
    alertOk('Catálogos carregados para a tela');
  }catch(e){ alertErr(e); }
}

async function acaoSalvarFerramenta(){
  try{
    await salvarFerramenta({
      nome: textVal($('#inpFerrNome')),
      codigo: textVal($('#inpFerrCodigo')),
      qtd_total: numberVal($('#inpFerrQtd'))||0,
      obs: textVal($('#inpFerrObs')),
    });
    alertOk('Ferramenta salva na planilha');
    await acaoBuscarDados(); // já recarrega a lista
  }catch(e){ alertErr(e); }
}

async function acaoSalvarFuncionario(){
  try{
    await salvarFuncionario({
      nome: textVal($('#inpFuncNome')),
      cargo: textVal($('#inpFuncCargo')),
    });
    alertOk('Funcionário salvo na planilha');
    await acaoBuscarDados();
  }catch(e){ alertErr(e); }
}

async function acaoSalvarObra(){
  try{
    await salvarObra({
      nome: textVal($('#inpObraNome')),
      cliente: textVal($('#inpObraCliente')),
      cidade: textVal($('#inpObraCidade')),
    });
    alertOk('Obra/Cliente salva na planilha');
    await acaoBuscarDados();
  }catch(e){ alertErr(e); }
}

async function acaoForcarSaida(){
  try{
    const s = coletarSaidaDaTela();
    if(!s.obra){ alert('Escolha a obra/cliente.'); return; }
    await confirmarSaida({
      obra: s.obra,
      createdBy: 'Admin', // ajuste se quiser usar login
      motorista: s.motorista,
      equipeArray: s.equipeArray,
      itensArray: s.itensArray,
      kmOut: s.kmOut,
      timeOut: s.timeOut,
      obs: s.obs,
    });
    alertOk('Saída registrada na aba Relatorio (tipo=mov)');
  }catch(e){ alertErr(e); }
}

async function acaoConfirmarRetorno(){
  try{
    const r = coletarRetornoDaTela();
    if(!r.out_id){ alert('Informe o ID da saída.'); return; }
    await confirmarRetorno(r);
    alertOk('Retorno fechado na aba Relatorio (status=Fechado)');
  }catch(e){ alertErr(e); }
}

/* ---------- BINDS ---------- */
function bind(){
  $('#btnTestarConexao')   ?.addEventListener('click', acaoTestarConexao);
  $('#btnBuscarDados')     ?.addEventListener('click', acaoBuscarDados);
  $('#btnForcarSaida')     ?.addEventListener('click', acaoForcarSaida);

  $('#btnSalvarFerramenta')  ?.addEventListener('click', acaoSalvarFerramenta);
  $('#btnSalvarFuncionario') ?.addEventListener('click', acaoSalvarFuncionario);
  $('#btnSalvarObra')        ?.addEventListener('click', acaoSalvarObra);

  // Se tiver um botão específico para retorno, ligue aqui:
  $('#btnConfirmarRetorno')  ?.addEventListener('click', acaoConfirmarRetorno);
}

document.addEventListener('DOMContentLoaded', bind);
