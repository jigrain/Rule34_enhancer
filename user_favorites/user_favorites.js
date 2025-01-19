// Додаємо стилі для кнопок і текстового блоку
let currentUrl = window.location.href;
let PostList = [];
let link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css';
document.head.appendChild(link);



browser.storage.local.get('favoritesData').then(result => {
    if (!result.favoritesData) {
        browser.storage.local.set({favoritesData: []}).then(() => {
            console.log('favoritesData успішно ініціалізовано як порожній масив.');
        }).catch(err => {
            console.error('Помилка при ініціалізації favoritesData:', err);
        });
    }
}).catch(err => {
    console.error('Помилка при отриманні favoritesData:', err);
});

const style = document.createElement('style');
style.innerHTML = `
#controlContainer {
    display: flex;
    flex-wrap: wrap;
    justify-content: start;
    align-items: center;
    gap: 10px; /* Відстань між елементами */
    margin: 10px auto auto 30px;
    width: 95%;
}
#openGalleryButton, #searchButton {
    padding: 10px 20px;
    background-color: #4CAF50;
    color: white;
    border: none;
    font-size: 16px;
    cursor: pointer;
}
#openGalleryButton:hover {
    background-color: #45a049;
}
#searchButton:hover {
    background-color: #45a049;
}
#search_input {
    padding: 10px;
    font-size: 16px;
    border: none;
}
#favoritesCount {
    font-size: 12px;
    color: #333;
    margin-right: 10px;
    font-weight: bold;
}
#refreshButton {
    background-color: #FF8C00;
    color: white;
    border: none;
    font-size: 14px;
    cursor: pointer;
    padding: 10px;
}
#refreshButton:hover {
    background-color: #FFA500;
}
.fa-refresh {
    margin-right: 5px;
}
`;
document.head.appendChild(style);

// Функція для перевірки та відображення кількості збережених favoritesData
async function displayFavoritesCount() {
    const {favoritesData} = await browser.storage.local.get('favoritesData');
    const count = favoritesData ? favoritesData.length : 0;

    const favoritesCount = document.createElement('div');
    favoritesCount.id = 'favoritesCount';
    favoritesCount.innerText = `Favorites: ${count} posts`;

    return favoritesCount;
}

// Додаємо елементи на сторінку
browser.runtime.sendMessage({action: 'getUserId'}, async (response) => {
    const userId = response.userId;

    if (userId) {
        console.log('Отриманий user_id:', userId);

        if (currentUrl.includes("page=favorites") && currentUrl.includes(`id=${userId}`)) {
            console.log('URL містить потрібні параметри та збігається з user_id');
            console.log(PostList);

            // Створюємо контейнер для кнопок і поля введення
            const contentDiv = document.getElementById('header');
            const controlContainer = document.createElement('div');
            controlContainer.id = 'controlContainer';

            // Додаємо текстовий блок із кількістю збережених елементів
            const favoritesCount = await displayFavoritesCount();

            const refreshButton = document.createElement('button');
            refreshButton.id = 'refreshButton';
            refreshButton.innerHTML = '<i class="fa fa-refresh"></i>Refresh';
            refreshButton.addEventListener("click", () => syncFavorites(userId));

            const openGalleryButton = document.createElement('button');
            openGalleryButton.innerText = 'Open Gallery';
            openGalleryButton.id = 'openGalleryButton';
            openGalleryButton.addEventListener("click", () => Open_Favorites_Gallery(userId));

            const SearchFavorites = document.createElement('input');
            SearchFavorites.type = "text";
            SearchFavorites.id = "search_input";
            SearchFavorites.placeholder = "Search favorites...";

            // Кнопка пошуку за тегами
            const searchButton = document.createElement('button');
            searchButton.innerText = 'Search by Tags';
            searchButton.id = 'searchButton';
            searchButton.addEventListener("click", searchFavoritesByTags);

            // Додаємо кнопку та поле введення до контейнера
            controlContainer.appendChild(favoritesCount);
            controlContainer.appendChild(refreshButton);
            controlContainer.appendChild(openGalleryButton);
            controlContainer.appendChild(SearchFavorites);
            controlContainer.appendChild(searchButton);

            let DropdownButton;
            try {
                const module = await import(chrome.runtime.getURL('user_favorites/settings_button.js'));
                DropdownButton = module.DropdownButton;
            } catch (err) {
                console.error("Error loading progress_bar.js:", err);
                return;
            }
            const dropdown = new DropdownButton(controlContainer);

            dropdown.create();

            // Додаємо контейнер до contentDiv
            contentDiv.appendChild(controlContainer);
        } else {
            console.log('Перевірка не пройдена: або неправильний URL, або user_id не збігається.');
        }
    } else {
        console.log('user_id не знайдений.');
    }
});

// Оптимізована функція Open_Favorites_Gallery
async function Open_Favorites_Gallery(userId) {
    // Перевіряємо, чи вже є збережені дані в favoritesData
    const { favoritesData } = await browser.storage.local.get('favoritesData');
    // Контейнер для смуги завантаження
    const controlContainer = document.getElementById('controlContainer');
    const originalHeight = controlContainer.offsetHeight;

    // Імпорт модуля динамічно
    let ProgressBar;
    try {
        const module = await import(chrome.runtime.getURL('user_favorites/progress_bar.js'));
        ProgressBar = module.ProgressBar;
    } catch (err) {
        console.error("Error loading progress_bar.js:", err);
        return;
    }

    // Ініціалізуємо смугу прогресу
    const progressBar = new ProgressBar(controlContainer);
    progressBar.create();
    progressBar.show();

    if (favoritesData && favoritesData.length > 0) {
        console.log('favoritesData вже існує в локальному сховищі. Завантаження з локального сховища.');

        // Заповнюємо PostList збереженими даними
        PostList = favoritesData.map(item => ({
            id: item.id,
            fileUrl: item.file_url,
            previewUrl: item.preview_url,
            tags: item.tags
        }));
        console.log('PostList сформовано з локального сховища:', PostList);

        // Імпортуємо і викликаємо методи з gallery_mod.js
        import(chrome.runtime.getURL('utilities/gallery_ui/gallery_mod.js')).then((module) => {
            module.createModal({isFavorite: true, postList: PostList});
            module.showModal(0);
            controlContainer.style.height = `${originalHeight}px`; 
        }).catch(err => {
            console.error("Error loading gallery_mod.js: ", err);
        });
    } else {
        console.log('favoritesData не знайдено, початок нового запиту.');

        // Початковий прогрес
        progressBar.update(0, 'Завантаження ID...');


        // Якщо локальні дані відсутні, робимо запит і зберігаємо їх
        browser.runtime.sendMessage({
            action: 'startParsing',
            baseUrl: `https://rule34.xxx/index.php?page=favorites&s=view&id=${userId}`,
            pidStep: 50
        }, async (response) => {
            const collectedIds = response.collectedIds;
            console.log('Отримані зібрані ID з background:', collectedIds);

            let detailedInfo = [];
            progressBar.startTimer(collectedIds.length);

            for (let i = 0; i < collectedIds.length; i++) {
                const details = await fetchDetails(collectedIds[i]);
                if (details) {
                    detailedInfo.push(details);
                }


                const progress = ((i + 1) / collectedIds.length) * 100;
                progressBar.update(progress, `Оброблено ${i} елементів, (${progress.toFixed(2)}%)`);
            }

            // Зберігаємо зібрані дані в локальному сховищі
            await browser.storage.local.set({favoritesData: detailedInfo});
            console.log('Детальна інформація збережена в локальному сховищі:', detailedInfo);

            progressBar.hide();

            // Заповнюємо PostList зібраними file_url
            PostList = detailedInfo.map(item => ({
                id: item.id,
                fileUrl: item.file_url,
                previewUrl: item.preview_url,
                tags: item.tags
            }));
            console.log('PostList сформовано з file_url:', PostList);

            // Імпортуємо і викликаємо методи з gallery_mod.js
            import(chrome.runtime.getURL('utilities/gallery_ui/gallery_mod.js')).then((module) => {
                module.createModal({isFavorite: true, postList: PostList});
                module.showModal(0);
                controlContainer.style.height = `${originalHeight}px`; 
            }).catch(err => {
                console.error("Error loading gallery_mod.js: ", err);
            });

            document.getElementById('favoritesCount').innerText = `Favorites: ${detailedInfo.length} posts`;

        });
    }
    //controlContainer.style.height = `${originalHeight}px`; // Відновлюємо висоту
}

// Функція для отримання даних про кожен id
async function fetchDetails(id) {
    const url = `https://api.rule34.xxx/index.php?page=dapi&q=index&json=1&s=post&id=${id}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Помилка при отриманні даних для ID ${id}: Статус ${response.status}`);
            return null;
        }

        // Читаємо відповідь як текст, щоб перевірити на порожній вміст
        const text = await response.text();

        // Перевіряємо, чи відповідь не порожня
        if (!text || text.trim().length === 0) {
            console.warn(`Порожня відповідь для ID ${id}`);
            return null;
        }

        // Парсимо текст у JSON
        const data = JSON.parse(text);

        // Перевіряємо, чи дані валідні і чи є потрібні поля
        if (data && data.length > 0) {
            const {file_url, preview_url, tags} = data[0];
            console.log(`Отримані дані для ID ${id}:`, {file_url, preview_url, tags});
            return {id, file_url, preview_url, tags};
        } else {
            console.warn(`Дані не знайдені або JSON некоректний для ID ${id}`);
            return null;
        }
    } catch (error) {
        console.error(`Помилка при отриманні JSON для ID ${id}:`, error);
        return null;
    }
}

// Функція для пошуку постів за тегами з підтримкою виключаючих тегів
async function searchFavoritesByTags() {
    const searchInput = document.getElementById('search_input').value.trim().toLowerCase();

    // Завантажуємо favoritesData з локального сховища
    const { favoritesData } = await browser.storage.local.get('favoritesData');
    if (!favoritesData || favoritesData.length === 0) {
        console.log('Favorites data is empty or not found.');
        return;
    }

    // Розділяємо введений рядок на окремі теги
    const tags = searchInput.split(/\s+/);

    // Розділяємо на обов’язкові та виключаючі теги
    const requiredTags = tags.filter(tag => !tag.startsWith('-'));
    const excludedTags = tags.filter(tag => tag.startsWith('-')).map(tag => tag.substring(1));

    // Фільтруємо пости на основі тегів
    const filteredPosts = favoritesData.filter(post => {
        const postTags = ` ${post.tags.toLowerCase()} `; // Додаємо пробіли на початку і в кінці для точного збігу

        // Створюємо регулярні вирази для обов’язкових тегів
        const hasRequiredTags = requiredTags.every(tag => {
            const regex = new RegExp(`\\b${tag}\\b`, 'i'); // Шукаємо повний збіг слова
            return regex.test(postTags);
        });

        // Створюємо регулярні вирази для виключаючих тегів
        const hasNoExcludedTags = excludedTags.every(tag => {
            const regex = new RegExp(`\\b${tag}\\b`, 'i'); // Шукаємо повний збіг слова
            return !regex.test(postTags);
        });

        // Повертаємо true, якщо пост відповідає всім умовам
        return hasRequiredTags && hasNoExcludedTags;
    });

    // Очищуємо контейнер content і додаємо результати пошуку
    const contentContainer = document.getElementById('content');
    contentContainer.innerHTML = ''; // Очищення контейнера

    const Img_List_Element = document.createElement('div');
    Img_List_Element.className = 'image-list';
    Img_List_Element.style = "gap: 25px 10px";
    contentContainer.appendChild(Img_List_Element);

    // Додаємо елементи для кожного знайденого поста
    filteredPosts.forEach(post => {
        // Створюємо зовнішній span
        const wrapperElement = document.createElement('span');
        wrapperElement.style = "align-self: flex-start; display: grid; grid-template-rows: auto 10px;";

        // Внутрішній span з класом thumb
        const postElement = document.createElement('span');
        postElement.className = 'thumb';

        // Заповнюємо HTML для кожного знайденого поста
        postElement.innerHTML = `
            <a href="index.php?page=post&amp;s=view&amp;id=${post.id}" id="p${post.id}" onclick="document.location='index.php?page=post&amp;s=view&amp;id=${post.id}'; return false;">
                <img src="${post.preview_url}" title="" border="0" alt="image_thumb" style="">
            </a><br>
            <a href="#" onclick="document.location='index.php?page=favorites&amp;s=delete&amp;id=${post.id}'; return false;">
                <b>Remove</b>
            </a>
        `;

        // Вкладаємо внутрішній span у зовнішній
        wrapperElement.appendChild(postElement);

        // Додаємо зовнішній span у контейнер
        Img_List_Element.appendChild(wrapperElement);
    });

    console.log(`Знайдено ${filteredPosts.length} постів за тегами "${searchInput}".`);
}

// Функція для синхронізації локальних даних з актуальним списком улюблених
async function syncFavorites(userId) {
    // Контейнер для смуги завантаження
    const controlContainer = document.getElementById('controlContainer');

    // Імпорт модуля прогрес-бара динамічно
    let ProgressBar;
    try {
        const module = await import(chrome.runtime.getURL('user_favorites/progress_bar.js'));
        ProgressBar = module.ProgressBar;
    } catch (err) {
        console.error("Error loading progress_bar.js:", err);
        return;
    }

    // Ініціалізуємо смугу прогресу
    const progressBar = new ProgressBar(controlContainer);
    progressBar.create();
    progressBar.show();

    // Початковий прогрес
    progressBar.update(0, 'Завантаження ID...');

    // Отримуємо актуальні ID улюблених постів користувача
    browser.runtime.sendMessage({
        action: 'startParsing',
        baseUrl: `https://rule34.xxx/index.php?page=favorites&s=view&id=${userId}`,
        pidStep: 50
    }, async (response) => {
        const collectedIds = response.collectedIds;
        console.log('Отримані зібрані ID з background:', collectedIds);

        // Завантажуємо favoritesData з локального сховища
        const { favoritesData } = await browser.storage.local.get('favoritesData') || [];
        const existingIds = favoritesData.map(item => item.id);

        // Знаходимо ID, які необхідно видалити
        const idsToRemove = existingIds.filter(id => !collectedIds.includes(id));

        // Видаляємо елементи, яких немає в новому списку
        let updatedFavoritesData = favoritesData.filter(item => !idsToRemove.includes(item.id));

        // Знаходимо нові ID, які потрібно додати
        const idsToAdd = collectedIds.filter(id => !existingIds.includes(id));
        let newEntries = [];

        progressBar.startTimer(idsToAdd.length);

        for (const [index, id] of idsToAdd.entries()) {
            const details = await fetchDetails(id);
            if (details) {
                newEntries.push(details);
            }

            // Оновлюємо смугу прогресу
            const progress = ((index + 1) / idsToAdd.length) * 100;
            progressBar.update(progress, `Оброблено ${index + 1} з ${idsToAdd.length} елементів, (${progress.toFixed(2)}%)`);
        }

        // Додаємо нові записи перед існуючими
        updatedFavoritesData = [...newEntries, ...updatedFavoritesData];

        // Оновлюємо локальне сховище
        await browser.storage.local.set({ favoritesData: updatedFavoritesData });
        console.log('Синхронізація завершена. Оновлені дані збережено в локальному сховищі.');

        // Оновлюємо кількість в favoritesCount
        document.getElementById('favoritesCount').innerText = `Favorites: ${updatedFavoritesData.length} posts`;

        // Ховаємо прогрес-бар після завершення
        progressBar.hide();
    });
}


