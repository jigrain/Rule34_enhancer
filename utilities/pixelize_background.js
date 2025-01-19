chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'fetchImage') {
      fetch(message.src)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.blob();
        })
        .then(blob => {
          sendResponse({ success: true, blob: blob });
        })
        .catch(error => {
          console.error('Помилка завантаження:', error);
          sendResponse({ success: false });
        });
  
      return true;  // Вказуємо, що відповідь буде асинхронною
    }
  });


// Створюємо пункт у контекстному меню
browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.create({
      id: 'togglePixelation',
      title: 'Перемкнути пікселізацію зображень',
      contexts: ['all'],
      documentUrlPatterns: [
        "*://rule34.xxx/*"
      ]
    });
  });
  
  // Обробник натискання на пункт контекстного меню
  browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'togglePixelation') {
      // Отримуємо поточний статус з локального сховища
      browser.storage.local.get('pixelateEnabled').then((data) => {
        const newStatus = !data.pixelateEnabled; // Перемикаємо значення
  
        // Зберігаємо новий статус
        browser.storage.local.set({ pixelateEnabled: newStatus }).then(() => {
          // Надсилаємо повідомлення до контентного скрипта для оновлення статусу
          browser.tabs.sendMessage(tab.id, { action: 'updatePixelationStatus', enabled: newStatus });
        });
      });
    }
  });
  