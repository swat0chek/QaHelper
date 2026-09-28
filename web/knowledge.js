// Shared content loading and pure search helpers (also used by the integrity tests).
window.qaModules = Object.create(null);
window.qaKnowledge = (() => {
  const requests = new Map();
  const normalize = text => String(text).toLocaleLowerCase('ru').replaceAll('ё', 'е');
  function blockText(block) {
    if (block.type === 'checklist') return block.items.map(item => item.title + ' ' + item.expected).join(' ');
    if (block.type === 'table') return [...block.headers, ...block.rows.flat()].join(' ');
    if (block.type === 'list') return block.items.join(' ');
    if (block.type === 'links') return block.items.map(item => item[0]).join(' ');
    if (block.type === 'diagram') return [...block.labels, block.text].join(' ');
    return block.text || '';
  }
  function httpContent() {
    return {
      topics: window.qaData.httpGroups.map(group => ({
        id: 'codes-' + group.prefix,
        title: group.prefix + ' · ' + group.title,
        blocks: [
          {type: 'paragraph', text: group.description},
          {type: 'table', headers: ['Код', 'Название', 'Описание'], rows: group.codes}
        ]
      })), sources: []
    };
  }
  function load(meta) {
    if (meta.id === 'http-codes') return Promise.resolve(httpContent());
    if (window.qaModules[meta.id]) return Promise.resolve(window.qaModules[meta.id]);
    if (requests.has(meta.id)) return requests.get(meta.id);
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = meta.file;
      const fail = () => {
        script.remove();
        requests.delete(meta.id);
        reject(new Error('Не удалось загрузить раздел «' + meta.title + '». Обновите страницу.'));
      };
      script.onload = () => window.qaModules[meta.id] ? resolve(window.qaModules[meta.id]) : fail();
      script.onerror = fail;
      document.head.append(script);
    });
    requests.set(meta.id, promise);
    return promise;
  }
  function index(catalog, contents) {
    return catalog.flatMap((meta, i) => contents[i].topics.map(topic => ({
      module: meta.title, title: topic.title, href: meta.href + '#' + topic.id,
      text: topic.blocks.map(blockText).join(' '), description: meta.description
    })));
  }
  function search(entries, query) {
    const words = normalize(query).trim().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return entries.map(entry => {
      const title = normalize(entry.module + ' ' + entry.title);
      const content = normalize(title + ' ' + entry.description + ' ' + entry.text);
      return {entry, matches: words.every(word => content.includes(word)),
        score: words.reduce((sum, word) => sum + (title.includes(word) ? 1 : 0), 0)};
    }).filter(item => item.matches).sort((a, b) => b.score - a.score)
      .map(({entry}) => entry);
  }
  function excerpt(text, query) {
    const words = normalize(query).trim().split(/\s+/).filter(Boolean);
    const normalized = normalize(text);
    const positions = words.map(word => normalized.indexOf(word)).filter(pos => pos >= 0);
    const start = positions.length ? Math.max(0, Math.min(...positions) - 55) : 0;
    return (start ? '…' : '') + text.slice(start, start + 220) + (text.length > start + 220 ? '…' : '');
  }
  return {load, index, search, excerpt, normalize, blockText};
})();
