window.qaModules["command-line"] = {
  "topics": [
    {
      "id": "shells",
      "title": "Выберите оболочку",
      "blocks": [
        {
          "type": "paragraph",
          "text": "Терминал — окно, shell — интерпретатор команд. CMD, PowerShell и Bash имеют разные команды и правила кавычек. В Windows PowerShell curl может быть псевдонимом: используйте curl.exe для запуска настоящего curl. Путь с пробелами заключайте в кавычки."
        },
        {
          "type": "table",
          "headers": [
            "Задача",
            "Bash / Linux",
            "CMD / Windows",
            "PowerShell"
          ],
          "rows": [
            [
              "Текущая папка",
              "pwd",
              "cd",
              "Get-Location"
            ],
            [
              "Перейти",
              "cd /tmp",
              "cd /d C:\\Temp",
              "Set-Location C:\\Temp"
            ],
            [
              "Список файлов",
              "ls -la",
              "dir",
              "Get-ChildItem -Force"
            ],
            [
              "Читать файл",
              "cat app.log",
              "type app.log",
              "Get-Content app.log"
            ],
            [
              "Найти ERROR",
              "grep -n \"ERROR\" app.log",
              "findstr /n /c:\"ERROR\" app.log",
              "Select-String -Path app.log -Pattern ERROR"
            ]
          ]
        }
      ]
    },
    {
      "id": "network",
      "title": "Пример 1: сервис не открывается",
      "blocks": [
        {
          "type": "code",
          "language": "text",
          "text": "# Bash / Linux\nnslookup localhost\nping -c 4 127.0.0.1\ncurl -i --max-time 5 http://localhost:8080/\nss -ltn\n# netstat -an доступен, если установлен пакет с netstat\n\n# CMD / Windows\nnslookup localhost\nping -n 4 127.0.0.1\ncurl.exe -i --max-time 5 http://localhost:8080/\nnetstat -ano | findstr :8080"
        },
        {
          "type": "paragraph",
          "text": "nslookup проверяет DNS, ping — доступность по ICMP, curl — HTTP, netstat/ss — сокеты. Успешный ping не доказывает работу API, а блокировка ICMP не доказывает недоступность сайта. Если порт слушает, но curl получает 500, проблема уже на уровне сервиса."
        }
      ]
    },
    {
      "id": "logs",
      "title": "Пример 2: найти ошибку в логе",
      "blocks": [
        {
          "type": "code",
          "language": "text",
          "text": "# Bash: совпадения и соседние строки\ngrep -n -C 2 'requestId=qa-42' app.log\n# PowerShell\nSelect-String -Path app.log -Pattern 'requestId=qa-42' -Context 2,2\n# CMD: номера строк, затем откройте файл для контекста\nfindstr /n /c:\"requestId=qa-42\" app.log"
        },
        {
          "type": "paragraph",
          "text": "Перенаправление > записывает вывод в файл с заменой, >> дописывает. Pipe | передаёт результат следующей команде; PowerShell обычно передаёт объекты, Bash — текст. Для доказательства прикладывайте время, команду и очищенный вывод, а не только «не работает»."
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
            "Выбрана правильная оболочка и папка.",
            "Проверены DNS, порт и HTTP отдельно.",
            "У сетевого запроса есть timeout.",
            "Перед перезаписью файла проверено имя назначения."
          ]
        }
      ]
    }
  ],
  "sources": [
    [
      "Microsoft: PowerShell",
      "https://learn.microsoft.com/en-us/powershell/scripting/overview"
    ],
    [
      "curl manual",
      "https://curl.se/docs/manpage.html"
    ]
  ]
};
