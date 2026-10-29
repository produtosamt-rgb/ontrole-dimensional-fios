'use strict';
const D=window.RELATORIO,$=id=>document.getElementById(id);
const nomes={nu:'Fio nu',empapelado:'Fio empapelado'},cores={nu:'#385f8c',empapelado:'#168a80'};
const meses=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const n=(v,d=0)=>Number(v).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sinal=(v,d=2)=>Math.abs(v)<.5*10**(-d)?n(0,d):(v>0?'+':'−')+n(Math.abs(v),d);
const extremo=v=>Math.abs(v)<1e-9?'—':sinal(v)+' mm';
const rotulo=m=>meses[Number(m.slice(5))-1]+'/'+m.slice(0,4);
const canonical=s=>String(s).toUpperCase().replace(/\s/g,'').replace(/×/g,'X').replace(/\./g,',').replace(/(\d+),(\d+)/g,(_,a,b)=>a+(b.replace(/0+$/,'')?','+b.replace(/0+$/,''):''));
let tipo='nu';
const chartInstances={};
function periodos(){const ks=D.linhas.filter(r=>r.tipo===tipo).flatMap(r=>Object.keys(r.mesesInspecao)).sort();if(!ks.length)return[];let v=ks[0];const out=[];while(v<=ks[ks.length-1]){out.push(v);let[y,m]=v.split('-').map(Number);m++;if(m>12){m=1;y++;}v=y+'-'+String(m).padStart(2,'0');}return out;}
function resumo(rs){const t={total:0,avaliadas:0,nc:0,suspeitas:0,semFaixa:0,somaDesvioAltura:0,somaDesvioLargura:0,ncAltura:0,ncLargura:0,maxAcimaAltura:0,minAbaixoAltura:0,maxAcimaLargura:0,minAbaixoLargura:0,vendido:0};for(const r of rs){for(const k of ['maxAcimaAltura','maxAcimaLargura'])t[k]=Math.max(t[k],r[k]);for(const k of ['minAbaixoAltura','minAbaixoLargura'])t[k]=Math.min(t[k],r[k]);for(const k of ['total','avaliadas','nc','suspeitas','semFaixa','somaDesvioAltura','somaDesvioLargura','ncAltura','ncLargura','vendido'])t[k]+=r[k]||0;}return t;}
function linhas(){const q=canonical($('busca').value),sel=$('mes').value;return D.linhas.filter(r=>r.tipo===tipo&&(!q||canonical(r.medida).includes(q))).flatMap(r=>Object.entries(r.mesesInspecao).filter(([m])=>!sel||m===sel).map(([m,s])=>({...s,mes:m,medida:r.medida,vendido:r.mesesVendas[m]||0})));}
function vendas(ms){const q=canonical($('busca').value);return D.linhas.filter(r=>r.tipo===tipo&&(!q||canonical(r.medida).includes(q))).reduce((a,r)=>a+ms.reduce((s,m)=>s+(r.mesesVendas[m]||0),0),0);}
function mean(t,k){return t.avaliadas?sinal(t[k]/t.avaliadas)+' mm':'Sem base';}
function chart(id,options){if(window.innerWidth<=760){options.grid={...(options.grid||{left:46,right:46,top:45,bottom:35}),left:58,right:38,top:60,bottom:60};options.xAxis={...options.xAxis,axisLabel:{interval:0,rotate:40,fontSize:10}};}if(!chartInstances[id])chartInstances[id]=echarts.init($(id),null,{renderer:'svg'});chartInstances[id].setOption({animation:false,textStyle:{fontFamily:'Inter,Arial',fontSize:10,color:'#6c8090'},tooltip:{trigger:'axis',textStyle:{fontSize:11}},grid:{left:46,right:46,top:45,bottom:35},legend:{top:3,right:8,itemWidth:10,itemHeight:8,textStyle:{fontSize:10,color:'#60798a'}},xAxis:{type:'category',axisTick:{show:false},axisLine:{lineStyle:{color:'#dce5ec'}}},yAxis:{type:'value',splitLine:{lineStyle:{color:'#c6d2dc',type:'dashed'}}},...options},true);}
function render(){const rs=linhas(),s=resumo(rs),ms=$('mes').value?[$('mes').value]:periodos(),ps=periodos(),q=$('busca').value;
$('tituloProcesso').textContent=nomes[tipo];$('periodo').textContent=ps.length?rotulo(ps[0])+' — '+rotulo(ps.at(-1)):'';
$('resumoPeriodo').textContent=(ms.length===1?rotulo(ms[0]):rotulo(ms[0])+' a '+rotulo(ms.at(-1)))+(q?' · medida '+q:' · todas as medidas');
$('kInspecoes').textContent=n(s.total);$('kNc').textContent=n(s.nc);$('baseInspecoes').textContent=n(s.avaliadas)+' inspeções avaliáveis';$('kTaxa').textContent=s.avaliadas?n(s.nc/s.avaliadas*100,2)+'% das inspeções avaliáveis':'Sem base avaliável';$('kAltura').textContent=mean(s,'somaDesvioAltura');$('kLargura').textContent=mean(s,'somaDesvioLargura');
for(const ax of ['Altura','Largura']){$('max'+ax).textContent=extremo(s['maxAcima'+ax]);$('min'+ax).textContent=extremo(s['minAbaixo'+ax]);$('nc'+ax).textContent=n(s['nc'+ax]);}
const monthly=ms.map(m=>resumo(rs.filter(r=>r.mes===m)));
chart('graficoMensal',{xAxis:{type:'category',data:ms.map(rotulo),axisTick:{show:false},axisLine:{lineStyle:{color:'#dce5ec'}}},yAxis:[{type:'value',name:'Inspeções',minInterval:1,splitLine:{lineStyle:{color:'#c6d2dc',type:'dashed'}}},{type:'value',name:'Não conformes',minInterval:1,splitLine:{show:false}}],series:[{name:'Inspeções',type:'bar',label:{show:true,position:'top',formatter:p=>n(p.value),color:cores[tipo],fontSize:11},barMaxWidth:34,itemStyle:{color:cores[tipo],borderRadius:[3,3,0,0]},data:monthly.map(v=>v.total)},{name:'Não conformes',type:'line',label:{show:true,position:'top',formatter:p=>n(p.value),color:'#b42318',fontSize:11,backgroundColor:'#eaf0f3',padding:[2,3]},yAxisIndex:1,symbolSize:6,itemStyle:{color:'#b42318'},lineStyle:{width:2},data:monthly.map(v=>v.nc)}]});
chart('graficoVendas',{xAxis:{type:'category',data:ms.map(rotulo),axisTick:{show:false},axisLine:{lineStyle:{color:'#dce5ec'}}},yAxis:{type:'value',name:'kg',axisLabel:{formatter:v=>n(v)},splitLine:{lineStyle:{color:'#c6d2dc',type:'dashed'}}},tooltip:{trigger:'axis',valueFormatter:v=>n(v,2)+' kg'},series:[{name:'Vendido',type:'bar',label:{show:true,position:'top',formatter:p=>n(p.value,2),color:cores[tipo],fontSize:10},barMaxWidth:34,itemStyle:{color:cores[tipo],opacity:.8,borderRadius:[3,3,0,0]},data:ms.map(m=>vendas([m]))}]});
renderTable(rs,s);
}
function numericCells(r){return '<td>'+n(r.vendido,2)+'</td><td>'+n(r.total)+'</td><td class="nc">'+n(r.nc)+'<small>'+n(r.avaliadas)+' avaliáveis</small></td>'+['Altura','Largura'].map(ax=>'<td>'+mean(r,'somaDesvio'+ax).replace(' mm','')+'</td><td class="'+(Math.round(r['maxAcima'+ax]*100)>0?'breach':'muted')+'">'+extremo(r['maxAcima'+ax]).replace(' mm','')+'</td><td class="'+(Math.round(r['minAbaixo'+ax]*100)<0?'breach':'muted')+'">'+extremo(r['minAbaixo'+ax]).replace(' mm','')+'</td>').join('');}
function renderTable(rs,s){const order=$('ordem').value;rs.sort((a,b)=>order==='nc'?b.nc-a.nc||a.mes.localeCompare(b.mes):order==='altura'?Math.max(b.maxAcimaAltura,-b.minAbaixoAltura)-Math.max(a.maxAcimaAltura,-a.minAbaixoAltura):order==='largura'?Math.max(b.maxAcimaLargura,-b.minAbaixoLargura)-Math.max(a.maxAcimaLargura,-a.minAbaixoLargura):a.mes.localeCompare(b.mes)||a.medida.localeCompare(b.medida,'pt-BR',{numeric:true}));$('tabela').innerHTML=rs.map(r=>'<tr><td>'+rotulo(r.mes)+'</td><td><strong>'+esc(r.medida)+'</strong></td><td><button class="abrir-inspecao" data-mes="'+r.mes+'" data-medida="'+esc(r.medida)+'">Abrir inspeção</button></td>'+numericCells(r)+'</tr>').join('')||'<tr><td colspan="12" class="empty">Nenhuma inspeção para este filtro.</td></tr>';$('totais').innerHTML=rs.length?'<tr><td colspan="3">TOTAL DO RECORTE</td>'+numericCells(s)+'</tr>':'';}
function selecionar(t){variacao.hidden=true; relatorio.hidden=false; abaVariacao.setAttribute('aria-selected','false'); abaVariacao.tabIndex=-1; tipo=t;for(const el of document.querySelectorAll('[data-tipo]')){const selected=el.dataset.tipo===t;el.setAttribute('aria-selected',selected);el.tabIndex=selected?0:-1;}$('relatorio').setAttribute('aria-labelledby',t==='nu'?'abaNu':'abaEmpapelado');const ps=periodos();$('mes').innerHTML='<option value="">Todos os meses</option>'+ps.map(m=>'<option value="'+m+'">'+rotulo(m)+'</option>').join('');$('busca').value='';render();}
for(const el of document.querySelectorAll('[data-tipo]')){el.addEventListener('click',()=>selecionar(el.dataset.tipo));el.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();selecionar(e.key==='Home'?'nu':e.key==='End'?'empapelado':tipo==='nu'?'empapelado':'nu');$(tipo==='nu'?'abaNu':'abaEmpapelado').focus();}});}
$('mes').addEventListener('change',render);$('busca').addEventListener('input',render);$('ordem').addEventListener('change',render);$('limpar').addEventListener('click',()=>{$('busca').value='';$('mes').value='';render();});
$('exportar').addEventListener('click',()=>{const header=['Processo','Mes','Medida','Vendido kg','Inspecoes','Avaliaveis','Nao conformes','Desvio medio altura mm','Acima max altura mm','Abaixo min altura mm','Desvio medio largura mm','Acima max largura mm','Abaixo min largura mm'];const decimal=v=>Number(v).toFixed(2).replace('.',',');const csv=[header,...linhas().map(r=>[nomes[tipo],r.mes,r.medida,decimal(r.vendido),r.total,r.avaliadas,r.nc,r.avaliadas?decimal(r.somaDesvioAltura/r.avaliadas):'',decimal(r.maxAcimaAltura),decimal(r.minAbaixoAltura),r.avaliadas?decimal(r.somaDesvioLargura/r.avaliadas):'',decimal(r.maxAcimaLargura),decimal(r.minAbaixoLargura)])].map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\r\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));a.download='Inspecoes-'+tipo+'-mensal.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);});
function resize(){Object.values(chartInstances).forEach(c=>c.resize());}window.addEventListener('resize',resize);window.addEventListener('beforeprint',resize);window.addEventListener('afterprint',resize);$('imprimir').addEventListener('click',()=>window.print());$('apresentar').addEventListener('click',()=>{if(document.fullscreenElement)document.exitFullscreen?.();else document.documentElement.requestFullscreen?.().catch(()=>{});});
selecionar('nu');document.fonts.ready.then(resize);

function descricaoCompleta(s){return String(s).replace(/\bALUM\.?/gi,'ALUMÍNIO').replace(/(\d+)\s*CP\b/gi,'$1 CAPAS DE PAPEL').replace(/\bIMP\b/gi,'IMPORTADO').replace(/\bNAC\b/gi,'NACIONAL');}
function foraDaFaixa(v,min,max){if(v==null||min==null||max==null)return false;const centesimos=x=>Math.round((Number(x)+Number.EPSILON)*100);return centesimos(v)<centesimos(min)||centesimos(v)>centesimos(max);}
function celulaMedida(v,min,max){const fora=foraDaFaixa(v,min,max);return '<td class="'+(fora?'breach':'')+'">'+(v==null?'—':n(v,2))+'</td>';}
$('tabela').addEventListener('click',event=>{const button=event.target.closest('[data-medida]');if(!button)return;
 const rows=(D.inspecoes||[]).filter(r=>r.tipo===tipo&&r.mes===button.dataset.mes&&r.medida===button.dataset.medida).sort((a,b)=>b.dataHora.localeCompare(a.dataHora));
 $('tituloDetalhe').textContent=nomes[tipo]+' · '+button.dataset.medida+' · '+rotulo(button.dataset.mes);
 $('resumoDetalhe').textContent=n(rows.length)+' inspeções · valores em milímetros';
 $('registrosDetalhe').innerHTML=rows.map(r=>'<tr><td>'+esc(new Date(r.dataHora).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}))+'<small>OP '+esc(r.op)+' · ID '+r.id+'</small>'+(r.correcao?'<small class="op-aproximada">'+esc(r.correcao.criterio)+'<br>OP original: '+esc(r.correcao.opOriginal)+(r.correcao.idReferencia?' | ID referencia '+r.correcao.idReferencia:'')+'</small>':'')+'</td><td>'+esc(r.inspetor)+'</td><td class="descricao-fio">'+esc(descricaoCompleta(r.descricao))+(r.capas?'<small>Capas registradas nesta inspeção: '+r.capas+' CP</small>':'')+(descricaoCompleta(r.descricao)!==r.descricao?'<small>Cadastrado: '+esc(r.descricao)+'</small>':'')+'</td>'+celulaMedida(r.altura,r.minAltura,r.maxAltura)+celulaMedida(r.minAltura)+celulaMedida(r.maxAltura)+celulaMedida(r.largura,r.minLargura,r.maxLargura)+celulaMedida(r.minLargura)+celulaMedida(r.maxLargura)+'<td>'+esc(r.situacao)+'</td></tr>').join('');
 $('dialogoInspecoes').showModal();
});
$('fecharDetalhe').addEventListener('click',()=>$('dialogoInspecoes').close());

function medidasVariacao(){
 const processo=$('processoVariacao').value;
 const rows=D.linhas.filter(r=>r.tipo===processo).sort((a,b)=>a.medida.localeCompare(b.medida,'pt-BR',{numeric:true}));
 $('medidaVariacao').innerHTML=rows.map(r=>'<option value="'+esc(r.medida)+'">'+esc(r.medida)+'</option>').join('');
 renderVariacao();
}
function renderVariacao(){
 const processo=$('processoVariacao').value,medida=$('medidaVariacao').value;
 const row=D.linhas.find(r=>r.tipo===processo&&r.medida===medida);
 $('tituloVariacao').textContent=nomes[processo]+' · '+medida;
 if(!row)return;
 const keys=D.linhas.filter(r=>r.tipo===processo).flatMap(r=>Object.keys(r.mesesInspecao)).sort();
 const months=[];let m=keys[0];while(m&&m<=keys.at(-1)){months.push(m);let [y,k]=m.split('-').map(Number);if(++k>12){k=1;y++;}m=y+'-'+String(k).padStart(2,'0');}
 chart('graficoVariacao',{grid:{left:75,right:35,top:60,bottom:45},tooltip:{trigger:'axis',valueFormatter:v=>v==null?'Sem base':sinal(v,3)+' mm'},xAxis:{type:'category',data:months.map(rotulo),axisLabel:{interval:0,rotate:20}},yAxis:{type:'value',name:'Desvio médio · mm',axisLabel:{formatter:v=>n(v,3)},splitLine:{lineStyle:{color:'#c6d2dc',type:'dashed'}}},series:[['Altura','somaDesvioAltura','#385f8c'],['Largura','somaDesvioLargura','#168a80']].map(([name,key,color],i)=>({name,type:'line',connectNulls:false,symbolSize:8,lineStyle:{width:3},itemStyle:{color},label:{show:true,position:i?'bottom':'top',formatter:p=>p.value==null?'':sinal(p.value,3),fontSize:10},data:months.map(m=>{const r=row.mesesInspecao[m];return r?.avaliadas?r[key]/r.avaliadas:null;}),...(i?{}:{markLine:{silent:true,symbol:'none',label:{formatter:'Centro da faixa'},lineStyle:{color:'#6b8192',type:'dashed'},data:[{yAxis:0}]}})}))});
}
$('abaVariacao').addEventListener('click',()=>{
 $('relatorio').hidden=true;$('variacao').hidden=false;
 for(const el of document.querySelectorAll('[data-tipo]')){el.setAttribute('aria-selected','false');el.tabIndex=-1;}
 $('abaVariacao').setAttribute('aria-selected','true');$('abaVariacao').tabIndex=0;
 if(!$('medidaVariacao').options.length){medidasVariacao();}else{renderVariacao();}resize();
});
$('processoVariacao').addEventListener('change',medidasVariacao);
$('medidaVariacao').addEventListener('change',renderVariacao);
const processTabs=[$('abaNu'),$('abaEmpapelado'),$('abaVariacao')];
for(const tab of processTabs)tab.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();e.stopImmediatePropagation();let i=processTabs.indexOf(tab);i=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3;processTabs[i].click();processTabs[i].focus();},true);
// Redimensiona cada grafico a partir do tamanho real do seu painel.
const chartSizeObserver = new ResizeObserver(entries=>{
 for(const {target,contentRect} of entries){
  const instance=chartInstances[target.id];
  if(instance&&contentRect.width>0&&contentRect.height>0)instance.resize({width:contentRect.width,height:contentRect.height});
 }
});
for(const el of document.querySelectorAll('.chart'))chartSizeObserver.observe(el);
window.addEventListener('load',()=>requestAnimationFrame(resize));