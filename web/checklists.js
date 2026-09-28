// One independent set of stable item IDs per scenario and browser origin.
async function initializeChecklists() {
  const meta = sections.find(section => section.id === 'what-to-test');
  const content = await window.qaKnowledge.load(meta);
  const scenarios = content.topics;
  const nav = document.getElementById('topic-nav');
  const article = document.getElementById('module-content');
  const status = document.getElementById('module-status');
  document.getElementById('module-title').textContent = meta.title;
  document.getElementById('module-description').textContent = 'Выберите сценарий и отмечайте проверенное. Галочка означает «проверено», а не Pass.';
  document.title = meta.title + ' — QA Helpers';
  nav.append(element('h2', '', 'Что вы тестируете?'));
  const states = new Map();
  let current, undo = null;
  const key = id => 'qaHelpers.checklists.v1.' + id;
  function storageWarning() {
    status.textContent = 'Сохранение недоступно. Отметки останутся только до закрытия или обновления страницы.';
  }
  function read(scenario) {
    if (states.has(scenario.id)) return states.get(scenario.id);
    let checked = new Set();
    try {
      const raw = localStorage.getItem(key(scenario.id));
      if (raw) {
        try {
          const saved = JSON.parse(raw);
          const allowed = new Set(scenario.blocks[0].items.map(item => item.id));
          if (Array.isArray(saved)) checked = new Set(saved.filter(id => typeof id === 'string' && allowed.has(id)));
        } catch { /* Corrupt saved JSON starts with an empty checklist. */ }
      }
    } catch { storageWarning(); }
    states.set(scenario.id, checked);
    return checked;
  }
  function save() {
    try { localStorage.setItem(key(current.id), JSON.stringify([...read(current)])); }
    catch { storageWarning(); }
  }
  for (const scenario of scenarios) {
    const link = element('a', '', scenario.title);
    link.href = '#' + scenario.id;
    link.dataset.scenario = scenario.id;
    nav.append(link);
  }
  function render(scroll = false) {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { id = ''; }
    current = scenarios.find(scenario => scenario.id === id) || scenarios[0];
    if (id !== current.id) history.replaceState(null, '', location.pathname + location.search + '#' + current.id);
    undo = null;
    const checked = read(current);
    nav.querySelectorAll('a').forEach(link => {
      if (link.dataset.scenario === current.id) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    article.replaceChildren();
    const section = element('section', 'article-topic interactive-checklist');
    section.id = current.id;
    section.append(element('h2', '', current.title));
    if (current.id === 'payment') section.append(element('p', 'content-note', 'Используйте тестовый режим провайдера и тестовые реквизиты.'));
    const items = current.blocks[0].items;
    const counter = element('p', 'check-counter');
    counter.setAttribute('role', 'status');
    const toolbar = element('div', 'check-toolbar');
    const copy = element('button', 'clear-results', 'Копировать чек-лист');
    const reset = element('button', 'clear-results', 'Сбросить отметки');
    const restore = element('button', 'clear-results', 'Отменить');
    for (const button of [copy, reset, restore]) button.type = 'button';
    restore.hidden = true;
    const message = element('p', 'check-message'); message.setAttribute('role', 'status');
    toolbar.append(copy, reset, restore);
    const list = element('div', 'check-items');
    const update = () => {
      counter.textContent = 'Проверено ' + checked.size + ' из ' + items.length;
      reset.disabled = checked.size === 0;
      list.querySelectorAll('input').forEach(input => { input.checked = checked.has(input.value); });
    };
    for (const item of items) {
      const row = element('label', 'check-item');
      const input = element('input'); input.type = 'checkbox'; input.value = item.id;
      input.id = 'check-' + current.id + '-' + item.id;
      const text = element('span', 'check-text');
      const title = element('strong', '', item.title); title.id = input.id + '-title';
      const expected = element('span', '', item.expected); expected.id = input.id + '-expected';
      input.setAttribute('aria-labelledby', title.id);
      input.setAttribute('aria-describedby', expected.id);
      text.append(title, expected); row.append(input, text); list.append(row);
      input.addEventListener('change', () => {
        if (input.checked) checked.add(item.id); else checked.delete(item.id);
        undo = null; restore.hidden = true; message.textContent = '';
        save(); update();
      });
    }
    reset.addEventListener('click', () => {
      undo = new Set(checked); checked.clear(); save(); update();
      restore.hidden = false; message.textContent = 'Отметки этого сценария сброшены.';
      restore.focus();
    });
    restore.addEventListener('click', () => {
      if (!undo) return;
      undo.forEach(id => checked.add(id)); undo = null; save(); update();
      restore.hidden = true; message.textContent = 'Отметки восстановлены.'; reset.focus();
    });
    copy.addEventListener('click', async () => {
      const text = current.title + '\n\n' + items.map(item =>
        '[' + (checked.has(item.id) ? 'x' : ' ') + '] ' + item.title + ' — ' + item.expected).join('\n');
      try { await navigator.clipboard.writeText(text); message.textContent = 'Чек-лист скопирован.'; }
      catch { message.textContent = 'Не удалось скопировать. Выделите текст списка вручную.'; }
    });
    section.append(counter, toolbar, message, list); article.append(section); update();
    if (scroll) section.scrollIntoView({block: 'start'});
    document.body.dataset.ready = 'true';
  }
  window.addEventListener('hashchange', () => render(true));
  render(Boolean(location.hash));
}
initializeChecklists().catch(error => {
  document.getElementById('module-status').textContent = error.message;
  document.body.dataset.ready = 'error';
});
