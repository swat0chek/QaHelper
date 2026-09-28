function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const { sections, httpGroups } = window.qaData;

// Small local vector icons; no external fonts or image requests.
const iconPaths = {
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

if (document.body.dataset.page === 'home') {
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
