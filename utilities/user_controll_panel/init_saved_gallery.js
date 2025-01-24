// Глобальні змінні
(() => {
const savedGalleryKey = 'savedGalleryData';
let savedGalleries = []; // Масив для галерей
let selectedGalleriesTags = []; // Виділені теги
const allGalleriesTags = ['author', 'general']; // Доступні теги
let PostList = [];

// Створюємо модальне вікно
let modal_gallery_manager = document.createElement('dialog');
modal_gallery_manager.className = 'main-modal-window';
modal_gallery_manager.setAttribute('id', 'gallery-list-modal');
modal_gallery_manager.innerHTML = `
  <button id="close-modal" class="close-modal-button">×</button>
  <h2 class="modal-title">Gallery Manager</h2>
  
  <div class="modal-search-form">
    <input name="tags" id="search-input-gallery" type="text" 
        autocomplete="off" 
        placeholder="Enter your tag or gallery name" 
        aria-autocomplete="list">
    <input id="search-button-gallery" type="submit" value="Search">
    <input id="add-button-gallery" type="submit" value="Add Gallery">
  </div>
  
  <div class="select-tags-section-gallery">
  <span>Select Tags:</span>
    ${allGalleriesTags.map(tag => `
        <button class="tag-button-gallery" data-tag="${tag}">${tag}</button>
    `).join('')}

    <label class="favorite-checkbox-label">
        <input type="checkbox" id="gallery-favorite-checkbox" class="favorite-checkbox">
        Favorites
    </label>
  </div>
  
  <div id="gallery-content"></div>
  
  <div id="modal_gallery_pagination" class="pagination-search-history"></div>
`;

document.body.appendChild(modal_gallery_manager);

// Закриття модального вікна
let modal_closeButton3 = modal_gallery_manager.querySelector('#close-modal');
modal_closeButton3.addEventListener('click', () => modal_gallery_manager.close());

// Відображення модального вікна
function openSavedGalleryModal() {
    loadSavedGalleries();
    modal_gallery_manager.showModal();
}

const galleryFavoriteCheckbox = document.getElementById('gallery-favorite-checkbox');
galleryFavoriteCheckbox.addEventListener('change', () => {
    const query = document.getElementById('search-input-gallery').value.trim();
    const filtered = filterGalleries(query); // Перефільтровуємо галереї
    renderGalleries(filtered, 1, 9); // Оновлюємо відображення галерей
});

// Ініціалізація сховища
function initializeGalleryStorage() {
    browser.storage.local.get(savedGalleryKey).then(result => {
        if (!result[savedGalleryKey]) {
            browser.storage.local.set({ [savedGalleryKey]: [] }).then(() => {
                console.log(`${savedGalleryKey} успішно ініціалізовано.`);
            }).catch(err => {
                console.error('Помилка при ініціалізації:', err);
            });
        }
    }).catch(err => {
        console.error('Помилка при отриманні:', err);
    });
}

// Події для кнопок "Add Gallery" та "Search"
document.getElementById('search-button-gallery').addEventListener('click', () => {
    let query = document.getElementById('search-input-gallery').value.trim();
    let filtered = filterGalleries(query);
    renderGalleries(filtered, 1, 9); // 3x3 блоки на сторінку
});

document.getElementById('add-button-gallery').addEventListener('click', () => {
    let input = document.getElementById('search-input-gallery');
    let newGalleryName = input.value.trim();
    if (!newGalleryName) return alert('Enter a valid gallery name');
    addNewGallery(newGalleryName, selectedGalleriesTags);
    input.value = '';
});

// Події для керування тегами
document.querySelectorAll('.tag-button-gallery').forEach(button => {
    button.addEventListener('click', (e) => {
        let tag = e.target.dataset.tag;
        e.target.classList.toggle('selected');
        if (selectedGalleriesTags.includes(tag)) {
            selectedGalleriesTags = selectedGalleriesTags.filter(t => t !== tag);
        } else {
            selectedGalleriesTags.push(tag);
        }
    });
});

// Збереження нової галереї
function addNewGallery(name, tags) {
    const newEntry = {
        name,
        content: [],
        tags: [...tags],
        favorite: false
    };

    browser.storage.local.get(savedGalleryKey).then(result => {
        const currentGalleries = result[savedGalleryKey] || [];
        currentGalleries.push(newEntry);
        return browser.storage.local.set({ [savedGalleryKey]: currentGalleries });
    }).then(() => {
        console.log(`Gallery "${name}" успішно додано.`);
        loadSavedGalleries();
    }).catch(err => {
        console.error('Помилка при додаванні галереї:', err);
    });
}

// Завантаження галерей
function loadSavedGalleries() {
    browser.storage.local.get(savedGalleryKey).then(result => {
        savedGalleries = result[savedGalleryKey] || [];
        renderGalleries(savedGalleries, 1, 8); // 3x3 блоки
    }).catch(err => {
        console.error('Помилка при завантаженні галерей:', err);
    });
}

// Фільтрація галерей
function filterGalleries(query) {
    return savedGalleries.filter(item =>
        item.name.toLowerCase().includes(query.toLowerCase()) &&
        selectedGalleriesTags.every(tag => item.tags.includes(tag))
    );
}

function handleGalleryClick(gallery) {
    // Очистка PostList перед копіюванням
    PostList.length = 0;

    gallery.content.forEach(item => {
        PostList.push({
            id: item.postId,
            fileUrl: item.url
        });
    });

    // Імпорт модуля для показу галереї
    import(chrome.runtime.getURL('utilities/gallery_ui/gallery_mod.js'))
        .then(module => {
            module.createModal({ postList: PostList });
            module.showModal(0);
        })
        .catch(err => {
            console.error("Error loading gallery_mod.js: ", err);
        });
}

// Рендеринг галерей
function renderGalleries(items, page, maxPerPage) {
    let content = document.getElementById('gallery-content');
    let pagination = document.getElementById('modal_gallery_pagination');
    content.innerHTML = '';
    pagination.innerHTML = '';

    let totalPages = Math.ceil(items.length / maxPerPage);
    let startIndex = (page - 1) * maxPerPage;
    let currentItems = items.slice(startIndex, startIndex + maxPerPage);

    currentItems.forEach(item => {
        let galleryBlock = document.createElement('div');
        galleryBlock.className = 'gallery-block';

        let title = document.createElement('h3');
        title.textContent = item.name;

        let imageContainer = document.createElement('div');
        imageContainer.className = 'gallery-image-container';

        let image = document.createElement('img');
        if (item.content.length > 0) {
            const firstContentItem = item.content[0];
            image.src = firstContentItem.preview_url;
            image.alt = 'preview';
        } else {
            image.src = 'https://placehold.co/200x200'; // Заглушка
            image.alt = 'No content available';
        }
        imageContainer.appendChild(image);

        imageContainer.addEventListener('click', () => handleGalleryClick(item));

        let buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'block-buttons';

        let favoriteToggle = document.createElement('button');
        favoriteToggle.className = 'favorite-button';
        favoriteToggle.innerHTML = item.favorite
            ? '<i class="fas fa-star fa-lg"></i>'
            : '<i class="far fa-star fa-lg"></i>';
        favoriteToggle.addEventListener('click', () => {
            item.favorite = !item.favorite;
            saveGalleries();
        });

        let deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.innerHTML = '<i class="fas fa-square-minus fa-lg"></i>';
        deleteButton.addEventListener('click', () => {
            deleteGallery(item.name);
        });

        buttonsContainer.appendChild(favoriteToggle);
        buttonsContainer.appendChild(deleteButton);
        galleryBlock.appendChild(title);
        galleryBlock.appendChild(imageContainer);
        galleryBlock.appendChild(buttonsContainer);
        content.appendChild(galleryBlock);
    });

    renderPagination(pagination, totalPages, page, items, maxPerPage);
}

function renderPagination(container, totalPages, currentPage, items, maxPerPage) {
    const maxVisiblePages = 5;
    container.innerHTML = ''; // Очищення контейнера

    if (totalPages <= 1) return; // Якщо сторінок одна або менше, пагінація не потрібна

    // Додаємо кнопки для переходу на першу сторінку та попередню
    if (currentPage > 1) {
        container.appendChild(createPagePaginatorButton('fa fa-angle-double-left', 1, () => renderGalleries(items, 1, maxPerPage), true));
        container.appendChild(createPagePaginatorButton('fa fa-angle-left', currentPage - 1, () => renderGalleries(items, currentPage - 1, maxPerPage), true));
    }

    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    // Генерація кнопок для кожної сторінки
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = createPagePaginatorButton(i, i, () => renderGalleries(items, i, maxPerPage));
        if (i === currentPage) {
            pageButton.classList.add('pagination-button-active');
        } else {
            pageButton.classList.add('pagination-button');
        }
        container.appendChild(pageButton);
    }

    // Додаємо кнопки для переходу на наступну сторінку та останню
    if (currentPage < totalPages) {
        container.appendChild(createPagePaginatorButton('fa fa-angle-right', currentPage + 1, () => renderGalleries(items, currentPage + 1, maxPerPage), true));
        container.appendChild(createPagePaginatorButton('fa fa-angle-double-right', totalPages, () => renderGalleries(items, totalPages, maxPerPage), true));
    }
}

function deleteGallery(name) {
    browser.storage.local.get(savedGalleryKey).then(result => {
        const updatedGalleries = (result[savedGalleryKey] || []).filter(gallery => gallery.name !== name);
        return browser.storage.local.set({ [savedGalleryKey]: updatedGalleries });
    }).then(() => {
        console.log(`Gallery "${name}" успішно видалено.`);
        loadSavedGalleries();
    }).catch(err => {
        console.error('Помилка при видаленні галереї:', err);
    });
}

// Ініціалізація сховища
initializeGalleryStorage();

document.getElementById('open-user-albums').addEventListener('click', openSavedGalleryModal);
})();
