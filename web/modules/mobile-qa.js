window.qaModules["mobile-qa"] = {
  "topics": [
    {
      "id": "platforms",
      "title": "Android/iOS, APK и окружения",
      "blocks": [
        {
          "type": "paragraph",
          "text": "APK — установочный пакет Android, не iOS. Для iOS применяются другие способы доставки, например TestFlight или сборка из Xcode. Android Emulator и iOS Simulator удобны для быстрых проверок, но не заменяют реальные устройства для камеры, батареи, производительности и особенностей сети."
        },
        {
          "type": "list",
          "items": [
            "Фиксируйте модель, ОС, версию приложения, тип сборки и способ установки.",
            "Проверяйте чистую установку и обновление с сохранением данных.",
            "Учитывайте фон/возврат, поворот, клавиатуру, системный размер текста и прерывания звонком."
          ]
        }
      ]
    },
    {
      "id": "adb",
      "title": "Пример 1: установка и логи Android",
      "blocks": [
        {
          "type": "paragraph",
          "text": "Установите Android SDK Platform Tools, включите USB debugging на своём тестовом устройстве и подтвердите доверие компьютеру. При нескольких устройствах используйте -s SERIAL. Замените com.example.qa на package name учебного приложения."
        },
        {
          "type": "code",
          "language": "bash",
          "text": "adb devices\nadb -s emulator-5554 install -r app-debug.apk\nadb -s emulator-5554 shell pidof com.example.qa\n# Подставьте полученный PID:\nadb -s emulator-5554 logcat --pid=12345 -d > qa-log.txt"
        },
        {
          "type": "paragraph",
          "text": "Если устройство unauthorized — проверьте подтверждение на экране. Если offline — проверьте подключение и состояние эмулятора. PID меняется после перезапуска процесса. Логи iOS просматривайте через инструменты Xcode/Console на macOS."
        }
      ]
    },
    {
      "id": "permissions",
      "title": "Разрешения и deep links: пример 2",
      "blocks": [
        {
          "type": "paragraph",
          "text": "Deep link открывает определённый экран приложения. Android App Links и iOS Universal Links связывают HTTPS-домен с приложением через проверку владения. Проверьте установленное/неустановленное приложение, авторизованного/неавторизованного пользователя и несуществующий ресурс."
        },
        {
          "type": "code",
          "language": "bash",
          "text": "adb shell am start -W -a android.intent.action.VIEW -d \"https://example.test/orders/42\""
        },
        {
          "type": "paragraph",
          "text": "В учебном приложении с настроенным доменом ссылка должна открыть заказ 42 только при наличии доступа. Без сессии — вход с корректным продолжением сценария. example.test — пример, а не готовый стенд."
        },
        {
          "type": "list",
          "items": [
            "Для камеры: первый запрос разрешения, отказ, разрешение через настройки, повторный вход.",
            "После отзыва разрешения приложение объясняет ограничение и не падает.",
            "Разрешение запрашивается при использовании функции, а не без контекста."
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
            "Проверены реальное устройство и целевые версии ОС.",
            "Есть сценарии установки, обновления и возврата из фона.",
            "Проверены отказ/отзыв разрешения и deep links.",
            "Логи содержат нужный процесс и время, без персональных данных."
          ]
        }
      ]
    }
  ],
  "sources": [
    [
      "Android: ADB",
      "https://developer.android.com/tools/adb"
    ],
    [
      "Apple: testing in Simulator",
      "https://developer.apple.com/documentation/xcode/running-your-app-in-simulator-or-on-a-device"
    ]
  ]
};
