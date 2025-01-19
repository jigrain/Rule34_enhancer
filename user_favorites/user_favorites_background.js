function fetchPage(url) {
    console.log(`Запит до URL: ${url}`);
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                console.error(`Помилка при завантаженні сторінки ${url}: Статус ${response.status}`);
                return null;
            }
            return response.text();
        })
        .then(html => {
            if (!html) {
                console.error(`Помилка: відсутній HTML для URL: ${url}`);
                return null;
            }
            console.log(`Сторінка успішно завантажена: ${url}`);
            return new DOMParser().parseFromString(html, 'text/html');
        })
        .catch(err => {
            console.error('Помилка при завантаженні сторінки:', err);
            return null;
        });
}

// Додаємо функцію затримки
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Функція для парсингу сторінок з додатковими спробами і затримкою між запитами
async function parsePages(baseUrl, pidStep) {
    let pid = 0;
    let collectedIds = [];
    let hasThumbs = true;

    while (hasThumbs) {
        let url = `${baseUrl}&pid=${pid}`;
        let doc = await fetchPageWithRetry(url, 3);  // Додаємо 3 спроби для кожного запиту
        
        if (!doc) {
            console.warn(`Пропускаємо URL ${url} через відсутність документу після кількох спроб.`);
            hasThumbs = false;
            continue;
        }

        let thumbs = doc.querySelectorAll('#content span.thumb a');
        console.log(`Знайдено ${thumbs.length} елементів на сторінці ${url}`);

        if (thumbs.length === 0) {
            console.log('Немає більше елементів для обробки. Завершення.');
            hasThumbs = false;
        } else {
            thumbs.forEach(thumb => {
                let postId = new URL(thumb.href).searchParams.get('id');
                console.log(`Знайдений ID: ${postId}`);
                collectedIds.push(postId);
            });
            pid += pidStep;
            console.log(`Переходимо до наступної сторінки з pid=${pid}`);
        }

        // Додаємо затримку між запитами, наприклад, 500 мс
        await delay(500);
    }

    const validIds = collectedIds.filter(id => id !== null && id !== undefined);
    console.log(`Загальна кількість зібраних ID: ${collectedIds.length}`);
    console.log(`Кількість валідних ID (без null): ${validIds.length}`);
    
    return validIds;
}

// Функція для обробки запиту з повторними спробами
async function fetchPageWithRetry(url, retries) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        const doc = await fetchPage(url);
        if (doc) {
            return doc;
        }
        console.warn(`Спроба ${attempt} не вдалася для URL: ${url}. Чекаємо перед повтором.`);
        await delay(1000); // Затримка між спробами (1 секунда)
    }
    console.error(`Не вдалося отримати документ для URL: ${url} після ${retries} спроб.`);
    return null;
}

// Обробка повідомлень з основного скрипта
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'startParsing') {
        const { baseUrl, pidStep } = message;
        
        // Викликаємо функцію парсингу і надсилаємо результат через sendResponse
        parsePages(baseUrl, pidStep).then(collectedIds => {
            console.log('Парсинг завершено, зібрані ID:', collectedIds);
            sendResponse({ collectedIds });
        });
        
        // Повертаємо true, щоб повідомити, що відповідь асинхронна
        return true;
    }
});

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'openOptionsPage') {
      chrome.runtime.openOptionsPage();
    }
  });
