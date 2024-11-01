let currentUrl = window.location.href;
let PostList = [];
let currentIndex = 0;


async function logMovies(tags) {
    const limit = 966;
    let page = 0;
    let hasMoreResults = true;

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
        }

        console.log(`Processed page ${page}, collected ${PostList.length} media files.`);
    }

    console.log(`Total collected ${PostList.length} media files.`);
}

async function processTags() {
    let inputTags = document.querySelector('input[name="tags"]');
    if (inputTags) {
        let tags = inputTags.value.replace(/ /g, "+");
        console.log("Input tags: ", tags);
        await logMovies(tags);

        // Динамічний імпорт через import()
        import(chrome.runtime.getURL('gallery_mod.js')).then((module) => {
            module.createModal();  // Викликаємо створення модального вікна
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
            let existingButtons = tagSearchContainer.parentElement.querySelectorAll('button');
            let buttonExists = Array.from(existingButtons).some(button => button.innerText === 'Gallery mod');

            if (!buttonExists) {
                let div = document.createElement('div');
                let button = document.createElement('button');
                button.innerText = 'Gallery mod';
                button.onclick = processTags;
                div.appendChild(button);
                tagSearchContainer.insertAdjacentElement('afterend', div);
            }
        } else {
            console.log("Element with class='tag-search' not found in sidebar.");
        }
    } else {
        console.log("Element with class='sidebar' not found on the page.");
    }
}
