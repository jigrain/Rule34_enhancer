// Функція для отримання user_id з куків
function getUserIdFromCookies() {
    return browser.cookies.get({
        url: "https://rule34.xxx",
        name: "user_id"
    });
}

// Функція для збереження user_id в локальне сховище
function saveUserIdToLocalStorage(userId) {
    browser.storage.local.set({ userId });
}

// Функція для отримання user_id з локального сховища
function getUserIdFromLocalStorage() {
    return browser.storage.local.get('userId');
}

// Обробка запитів від content.js
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getUserId') {
        // Повертаємо user_id або порожнє значення
        getUserIdFromLocalStorage().then((result) => {
            let userId = result.userId;

            if (userId) {
                // Якщо user_id знайдений у локальному сховищі
                sendResponse({ userId });
            } else {
                // Якщо user_id немає в сховищі, спробуємо отримати з куків
                getUserIdFromCookies().then((cookie) => {
                    if (cookie) {
                        userId = cookie.value;
                        // Зберігаємо в локальне сховище
                        saveUserIdToLocalStorage(userId);
                        sendResponse({ userId });
                    } else {
                        sendResponse({ userId: null });  // Кука не знайдена
                    }
                }).catch((error) => {
                    console.error('Помилка отримання куки:', error);
                    sendResponse({ userId: null });
                });
            }
        }).catch((error) => {
            console.error('Помилка отримання user_id з локального сховища:', error);
            sendResponse({ userId: null });
        });

        // Повертаємо true для асинхронної відповіді
        return true;
    }
});
