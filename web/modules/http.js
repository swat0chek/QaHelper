window.qaModules.http = {
  "topics": [
    {
      "id": "methods",
      "title": "GET, POST, PUT, PATCH, DELETE",
      "blocks": [
        {
          "type": "table",
          "headers": [
            "Метод",
            "Обычный смысл",
            "Идемпотентность по семантике"
          ],
          "rows": [
            [
              "GET",
              "Получить представление ресурса; не менять бизнес-состояние",
              "Да"
            ],
            [
              "POST",
              "Обработать данные, часто создать ресурс",
              "Не гарантируется"
            ],
            [
              "PUT",
              "Создать/заменить состояние ресурса по адресу",
              "Да"
            ],
            [
              "PATCH",
              "Частично изменить ресурс",
              "Зависит от операции"
            ],
            [
              "DELETE",
              "Удалить связь ресурса с адресом",
              "Да"
            ]
          ]
        },
        {
          "type": "paragraph",
          "text": "Идемпотентность — одинаковый целевой эффект повторного запроса, а не одинаковые ответы. Первый DELETE может вернуть 204, повторный 404. PATCH «установить имя» может быть идемпотентным, «увеличить счётчик» — нет."
        }
      ]
    },
    {
      "id": "headers",
      "title": "Headers и cookies",
      "blocks": [
        {
          "type": "paragraph",
          "text": "Content-Type описывает формат тела текущего сообщения, Accept — желаемый формат ответа. Authorization передаёт учётные данные, Location может указывать созданный ресурс. Сервер устанавливает cookie через Set-Cookie, браузер отправляет подходящие cookies через Cookie с учётом области и политик браузера."
        },
        {
          "type": "code",
          "language": "http",
          "text": "POST /users HTTP/1.1\nHost: localhost:9000\nContent-Type: application/json\nAccept: application/json\n\n{\"name\":\"Анна\"}"
        },
        {
          "type": "paragraph",
          "text": "Пример 1: API требует JSON, но клиент отправляет текст с Content-Type: text/plain. Ожидайте предусмотренный контрактом отказ, например 415. Исправьте заголовок и сравните результат; неверный JSON остаётся ошибкой даже при правильном Content-Type."
        }
      ]
    },
    {
      "id": "cache",
      "title": "Cache: пример 2",
      "blocks": [
        {
          "type": "code",
          "language": "http",
          "text": "HTTP/1.1 200 OK\nETag: \"v1\"\nCache-Control: no-cache\n\n...\n\nGET /profile HTTP/1.1\nIf-None-Match: \"v1\"\n\nHTTP/1.1 304 Not Modified"
        },
        {
          "type": "paragraph",
          "text": "no-cache разрешает хранение, но требует валидации перед повторным использованием; no-store запрещает хранить ответ в кеше. max-age задаёт время свежести. В примере сервер подтверждает актуальность через 304 без тела. Проверьте изменение ETag после обновления данных и отсутствие чужих персональных ответов в общем кеше."
        }
      ]
    },
    {
      "id": "cors-https",
      "title": "CORS и HTTPS",
      "blocks": [
        {
          "type": "paragraph",
          "text": "Origin — схема, хост и порт. CORS задаёт, может ли браузер предоставить JavaScript доступ к cross-origin ответу. Некоторые запросы предваряются OPTIONS preflight. Успех в Postman или curl не доказывает работоспособность CORS в браузере. CORS не заменяет авторизацию."
        },
        {
          "type": "paragraph",
          "text": "Для запросов с credentials нельзя использовать wildcard * как разрешённый origin. Проверяйте разрешённый и запрещённый origin, методы и headers. HTTPS — HTTP поверх TLS: шифрование канала и проверка подлинности сервера при корректной проверке сертификата. Оно не исправляет ошибки доступа внутри приложения."
        },
        {
          "type": "note",
          "text": "Проверьте перенаправление HTTP→HTTPS, сертификат и mixed content. Не отключайте проверку сертификата, чтобы объявить тест успешным."
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
            "Метод соответствует операции.",
            "Проверены headers, тело и статусы.",
            "Кеш не скрывает изменения данных.",
            "CORS проверен в браузере; HTTPS — с проверкой сертификата."
          ]
        },
        {
          "type": "links",
          "items": [
            [
              "HTTP Status Code Finder: найти ответ по коду или проблеме",
              "/http-codes"
            ]
          ]
        }
      ]
    }
  ],
  "sources": [
    [
      "MDN: CORS",
      "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS"
    ]
  ]
};
