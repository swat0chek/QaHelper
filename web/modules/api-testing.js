window.qaModules["api-testing"] = {
  "topics": [
    {
      "id": "rest",
      "title": "REST, endpoint и параметры",
      "blocks": [
        {
          "type": "paragraph",
          "text": "API задаёт правила взаимодействия программ. REST — архитектурный стиль с ресурсами и единообразным интерфейсом; не всякий HTTP API является REST. Endpoint в документации обычно определяют методом и адресом. Path-параметр выбирает ресурс, query-параметры уточняют выборку."
        },
        {
          "type": "code",
          "language": "http",
          "text": "GET /users/42/orders?status=paid&limit=10 HTTP/1.1\nHost: localhost:9000\nAccept: application/json"
        },
        {
          "type": "paragraph",
          "text": "Здесь 42 — path param, status и limit — query params. Проверьте отсутствие параметра, границы limit и чужой userId. JSON содержит объекты, массивы, строки, числа, boolean и null; отсутствие поля отличается от поля со значением null."
        }
      ]
    },
    {
      "id": "auth",
      "title": "Auth, Bearer и JWT",
      "blocks": [
        {
          "type": "paragraph",
          "text": "Authentication отвечает «кто вы», authorization — «что вам разрешено». Bearer означает доступ по владению токеном; JWT — один из форматов токена, а не синоним Bearer. Подписанный JWT обычно можно декодировать: подпись не скрывает содержимое. Сервер проверяет подпись, срок действия и применимые ограничения issuer/audience."
        },
        {
          "type": "code",
          "language": "http",
          "text": "Authorization: Bearer <TEST_TOKEN>"
        },
        {
          "type": "list",
          "items": [
            "Без токена и с истёкшим токеном — ожидаемый отказ по контракту.",
            "С корректным токеном без нужной роли — доступ запрещён.",
            "Пользователь A не получает заказ пользователя B при замене path param."
          ]
        }
      ]
    },
    {
      "id": "postman",
      "title": "Пример 1: позитивная проверка в Postman",
      "blocks": [
        {
          "type": "paragraph",
          "text": "Создайте GET-запрос к учебному API, задайте baseUrl в environment. Выполните запрос и добавьте проверки в Scripts → Post-response. Пример предполагает, что GET /users/42 возвращает объект с числовым id=42."
        },
        {
          "type": "code",
          "language": "javascript",
          "text": "pm.test('Статус и JSON-контракт', () => {\n  pm.response.to.have.status(200);\n  pm.expect(pm.response.headers.get('Content-Type')).to.include('application/json');\n  const user = pm.response.json();\n  pm.expect(user.id).to.eql(42);\n  pm.expect(user.name).to.be.a('string');\n});"
        },
        {
          "type": "paragraph",
          "text": "Проверяйте не только типы, но и значения, обязательность полей, бизнес-правила и отсутствие секретов. Время ответа сравнивайте с согласованным пределом на известном стенде."
        }
      ]
    },
    {
      "id": "negative",
      "title": "Пример 2: негативный сценарий и OpenAPI",
      "blocks": [
        {
          "type": "paragraph",
          "text": "Для POST /users с email=\"wrong\" контракт учебного API требует 422 и поле ошибки email. Ожидайте отказ, понятный код ошибки и отсутствие созданной записи. Затем выполните GET или запрос к тестовой БД: одного 422 недостаточно для проверки побочных эффектов."
        },
        {
          "type": "paragraph",
          "text": "OpenAPI описывает операции, параметры, схемы и ответы. Swagger — семейство инструментов для работы с такими описаниями. Сравнивайте фактический ответ со схемой конкретной версии API; схема не заменяет проверку правил продукта."
        },
        {
          "type": "table",
          "headers": [
            "Проверка",
            "Пример"
          ],
          "rows": [
            [
              "Контракт",
              "Обязательное id — число; email — строка"
            ],
            [
              "Бизнес-логика",
              "Итог равен сумме позиций с учётом скидки"
            ],
            [
              "Ошибки",
              "Нет внутреннего stack trace в ответе"
            ],
            [
              "Коллекции",
              "Пагинация не теряет и не дублирует записи"
            ]
          ]
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
            "Проверены статус, headers, тело и побочные эффекты.",
            "Есть позитивный, негативный и ролевой сценарии.",
            "Секреты не записаны в коллекцию и отчёт.",
            "Данные изолированы и очищены после проверки."
          ]
        }
      ]
    }
  ],
  "sources": [
    [
      "Postman: response tests",
      "https://learning.postman.com/docs/tests-and-scripts/write-scripts/test-scripts/"
    ],
    [
      "OpenAPI Specification",
      "https://spec.openapis.org/oas/latest.html"
    ]
  ]
};
