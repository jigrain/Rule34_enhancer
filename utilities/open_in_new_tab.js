// Шукаємо контейнери з посиланнями
const imageList = document.querySelector('.image-list');
const favoriteImageList = document.getElementById('content');

// Функція для встановлення target="_blank" для специфічних посилань
function setLinksToOpenInNewTab(container) {
    if (container) {
        // Шукаємо всі <a> всередині <span class="thumb">, які мають атрибут id
        const links = container.querySelectorAll('span.thumb a[id]');

        links.forEach(link => {
            // Перевіряємо, чи посилання знаходиться всередині #paginator або .sidebar
            const isInsidePaginator = link.closest('#paginator') !== null;
            const isInsideSidebar = link.closest('.sidebar') !== null;

            if (isInsidePaginator || isInsideSidebar) {
                return; // Пропускаємо ці посилання
            }

            // Видаляємо атрибут "onclick" (якщо є), щоб уникнути конфліктів
            if (link.hasAttribute('onclick')) {
                link.removeAttribute('onclick');
            }

            // Встановлюємо target="_blank" для відкривання у новій вкладці
            link.setAttribute('target', '_blank');
        });
    }
}

// Застосовуємо функцію до обох контейнерів
setLinksToOpenInNewTab(imageList);
setLinksToOpenInNewTab(favoriteImageList);
