window.qaChecklistTools = (() => {
  const normalize = value => String(value).toLocaleLowerCase('ru').replaceAll('ё', 'е');
  const words = query => normalize(query).trim().split(/\s+/).filter(Boolean);
  const matches = (text, terms) => terms.every(term => normalize(text).includes(term));
  function find(scenarios, query, category = '') {
    const terms = words(query);
    return scenarios.filter(s => !category || s.id === category).map(scenario => {
      const items = scenario.blocks[0].items;
      const matching = matches(scenario.title, terms) ? items : items.filter(item => matches(scenario.title + ' ' + item.title + ' ' + item.expected, terms));
      return {scenario, matching};
    }).filter(result => result.matching.length);
  }
  function exportText(scenario, checked, format) {
    const markdown = format === 'markdown';
    const escape = text => markdown ? String(text).replace(/([\\`*_{}\[\]<>()#+.!|~-])/g, '\\$1') : String(text);
    return (markdown ? '# ' : '') + escape(scenario.title) + '\n\n' + scenario.blocks[0].items.map(item =>
      (markdown ? '- ' : '') + '[' + (checked.has(item.id) ? 'x' : ' ') + '] ' + escape(item.title) + ' — ' + escape(item.expected)).join('\n');
  }
  return {normalize, words, find, exportText};
})();

async function initializeChecklists() {
  const meta = sections.find(section => section.id === 'what-to-test');
  const {topics: scenarios} = await window.qaKnowledge.load(meta);
  const nav = document.getElementById('topic-nav'), article = document.getElementById('module-content'), status = document.getElementById('module-status');
  const tools = window.qaChecklistTools;
  const kinds = {positive:'Позитивная',negative:'Негативная',boundary:'Граничная','ui-ux':'UI/UX',technical:'Техническая'};
  document.getElementById('module-title').textContent = meta.title;
  document.getElementById('module-description').textContent = 'Готовые проверки для типовых функций. Галочка означает «проверено», а не Pass.';
  document.title = 'Что проверить? — библиотека QA-checklist’ов | qaHelp';
  nav.append(element('h2', '', 'Библиотека проверок'));
  const searchLabel = element('label', '', 'Найти проверку'); searchLabel.htmlFor = 'checklist-search';
  const search = element('input'); search.id = 'checklist-search'; search.type = 'search'; search.placeholder = 'Например, срок действия'; search.setAttribute('aria-controls','scenario-results');
  const categoryLabel = element('label', '', 'Категория'); categoryLabel.htmlFor = 'checklist-category';
  const category = element('select'); category.id = 'checklist-category';
  for (const [value,title] of [['','Все категории'],...scenarios.map(s=>[s.id,s.title])]) {const o=element('option','',title);o.value=value;category.append(o);}
  const count = element('p','scenario-count'); count.setAttribute('role','status');
  const results = element('div','scenario-results'); results.id='scenario-results';
  const clear = element('button','clear-results','Очистить поиск и фильтр'); clear.type='button';
  nav.append(searchLabel,search,categoryLabel,category,clear,count,results);
  const states=new Map(); let current, undo=null, exportFormat='markdown';
  const key=id=>'qaHelpers.checklists.v1.'+id;
  const warning=()=>{status.textContent='Сохранение недоступно. Отметки останутся только до закрытия или обновления страницы.';};
  function read(scenario) {
    if(states.has(scenario.id))return states.get(scenario.id);
    let checked=new Set();
    try {
      const raw=localStorage.getItem(key(scenario.id));
      if(raw)try {
        const saved=JSON.parse(raw),allowed=new Set(scenario.blocks[0].items.map(i=>i.id));
        if(Array.isArray(saved))checked=new Set(saved.filter(id=>typeof id==='string'&&allowed.has(id)));
      }catch{/* Ignore malformed saved JSON. */}
    }catch{warning();}
    states.set(scenario.id,checked);return checked;
  }
  function save(){try{localStorage.setItem(key(current.id),JSON.stringify([...read(current)]));}catch{warning();}}
  function highlight(node,text) {
    const normalized=tools.normalize(text),marked=new Uint8Array(text.length);
    for(const term of tools.words(search.value)) {
      let start=normalized.indexOf(term);
      while(start>=0){marked.fill(1,start,start+term.length);start=normalized.indexOf(term,start+term.length);}
    }
    node.replaceChildren();
    for(let start=0;start<text.length;){let end=start+1;while(end<text.length&&marked[end]===marked[start])end++;const part=text.slice(start,end);node.append(marked[start]?element('mark','',part):document.createTextNode(part));start=end;}
  }
  function highlightArticle(){article.querySelectorAll('[data-highlight]').forEach(node=>highlight(node,node.dataset.highlight));}
  function renderChoices() {
    results.replaceChildren();
    const found=tools.find(scenarios,search.value,category.value);
    count.textContent='Категорий: '+found.length+' из '+scenarios.length; clear.hidden=!search.value&&!category.value;
    for(const {scenario,matching} of found) {
      const link=element('a');link.href='#'+scenario.id;link.dataset.scenario=scenario.id;
      if(current?.id===scenario.id)link.setAttribute('aria-current','true');
      const title=element('strong');highlight(title,scenario.title);link.append(title,element('span','scenario-match','Пунктов: '+matching.length));
      if(search.value.trim()){const first=matching[0],snippet=element('span','scenario-snippet');highlight(snippet,window.qaKnowledge.excerpt(first.title+' — '+first.expected,search.value));link.append(snippet);}
      results.append(link);
    }
    if(!found.length)results.append(element('p','scenario-empty','Совпадений нет. Измените запрос или очистите поиск и фильтр. Открытый чек-лист остаётся доступным.'));
    highlightArticle();
  }
  function saveFilters() {
    const url=new URL(location.href);
    for(const [name,value] of [['checklist-search',search.value],['category',category.value]]){if(value)url.searchParams.set(name,value);else url.searchParams.delete(name);}
    history.replaceState(null,'',url.pathname+url.search+url.hash);renderChoices();
  }
  search.addEventListener('input',saveFilters);category.addEventListener('change',saveFilters);
  clear.addEventListener('click',()=>{search.value='';category.value='';saveFilters();search.focus();});
  function renderArticle(scroll) {
    undo=null; const checked=read(current),items=current.blocks[0].items;
    article.replaceChildren();
    const section=element('section','article-topic interactive-checklist');section.id=current.id;section.append(element('h2','',current.title));
    if(current.notice)section.append(element('p','content-note',current.notice));
    const counter=element('p','check-counter');counter.setAttribute('role','status');
    const progress=element('progress','check-progress');progress.max=items.length;progress.setAttribute('aria-label','Прогресс проверки');
    const toolbar=element('div','check-toolbar');
    const button=(action,text)=>{const b=element('button','clear-results',text);b.type='button';b.dataset.action=action;return b;};
    const copy=button('copy','Скопировать checklist'),reset=button('reset','Сбросить'),restore=button('undo','Отменить'),all=button('all','Отметить всё');restore.hidden=true;
    const formatLabel=element('label','export-format','Формат копирования'),format=element('select');format.id='checklist-format';formatLabel.htmlFor=format.id;
    for(const [value,text] of [['markdown','Markdown'],['text','Plain text']]){const o=element('option','',text);o.value=value;format.append(o);}
    format.value=exportFormat;format.addEventListener('change',()=>{exportFormat=format.value;});formatLabel.append(format);toolbar.append(copy,reset,restore,all);
    const message=element('p','check-message');message.setAttribute('role','status');
    const list=element('div','check-items');
    const update=()=>{counter.textContent='Проверено '+checked.size+' из '+items.length+' · '+Math.round(100*checked.size/items.length)+'%';progress.value=checked.size;progress.textContent=counter.textContent;reset.disabled=!checked.size;all.disabled=checked.size===items.length;list.querySelectorAll('input').forEach(input=>{input.checked=checked.has(input.value);});};
    const invalidateUndo=()=>{undo=null;restore.hidden=true;message.textContent='';};
    for(const item of items){
      const row=element('label','check-item'),input=element('input');input.type='checkbox';input.value=item.id;input.id='check-'+current.id+'-'+item.id;
      const text=element('span','check-text'),title=element('strong'),expected=element('span');title.id=input.id+'-title';expected.id=input.id+'-expected';
      title.dataset.highlight=item.title;expected.dataset.highlight=item.expected;title.textContent=item.title;expected.textContent=item.expected;
      input.setAttribute('aria-labelledby',title.id);input.setAttribute('aria-describedby',expected.id);
      const tags=element('span','check-tags');item.kinds.forEach(kind=>tags.append(element('span','check-tag',kinds[kind])));
      text.append(title,expected,tags);row.append(input,text);list.append(row);
      input.addEventListener('change',()=>{if(input.checked)checked.add(item.id);else checked.delete(item.id);invalidateUndo();save();update();});
    }
    reset.addEventListener('click',()=>{undo=new Set(checked);checked.clear();save();update();restore.hidden=false;message.textContent='Отметки этого сценария сброшены.';restore.focus();});
    restore.addEventListener('click',()=>{if(!undo)return;undo.forEach(id=>checked.add(id));invalidateUndo();save();update();message.textContent='Отметки восстановлены.';reset.focus();});
    all.addEventListener('click',()=>{items.forEach(item=>checked.add(item.id));invalidateUndo();save();update();message.textContent='Отмечены все пункты открытого чек-листа.';reset.focus();});
    copy.addEventListener('click',async()=>{const text=tools.exportText(current,checked,format.value);try{await navigator.clipboard.writeText(text);message.textContent='Чек-лист скопирован.';}catch{message.textContent='Не удалось скопировать. Выделите текст списка вручную.';}});
    section.append(counter,progress,element('p','check-scope','Действия и копирование применяются ко всему открытому чек-листу, независимо от поиска.'),formatLabel,toolbar,message,list);
    article.append(section);update();highlightArticle();if(scroll)section.scrollIntoView({block:'start'});
  }
  function restoreUrl(scroll=false) {
    const url=new URL(location.href);search.value=url.searchParams.get('checklist-search')||'';
    const requested=url.searchParams.get('category')||'';category.value=scenarios.some(s=>s.id===requested)?requested:'';
    if(requested&&!category.value)url.searchParams.delete('category');
    let id;try{id=decodeURIComponent(url.hash.slice(1));}catch{id='';}
    const next=scenarios.find(s=>s.id===id)||scenarios[0];if(next.id!==id)url.hash=next.id;
    if(url.href!==location.href)history.replaceState(null,'',url.pathname+url.search+url.hash);
    const changed=current?.id!==next.id;current=next;if(changed)renderArticle(scroll);
    renderChoices();document.body.dataset.ready='true';
  }
  window.addEventListener('hashchange',()=>restoreUrl(true));window.addEventListener('popstate',()=>restoreUrl(true));restoreUrl(Boolean(location.hash));
}
if(document.body?.dataset.page==='checklists')initializeChecklists().catch(error=>{document.getElementById('module-status').textContent=error.message;document.body.dataset.ready='error';});
