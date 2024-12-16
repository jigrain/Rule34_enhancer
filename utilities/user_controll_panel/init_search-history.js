// Додаємо обробник події для кнопки
const searchHistoryButton = document.getElementById('open-search-history');
searchHistoryButton.addEventListener('click', openModal);

// Створюємо модальне вікно
const modal = document.createElement('dialog');
modal.setAttribute('id', 'search-history-modal');
modal.style.width = '80%';
modal.style.height = '60%';
modal.style.padding = '20px';
modal.style.borderRadius = '10px';
modal.style.border = 'none';
modal.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
modal.style.textAlign = 'center';
modal.style.fontFamily = 'Arial, sans-serif';
modal.style.overflowY = 'auto';

// Додаємо початковий контент модального вікна
modal.innerHTML = `
  <button id="close-modal" style="
    position: absolute;
    top: 10px;
    right: 10px;
    border: none;
    background: none;
    font-size: 20px;
    font-weight: bold;
    cursor: pointer;
    color: #555;
  ">×</button>
  <h2>Search History</h2>
  <div id="history-content" style="margin-bottom: 20px;"></div>
  <div id="pagination" style="margin-bottom: 20px; display: flex; justify-content: center; gap: 10px;"></div>
`;

// Додаємо модальне вікно до сторінки
document.body.appendChild(modal);

// Функція для відкриття модального вікна
function openModal() {
    fetchHistory(); // Отримуємо історію
    modal.showModal();
}

// Додаємо обробник події для закриття модального вікна
const closeButton = modal.querySelector('#close-modal');
closeButton.addEventListener('click', () => {
    modal.close();
});

// Функція для отримання історії через Messaging API
function fetchHistory() {
    chrome.runtime.sendMessage({ action: 'fetchHistory' }, (response) => {
        if (response && response.history) {
            renderHistory(response.history, 1, 10);
        }
    });
}

// Функція для рендерингу історії
function renderHistory(items, page, maxPerPage) {
    const historyContent = document.getElementById('history-content');
    const pagination = document.getElementById('pagination');
    historyContent.innerHTML = ''; // Очищаємо список
    pagination.innerHTML = ''; // Очищаємо пагінацію

    // Пагінація
    const totalPages = Math.ceil(items.length / maxPerPage);
    const startIndex = (page - 1) * maxPerPage;
    const currentPageItems = items.slice(startIndex, startIndex + maxPerPage);

    // Виводимо елементи
    currentPageItems.forEach(item => {
        const entry = document.createElement('div');
        entry.style.display = 'flex';
        entry.style.justifyContent = 'space-between';
        entry.style.alignItems = 'center';
        entry.style.marginBottom = '10px';

        const title = document.createElement('span');
        title.style.flexGrow = '1';
        title.style.textAlign = 'left';
        title.textContent = item.title;

        const date = document.createElement('span');
        date.style.marginRight = '10px';
        date.style.color = '#888';
        date.textContent = formatDate(item.date);

        const copyButton = document.createElement('button');
        copyButton.textContent = 'Копіювати';
        copyButton.style.marginLeft = '10px';
        copyButton.style.padding = '5px';
        copyButton.style.cursor = 'pointer';
        copyButton.addEventListener('click', () => copyToClipboard(item.title));

        const redirectButton = document.createElement('button');
        redirectButton.textContent = 'Перейти';
        redirectButton.style.marginLeft = '10px';
        redirectButton.style.padding = '5px';
        redirectButton.style.cursor = 'pointer';
        redirectButton.addEventListener('click', () => redirectTo(item.url));

        entry.appendChild(date);
        entry.appendChild(title);
        entry.appendChild(copyButton);
        entry.appendChild(redirectButton);
        historyContent.appendChild(entry);
    });

    // Функція для форматування дати
    function formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString(); // Формат дати у локальному вигляді
    }

    // Виводимо кнопки пагінації
    renderPagination(pagination, totalPages, page, items, maxPerPage);
}

// Функція для сучасного пагінатора
function renderPagination(container, totalPages, currentPage, items, maxPerPage) {
    const maxVisiblePages = 3;

    // Кнопка для першої сторінки
    if (currentPage > 1) {
        const firstPageButton = createPageButton('<<', 1, () => renderHistory(items, 1, maxPerPage));
        container.appendChild(firstPageButton);
    }

    // Кнопка "Назад"
    if (currentPage > 1) {
        const prevButton = createPageButton('<', currentPage - 1, () => renderHistory(items, currentPage - 1, maxPerPage));
        container.appendChild(prevButton);
    }

    // Відображення діапазону сторінок
    const startPage = Math.max(1, currentPage - maxVisiblePages);
    const endPage = Math.min(totalPages, currentPage + maxVisiblePages);

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = createPageButton(i, i, () => renderHistory(items, i, maxPerPage));
        if (i === currentPage) {
            pageButton.style.backgroundColor = '#007BFF';
            pageButton.style.color = '#fff';
        }
        container.appendChild(pageButton);
    }

    // Кнопка "Вперед"
    if (currentPage < totalPages) {
        const nextButton = createPageButton('>', currentPage + 1, () => renderHistory(items, currentPage + 1, maxPerPage));
        container.appendChild(nextButton);
    }

    // Кнопка для останньої сторінки
    if (currentPage < totalPages) {
        const lastPageButton = createPageButton('>>', totalPages, () => renderHistory(items, totalPages, maxPerPage));
        container.appendChild(lastPageButton);
    }
}

// Функція для створення кнопки пагінації
function createPageButton(label, page, onClick) {
    const button = document.createElement('button');
    button.textContent = label;
    button.style.padding = '5px 10px';
    button.style.margin = '0 5px';
    button.style.cursor = 'pointer';
    button.style.backgroundColor = '#f0f0f0';
    button.style.border = '1px solid #ddd';
    button.addEventListener('click', onClick);
    return button;
}

