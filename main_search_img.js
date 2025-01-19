let currentUrl = window.location.href;
let PostList = [];
let currentIndex = 0;
let link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css';
document.head.appendChild(link);
let finalpage = 0;
let isMoreResult = true;


async function logMovies(tags) {
    const limit = 966;
    let page = 0;
    let hasMoreResults = true;
    const maxPosts = 5000;

    while (hasMoreResults) {
        const response = await fetch(`https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&tags=${tags}&pid=${page}&limit=${limit}`);
        const text = await response.text();
        let parser = new DOMParser();
        let xmlDoc = parser.parseFromString(text, "text/xml");

        let posts = xmlDoc.querySelectorAll('post');
        if (posts.length === 0) {
            hasMoreResults = false;
        } else {
            posts.forEach(post => {
                let fileUrl = post.getAttribute('file_url');
                let id = post.getAttribute('id');
                PostList.push({ fileUrl, id });
            });
            page += 1;

            if (PostList.length >= maxPosts) {
                console.log(`Reached maximum allowed posts: ${maxPosts}. Stopping further fetches.`);
                const nextResponse = await fetch(`https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&tags=${tags}&pid=${page}&limit=${limit}`);
                const nextText = await nextResponse.text();
                let nextXmlDoc = parser.parseFromString(nextText, "text/xml");
                let nextPosts = nextXmlDoc.querySelectorAll('post');

                if (nextPosts.length === 0 || nextPosts.length < limit) {
                    isMoreResult = false;
                } else {
                    isMoreResult = true;
                }
                
                console.log(`Next batch check: ${nextPosts.length} posts found. isMoreResult = ${isMoreResult}`);
                hasMoreResults = false;
            }
        }

        console.log(`Processed page ${page}, collected ${PostList.length} media files.`);
    }

    finalpage = page
    console.log(`Total collected ${PostList.length} media files.`);
    console.log(`Last page ${finalpage}`);
}

async function processTags() {
    let inputTags = document.querySelector('input[name="tags"]');
    if (inputTags) {
        let tags = inputTags.value.replace(/ /g, "+");
        console.log("Input tags: ", tags);
        await logMovies(tags);

        // Динамічний імпорт через import()
        import(chrome.runtime.getURL('utilities/gallery_ui/gallery_mod.js')).then((module) => {
            if(isMoreResult){
                module.createModal({ isFavorite: false, lastPage: finalpage, postList: PostList}); 
            }else{
                module.createModal({isFavorite: false, postList: PostList});  
            }
            module.showModal(0);    // Відкриваємо модальне вікно з першим елементом
        }).catch(err => {
            console.error("Error loading gallery_mod.js: ", err);
        });
    } else {
        console.log("Input element with name='tags' not found.");
    }
}

// Створюємо кнопку у боковій панелі, якщо ми на відповідній сторінці
if (currentUrl.includes("page=post") && currentUrl.includes("s=list")) {
    let sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        let tagSearchContainer = sidebar.querySelector('.tag-search');
        if (tagSearchContainer) {

            let existingPanels = tagSearchContainer.parentElement.querySelectorAll('.panel');
            if (existingPanels.length === 0) {
                // Використовуємо створення фіксованої панелі з 1 вертикальною кнопкою і 4 горизонтальними
                const panel = document.createElement('div');
                panel.className = 'panel';

                const buttonContainer = document.createElement('div');
                buttonContainer.className = 'button-container';

                // Створення вертикальних кнопок
                const verticalButtons = document.createElement('div');
                verticalButtons.className = 'vertical-buttons';

                const addNewTagsToSavedButton = document.createElement('button');
                addNewTagsToSavedButton.className = 'button vertical-button';
                addNewTagsToSavedButton.id = 'addNewTagsToSavedButton';
                addNewTagsToSavedButton.textContent = 'Save search tags';
                verticalButtons.appendChild(addNewTagsToSavedButton);

                const galleryModButton = document.createElement('button');
                galleryModButton.className = 'button vertical-button';
                galleryModButton.textContent = 'Gallery mod';
                galleryModButton.onclick = processTags; // Ваша функція
                verticalButtons.appendChild(galleryModButton);

                // Додаємо вертикальні кнопки до контейнера
                buttonContainer.appendChild(verticalButtons);

                // Додаємо роздільник
                const divider = document.createElement('div');
                divider.className = 'divider';
                buttonContainer.appendChild(divider);

                // Створення горизонтальних кнопок
                const horizontalButtons = document.createElement('div');
                horizontalButtons.className = 'horizontal-buttons';

                const button = document.createElement('button');
                button.id = "open-search-history"
                button.className = 'button horizontal-button';
                button.innerHTML = '<i class="fa fa-history"></i>'
                horizontalButtons.appendChild(button);

                const button2 = document.createElement('button');
                button2.id = "open-saved-search"
                button2.className = 'button horizontal-button';
                button2.innerHTML = '<i class="fa fa-copy"></i>';
                horizontalButtons.appendChild(button2);

                const button3 = document.createElement('button');
                button3.id = "open-user-albums"
                button3.className = 'button horizontal-button';
                button3.innerHTML = '<i class="fa fa-photo-film"></i>';
                horizontalButtons.appendChild(button3);

                // Додаємо горизонтальні кнопки до контейнера
                buttonContainer.appendChild(horizontalButtons);

                // Додаємо контейнер до панелі
                panel.appendChild(buttonContainer);

                // Вставляємо панель після tagSearchContainer
                tagSearchContainer.insertAdjacentElement('afterend', panel);
            }
        } else {
            console.log("Element with class='tag-search' not found in sidebar.");
        }
    } else {
        console.log("Element with class='sidebar' not found on the page.");
    }
}
