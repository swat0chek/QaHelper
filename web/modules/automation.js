window.qaModules["automation"] = {
  "topics": [
    {
      "id": "levels",
      "title": "Unit, integration и E2E",
      "blocks": [
        {
          "type": "table",
          "headers": [
            "Уровень",
            "Что проверяет",
            "Пример"
          ],
          "rows": [
            [
              "Unit",
              "Небольшую единицу логики в изоляции",
              "Расчёт скидки"
            ],
            [
              "Integration",
              "Взаимодействие компонентов",
              "Сервис сохраняет заказ в тестовую БД"
            ],
            [
              "E2E",
              "Полный пользовательский путь",
              "Вход → корзина → оформление заказа"
            ]
          ]
        },
        {
          "type": "paragraph",
          "text": "UI/API — интерфейс проверки, а unit/integration/E2E — охват. API-тест может быть интеграционным или сквозным. Быструю бизнес-логику выгодно покрывать ниже UI; несколько сквозных сценариев подтверждают работу системы целиком."
        }
      ]
    },
    {
      "id": "ui",
      "title": "Пример 1: UI-тест Playwright",
      "blocks": [
        {
          "type": "paragraph",
          "text": "Playwright управляет браузером и предоставляет ожидания/проверки; Selenium WebDriver также автоматизирует браузеры и используется с тестовыми фреймворками разных языков. Выбор зависит от стека, окружений и опыта команды. Пример для отдельно установленного @playwright/test проверяет текущий сайт."
        },
        {
          "type": "code",
          "language": "javascript",
          "text": "import { test, expect } from '@playwright/test';\ntest('HTTP справочник открывается из каталога', async ({ page }) => {\n  await page.goto('http://localhost:8080/');\n  await page.locator('a.section-card').filter({ hasText: 'HTTP коды' }).click();\n  await expect(page).toHaveURL(/http-codes/);\n  await expect(page.getByRole('heading', { level: 1 })).toContainText('HTTP');\n  await expect(page.locator('.status-code').filter({ hasText: /^200$/ })).toBeVisible();\n});"
        }
      ]
    },
    {
      "id": "api",
      "title": "Пример 2: API-проверка",
      "blocks": [
        {
          "type": "code",
          "language": "javascript",
          "text": "import { test, expect } from '@playwright/test';\ntest('неизвестная страница возвращает 404', async ({ request }) => {\n  const response = await request.get('http://localhost:8080/not-a-module');\n  expect(response.status()).toBe(404);\n  expect(await response.text()).toContain('Страница не найдена');\n});"
        },
        {
          "type": "paragraph",
          "text": "Автоматизируйте повторяемые проверки с ясным ожиданием и устойчивыми данными. Исследование новой функции, удобства и неожиданных рисков остаётся работой человека. Не заменяйте ожидание состояния sleep: случайные задержки делают тесты медленными и нестабильными."
        }
      ]
    },
    {
      "id": "stability",
      "title": "Flaky tests и поддержка",
      "blocks": [
        {
          "type": "list",
          "items": [
            "Изолируйте данные и не связывайте порядок тестов.",
            "Используйте устойчивые локаторы: роль, label или согласованный test ID.",
            "Сохраняйте trace/скриншот и логи при падении.",
            "Повторы помогают диагностике, но не превращают нестабильный тест в надёжный."
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
            "Проверка стоит на минимально достаточном уровне.",
            "Есть ясный assert и контролируемые данные.",
            "Нет случайных sleep и зависимости от порядка.",
            "Результат воспроизводим локально и в CI."
          ]
        }
      ]
    }
  ],
  "sources": [
    [
      "Playwright: writing tests",
      "https://playwright.dev/docs/writing-tests"
    ],
    [
      "Selenium WebDriver",
      "https://www.selenium.dev/documentation/webdriver/"
    ]
  ]
};
