window.qaModules["sql"] = {
  "topics": [
    {
      "id": "dataset",
      "title": "Учебная схема и данные",
      "blocks": [
        {
          "type": "paragraph",
          "text": "Примеры используют совместимый с SQLite синтаксис. Выполняйте их в отдельной учебной базе. Таблица orders связана с users через user_id; у Бориса нет заказов, у Анны отсутствует email."
        },
        {
          "type": "code",
          "language": "sql",
          "text": "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT);\nCREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, amount INTEGER, status TEXT,\n  FOREIGN KEY (user_id) REFERENCES users(id));\nINSERT INTO users VALUES (1, 'Анна', NULL), (2, 'Борис', 'b@example.test'), (3, 'Вера', 'v@example.test');\nINSERT INTO orders VALUES (101, 1, 100, 'paid'), (102, 1, 50, 'new'), (103, 3, 200, 'paid');"
        }
      ]
    },
    {
      "id": "select",
      "title": "Пример 1: SELECT, WHERE, ORDER BY и NULL",
      "blocks": [
        {
          "type": "code",
          "language": "sql",
          "text": "SELECT id, amount FROM orders\nWHERE status = 'paid' AND amount >= 100\nORDER BY amount DESC, id ASC;\n-- Результат: (103, 200), (101, 100)\nSELECT name FROM users WHERE email IS NULL;\n-- Результат: Анна"
        },
        {
          "type": "paragraph",
          "text": "WHERE фильтрует строки до группировки. Без ORDER BY порядок не гарантирован. NULL означает неизвестное или отсутствующее значение: используйте IS NULL, а не = NULL. COUNT(email) пропускает NULL, COUNT(*) считает строки. В этой базе это 2 и 3 соответственно."
        }
      ]
    },
    {
      "id": "join",
      "title": "Пример 2: JOIN и агрегатные функции",
      "blocks": [
        {
          "type": "code",
          "language": "sql",
          "text": "SELECT u.name, COUNT(o.id) AS order_count,\n       COALESCE(SUM(o.amount), 0) AS total\nFROM users u LEFT JOIN orders o ON o.user_id = u.id\nGROUP BY u.id, u.name\nORDER BY u.id;\n-- Анна | 2 | 150\n-- Борис | 0 | 0\n-- Вера | 1 | 200"
        },
        {
          "type": "paragraph",
          "text": "INNER JOIN оставил бы только пользователей с заказами. LEFT JOIN сохраняет пользователей без совпадений. Здесь COUNT(*) ошибочно дал бы Борису 1, поскольку строка пользователя сохранена. SUM, AVG, MIN и MAX работают по группе и обычно игнорируют NULL. COALESCE заменяет отсутствующую сумму на 0."
        },
        {
          "type": "code",
          "language": "sql",
          "text": "SELECT status, COUNT(*) AS count, AVG(amount) AS average\nFROM orders GROUP BY status HAVING SUM(amount) >= 100;\n-- paid | 2 | 150"
        },
        {
          "type": "paragraph",
          "text": "HAVING фильтрует группы после агрегации. Условие по правой таблице в WHERE после LEFT JOIN может убрать строки без совпадения. Для сохранения всех пользователей фильтр заказов часто нужен в ON."
        }
      ]
    },
    {
      "id": "write",
      "title": "INSERT и UPDATE",
      "blocks": [
        {
          "type": "code",
          "language": "sql",
          "text": "BEGIN TRANSACTION;\nINSERT INTO orders VALUES (104, 2, 80, 'new');\nUPDATE orders SET status = 'paid' WHERE id = 104;\nSELECT id, status FROM orders WHERE id = 104;\n-- 104 | paid\nROLLBACK;\n-- Учебная база вернулась к исходному состоянию."
        },
        {
          "type": "note",
          "text": "Перед UPDATE выполните SELECT с тем же WHERE и проверьте целевые строки. UPDATE без WHERE изменяет все строки. Синтаксис транзакций, типов и ограничений зависит от СУБД."
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
            "Выборка сверена с ожидаемыми строками и порядком.",
            "Проверены NULL и записи без связанных сущностей.",
            "JOIN не создаёт неожиданные дубликаты.",
            "Изменения выполняются только в учебной базе и откатываются."
          ]
        }
      ]
    }
  ],
  "sources": [
    [
      "SQLite SELECT",
      "https://www.sqlite.org/lang_select.html"
    ]
  ]
};
