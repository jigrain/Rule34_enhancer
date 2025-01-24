// Підготовка глобальних змінних 
(() => {
const savedTagsKey = 'savedTagsData';
let savedStrings = []; // Масив для збережених стрічок
let selectedTags = []; // Виділені теги
const allTags = ['author', 'general']; // Доступні теги

// Створюємо модальне вікно
let modal_saved_search = document.createElement('dialog');
modal_saved_search.className = 'main-modal-window';
modal_saved_search.setAttribute('id', 'main-modal-window');
modal_saved_search.innerHTML = `
  <button id="close-modal" class="close-modal-button">×</button>
  <h2 class="modal-title">Tag Manager</h2>
  
  <div class="modal-search-form">
    <input name="tags" id="search-input" type="text" 
        autocomplete="off" 
        placeholder="Enter your tag" 
        aria-autocomplete="list">
    <input id="search-button" type="submit" value="Search">
    <input id="add-button" type="submit" value="Add">
  </div>
  
  <div class="select-tags-section-tags">
  <span>Select Tags:</span>
    ${allTags.map(tag => `
        <button class="tag-button-tags" data-tag="${tag}">${tag}</button>
    `).join('')}

    <label class="favorite-checkbox-label">
        <input type="checkbox" id="favorite-checkbox" class="favorite-checkbox">
        Favorites
    </label>
    </div>
  
  <div id="tag-content"></div>
  
  <div id="modal_saved_search_pagination" class="pagination-search-history"></div>
`;

document.body.appendChild(modal_saved_search);

// Закриття модального вікна
let modal_closeButton = modal_saved_search.querySelector('#close-modal');
modal_closeButton.addEventListener('click', () => modal_saved_search.close());

// Відображення модального вікна
function openSavedSearchModal() {
    loadSavedTags();
    modal_saved_search.showModal();
}

function initializeStorage() {
    browser.storage.local.get(savedTagsKey).then(result => {
        if (!result[savedTagsKey]) {
            browser.storage.local.set({ [savedTagsKey]: [] }).then(() => {
                console.log(`${savedTagsKey} успішно ініціалізовано як порожній масив.`);
            }).catch(err => {
                console.error('Помилка при ініціалізації:', err);
            });
        }
    }).catch(err => {
        console.error('Помилка при отриманні:', err);
    });
}

const favoriteCheckbox = document.getElementById('favorite-checkbox');
favoriteCheckbox.addEventListener('change', () => {
    const query = document.getElementById('search-input').value.trim();
    const filtered = filterTags(query); // Повторно застосовуємо фільтри
    renderTags(filtered, 1, 10); // Оновлюємо відображення
});

// Події для кнопок "Add" та "Search"
document.getElementById('search-button').addEventListener('click', () => {
    let query = document.getElementById('search-input').value.trim();
    let filtered = filterTags(query);
    renderTags(filtered, 1, 10);
});

document.getElementById('add-button').addEventListener('click', () => {
    let input = document.getElementById('search-input');
    let newTag = input.value.trim();
    if (!newTag) return alert('Enter a valid tag');
    addNewTag(newTag, selectedTags);
    input.value = '';
});

// Події для керування тегами
document.querySelectorAll('.tag-button-tags').forEach(button => {
    button.addEventListener('click', (e) => {
        let tag = e.target.dataset.tag;
        e.target.classList.toggle('selected');
        if (selectedTags.includes(tag)) {
            selectedTags = selectedTags.filter(t => t !== tag);
        } else {
            selectedTags.push(tag);
        }
    });
});

document.getElementById('addNewTagsToSavedButton').addEventListener('click', () => {
    const tagInput = document.querySelector('input[name="tags"]');
    if (!tagInput) {
        console.error('Input element with name="tags" not found.');
        return;
    }

    const newTag = tagInput.value.trim();
    if (!newTag) {
        console.warn('Empty or invalid tag. Skipping.');
        return;
    }

    // Отримання поточних тегів з локального сховища
    browser.storage.local.get(savedTagsKey).then(result => {
        const currentTags = result[savedTagsKey] || [];

        // Перевірка, чи існує вже такий тег
        if (currentTags.some(item => item.tag === newTag)) {
            console.warn(`Tag "${newTag}" вже існує. Пропуск.`);
            return;
        }

        // Додавання нового тегу
        const newEntry = {
            tag: newTag,
            tags: [],
            favorite: false
        };

        currentTags.push(newEntry);

        // Збереження оновленого масиву у локальне сховище
        return browser.storage.local.set({ [savedTagsKey]: currentTags });
    }).then(() => {
        console.log(`Tag "${newTag}" успішно додано.`);
        tagInput.value = ''; // Очищення поля вводу
        loadSavedTags(); // Оновлення відображення тегів
    }).catch(err => {
        console.error('Помилка при додаванні тегу:', err);
    });
});

// Збереження нової стрічки
function addNewTag(tag, tags) {
    const newEntry = {
        tag,
        tags: [...tags],
        favorite: false
    };

    browser.storage.local.get(savedTagsKey).then(result => {
        const currentTags = result[savedTagsKey] || [];
        currentTags.push(newEntry);
        return browser.storage.local.set({ [savedTagsKey]: currentTags });
    }).then(() => {
        console.log(`Tag "${tag}" успішно додано.`);
        loadSavedTags();
    }).catch(err => {
        console.error('Помилка при додаванні тегу:', err);
    });
}

function loadSavedTags() {
    browser.storage.local.get(savedTagsKey).then(result => {
        savedStrings = result[savedTagsKey] || [];
        renderTags(savedStrings, 1, 10);
    }).catch(err => {
        console.error('Помилка при завантаженні тегів:', err);
    });
}

// Фільтрація стрічок
function filterTags(query) {
    const isFavoriteChecked = document.getElementById('favorite-checkbox').checked;

    return savedStrings.filter(item => {
        const matchesQuery = item.tag.toLowerCase().includes(query.toLowerCase());
        const matchesTags = selectedTags.every(tag => item.tags.includes(tag));
        const matchesFavorite = !isFavoriteChecked || item.favorite === true; // Додаємо перевірку чекбоксу

        return matchesQuery && matchesTags && matchesFavorite;
    });
}


function openInNewTabSavedTags(url) {
    url = url.replace(" ", "+")
    finalUrl = "https://rule34.xxx/index.php?page=post&s=list&tags="+url
    window.open(finalUrl, '_blank').focus();
}

// Рендеринг стрічок
function renderTags(items, page, maxPerPage) {
    let content = document.getElementById('tag-content');
    let pagination = document.getElementById('modal_saved_search_pagination');
    content.innerHTML = '';
    pagination.innerHTML = '';

    let totalPages = Math.ceil(items.length / maxPerPage);
    let startIndex = (page - 1) * maxPerPage;
    let currentItems = items.slice(startIndex, startIndex + maxPerPage);

    if (currentItems.length === 0 && items.length > 0) {
        console.warn('Pagination error: no items to display on the page. Check calculations.');
    }

    // Рендеринг елементів
    currentItems.forEach(item => {
        let entry = document.createElement('div');
        entry.className = 'tag-entry';

        // Теги
        let tagContainer = document.createElement('div');
        tagContainer.className = 'tag-container';

        // Append tags to the tag container if they exist
        (item.tags || []).forEach(t => {
            let tagBlock = document.createElement('span');
            tagBlock.className = 'tag';
            tagBlock.textContent = t;
            tagContainer.appendChild(tagBlock);
        });

        // Текстова мітка
        let tagLabel = document.createElement('span');
        tagLabel.className = 'tag-label';
        tagLabel.textContent = item.tag;

        // Кнопки
        let sendButton = document.createElement('button');
        sendButton.className = 'sendButton';
        sendButton.innerHTML = '<i class="fas fa-magnifying-glass fa-lg"></i>'
        sendButton.addEventListener('click', () => openInNewTabSavedTags(item.tag));


        let deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.innerHTML = '<i class="fas fa-square-minus fa-lg"></i>';
        deleteButton.addEventListener('click', () => {
            browser.storage.local.get(savedTagsKey).then(result => {
                let updatedTags = (result[savedTagsKey] || []).filter(s => s.tag !== item.tag);
                return browser.storage.local.set({ [savedTagsKey]: updatedTags });
            }).then(() => {
                console.log(`Tag "${item.tag}" успішно видалено.`);
                loadSavedTags();
            }).catch(err => {
                console.error('Помилка при видаленні тегу:', err);
            });
        });

        let favoriteToggle = document.createElement('button');
        favoriteToggle.className = 'favorite-button';
        favoriteToggle.innerHTML = item.favorite
            ? '<i class="fas fa-star fa-lg"></i>'
            : '<i class="far fa-star fa-lg"></i>';
        favoriteToggle.addEventListener('click', () => {
            item.favorite = !item.favorite;
            browser.storage.local.get(savedTagsKey).then(result => {
                const currentTags = result[savedTagsKey] || [];
                const updatedTags = currentTags.map(tagEntry =>
                    tagEntry.tag === item.tag ? { ...tagEntry, favorite: item.favorite } : tagEntry
                );
                return browser.storage.local.set({ [savedTagsKey]: updatedTags });
            }).then(() => {
                console.log(`Tag "${item.tag}" оновлено.`);
                loadSavedTags();
            }).catch(err => {
                console.error('Помилка при оновленні тегу:', err);
            });
        });

        let buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'tag-buttons';
        buttonsContainer.appendChild(sendButton);
        buttonsContainer.appendChild(deleteButton);
        buttonsContainer.appendChild(favoriteToggle);

        entry.appendChild(tagLabel);
        entry.appendChild(tagContainer);
        entry.appendChild(buttonsContainer);
        content.appendChild(entry);
    });

    // Оновлення пагінації
    renderPagination(pagination, totalPages, page, items, maxPerPage);
}


function renderPagination(container, totalPages, currentPage, items, maxPerPage) {
    const maxVisiblePages = 5;
    container.innerHTML = ''; // Очищення контейнера

    if (totalPages <= 1) return; // Якщо сторінок одна або менше, пагінація не потрібна

    // Додаємо кнопки для переходу на першу сторінку та попередню
    if (currentPage > 1) {
        container.appendChild(createPagePaginatorButton('fa fa-angle-double-left', 1, () => renderTags(items, 1, maxPerPage), true));
        container.appendChild(createPagePaginatorButton('fa fa-angle-left', currentPage - 1, () => renderTags(items, currentPage - 1, maxPerPage), true));
    }

    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    // Генерація кнопок для кожної сторінки
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = createPagePaginatorButton(i, i, () => renderTags(items, i, maxPerPage));
        if (i === currentPage) {
            pageButton.classList.add('pagination-button-active');
        } else {
            pageButton.classList.add('pagination-button');
        }
        container.appendChild(pageButton);
    }

    // Додаємо кнопки для переходу на наступну сторінку та останню
    if (currentPage < totalPages) {
        container.appendChild(createPagePaginatorButton('fa fa-angle-right', currentPage + 1, () => renderTags(items, currentPage + 1, maxPerPage), true));
        container.appendChild(createPagePaginatorButton('fa fa-angle-double-right', totalPages, () => renderTags(items, totalPages, maxPerPage), true));
    }
}

initializeStorage();
// Відкриття модального вікна
document.getElementById('open-saved-search').addEventListener('click', openSavedSearchModal);
})();