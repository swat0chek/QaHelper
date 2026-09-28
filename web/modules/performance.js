window.qaModules["performance"] = {
  "topics": [
    {
      "id": "metrics",
      "title": "Latency, response time и RPS",
      "blocks": [
        {
          "type": "paragraph",
          "text": "Response time — длительность ответа, но границы измерения нужно явно определить. Latency может означать задержку до первого байта или сетевую задержку: сверяйтесь с инструментом. RPS — запросы в секунду; число виртуальных пользователей не равно RPS."
        },
        {
          "type": "table",
          "headers": [
            "Показатель",
            "Пример",
            "Как читать"
          ],
          "rows": [
            [
              "Среднее",
              "200 мс",
              "Может скрывать медленные запросы"
            ],
            [
              "p95",
              "600 мс",
              "Около 95% измерений не больше 600 мс"
            ],
            [
              "RPS",
              "100",
              "Пропускная способность при данной нагрузке"
            ],
            [
              "Error rate",
              "2%",
              "Доля ошибок с согласованным определением"
            ]
          ]
        },
        {
          "type": "paragraph",
          "text": "Нагрузочный тест проверяет ожидаемый профиль, stress — поведение за пределами, spike — резкий рост, soak — длительную стабильность. Нужны модель пользователей, тестовые данные и измерение ресурсов сервера."
        }
      ]
    },
    {
      "id": "k6",
      "title": "Пример 1: короткий локальный тест k6",
      "blocks": [
        {
          "type": "paragraph",
          "text": "Установите k6 отдельно. Сохраните пример как smoke.js и выполните k6 run smoke.js при запущенном QA Helpers. Это учебная проверка на одном виртуальном пользователе, не оценка производительности production."
        },
        {
          "type": "code",
          "language": "javascript",
          "text": "import http from 'k6/http';\nimport { check, sleep } from 'k6';\nexport const options = {\n  vus: 1, duration: '10s',\n  thresholds: { http_req_failed: ['rate<0.01'], http_req_duration: ['p(95)<1000'] }\n};\nexport default function () {\n  const r = http.get('http://localhost:8080/');\n  check(r, { 'status 200': r => r.status === 200 });\n  sleep(1);\n}"
        },
        {
          "type": "paragraph",
          "text": "http_req_duration измеряет отправку, ожидание и получение; установление соединения учитывается отдельными метриками. Threshold задаёт критерий успешности. Порог 1000 мс здесь учебный, его нельзя автоматически считать SLA."
        }
      ]
    },
    {
      "id": "jmeter",
      "title": "Пример 2: минимальный JMeter",
      "blocks": [
        {
          "type": "list",
          "items": [
            "Создайте Test Plan → Thread Group: 1 поток, ramp-up 1 секунда, loop count 5.",
            "Добавьте HTTP Request: protocol http, server localhost, port 8080, path /.",
            "Добавьте Response Assertion на код 200.",
            "При отладке смотрите результат; сохраните план как qa-local.jmx.",
            "Для запуска без GUI используйте команду ниже; имя результата должно быть новым."
          ]
        },
        {
          "type": "code",
          "language": "bash",
          "text": "jmeter -n -t qa-local.jmx -l qa-local-results.jtl"
        },
        {
          "type": "note",
          "text": "Не направляйте нагрузку на внешние сервисы без согласования. Сравнивайте одинаковые версии, данные, профиль и прогрев; одновременно смотрите ошибки, CPU, память и БД."
        }
      ]
    },
    {
      "id": "checklist",
      "title": "Чек-лист перед завершением",
      "blocks": [
        {
          "type": "list",
          "items": [
            "Определены нагрузка, длительность и критерии приёмки.",
            "Цель — локальный или согласованный тестовый стенд.",
            "Проверены бизнес-ответы, а не только HTTP 200.",
            "Сохранены профиль, ошибки, перцентили и ресурсы сервера."
          ]
        }
      ]
    }
  ],
  "sources": [
    [
      "k6: metrics",
      "https://grafana.com/docs/k6/latest/using-k6/metrics/"
    ],
    [
      "JMeter: web test plan",
      "https://jmeter.apache.org/usermanual/build-web-test-plan.html"
    ]
  ]
};
