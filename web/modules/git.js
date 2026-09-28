window.qaModules["git"] = {
  "topics": [
    {
      "id": "workflow",
      "title": "Пример 1: ветка с тестами",
      "blocks": [
        {
          "type": "paragraph",
          "text": "Git хранит историю изменений. Рабочая папка, staging area и коммит — разные состояния: git add выбирает изменения для следующего коммита. Перед действием проверяйте git status и текущую ветку. URL ниже — шаблон адреса учебного репозитория, который нужно заменить."
        },
        {
          "type": "code",
          "language": "bash",
          "text": "git clone <URL_УЧЕБНОГО_РЕПОЗИТОРИЯ>\ncd qa-demo\ngit status\ngit pull --ff-only\ngit switch -c qa/login-checks\n# Измените файл checklist.md\ngit diff\ngit add checklist.md\ngit diff --staged\ngit commit -m \"Add login checklist\"\ngit push -u origin qa/login-checks"
        },
        {
          "type": "paragraph",
          "text": "clone создаёт локальную копию; branch показывает ветки; switch переключает или создаёт их. commit сохраняет локальный снимок, push отправляет коммиты. pull получает удалённые изменения и интегрирует их; --ff-only останавливается при разошедшейся истории вместо неявного merge."
        }
      ]
    },
    {
      "id": "merge",
      "title": "Пример 2: конфликт слияния",
      "blocks": [
        {
          "type": "paragraph",
          "text": "После сохранения своей работы выполните git fetch origin и git merge origin/main в своей ветке. Если один участок изменён с обеих сторон, Git просит разрешить конфликт. Откройте файлы из git status, выберите итоговое содержание, удалите маркеры <<<<<<<, =======, >>>>>>> и проверьте результат."
        },
        {
          "type": "code",
          "language": "bash",
          "text": "git status\n# Исправьте конфликт в checklist.md и проверьте смысл обеих правок\ngit add checklist.md\ngit commit\n# Если решили отменить именно незавершённое слияние:\n# git merge --abort"
        },
        {
          "type": "paragraph",
          "text": "Разрешить конфликт — не значит выбрать всё «наше» или «их». Итог должен сохранять нужное поведение обеих сторон. После merge запустите связанные тесты."
        }
      ]
    },
    {
      "id": "errors",
      "title": "Что делать, если Git ругается",
      "blocks": [
        {
          "type": "table",
          "headers": [
            "Сообщение",
            "Действие"
          ],
          "rows": [
            [
              "Not a git repository",
              "Проверьте текущую папку; перейдите в репозиторий"
            ],
            [
              "Local changes would be overwritten",
              "Просмотрите diff; сохраните осмысленным коммитом или временно stash, затем повторите"
            ],
            [
              "Non-fast-forward при push",
              "Выполните fetch, изучите историю, согласованно интегрируйте изменения"
            ],
            [
              "Authentication failed / Permission denied",
              "Проверьте URL, доступ и настройку токена/SSH"
            ],
            [
              "Unmerged files",
              "Завершите разрешение конфликтов или отмените незавершённый merge"
            ]
          ]
        },
        {
          "type": "note",
          "text": "Не используйте reset --hard или force push как универсальное исправление: они могут уничтожить работу или переписать общую историю. Начните со status, diff и log."
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
            "Выбраны правильные репозиторий и ветка.",
            "В staging нет секретов и случайных файлов.",
            "После merge проверены содержимое и тесты.",
            "Перед push просмотрены собственные коммиты."
          ]
        }
      ]
    }
  ],
  "sources": [
    [
      "Git: pull",
      "https://git-scm.com/docs/git-pull"
    ],
    [
      "Git: merge",
      "https://git-scm.com/docs/git-merge"
    ]
  ]
};
