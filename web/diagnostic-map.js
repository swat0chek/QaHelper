(function () {
  'use strict';
  if (location.pathname !== '/architecture') return;
  const layers = [
    {
      id: 'user', name: 'User', subtitle: 'Действие человека',
      responsibility: 'Пользователь задаёт цель и вводит данные. Здесь QA уточняет сценарий, условия и ожидаемый результат.',
      example: 'Человек выбирает товар и нажимает «Оформить заказ».',
      problems: ['Ожидание отличается от требований; неясная подсказка.', 'Другая роль, язык, часовой пояс или исходные данные.', 'Пропущенный шаг или повторное нажатие кнопки.'],
      checks: ['Повторить точные шаги с теми же данными и ролью.', 'Сравнить ожидаемое поведение с требованиями.', 'Проверить сценарий нового пользователя и управление с клавиатуры.'],
      tools: ['Требования и тест-кейсы — определить ожидаемый результат.', 'Скриншот или запись экрана — зафиксировать действия.'],
      evidence: ['Шаги, фактический и ожидаемый результат, частота воспроизведения.', 'Стенд, версия приложения, браузер, ОС, роль и время с часовым поясом.'],
      links: [['Баг-репорты', '/bug-reports'], ['Тест-кейсы и чек-листы', '/test-cases']]
    },
    {
      id: 'frontend', name: 'Frontend', subtitle: 'Интерфейс в браузере',
      responsibility: 'Показывает страницу, обрабатывает действия, проверяет поля и отображает данные, полученные от сервера.',
      example: 'Форма проверяет адрес, показывает загрузку и отправляет заказ.',
      problems: ['Кнопка не реагирует из-за JavaScript-ошибки.', 'Элемент перекрыт, скрыт или выходит за экран.', 'Ответ сервера получен, но интерфейс показывает старые данные.'],
      checks: ['Открыть Console и повторить действие: появились ли JS errors?', 'В Elements проверить элемент, стили и перекрытия.', 'Сопоставить данные в Network с тем, что показано на экране; проверить узкий экран.'],
      tools: ['DevTools → Console: ошибки JavaScript и их стек вызовов.', 'DevTools → Elements: HTML и CSS.', 'DevTools → Network / Application: запросы, кеш и хранилище браузера.'],
      evidence: ['Текст ошибки и stack trace, файл и строка, версия сборки.', 'Скриншот, размер экрана, браузер; запрос и ответ в момент сбоя.'],
      links: [['DevTools: панели', '/devtools#panels'], ['Хранилище браузера', '/browser-storage']]
    },
    {
      id: 'http-api', name: 'HTTP/API', subtitle: 'Обмен запросами',
      responsibility: 'Связывает клиент и сервер: запрос содержит метод, адрес, заголовки и иногда тело; ответ — статус, заголовки и данные.',
      example: 'POST /orders передаёт заказ. Ответ 201 может содержать его ID.',
      problems: ['Запрос не отправлен, заблокирован CORS или оборван сетью.', 'Неверные параметры, формат тела или авторизация; ответы 4xx/5xx.', 'Долгое ожидание, timeout или неожиданный формат ответа даже при 200.'],
      checks: ['В Network найти запрос после действия и проверить URL, method, status.', 'Сравнить headers и request/response с контрактом API.', 'Изучить Timing: где ушло время; повторить запрос на тестовом стенде с учётом его побочных эффектов.'],
      tools: ['DevTools → Network: Headers, Payload, Response, Timing.', 'Postman или curl: воспроизвести HTTP-запрос.', 'HTTP Status Code Finder: разобраться со статусом.'],
      evidence: ['URL, метод, status, headers, request/response, длительность и время запроса.', 'Request/trace ID, если есть; HAR — экспорт сетевых запросов. Перед передачей убрать токены, cookies и персональные данные.'],
      links: [['DevTools: Network', '/devtools#network'], ['API-тестирование', '/api-testing'], ['HTTP-статусы', '/http-codes']]
    },
    {
      id: 'backend', name: 'Backend', subtitle: 'Серверные правила',
      responsibility: 'Проверяет доступ и данные, выполняет бизнес-правила, обращается к БД и другим сервисам, формирует ответ.',
      example: 'Проверяет наличие товара, рассчитывает сумму и создаёт заказ.',
      problems: ['Исключение в коде, неверный расчёт или проверка прав.', 'Неправильная конфигурация, недоступная зависимость.', 'Ошибка на части запросов или медленная обработка.'],
      checks: ['Найти запрос в логах по времени и request/trace ID.', 'Прочитать stack trace: тип исключения, причина и место возникновения.', 'Сравнить успешный и неуспешный запрос; проверить серверную валидацию и права.'],
      tools: ['Просмотрщик логов, например Kibana или Grafana Loki.', 'Система трассировки: путь запроса между сервисами.', 'Postman / curl: повторить минимальный сценарий на тестовом стенде.'],
      evidence: ['Фрагмент логов до и после ошибки, stack trace, request/trace ID.', 'Имя сервиса, версия, окружение, время с часовым поясом и входные данные без секретов.'],
      links: [['Логи: расследование', '/logs#investigation'], ['Stack trace', '/logs#stack'], ['Troubleshooting', '/troubleshooting']]
    },
    {
      id: 'database', name: 'Database', subtitle: 'Хранение данных',
      responsibility: 'Хранит записи и связи между ними. Транзакции помогают сохранять связанные изменения целиком, ограничения — поддерживать целостность.',
      example: 'Сохраняет заказ и его позиции, чтобы заказ был доступен после обновления страницы.',
      problems: ['Запись отсутствует, дублируется или содержит неверные значения.', 'Нарушены связи, изменение откатилось или запрос заблокирован.', 'Медленный SQL; чтение с реплики или из кеша возвращает старое значение.'],
      checks: ['Через SELECT найти запись по ID в правильной БД и окружении.', 'Сравнить данные с API; проверить связанные строки, NULL и дубликаты.', 'Проверить consistency (согласованность): совпадают ли данные после допустимой задержки репликации; уточнить правила транзакции.'],
      tools: ['SQL-клиент, например DBeaver или DataGrip: SELECT и JOIN.', 'План выполнения запроса и мониторинг БД — вместе с разработчиком при медленном SQL.'],
      evidence: ['SQL-запрос и обезличенный результат, ID записей, ожидаемые значения.', 'Время проверки, имя окружения, источник чтения (основная БД/реплика), длительность запроса.'],
      links: [['SQL: SELECT', '/sql#select'], ['SQL: JOIN', '/sql#join'], ['Кеш и устаревшие данные', '/architecture#cache']]
    },
    {
      id: 'external-services', name: 'External Services', subtitle: 'Внешние интеграции',
      responsibility: 'Предоставляют отдельные функции: оплату, почту, доставку. Webhook — входящий HTTP-вызов с уведомлением о событии.',
      example: 'Провайдер обрабатывает платёж и присылает webhook с результатом.',
      problems: ['Timeout: ответ не пришёл вовремя; сервис недоступен или ограничил частоту запросов.', 'Несовместимый контракт, неверные ключи или настройки integration.', 'Webhook потерян, пришёл повторно или события пришли не по порядку.'],
      checks: ['Сопоставить исходящий запрос и ответ провайдера с контрактом.', 'На тестовом стенде проверить timeout, ошибку, повтор и восстановление.', 'Проверить доставку и обработку webhook; повтор одного события не должен повторно списывать оплату (идемпотентность).'],
      tools: ['Sandbox провайдера и журнал доставки webhook.', 'Логи и трассировка вызовов; Postman / curl.', 'Mock-сервис: воспроизведение задержки или ошибки зависимости.'],
      evidence: ['Провайдер, endpoint, время, duration, status и обезличенные request/response.', 'ID операции и события, trace ID, число попыток и ответы на webhook.'],
      links: [['API-тестирование', '/api-testing'], ['Микросервисы и очереди', '/architecture#microservices'], ['Логи', '/logs']]
    }
  ];
  const el = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const map = el('section', '', 'diagnostic-map');
  map.id = 'diagnostic-map';
  map.setAttribute('aria-labelledby', 'diagnostic-title');
  const title = el('h2', 'Где искать причину?'); title.id = 'diagnostic-title';
  map.append(el('p', 'CLIENT–SERVER • КАРТА ДИАГНОСТИКИ', 'diagnostic-kicker'), title,
    el('p', 'Выберите слой и узнайте, что проверить. Начните с действия пользователя и двигайтесь по цепочке, сопоставляя факты.', 'diagnostic-intro'));
  const chain = el('ol', '', 'diagnostic-chain');
  chain.setAttribute('aria-label', 'Слои диагностики');
  const detail = el('section', '', 'diagnostic-detail');
  detail.id = 'diagnostic-detail';
  detail.setAttribute('aria-labelledby', 'diagnostic-layer-title');
  const status = el('p', '', 'diagnostic-selection'); status.setAttribute('role', 'status');
  const buttons = [];
  function select(index) {
    const layer = layers[index];
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    detail.replaceChildren();
    const heading = el('h3', layer.name + ' — ' + layer.subtitle); heading.id = 'diagnostic-layer-title';
    detail.append(heading, el('p', 'Пример: ' + layer.example, 'diagnostic-example'));
    const grid = el('div', '', 'diagnostic-grid');
    for (const [label, content] of [
      ['За что отвечает', [layer.responsibility]], ['Типичные проблемы', layer.problems],
      ['Что проверить QA', layer.checks], ['Инструменты', layer.tools], ['Какие данные собрать', layer.evidence]
    ]) {
      const card = el('section', '', 'diagnostic-card'); card.append(el('h4', label));
      const list = el('ul'); content.forEach(text => list.append(el('li', text))); card.append(list); grid.append(card);
    }
    const related = el('section', '', 'diagnostic-card'); related.append(el('h4', 'Связанные материалы qaHelp'));
    const links = el('ul', '', 'related-links');
    layer.links.forEach(([label, href]) => { const row = el('li'); const link = el('a', label + ' →'); link.href = href; row.append(link); links.append(row); });
    related.append(links); grid.append(related); detail.append(grid);
    status.textContent = `Выбран слой ${index + 1} из ${layers.length}: ${layer.name}. Подсказки — под картой.`;
  }
  layers.forEach((layer, index) => {
    const item = el('li'); const button = el('button'); button.type = 'button';
    button.dataset.layer = layer.id; button.setAttribute('aria-controls', detail.id);
    button.append(el('span', String(index + 1).padStart(2, '0'), 'diagnostic-number'), el('strong', layer.name), el('span', layer.subtitle));
    button.addEventListener('click', () => select(index)); buttons.push(button); item.append(button); chain.append(item);
  });
  map.append(chain, status,
    el('p', 'Стрелки показывают порядок диагностики, а не обязательный маршрут запроса. Backend обычно обращается к Database и External Services независимо. Ответ возвращается к интерфейсу; часть операций завершается позже, например через webhook.', 'diagnostic-note'), detail);
  document.querySelector('.reading-layout').before(map);
  select(0);
})();
