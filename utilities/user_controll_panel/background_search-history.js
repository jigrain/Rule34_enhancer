chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'fetchHistory') {
        const searchUrl = "https://rule34.xxx/index.php?page=post&s=list";
        const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000; // Дата 30 днів тому

        // Використовуємо chrome.history для пошуку історії
        chrome.history.search({ text: searchUrl, startTime: oneMonthAgo, maxResults: 1000 }, (results) => {
            const filteredResults = results
                .filter(item => item.url.includes(searchUrl)) // Фільтруємо за пошуковою URL
                .map(item => ({
                    url: item.url,
                    title: new URL(item.url).searchParams.get('tags')?.replace(/\+/g, ' ') || 'Unknown Title',
                    date: item.lastVisitTime
                }));

            sendResponse({ history: filteredResults });
        });

        // Повертаємо true, щоб вказати, що відповідь буде асинхронною
        return true;
    }
});
