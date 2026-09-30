async function initializeHttpFinder() {
  const data=await window.qaKnowledge.load(sections.find(s=>s.id==='http-codes'));
  const content=document.getElementById('code-groups'),nav=document.getElementById('category-nav');
  const search=document.getElementById('status-search'),status=document.getElementById('finder-status');
  const filters=new Map();let group='all';
  const cleanHref=hash=>{
    const url=new URL(location.href);url.searchParams.delete('status-search');url.searchParams.delete('status-class');url.hash=hash;
    return url.pathname+url.search+url.hash;
  };
  function link(text,hash){const a=element('a','',text);a.href=cleanHref(hash);a.dataset.finderTarget=hash;return a;}
  function localNavigation(event){
    const a=event.target.closest('a[data-finder-target]');
    if(!a || event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)return;
    event.preventDefault();history.pushState(null,'',cleanHref(a.dataset.finderTarget));restore(true);
  }
  document.getElementById('http-finder').addEventListener('click',localNavigation);
  for(const [id,title] of [['all','Все'],...httpGroups.map(g=>[g.prefix,g.prefix+' · '+g.title])]) {
    const b=element('button','category-link',title);b.type='button';b.dataset.statusClass=id;
    b.addEventListener('click',()=>{group=id;save(true);render();});nav.append(b);filters.set(id,b);
  }
  const compareNav=document.getElementById('comparison-nav'),comparisonContent=document.getElementById('status-comparisons');
  for(const comparison of data.comparisons){
    compareNav.append(link(comparison.title,'compare-'+comparison.id));
    const section=element('section','article-topic status-comparison');section.id='compare-'+comparison.id;
    const title=element('h3','',comparison.title);title.tabIndex=-1;section.append(title);
    const list=element('ul');comparison.points.forEach(text=>list.append(element('li','',text)));section.append(list);
    const related=element('p','finder-links');comparison.codes.forEach(code=>related.append(link('Открыть '+code,'status-'+code)));section.append(related);comparisonContent.append(section);
  }
  for(const [label,href] of data.sources){const a=element('a','',label);a.href=href;document.getElementById('finder-sources').append(a);}
  function save(push=false){
    const url=new URL(location.href);url.hash='';
    if(search.value.trim())url.searchParams.set('status-search',search.value.trim());else url.searchParams.delete('status-search');
    if(group!=='all')url.searchParams.set('status-class',group);else url.searchParams.delete('status-class');
    history[push?'pushState':'replaceState'](null,'',url.pathname+url.search);
  }
  function render(){
    const matches=data.find(search.value,group);content.replaceChildren();
    filters.forEach((b,id)=>b.setAttribute('aria-pressed',String(id===group)));
    status.textContent=matches.length?`Найдено статусов: ${matches.length} из ${data.items.length}.`:'Ничего не найдено. Измените запрос или сбросьте фильтры.';
    for(const g of httpGroups){
      const items=matches.filter(i=>i.group===g.prefix);if(!items.length)continue;
      const section=element('section','code-group tone-'+g.prefix);section.id='codes-'+g.prefix;
      const heading=element('h2','group-title',g.prefix+' · '+g.title);heading.tabIndex=-1;section.append(heading,element('p','group-description',g.description));
      for(const item of items){
        const card=element('article','code-row status-card');card.id='status-'+item.code;
        const title=element('h3');title.tabIndex=-1;title.append(element('span','status-code',item.code),document.createTextNode(' '+item.name));
        card.append(title,element('p','',item.description));
        const detail=element('details');detail.append(element('summary','','Пример, проверки QA и похожие статусы'));
        detail.append(element('h4','','Типичный пример'),element('p','',item.example),element('h4','','Что проверить QA'));
        const list=element('ul');item.checks.forEach(text=>list.append(element('li','',text)));detail.append(list,element('h4','','Похожие статусы'));
        const similar=element('p','finder-links');item.similar.forEach(code=>similar.append(link(String(code),'status-'+code)));detail.append(similar,element('h4','','В чём отличие'),element('p','',item.difference));
        const comparisons=element('p','finder-links');data.comparisons.filter(c=>c.codes.includes(item.code)).forEach(c=>comparisons.append(link('Сравнить '+c.title,'compare-'+c.id)));detail.append(comparisons);
        const material=element('a','back-link','HTTP: связанный материал →');material.href=withQuery(item.href);detail.append(material);card.append(detail,link('Ссылка на '+item.code,'status-'+item.code));section.append(card);
      }
      content.append(section);
    }
  }
  function restore(focus=false){
    const params=new URLSearchParams(location.search);search.value=(params.get('status-search')||'').slice(0,300);group=filters.has(params.get('status-class'))?params.get('status-class'):'all';
    render();let hash;try{hash=decodeURIComponent(location.hash.slice(1));}catch{hash='';}
    // A saved status/group link must remain reachable even with conflicting filters.
    const known=data.topics.some(t=>t.id===hash);
    if(known && !document.getElementById(hash)){search.value='';group='all';const url=cleanHref(hash);history.replaceState(null,'',url);render();}
    const target=known?document.getElementById(hash):null;
    if(target){const detail=target.querySelector('details');if(detail)detail.open=true;target.scrollIntoView({block:'start',behavior:'instant'});if(focus)target.querySelector('h2,h3')?.focus({preventScroll:true});}
  }
  search.addEventListener('input',()=>{save();render();});
  document.getElementById('finder-form').addEventListener('submit',event=>{event.preventDefault();save();render();});
  document.getElementById('finder-reset').addEventListener('click',()=>{search.value='';group='all';save(true);render();search.focus();});
  window.addEventListener('popstate',()=>restore(true));window.addEventListener('hashchange',()=>restore(true));
  restore(Boolean(location.hash));document.body.dataset.ready='true';
}
initializeHttpFinder().catch(error=>{document.getElementById('finder-status').textContent=error.message;document.body.dataset.ready='error';});
