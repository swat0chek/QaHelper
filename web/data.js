// Catalog metadata. Module content lives in web/modules; routes are allowlisted in Main.java.
window.qaData = {
  sections: [
{"id":"toolbox","title":"QA Toolbox","description":"12 локальных инструментов: JSON, Diff, Base64, URL, UUID, время, JWT и генерация данных.","icon":"bolt","color":"orange","href":"/toolbox","file":"/modules/toolbox.js"},
{"id":"troubleshooting","title":"Troubleshooting","description":"16 симптомов: локализуйте проблему и соберите доказательства шаг за шагом.","icon":"gear","color":"blue","href":"/troubleshooting","file":"/modules/troubleshooting.js"},
{"id":"what-to-test","title":"Что проверить?","description":"Готовые чек-листы для 17 категорий: выбирайте, проверяйте и сохраняйте отметки.","icon":"book","color":"purple","href":"/what-to-test","file":"/modules/what-to-test.js"},
  {
    "id": "http-codes",
    "title": "HTTP коды",
    "description": "Все пять классов ответов и 25 статусов с пояснениями.",
    "icon": "http",
    "color": "purple",
    "href": "/http-codes"
  },
  {
    "id": "devtools",
    "title": "DevTools",
    "description": "Находите причины ошибок через Network, Console и инструменты браузера.",
    "icon": "laptop",
    "color": "blue",
    "href": "/devtools",
    "file": "/modules/devtools.js"
  },
  {
    "id": "api-testing",
    "title": "API-тестирование",
    "description": "REST, JSON, авторизация и проверки контрактов с практическими примерами.",
    "icon": "api",
    "color": "green",
    "href": "/api-testing",
    "file": "/modules/api-testing.js"
  },
  {
    "id": "sql",
    "title": "SQL",
    "description": "Запросы к учебной базе: выборки, JOIN, группировки и изменение данных.",
    "icon": "database",
    "color": "orange",
    "href": "/sql",
    "file": "/modules/sql.js"
  },
  {
    "id": "bug-reports",
    "title": "Баг-репорты",
    "description": "От воспроизведения до понятного отчёта: важность, приоритет и доказательства.",
    "icon": "book",
    "color": "purple",
    "href": "/bug-reports",
    "file": "/modules/bug-reports.js"
  },
  {
    "id": "test-cases",
    "title": "Тест-кейсы и чек-листы",
    "description": "Выбирайте нужную детализацию и покрывайте позитивные и негативные сценарии.",
    "icon": "book",
    "color": "blue",
    "href": "/test-cases",
    "file": "/modules/test-cases.js"
  },
  {
    "id": "test-design",
    "title": "Техники тест-дизайна",
    "description": "Сокращайте число проверок, сохраняя осмысленное покрытие рисков.",
    "icon": "gear",
    "color": "green",
    "href": "/test-design",
    "file": "/modules/test-design.js"
  },
  {
    "id": "http",
    "title": "HTTP подробнее",
    "description": "Методы, заголовки, кеширование, CORS и HTTPS на понятных примерах.",
    "icon": "http",
    "color": "purple",
    "href": "/http",
    "file": "/modules/http.js"
  },
  {
    "id": "browser-storage",
    "title": "Cookies / Local / Session Storage",
    "description": "Различия браузерных хранилищ и проверки сохранения состояния.",
    "icon": "database",
    "color": "orange",
    "href": "/browser-storage",
    "file": "/modules/browser-storage.js"
  },
  {
    "id": "git",
    "title": "Git для QA",
    "description": "Повседневная работа с ветками, изменениями и конфликтами.",
    "icon": "gear",
    "color": "purple",
    "href": "/git",
    "file": "/modules/git.js"
  },
  {
    "id": "command-line",
    "title": "Командная строка",
    "description": "Команды Windows и Linux для файлов, сети и диагностики.",
    "icon": "laptop",
    "color": "blue",
    "href": "/command-line",
    "file": "/modules/command-line.js"
  },
  {
    "id": "mobile-qa",
    "title": "Mobile QA",
    "description": "Устройства, ADB, разрешения, логи и мобильные сценарии.",
    "icon": "laptop",
    "color": "green",
    "href": "/mobile-qa",
    "file": "/modules/mobile-qa.js"
  },
  {
    "id": "logs",
    "title": "Логи",
    "description": "Читайте stack trace и связывайте события по времени и request ID.",
    "icon": "book",
    "color": "orange",
    "href": "/logs",
    "file": "/modules/logs.js"
  },
  {
    "id": "security",
    "title": "Основы безопасности для QA",
    "description": "Проверки доступа и обработки данных в рамках обычного QA.",
    "icon": "gear",
    "color": "purple",
    "href": "/security",
    "file": "/modules/security.js"
  },
  {
    "id": "performance",
    "title": "Performance",
    "description": "Время ответа, пропускная способность и первые нагрузочные сценарии.",
    "icon": "bolt",
    "color": "blue",
    "href": "/performance",
    "file": "/modules/performance.js"
  },
  {
    "id": "automation",
    "title": "Автоматизация",
    "description": "Уровни тестов, UI/API и выбор подходящего инструмента.",
    "icon": "gear",
    "color": "green",
    "href": "/automation",
    "file": "/modules/automation.js"
  },
  {
    "id": "ci-cd",
    "title": "CI/CD",
    "description": "Как изменения проходят сборку, проверки и развёртывание.",
    "icon": "bolt",
    "color": "orange",
    "href": "/ci-cd",
    "file": "/modules/ci-cd.js"
  },
  {
    "id": "architecture",
    "title": "Архитектура",
    "description": "Понятные схемы frontend, backend, БД, очередей и кеша.",
    "icon": "api",
    "color": "purple",
    "href": "/architecture",
    "file": "/modules/architecture.js"
  },
  {
    "id": "testing-types",
    "title": "Виды тестирования",
    "description": "Как выбрать проверки под изменение, риск и стадию выпуска.",
    "icon": "book",
    "color": "blue",
    "href": "/testing-types",
    "file": "/modules/testing-types.js"
  },
  {
    "id": "qa-metrics",
    "title": "QA-метрики",
    "description": "Считайте показатели с понятными знаменателями и ограничениями.",
    "icon": "gear",
    "color": "green",
    "href": "/qa-metrics",
    "file": "/modules/qa-metrics.js"
  },
  {
    "id": "glossary",
    "title": "Словарь QA",
    "description": "Термины с примерами и переходами к практическим материалам.",
    "icon": "book",
    "color": "orange",
    "href": "/glossary",
    "file": "/modules/glossary.js"
  }
],
  httpGroups: [
    { prefix: '1xx', title: 'Информационные', description: 'Запрос принят, обработка продолжается.', codes: [
      [100, 'Continue', 'Промежуточный ответ: клиент может продолжить отправку тела запроса.'],
      [101, 'Switching Protocols', 'Сервер согласился переключить протокол по запросу клиента.']
    ] },
    { prefix: '2xx', title: 'Успешные', description: 'Запрос успешно принят и обработан.', codes: [
      [200, 'OK', 'Запрос выполнен успешно. Содержимое ответа зависит от метода запроса.'],
      [201, 'Created', 'Запрос выполнен и создан новый ресурс, например после POST.'],
      [202, 'Accepted', 'Запрос принят в обработку, но она ещё не завершена. Результат пока не гарантирован.'],
      [204, 'No Content', 'Запрос выполнен успешно. Тело ответа отсутствует.']
    ] },
    { prefix: '3xx', title: 'Перенаправления', description: 'Для завершения запроса может потребоваться дополнительное действие.', codes: [
      [301, 'Moved Permanently', 'Ресурс навсегда перемещён на другой URL. При переходе POST может измениться на GET.'],
      [302, 'Found', 'Ресурс временно доступен по другому URL. При переходе POST может измениться на GET.'],
      [304, 'Not Modified', 'Ресурс не изменился: клиент может использовать кешированную версию. Тела ответа нет.'],
      [307, 'Temporary Redirect', 'Временное перенаправление с сохранением метода и тела запроса.'],
      [308, 'Permanent Redirect', 'Постоянное перенаправление с сохранением метода и тела запроса.']
    ] },
    { prefix: '4xx', title: 'Ошибки клиента', description: 'Проверь запрос, авторизацию и доступность ресурса.', codes: [
      [400, 'Bad Request', 'Сервер не может обработать запрос из-за ошибки клиента, например некорректного синтаксиса.'],
      [401, 'Unauthorized', 'Нет действительных данных аутентификации. Проверь токен или учётные данные.'],
      [403, 'Forbidden', 'Сервер понял запрос, но отказывается его выполнять. Проверь права доступа.'],
      [404, 'Not Found', 'Ресурс не найден либо сервер не раскрывает его существование.'],
      [405, 'Method Not Allowed', 'Метод не поддерживается этим ресурсом. Допустимые методы указаны в заголовке Allow.'],
      [409, 'Conflict', 'Запрос конфликтует с текущим состоянием ресурса, например при обновлении устаревшей версии.'],
      [415, 'Unsupported Media Type', 'Формат содержимого запроса не поддерживается. Проверь Content-Type и тело запроса.'],
      [422, 'Unprocessable Content', 'Формат и синтаксис содержимого понятны, но сервер не может выполнить содержащиеся в нём инструкции.'],
      [429, 'Too Many Requests', 'Превышена частота запросов. Сервер может указать время ожидания в Retry-After.']
    ] },
    { prefix: '5xx', title: 'Ошибки сервера', description: 'Сервер не смог выполнить запрос.', codes: [
      [500, 'Internal Server Error', 'Непредвиденная ошибка сервера. Для диагностики понадобятся серверные логи.'],
      [501, 'Not Implemented', 'Сервер не поддерживает функциональность, необходимую для выполнения запроса.'],
      [502, 'Bad Gateway', 'Шлюз или прокси получил некорректный ответ от вышестоящего сервера.'],
      [503, 'Service Unavailable', 'Сервис временно недоступен, например из-за перегрузки или обслуживания.'],
      [504, 'Gateway Timeout', 'Шлюз или прокси не дождался ответа от вышестоящего сервера.']
    ] }
  ]
};
