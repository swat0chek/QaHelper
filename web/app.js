function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const { sections, httpGroups } = window.qaData;

// Small local vector icons; no external fonts or image requests.
const iconPaths = {
  check: 'M5 3h14v18H5z M8 12l3 3 5-6',
  laptop: 'M4 4h16v13H4z M2 20h20l-2-3H4z M10 18h4',
  api: 'M8 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M21 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M21 19a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M8 11l7-5 M8 13l7 5',
  database: 'M20 5c0 2-3.6 3-8 3S4 7 4 5s3.6-3 8-3 8 1 8 3 M4 5v14c0 2 3.6 3 8 3s8-1 8-3V5 M4 10c0 2 3.6 3 8 3s8-1 8-3 M4 15c0 2 3.6 3 8 3s8-1 8-3',
  book: 'M12 5Q7 1 3 4v15q5-3 9 1 4-4 9-1V4q-4-3-9 1v15 M6 7h2 M6 10h2 M16 7h2 M16 10h2',
  bolt: 'm13 2-9 12h7l-1 8L21 9h-8z',
  gear: 'm10 2-1 3-3-1-2 3 2 2-1 3-3 1 1 4 3 0 2 2 0 3 4 0 1-3 3-1 2 1 2-3-2-2 1-3 2-1-1-3-3 0-2-2V2z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  heart: 'M12 21 3 12C-3 4 7-1 12 6 17-1 27 4 21 12z'
};

function icon(name) {
  if (!iconPaths[name]) return element('span', 'card-icon-text', name === 'http' ? 'HTTP' : name);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.7');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', iconPaths[name]);
  svg.append(path);
  return svg;
}

document.querySelectorAll('[data-icon]').forEach(node => node.append(icon(node.dataset.icon)));

function renderCatalog() {
  document.querySelector('.catalog-heading span').textContent = sections.length + ' раздела · от основ к практике';
  const grid = document.getElementById('section-grid');
  for (const section of sections) {
    const card = element(section.href ? 'a' : 'article', `section-card${section.href ? '' : ' card-pending'}`);
    card.dataset.color = section.color || 'purple';
    if (section.href) card.href = section.href;
    const top = element('div', 'card-top');
    const cardIcon = element('span', 'card-icon');
    cardIcon.setAttribute('aria-hidden', 'true');
    cardIcon.append(icon(section.icon));
    top.append(cardIcon);
    if (!section.href) top.append(element('span', 'card-label', 'Скоро'));
    const bottom = element('div', 'card-bottom');
    const arrow = element('span', 'card-arrow', '→');
    arrow.setAttribute('aria-hidden', 'true');
    bottom.append(arrow);
    card.append(top, element('h3', '', section.title), element('p', 'card-description', section.description), bottom);
    grid.append(card);
  }
}

if (document.body.dataset.page === 'http-codes') {
  const navigation = document.getElementById('category-nav');
  const content = document.getElementById('code-groups');
  for (const group of httpGroups) {
    const link = element('a', `category-link tone-${group.prefix}`, `${group.prefix} · ${group.title}`);
    link.href = `#codes-${group.prefix}`;
    navigation.append(link);
    const section = element('section', `code-group tone-${group.prefix}`);
    section.id = `codes-${group.prefix}`;
    const heading = element('h2', 'group-title');
    heading.id = `title-${group.prefix}`;
    heading.append(element('span', 'group-prefix', group.prefix), document.createTextNode(group.title));
    section.setAttribute('aria-labelledby', heading.id);
    section.append(heading, element('p', 'group-description', group.description));
    const list = element('dl', 'code-list');
    for (const [code, name, description] of group.codes) {
      const row = element('div', 'code-row');
      const term = element('dt');
      term.append(element('span', 'status-code', code), element('span', 'status-name', name));
      row.append(term, element('dd', '', description));
      list.append(row);
    }
    section.append(list);
    content.append(section);
  }
}

const query = () => new URLSearchParams(location.search).get('q') || '';
function withQuery(href) {
  const url = new URL(href, location.origin);
  if (query()) url.searchParams.set('q', query());
  return url.pathname + url.search + url.hash;
}
function updateReturnLinks() {
  document.querySelectorAll('.return-link').forEach(link => {
    link.href = withQuery('/#library');
    link.textContent = query() ? '← К результатам поиска' : '← Все разделы';
  });
}
updateReturnLinks();

function renderDiagram(block) {
  const figure = element('figure', 'architecture-diagram');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 720 105');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', block.labels.join(' → '));
  const make = (tag, attrs, text) => {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([key,value]) => node.setAttribute(key,value));
    if (text) node.textContent = text;
    svg.append(node);
    return node;
  };
  block.labels.forEach((label, i) => {
    const x = i * 245;
    make('rect', {x:x+5,y:15,width:215,height:65,rx:13,fill:'#eee9ff',stroke:'#b6a8e5'});
    make('text', {x:x+112,y:54,'text-anchor':'middle',fill:'#3d326a','font-size':17},label);
    if (i < block.labels.length-1) make('path', {d:`M${x+222} 48h20m-7-6 7 6-7 6`,fill:'none',stroke:'#7863bc','stroke-width':2});
  });
  const viewport = element('div', 'diagram-scroll');
  viewport.append(svg);
  figure.append(viewport,element('figcaption','',block.text));
  return figure;
}
function renderBlock(block) {
  switch (block.type) {
    case 'heading': return element('h3','',block.text);
    case 'paragraph': return element('p','',block.text);
    case 'note': return element('aside','content-note',block.text);
    case 'list':
    case 'ordered-list': {
      const list = element(block.type === 'ordered-list' ? 'ol' : 'ul');
      block.items.forEach(text => list.append(element('li','',text)));
      return list;
    }
    case 'table': {
      const wrapper = element('div','table-scroll');
      wrapper.tabIndex = 0;
      wrapper.setAttribute('role','region');
      wrapper.setAttribute('aria-label','Таблица: ' + block.headers.join(', '));
      const table = element('table');
      const head = element('thead'), header = element('tr'), body = element('tbody');
      block.headers.forEach(text => {const cell = element('th','',text); cell.scope = 'col'; header.append(cell);});
      head.append(header);
      block.rows.forEach(values => {
        const row = element('tr');
        values.forEach(text => row.append(element('td','',text)));
        body.append(row);
      });
      table.append(head,body); wrapper.append(table); return wrapper;
    }
    case 'code': {
      const wrapper = element('div','code-example');
      const top = element('div','code-toolbar');
      const button = element('button','copy-button','Копировать');
      button.type = 'button';
      button.setAttribute('aria-label','Копировать пример ' + block.language);
      const status = element('span','copy-status');
      status.setAttribute('role','status');
      button.addEventListener('click',async () => {
        try {
          await navigator.clipboard.writeText(block.text);
          status.textContent = 'Скопировано';
        } catch {
          status.textContent = 'Не удалось скопировать. Выделите текст вручную.';
        }
      });
      const pre = element('pre'); pre.tabIndex = 0;
      pre.append(element('code','',block.text));
      top.append(element('span','',block.language),button);
      wrapper.append(top,pre,status); return wrapper;
    }
    case 'diagram': return renderDiagram(block);
    case 'links': {
      const links = element('ul','related-links');
      block.items.forEach(([title,href]) => {
        const row = element('li'), link = element('a','',title);
        link.href = withQuery(href); row.append(link); links.append(row);
      });
      return links;
    }
    default: throw new Error('Неизвестный тип материала: ' + block.type);
  }
}
async function renderModule() {
  const meta = sections.find(item => item.href === location.pathname);
  if (!meta) throw new Error('Раздел не найден');
  document.title = meta.title + ' — QA Helpers';
  document.getElementById('module-title').textContent = meta.title;
  document.getElementById('module-description').textContent = meta.description;
  const content = await window.qaKnowledge.load(meta);
  const nav = document.getElementById('topic-nav');
  nav.append(element('h2','','В этом разделе'));
  const article = document.getElementById('module-content');
  for (const topic of content.topics) {
    const link = element('a','',topic.title); link.href = '#' + topic.id; nav.append(link);
    const section = element('section','article-topic'); section.id = topic.id;
    const title = element('h2','',topic.title); title.id = 'heading-' + topic.id;
    section.setAttribute('aria-labelledby',title.id);
    section.append(title,...topic.blocks.map(renderBlock)); article.append(section);
  }
  if (content.sources.length) {
    const sourceSection = element('section','article-topic sources');
    sourceSection.append(element('h2','','Документация и источники'));
    const list = element('ul');
    for (const [title,href] of content.sources) {
      const row = element('li'), link = element('a','',title);
      link.href = href; row.append(link); list.append(row);
    }
    sourceSection.append(list); article.append(sourceSection);
  }
  if (location.hash) {
    try { document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView(); } catch { /* Invalid fragments do not prevent reading. */ }
  }
  document.body.dataset.ready = 'true';
}

async function initializeSearch() {
  renderCatalog();
  const input = document.getElementById('knowledge-search');
  const reset = document.getElementById('search-reset');
  const status = document.getElementById('search-status');
  const results = document.getElementById('search-results');
  const grid = document.getElementById('section-grid');
  let entries = null, loadError = null;
  input.value = query();
  function renderSearch() {
    const text = input.value.trim();
    reset.hidden = !text;
    grid.hidden = Boolean(text);
    results.hidden = !text;
    results.replaceChildren();
    if (!text) {status.textContent = ''; return;}
    if (!entries) {
      status.textContent = loadError || 'Загружаем материалы для поиска…';
      return;
    }
    const found = window.qaKnowledge.search(entries,text);
    status.textContent = 'Найдено тем: ' + found.length;
    if (!found.length) {
      results.append(element('p','empty-results','Ничего не найдено. Попробуйте другое слово или очистите поиск.'));
      const button = element('button','clear-results','Сбросить поиск');
      button.type = 'button'; button.addEventListener('click',clear); results.append(button);
    }
    for (const item of found) {
      const link = element('a','search-result'); link.href = withQuery(item.href);
      link.append(element('span','result-module',item.module),element('h3','',item.title),
        element('p','',window.qaKnowledge.excerpt(item.text,text)));
      results.append(link);
    }
  }
  function save() {
    const url = new URL(location.href);
    if (input.value.trim()) url.searchParams.set('q',input.value.trim()); else url.searchParams.delete('q');
    history.replaceState(null,'',url.pathname + url.search + url.hash);
    renderSearch();
  }
  function clear() {input.value = ''; save(); input.focus();}
  reset.addEventListener('click',clear);
  input.addEventListener('input',save);
  input.addEventListener('keydown',event => {if (event.key === 'Escape') clear();});
  window.addEventListener('popstate',() => {input.value = query(); renderSearch();});
  window.addEventListener('pageshow',() => {input.value = query(); renderSearch();});
  renderSearch();
  try {
    const contents = await Promise.all(sections.map(window.qaKnowledge.load));
    entries = window.qaKnowledge.index(sections,contents);
  } catch (error) {
    loadError = error.message;
  }
  renderSearch();
  document.body.dataset.ready = loadError ? 'error' : 'true';
  if (query().trim()) document.getElementById('library').scrollIntoView({block: 'start', behavior: 'instant'});
}

if (document.body.dataset.page === 'home') {
  document.querySelectorAll('a[href="#library"]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    if (location.hash !== '#library') history.pushState(null, '', location.pathname + location.search + '#library');
    document.getElementById('library-title').focus({preventScroll: true});
    document.getElementById('library').scrollIntoView({block: 'start'});
  }));
}
document.querySelectorAll('.skip-link').forEach(link => link.addEventListener('click', () => {
  document.getElementById('main-content').focus({preventScroll: true});
}));
if (document.body.dataset.page === 'practice') document.body.dataset.ready = 'true';
if (document.body.dataset.page === 'home') initializeSearch();
if (document.body.dataset.page === 'module') renderModule().catch(error => {
  document.getElementById('module-status').textContent = error.message;
  document.body.dataset.ready = 'error';
});
if (document.body.dataset.page === 'http-codes') document.body.dataset.ready = 'true';
