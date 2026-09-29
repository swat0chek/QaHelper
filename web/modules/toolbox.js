// One definition per utility; searchable topics are derived from the same data.
window.qaModules.toolbox = (() => {
  const tools = [
  {
    "id": "json-format",
    "title": "JSON Formatter / Validator",
    "purpose": "Проверить синтаксис ответа API и сделать JSON читаемым.",
    "help": "JSON обрабатывается стандартным JSON.parse: повторные ключи заменяются последним значением, дробные числа имеют точность JavaScript. Большие целые отклоняются.",
    "example": [
      "{\"name\":\"QA\",\"active\":true,\"roles\":[\"tester\"]}"
    ],
    "modes": []
  },
  {
    "id": "json-minify",
    "title": "JSON Minify",
    "purpose": "Убрать форматирование JSON перед вставкой в запрос или fixture.",
    "help": "Удаляются пробелы вне строк. Ограничения точности и повторных ключей такие же, как у Formatter.",
    "example": [
      "{\n  \"name\": \"QA\",\n  \"active\": true\n}"
    ],
    "modes": []
  },
  {
    "id": "json-diff",
    "title": "JSON Diff",
    "purpose": "Сравнить ожидаемый и фактический ответы API.",
    "help": "Порядок ключей объекта не важен, массивы сравниваются по индексам. Пути — JSON Pointer; пустой путь означает корень. Максимум 2000 различий.",
    "example": [
      "{\"status\":\"pending\",\"items\":[1,2]}",
      "{\"status\":\"paid\",\"items\":[1,3]}"
    ],
    "modes": []
  },
  {
    "id": "text-diff",
    "title": "Text Diff",
    "purpose": "Сравнить тексты, логи и сообщения об ошибке.",
    "help": "Построчное сравнение: − удалено, + добавлено. CRLF/CR считаются LF; пробелы и завершающая пустая строка учитываются. Максимум 400 строк.",
    "example": [
      "status: pending\namount: 100",
      "status: paid\namount: 100"
    ],
    "modes": []
  },
  {
    "id": "base64",
    "title": "Base64 Encode/Decode",
    "purpose": "Подготовить закодированную строку или прочесть текстовое значение.",
    "help": "Base64 не шифрует данные. Используется стандартный Base64 и UTF-8; бинарные файлы не поддерживаются.",
    "example": [
      "Привет, QA!"
    ],
    "modes": [
      [
        "encode",
        "Encode → Base64"
      ],
      [
        "decode",
        "Decode → UTF-8"
      ]
    ]
  },
  {
    "id": "url",
    "title": "URL Encode/Decode",
    "purpose": "Закодировать значение query-параметра или прочитать его.",
    "help": "Обрабатывается отдельный компонент URL, не весь адрес. Пробел → %20; плюс при декодировании остаётся плюсом.",
    "example": [
      "поиск & QA=1"
    ],
    "modes": [
      [
        "encode",
        "Encode → URL component"
      ],
      [
        "decode",
        "Decode → текст"
      ]
    ]
  },
  {
    "id": "uuid",
    "title": "UUID Generator",
    "purpose": "Создать уникальные тестовые идентификаторы.",
    "help": "UUID v4 генерируются криптографическим генератором браузера. Количество: 1–100.",
    "example": [
      "3"
    ],
    "modes": []
  },
  {
    "id": "timestamp",
    "title": "Unix Timestamp ↔ Date",
    "purpose": "Сопоставить время в логах, API и интерфейсе.",
    "help": "Единицы выбираются явно. Результат всегда в UTC; для ISO даты обязателен часовой пояс.",
    "example": [
      "1767225600"
    ],
    "modes": [
      [
        "seconds",
        "Unix seconds → Date"
      ],
      [
        "milliseconds",
        "Unix milliseconds → Date"
      ],
      [
        "date",
        "ISO Date → Unix"
      ]
    ]
  },
  {
    "id": "characters",
    "title": "Character Counter",
    "purpose": "Проверить граничные значения длины поля.",
    "help": "UTF-16, Unicode code points и видимые графемы могут иметь разную длину, особенно для emoji.",
    "example": [
      "Привет 👩‍💻"
    ],
    "modes": []
  },
  {
    "id": "bytes",
    "title": "Byte Counter",
    "purpose": "Проверить размер текстового payload в UTF-8.",
    "help": "Считаются байты UTF-8, без HTTP-заголовков, BOM или сжатия. Поле ввода браузера нормализует переводы строк в LF.",
    "example": [
      "Привет 👩‍💻"
    ],
    "modes": []
  },
  {
    "id": "jwt",
    "title": "JWT Decoder",
    "purpose": "Посмотреть header и claims тестового токена.",
    "help": "Токен обрабатывается только в браузере, не сохраняется и не отправляется на сервер. Подпись НЕ проверяется. Claims нельзя считать достоверными. JWE не поддерживается.",
    "example": [
      "eyJhbGciOiJub25lIn0.eyJzdWIiOiJxYS1kZW1vIiwiZXhwIjoxNzY3MjI1NjAwfQ."
    ],
    "modes": []
  }
, {"id":"test-data-generator","title":"Test Data Generator","renderer":"generator","purpose":"Создать тестовые имя, email, телефон, UUID, число, строку, дату, IPv4, URL, JSON или список значений.","help":"Обычная генерация и Edge Cases / Problematic Data: пустая строка, пробелы, Unicode, emoji, кириллица, дефис, апостроф, длинная строка, перенос строки, HTML-like input и специальные символы. Для тестовых сред и проверки валидации. Всё локально; запросы, звонки и отправка писем не выполняются.","example":[],"modes":[]}
];
  return {tools, topics: tools.map(tool => ({id:tool.id, title:tool.title, blocks:[
    {type:'paragraph', text:tool.purpose}, {type:'note', text:tool.help}
  ]}))};
})();
