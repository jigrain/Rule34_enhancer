
// Додаємо стилі для кнопки на початку скрипта
const style = document.createElement('style');
style.innerHTML = `
#controlContainer {
    display: flex;
    justify-content: start;
    align-items: center;
    gap: 10px; /* Відстань між кнопкою і полем введення */
    margin: 10px auto auto 20px;
}
#openGalleryButton {
    padding: 10px 20px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 5px;
    font-size: 16px;
    cursor: pointer;
    z-index: 1000;
}
#openGalleryButton:hover {
    background-color: #45a049;
}
#search_input {
    padding: 10px;
    font-size: 16px;
    border: 1px solid #ddd;
    border-radius: 5px;
}
`;
document.head.appendChild(style);


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

            // Створюємо контейнер для кнопки та поля введення
            const contentDiv = document.getElementById('header');
            const controlContainer = document.createElement('div');
            controlContainer.id = 'controlContainer';

            const openGalleryButton = document.createElement('button');
            openGalleryButton.innerText = 'Open Gallery';
            openGalleryButton.id = 'openGalleryButton';

            const SearchFavorites = document.createElement('input');
            SearchFavorites.type = "text"
            SearchFavorites.id = "search_input";
            SearchFavorites.placeholder = "Search favorites...";

            // Додаємо кнопку та поле введення до контейнера
            controlContainer.appendChild(openGalleryButton);
            controlContainer.appendChild(SearchFavorites);

            // Додаємо контейнер до contentDiv
            contentDiv.appendChild(controlContainer);
        } else {
            console.log('Перевірка не пройдена: або неправильний URL, або user_id не збігається.');
        }
    } else {
        console.log('user_id не знайдений.');
    }
});

openGalleryButton.addEventListener('click', () => {
    console.log('Open Gallery button clicked');
    // Можна додати тут код, який виконується при натисканні кнопки
});
