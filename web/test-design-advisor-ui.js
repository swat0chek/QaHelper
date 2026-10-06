(function () {
  'use strict';
  if (location.pathname !== '/test-design') return;
  const {questions, recommend} = window.qaTestDesignAdvisor;
  const answers = {};
  let step = 0;
  const el = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const panel = el('section', '', 'design-advisor article-topic');
  panel.id = 'technique-advisor';
  panel.setAttribute('aria-labelledby', 'advisor-title');
  document.querySelector('.reading-layout').before(panel);
  function button(text, id, action) {
    const node = el('button', text, 'advisor-button');
    node.type = 'button'; node.id = id; node.addEventListener('click', action);
    return node;
  }
  function list(parent, heading, items, ordered = false) {
    parent.append(el('h4', heading));
    const node = el(ordered ? 'ol' : 'ul');
    items.forEach(item => node.append(el('li', item)));
    parent.append(node);
  }
  function render(focus = true) {
    panel.replaceChildren();
    const title = el('h2', 'Какая техника подойдёт вашей задаче?');
    title.id = 'advisor-title'; title.tabIndex = -1;
    panel.append(title);
    if (step < questions.length) {
      panel.append(el('p', 'Ответьте на пять вопросов. Можно получить несколько техник и применять их вместе.'));
      const progress = el('p', `Вопрос ${step + 1} из ${questions.length}`, 'advisor-progress');
      progress.setAttribute('role', 'status'); panel.append(progress);
      const question = questions[step];
      const form = el('form');
      const fieldset = el('fieldset');
      fieldset.append(el('legend', question.title));
      const hint = el('p', question.hint); hint.id = 'advisor-hint';
      fieldset.setAttribute('aria-describedby', hint.id); fieldset.append(hint);
      for (const [value, label] of [['yes', 'Да'], ['no', 'Нет'], ['unknown', 'Пока не знаю']]) {
        const option = el('label', '', 'advisor-option');
        const input = el('input');
        input.type = 'radio'; input.name = question.id; input.value = value; input.required = true;
        input.checked = answers[question.id] === value;
        input.addEventListener('change', () => { answers[question.id] = value; next.disabled = false; });
        option.append(input, el('span', label)); fieldset.append(option);
      }
      const actions = el('div', '', 'advisor-actions');
      const back = button('Назад', 'advisor-back', () => {step--; render();}); back.disabled = step === 0;
      const next = button(step === questions.length - 1 ? 'Показать рекомендации' : 'Далее', 'advisor-next', () => {});
      next.type = 'submit'; next.disabled = !answers[question.id];
      actions.append(back, next); form.append(fieldset, actions);
      form.addEventListener('submit', event => {event.preventDefault(); if (!answers[question.id]) return; step++; render();});
      panel.append(form);
    } else {
      const results = recommend(answers);
      panel.append(el('h3', results.length ? `Подходящие техники: ${results.length}` : 'Пока недостаточно признаков для выбора'));
      panel.append(el('p', results.length ? 'Используйте техники совместно: каждая покрывает свой аспект задачи. Это отправная точка, а не гарантия полного покрытия.' : 'Уточните требования: какие входы допустимы, от чего зависит результат и какие действия выполняет пользователь. Затем измените ответы.'));
      if (Object.values(answers).includes('unknown')) panel.append(el('p', 'Есть ответы «Пока не знаю». Рекомендации учитывают только подтверждённые особенности; после уточнения требований пройдите вопросы ещё раз.', 'advisor-notice'));
      const summary = el('ul', '', 'advisor-summary');
      questions.forEach(q => summary.append(el('li', `${q.title} — ${{yes: 'Да', no: 'Нет', unknown: 'Пока не знаю'}[answers[q.id]]}`)));
      panel.append(summary);
      const cards = el('div', '', 'advisor-results');
      results.forEach(item => {
        const card = el('section', '', 'advisor-result'); card.dataset.technique = item.id;
        card.append(el('h3', item.title), el('p', item.subtitle, 'advisor-subtitle'));
        list(card, 'Почему подходит', item.reasons);
        card.append(el('h4', 'Простой пример'), el('p', item.example));
        list(card, 'Как применить', item.steps, true);
        list(card, 'Типичные ошибки', item.mistakes);
        const link = el('a', 'Подробнее в qaHelp →', 'back-link'); link.href = item.href; card.append(link);
        cards.append(card);
      });
      panel.append(cards);
      const actions = el('div', '', 'advisor-actions');
      actions.append(button('Изменить ответы', 'advisor-edit', () => {step = 0; render();}),
        button('Начать заново', 'advisor-reset', () => {Object.keys(answers).forEach(key => delete answers[key]); step = 0; render();}));
      panel.append(actions);
    }
    if (focus) title.focus();
  }
  render(false);
})();
