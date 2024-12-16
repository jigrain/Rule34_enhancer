// Підготовка глобальних змінних
const savedTagsFile = 'saved-tags.json';
let savedStrings = []; // Масив для збережених стрічок
let selectedTags = []; // Виділені теги
const allTags = ['author', 'general', 'favorite']; // Доступні теги

// Створюємо модальне вікно
const modal_saved_search = document.createElement('dialog');
modal_saved_search.setAttribute('id', 'tag-manager-modal_saved_search');
modal_saved_search.style.width = '80%';
modal_saved_search.style.height = '70%';
modal_saved_search.style.padding = '20px';
modal_saved_search.style.borderRadius = '10px';
modal_saved_search.style.border = 'none';
modal_saved_search.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
modal_saved_search.style.textAlign = 'center';
modal_saved_search.style.fontFamily = 'Arial, sans-serif';
modal_saved_search.style.overflowY = 'auto';
modal_saved_search.style.backgroundColor = '#f9f9f9';

modal_saved_search.innerHTML = `
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
  <h2 style="
    font-size: 24px;
    font-weight: bold;
    color: #333;
    margin-bottom: 20px;
  ">Tag Manager</h2>
  
  <div style="display: flex; align-items: center; gap: 10px; justify-content: center; margin-bottom: 20px;">
    <div class="awesomplete" style="flex-grow: 1;">
      <input name="tags" id="search-input" type="text" value="" 
        autocomplete="off" 
        placeholder="Enter your tag" 
        aria-autocomplete="list" 
        style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px; font-size: 16px;">
    </div>
    <input id="search-button" type="submit" value="Search" style="
      padding: 10px 20px;
      font-size: 16px;
      color: #fff;
      background-color: #007BFF;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    ">
    <input id="add-button" type="submit" value="Add" style="
      padding: 10px 20px;
      font-size: 16px;
      color: #fff;
      background-color: #28A745;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    ">
  </div>
  
  <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px; justify-content: center;">
    <span style="
      font-size: 18px;
      font-weight: bold;
      color: #555;
    ">Select Tags:</span>
    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
      ${allTags.map(tag => `
        <button class="tag-button" data-tag="${tag}" style="
          padding: 8px 16px;
          font-size: 14px;
          color: #555;
          border: 1px solid #ccc;
          border-radius: 20px;
          background: #f9f9f9;
          cursor: pointer;
          transition: 0.3s;
        ">${tag}</button>
      `).join('')}
    </div>
  </div>
  
  <div id="tag-content" style="
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    margin-bottom: 20px;
    padding: 0 20px;
  "></div>
  
  <div id="modal_saved_search_pagination" style="
    margin-top: 20px; 
    display: flex; 
    justify-content: center; 
    gap: 10px;">
  </div>
`;

// Додаємо модальне вікно до сторінки
document.body.appendChild(modal_saved_search);

// Закриття модального вікна
const modal_closeButton = modal_saved_search.querySelector('#close-modal');
modal_closeButton.addEventListener('click', () => modal_saved_search.close());

// Відображення модального вікна
function openModal() {
    loadSavedTags();
    modal_saved_search.showModal();
}

// Події для кнопок "Add" та "Search"
document.getElementById('search-button').addEventListener('click', () => {
    const query = document.getElementById('search-input').value.trim();
    const filtered = filterTags(query);
    renderTags(filtered, 1, 10);
});

document.getElementById('add-button').addEventListener('click', () => {
    const input = document.getElementById('search-input');
    const newTag = input.value.trim();
    if (!newTag) return alert('Enter a valid tag');
    addNewTag(newTag, selectedTags);
    input.value = '';
});

// Події для керування тегами
document.querySelectorAll('.tag-button').forEach(button => {
    button.addEventListener('click', (e) => {
        const tag = e.target.dataset.tag;
        if (selectedTags.includes(tag)) {
            selectedTags = selectedTags.filter(t => t !== tag);
            e.target.style.backgroundColor = '';
        } else {
            selectedTags.push(tag);
            e.target.style.backgroundColor = '#007BFF';
            e.target.style.color = '#fff';
        }
    });
});

// Збереження нової стрічки
function addNewTag(tag, tags) {
    savedStrings.push({ tag, tags, favorite: false });
    saveTagsToFile();
    renderTags(savedStrings, 1, 10); // Оновлюємо список із першої сторінки
}

// Збереження у локальний файл
function saveTagsToFile() {
    try {
        localStorage.setItem(savedTagsFile, JSON.stringify(savedStrings));
    } catch (e) {
        console.error('Error saving tags to localStorage:', e);
    }
}

// Завантаження збережених стрічок
function loadSavedTags() {
    const data = localStorage.getItem(savedTagsFile);
    if (data) {
        savedStrings = JSON.parse(data);
    } else {
        savedStrings = []; // Ініціалізація, якщо немає даних
    }

    renderTags(savedStrings, 1, 10); // Завантажуємо з першої сторінки
}

// Фільтрація стрічок
function filterTags(query) {
    return savedStrings.filter(item =>
        item.tag.toLowerCase().includes(query.toLowerCase()) &&
        selectedTags.every(tag => item.tags.includes(tag))
    );
}

// Рендеринг стрічок
function renderTags(items, page, maxPerPage) {
    const content = document.getElementById('tag-content');
    const pagination = document.getElementById('modal_saved_search_pagination');
    content.innerHTML = '';
    pagination.innerHTML = '';

    const totalPages = Math.ceil(items.length / maxPerPage);
    const startIndex = (page - 1) * maxPerPage;
    const currentItems = items.slice(startIndex, startIndex + maxPerPage);

    console.warn('currentItems.length: ' + currentItems.length);
    console.warn('savedStrings.length: ' + items.length);
    console.warn('totalPages: ' + totalPages);

    if (currentItems.length === 0 && items.length > 0) {
        console.warn('Pagination error: no items to display on the page. Check calculations.');
    }

    // Рендеринг елементів
    currentItems.forEach(item => {
        const entry = document.createElement('div');
        entry.style.display = 'flex';
        entry.style.justifyContent = 'space-between';
        entry.style.alignItems = 'center';
        entry.style.padding = '10px';
        entry.style.border = '1px solid #ccc';
        entry.style.borderRadius = '5px';
        entry.style.background = '#fff';
        entry.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';

        const tagLabel = document.createElement('span');
        tagLabel.style.flexGrow = '1';
        tagLabel.textContent = `${item.tag} [${item.tags.join(', ')}]`;

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.style.padding = '5px 10px';
        deleteButton.style.color = '#fff';
        deleteButton.style.backgroundColor = '#DC3545';
        deleteButton.style.border = 'none';
        deleteButton.style.borderRadius = '5px';
        deleteButton.style.cursor = 'pointer';
        deleteButton.addEventListener('click', () => {
            const updatedItems = items.filter(s => s !== item);
            savedStrings = updatedItems; // Оновлюємо глобальні дані
            saveTagsToFile();
            renderTags(updatedItems, page, maxPerPage); // Перерендеримо список
        });

        const favoriteToggle = document.createElement('button');
        favoriteToggle.textContent = item.favorite ? '★' : '☆';
        favoriteToggle.style.padding = '5px 10px';
        favoriteToggle.style.color = '#FFC107';
        favoriteToggle.style.border = '1px solid #FFC107';
        favoriteToggle.style.borderRadius = '5px';
        favoriteToggle.style.cursor = 'pointer';
        favoriteToggle.addEventListener('click', () => {
            item.favorite = !item.favorite;
            saveTagsToFile();
            renderTags(items, page, maxPerPage);
        });

        entry.appendChild(tagLabel);
        entry.appendChild(deleteButton);
        entry.appendChild(favoriteToggle);
        content.appendChild(entry);
    });

    // Оновлення пагінації
    renderPagination(pagination, totalPages, page, items, maxPerPage);
}


// Виправлення логіки пагінації
function renderPagination(container, totalPages, currentPage, items, maxPerPage) {
    container.innerHTML = ''; // Очищення контейнера

    if (totalPages <= 1) return; // Якщо сторінок одна або менше, пагінація не потрібна

    // Додаємо кнопки для переходу на першу сторінку та попередню
    if (currentPage > 1) {
        container.appendChild(createPageButton('<<', 1, () => renderTags(items, 1, maxPerPage)));
        container.appendChild(createPageButton('<', currentPage - 1, () => renderTags(items, currentPage - 1, maxPerPage)));
    }

    // Генерація кнопок для кожної сторінки
    for (let i = 1; i <= totalPages; i++) {
        console.log('Згенеровано кнопку для пагінації');
        const pageButton = createPageButton(i, i, () => renderTags(items, i, maxPerPage));
        if (i === currentPage) {
            pageButton.style.backgroundColor = '#007BFF';
            pageButton.style.color = '#fff';
        }
        container.appendChild(pageButton);
    }

    // Додаємо кнопки для переходу на наступну сторінку та останню
    if (currentPage < totalPages) {
        container.appendChild(createPageButton('>', currentPage + 1, () => renderTags(items, currentPage + 1, maxPerPage)));
        container.appendChild(createPageButton('>>', totalPages, () => renderTags(items, totalPages, maxPerPage)));
    }
    console.log(container.innerHTML)
}




// Створення кнопок пагінації
function createPageButton(label, page, onClick) {
    const button = document.createElement('button');
    button.textContent = label;
    button.style.padding = '5px 10px';
    button.style.margin = '0 5px';
    button.style.cursor = 'pointer';
    button.addEventListener('click', onClick);
    return button;
}

// Відкриття модального вікна
document.getElementById('open-saved-search').addEventListener('click', openModal);
