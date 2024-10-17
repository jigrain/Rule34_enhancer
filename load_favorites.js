
// Запитуємо user_id у фонового скрипта
browser.runtime.sendMessage({ action: 'getUserId' }, (response) => {
    const userId = response.userId;

    if (userId) {
        console.log('Отриманий user_id:', userId);

        // Виконуємо перевірку URL
        if (currentUrl.includes("page=favorites") && currentUrl.includes(`id=${userId}`)) {
            console.log('URL містить потрібні параметри та збігається з user_id');
            
            // Надсилаємо запит на запуск парсингу
            browser.runtime.sendMessage({
                action: 'startParsing',
                baseUrl: `https://rule34.xxx/index.php?page=favorites&s=view&id=${userId}`,
                pidStep: 50
            });
        } else {
            console.log('Перевірка не пройдена: або неправильний URL, або user_id не збігається.');
        }
    } else {
        console.log('user_id не знайдений.');
    }
});
