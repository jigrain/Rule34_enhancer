function fetchPage(url) {
    return fetch(url)
        .then(response => response.text())
        .then(html => new DOMParser().parseFromString(html, 'text/html'))
        .catch(err => console.error('Error fetching page:', err));
}

async function parsePages(baseUrl, pidStep) {
    let pid = 0;
    let collectedIds = [];
    let hasThumbs = true;

    while (hasThumbs) {
        let url = `${baseUrl}&pid=${pid}`;
        let doc = await fetchPage(url);
        
        let thumbs = doc.querySelectorAll('#content span.thumb a');
        
        if (thumbs.length === 0) {
            hasThumbs = false;
        } else {
            thumbs.forEach(thumb => {
                let postId = new URL(thumb.href).searchParams.get('id');
                collectedIds.push(postId);  // Додаємо id в масив, навіть якщо це null
            });
            pid += pidStep;
        }
    }

    // Очищаємо масив від null або undefined значень
    const validIds = collectedIds.filter(id => id !== null && id !== undefined);

    // Зберігаємо зібрані ID в локальному сховищі
    await browser.storage.local.set({ collectedIds: validIds });

    console.log('Зібрані ID збережено локально:', validIds);
    return validIds;
}

// Обробка повідомлень з main.js
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'startParsing') {
        const { baseUrl, pidStep } = message;
        
        // Викликаємо функцію парсингу
        parsePages(baseUrl, pidStep).then(collectedIds => {
            console.log('Парсинг завершено, зібрані ID:', collectedIds);
        });
    }
});
