async function initializeTroubleshooting() {
  const meta=sections.find(item=>item.id==='troubleshooting');
  const content=await window.qaKnowledge.load(meta);
  const nav=document.getElementById('topic-nav'),article=document.getElementById('module-content');
  document.getElementById('module-title').textContent='Troubleshooting';
  document.getElementById('module-description').textContent='Выберите симптом. Найдите границу сбоя, проверьте гипотезу и соберите доказательства.';
  nav.append(element('h2','','Что пошло не так?'));
  for(const topic of content.topics){
    const link=element('a','',topic.title);link.href='#'+topic.id;link.dataset.symptom=topic.id;nav.append(link);
    link.addEventListener('click',event=>{
      if(event.button!==0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)return;
      event.preventDefault();
      if(location.hash!=='#'+topic.id)history.pushState(null,'',location.pathname+location.search+'#'+topic.id);
      render(true);
    });
  }
  let selected;
  function render(scroll=false){
    let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{id='';}
    const topic=content.topics.find(item=>item.id===id)||content.topics[0];
    if(topic.id!==id)history.replaceState(null,'',location.pathname+location.search+'#'+topic.id);
    if(selected===topic.id){
      if(scroll){document.getElementById('symptom-title').focus({preventScroll:true});article.scrollIntoView({block:'start'});}
      return;
    }
    selected=topic.id;
    document.title=topic.title+' — Troubleshooting | qaHelp';
    nav.querySelectorAll('a').forEach(link=>{
      if(link.dataset.symptom===selected)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');
    });
    const section=element('section','article-topic diagnostic-scenario');section.id=topic.id;
    const title=element('h2','',topic.title);title.id='symptom-title';title.tabIndex=-1;
    section.setAttribute('aria-labelledby',title.id);
    section.append(title,element('aside','content-note','Симптом не доказывает причину. Проверяйте только относящиеся к случаю слои; если нет доступа к логам или БД, зафиксируйте это и запросите данные у владельца.'));
    section.append(...topic.blocks.map(renderBlock));
    const source=element('details','diagnostic-sources');source.append(element('summary','','Официальная документация'));
    for(const [label,href] of content.sources){const p=element('p'),a=element('a','',label);a.href=href;p.append(a);source.append(p);}
    section.append(source);article.replaceChildren(section);
    if(scroll){title.focus({preventScroll:true});section.scrollIntoView({block:'start'});}
    document.body.dataset.ready='true';
  }
  window.addEventListener('hashchange',()=>render(true));
  window.addEventListener('popstate',()=>render(true));
  render(Boolean(location.hash));
}
initializeTroubleshooting().catch(error=>{
  document.getElementById('module-status').textContent=error.message;
  document.body.dataset.ready='error';
});
