// Додаємо обробник події для кнопки
const searchHistoryButton = document.getElementById('open-search-history');
searchHistoryButton.addEventListener('click', openModal);

// Створюємо модальне вікно
let modal = document.createElement('dialog');
modal.setAttribute('id', 'search-history-modal');
modal.classList.add('search-history-modal');

// Додаємо початковий контент модального вікна
modal.innerHTML = `
  <button id="close-modal" class="close-modal-button">×</button>
  <h2 class="modal-title">Search History</h2>
  <div id="history-content" class="history-content"></div>
  <div id="pagination" class="pagination-search-history"></div>
`;

// Додаємо модальне вікно до сторінки
document.body.appendChild(modal);

// Функція для відкриття модального вікна
function openModal() {
    fetchHistory(); // Отримуємо історію
    modal.showModal();
}

// Додаємо обробник події для закриття модального вікна
let closeButton = modal.querySelector('#close-modal');
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

function openInNewTab(url) {
    window.open(url, '_blank').focus();
}

async function copyTextToClipboard(textToCopy) {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      }
    } catch (err) {
      console.error(err);
    }
  }
  

// Функція для рендерингу історії
function renderHistory(items, page, maxPerPage) {
    let historyContent = document.getElementById('history-content');
    let pagination = document.getElementById('pagination');
    historyContent.innerHTML = ''; // Очищаємо список
    pagination.innerHTML = ''; // Очищаємо пагінацію

    // Пагінація
    let totalPages = Math.ceil(items.length / maxPerPage);
    let startIndex = (page - 1) * maxPerPage;
    let currentPageItems = items.slice(startIndex, startIndex + maxPerPage);

    // Виводимо елементи
    currentPageItems.forEach(item => {
        let entry = document.createElement('div');
        entry.classList.add('history-entry');

        let title = document.createElement('span');
        title.classList.add('history-title');
        title.textContent = item.title;

        let date = document.createElement('span');
        date.classList.add('history-date');
        date.textContent = formatDate(item.date);

        let copyButton = document.createElement('button');
        copyButton.classList.add('history-copy-button');
        copyButton.textContent = 'Копіювати';
        copyButton.addEventListener('click', () => copyTextToClipboard(item.title));

        let redirectButton = document.createElement('button');
        redirectButton.classList.add('history-redirect-button');
        redirectButton.textContent = 'Перейти';
        redirectButton.addEventListener('click', () => openInNewTab(item.url));

        entry.appendChild(date);
        entry.appendChild(title);
        entry.appendChild(copyButton);
        entry.appendChild(redirectButton);
        historyContent.appendChild(entry);
    });

    // Функція для форматування дати
    function formatDate(timestamp) {
        let date = new Date(timestamp);
        return date.toLocaleString(); // Формат дати у локальному вигляді
    }

    // Виводимо кнопки пагінації
    renderHistoryPagination(pagination, totalPages, page, items, maxPerPage);
}

// Функція для сучасного пагінатора
function renderHistoryPagination(container, totalPages, currentPage, items, maxPerPage) {
    const maxVisiblePages = 5; // Максимальна кількість кнопок, які будуть видимі одночасно
    container.innerHTML = ''; // Очищення контейнера

    if (totalPages <= 1) return; // Якщо сторінок менше двох, пагінація не потрібна

    // Додаємо кнопку для переходу на першу сторінку
    if (currentPage > 1) {
        container.appendChild(createPagePaginatorButton('fas fa-angle-double-left', 1, () => renderHistory(items, 1, maxPerPage), true));
        container.appendChild(createPagePaginatorButton('fas fa-angle-left', currentPage - 1, () => renderHistory(items, currentPage - 1, maxPerPage), true));
    }

    // Обчислення діапазону сторінок для відображення
    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Генерація кнопок для діапазону сторінок
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = createPagePaginatorButton(i, i, () => renderHistory(items, i, maxPerPage));
        if (i === currentPage) {
            pageButton.classList.add('pagination-button-active');
        } else {
            pageButton.classList.add('pagination-button');
        }
        container.appendChild(pageButton);
    }

    // Додаємо кнопку для переходу на останню сторінку
    if (currentPage < totalPages) {
        container.appendChild(createPagePaginatorButton('fa-solid fa-angle-right', currentPage + 1, () => renderHistory(items, currentPage + 1, maxPerPage), true));
        container.appendChild(createPagePaginatorButton('fa fa-angle-double-right', totalPages, () => renderHistory(items, totalPages, maxPerPage), true));
    }
}

// Оновлена функція createPageButton для підтримки іконок Font Awesome
function createPagePaginatorButton(label, page, onClick, isScrollButton = false) {
    let button = document.createElement('button');
    console.log(isScrollButton);
    button.classList.add(isScrollButton ? 'pagination-button-scroll' : 'pagination-button');
    button.addEventListener('click', onClick);

    if (isScrollButton) {
        // Якщо це кнопка прокрутки, додаємо іконку
        let icon = document.createElement('i');
        icon.className = label; // label тепер містить клас іконки, наприклад, "fas fa-angle-right"
        button.appendChild(icon);
    } else {
        // Якщо це звичайна кнопка, додаємо текст
        button.textContent = label; // label — це текст (номер сторінки)
    }

    return button;
}

