window.qaModules["browser-storage"] = {
  "topics": [
    {
      "id": "comparison",
      "title": "Чем отличаются хранилища",
      "blocks": [
        {
          "type": "table",
          "headers": [
            "Хранилище",
            "Срок и область",
            "Отправка серверу"
          ],
          "rows": [
            [
              "Cookies",
              "Domain/Path и другие ограничения; до срока или конца сессии с оговорками восстановления браузера",
              "Автоматически при подходящем запросе и политике"
            ],
            [
              "Local Storage",
              "В рамках origin, сохраняется между сессиями до очистки",
              "Нет, приложение читает само"
            ],
            [
              "Session Storage",
              "Origin и вкладка; переживает reload, обычно удаляется при закрытии вкладки",
              "Нет"
            ]
          ]
        },
        {
          "type": "paragraph",
          "text": "Web Storage хранит строки. Для объектов применяют JSON.stringify/JSON.parse. Квоты, приватный режим и блокировки зависят от браузера. Сессионные cookies могут восстанавливаться вместе с сессией браузера; не считайте закрытие окна гарантированным logout."
        }
      ]
    },
    {
      "id": "inspect",
      "title": "Где смотреть и что означают флаги",
      "blocks": [
        {
          "type": "paragraph",
          "text": "В Chrome откройте Application → Storage и выберите Cookies, Local Storage или Session Storage нужного origin. В Network проверьте Set-Cookie в ответе и Cookie в запросе. HttpOnly запрещает чтение cookie из JavaScript; Secure ограничивает передачу защищённым каналом; SameSite управляет cross-site отправкой."
        },
        {
          "type": "note",
          "text": "Токен в Local Storage доступен JavaScript страницы. HttpOnly уменьшает риск кражи cookie через JS, но не является полной защитой от XSS или CSRF."
        }
      ]
    },
    {
      "id": "examples",
      "title": "Два примера проверки",
      "blocks": [
        {
          "type": "paragraph",
          "text": "Пример 1: выбор темы сохраняется в Local Storage. Выберите тёмную тему, обновите страницу и откройте другую вкладку того же origin: новое чтение должно получить сохранённое значение. Очистка site data должна вернуть предусмотренное значение по умолчанию."
        },
        {
          "type": "paragraph",
          "text": "Пример 2: черновик формы хранится в Session Storage. После reload текущей вкладки он остаётся, независимая новая вкладка начинает отдельную сессию. При открытии через opener возможна начальная копия — проверьте именно предусмотренный продуктом сценарий."
        },
        {
          "type": "code",
          "language": "javascript",
          "text": "// Только на своей учебной странице в Console\nlocalStorage.setItem('qa-theme', 'dark');\nlocalStorage.getItem('qa-theme'); // 'dark'\nsessionStorage.setItem('qa-draft', JSON.stringify({name: 'Анна'}));\nJSON.parse(sessionStorage.getItem('qa-draft')).name; // 'Анна'\nlocalStorage.removeItem('qa-theme');\nsessionStorage.removeItem('qa-draft');"
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
            "Проверены нужный origin, вкладка и срок хранения.",
            "Проверены reload, новая вкладка и очистка данных.",
            "При logout удаляется чувствительное состояние.",
            "Приложение корректно обрабатывает недоступное хранилище."
          ]
        }
      ]
    }
  ],
  "sources": [
    [
      "MDN: Web Storage",
      "https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API"
    ]
  ]
};
