let currentIndex = 0;
let currentPage = 0; // Відстежуємо сторінку для дозавантаження
const batchSize = 966; // Розмір партії (перевірка кожні 100 елементів)
let lastThreshold = batchSize; // Порогова позначка для дозавантаження
let isLoadingMore = false;
let GalleryPostList = [];

let isGalleryListUsed = false;

function createMediaElements() {
    let imgElement = document.createElement('img');
    imgElement.id = 'gallery_img';

    let videoElement = document.createElement('video');
    videoElement.controls = true;
    videoElement.id = 'gallery_video';

    return [imgElement, videoElement];
}

function injectScript(fn, postId) {
    const script = document.createElement('script');
    script.textContent = '(' + fn.toString() + ')(' + JSON.stringify(postId) + ');';
    document.documentElement.appendChild(script);
    script.remove();
}

async function loadMoreImages(tags) {
    console.log(`Attempting to load more images from page ${currentPage}...`);
    const response = await fetch(`https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&tags=${tags}&pid=${currentPage}&limit=${966}`);
    const text = await response.text();
    let parser = new DOMParser();
    let xmlDoc = parser.parseFromString(text, "text/xml");

    let posts = xmlDoc.querySelectorAll('post');
    if (posts.length === 0) {
        console.log("No more images available.");
        return false; // Якщо більше немає зображень
    }

    posts.forEach(post => {
        let fileUrl = post.getAttribute('file_url');
        let id = post.getAttribute('id');
        GalleryPostList.push({ fileUrl, id }); // Додаємо до списку
    });

    currentPage += 1; // Збільшуємо номер сторінки
    console.log(`Loaded ${posts.length} images. Total: ${GalleryPostList.length}`);
    return posts.length === limit; // Повертаємо `true`, якщо є ще зображення
}

function updateMedia(isFavorite = false) {
    let imgElement = document.querySelector('#gallery_img');
    let videoElement = document.querySelector('#gallery_video');
    let imgWrapper = document.getElementById("mediaWrapper");
    let contentWrapper = document.getElementById("contentWrapper");
    let tagsPanel = document.querySelector('#tagsPanel');

    if (tagsPanel && !tagsPanel.classList.contains('hidden')) {
        tagsPanel.classList.add('hidden'); // Close the panel
        clearTagsPanel(tagsPanel); // Clear its contents
    }

    let currentPost = GalleryPostList[currentIndex];

    if (currentPost.fileUrl.match(/\.(jpeg|jpg|gif|png)$/) != null) {
        imgElement.src = currentPost.fileUrl;
        imgElement.crossOrigin = "anonymous";

        // Додаємо подію onload для зображення
        imgElement.onload = function () {
            
            const aspectRatio = imgElement.naturalHeight / imgElement.naturalWidth;

            if (aspectRatio > 5) {
                
                console.log('tall-image');
                imgElement.classList.add('tall-image'); // Якщо висота > ширини у 5 разів
                imgWrapper.classList.add('mediaWrapper-tall');

                const imgDimensions = imgWrapper.getBoundingClientRect();

                // Оновлюємо розміри contentWrapper під tall-image
                contentWrapper.style.width = `${imgDimensions.width}px`;
                contentWrapper.style.height = `90vh`; // Фіксована висота для високих зображень

                console.log("Велике зображення Ширина:", imgDimensions.width);
                console.log("Велике зображення Висота:", imgDimensions.height);
            } else {
                imgElement.classList.remove('tall-image');
                imgWrapper.classList.remove('mediaWrapper-tall');

                // Повертаємо стандартні розміри contentWrapper
                const imgDimensions = imgWrapper.getBoundingClientRect();
                contentWrapper.style.width = `${imgDimensions.width}px`;
                contentWrapper.style.height = `${imgDimensions.height}px`;

                console.log("Звичайне зображення Ширина:", imgDimensions.width);
                console.log("Звичайне зображення Висота:", imgDimensions.height);
            }
        };

        imgElement.style.display = 'block';
        videoElement.style.display = 'none';
    } else if (currentPost.fileUrl.match(/\.(mp4|webm)$/) != null) {
        videoElement.src = currentPost.fileUrl;
        videoElement.style.display = 'block';
        imgElement.style.display = 'none';

        // Wait for the video metadata to load before setting dimensions
        videoElement.onloadedmetadata = function () {
            // Дочекаємося, поки браузер відобразить масштабоване відео
            requestAnimationFrame(() => {
                const videoDimensions = videoElement.getBoundingClientRect();
                contentWrapper.style.width = `${videoDimensions.width}px`;
                contentWrapper.style.height = `${videoDimensions.height}px`;

                console.log("Video Displayed Width:", videoDimensions.width);
                console.log("Video Displayed Height:", videoDimensions.height);
            });
        };
    } else {
        console.log("Unsupported media format.");
    }

    if (!isFavorite) {
        injectScript(function (postId) {
            let heartIcon = document.querySelector('#heart_icon');
            if (heartIcon) {
                heartIcon.onclick = function () {
                    addFav(postId);
                };
            }
        }, currentPost.id);
    }


    if (currentIndex + 1 >= lastThreshold && isFavorite==false && currentPage != 0) {
        console.log(`Reached threshold ${lastThreshold}. Loading more images...`);
        let tags = document.querySelector('input[name="tags"]').value.replace(/ /g, "+");
        if (!isLoadingMore) {
            isLoadingMore = true; // Уникнення повторного виклику
            loadMoreImages(tags).then(hasMore => {
                if (hasMore) {
                    lastThreshold += batchSize; // Оновлюємо порогову позначку
                } else {
                    console.log("No more images available to load.");
                }
                isLoadingMore = false; // Скидаємо прапорець після завершення завантаження
            });
        }
    }

    updatePaginator();
}

async function fetchTags(postId) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'fetchTags', postId }, (response) => {
            if (!response) {
                console.error('No response from background script.');
                resolve(null);
                return;
            }

            if (response.success) {
                resolve(response.categories);
            } else {
                console.error('Failed to fetch tags:', response.error);
                resolve(null);
            }
        });
    });
}


function clearTagsPanel(tagsPanel) {
    while (tagsPanel.firstChild) {
        tagsPanel.removeChild(tagsPanel.firstChild);
    }
}

async function populateTagsPanel(postId, tagsPanel) {
    clearTagsPanel(tagsPanel);

    const categories = await fetchTags(postId);
    if (!categories) {
        const errorMsg = document.createElement('p');
        errorMsg.textContent = 'Failed to load tags. Please try again.';
        errorMsg.style.color = 'red';
        tagsPanel.appendChild(errorMsg);
        return;
    }

    for (const [category, tags] of Object.entries(categories)) {
        if (tags.length > 0) {
            const sectionHeader = document.createElement('h3');
            sectionHeader.textContent = category;
            sectionHeader.className = 'tagSectionHeader';

            const tagList = document.createElement('ul');
            tagList.className = 'tagList';

            tags.forEach((tag) => {
                const tagItem = document.createElement('li');
                tagItem.textContent = tag;
                tagItem.className = 'tagItem';
                tagList.appendChild(tagItem);
            });

            tagsPanel.appendChild(sectionHeader);
            tagsPanel.appendChild(tagList);
        }
    }
}

export function createModal({ isFavorite = false, lastPage = 0, postList = [] } = {}) {

    const galleryListDialog = document.getElementById('gallery-list-modal');
    if (galleryListDialog && galleryListDialog.open) {
        galleryListDialog.close();  // Закриваємо dialog перед відкриттям галереї
        isGalleryListUsed = true;
    }

    currentPage = lastPage;
    let modal = document.createElement('div');
    modal.id = 'mediaModal';
    GalleryPostList = postList

    let tagsPanel = document.createElement('div');
    tagsPanel.id = 'tagsPanel';
    tagsPanel.className = 'tagsPanel hidden'; // Початково прихована

    let contentWrapper = document.createElement('div');
    contentWrapper.className = 'contentWrapper';
    contentWrapper.id = 'contentWrapper';

    let mediaWrapper = document.createElement('div');
    mediaWrapper.className = 'mediaWrapper';
    mediaWrapper.id = 'mediaWrapper';

    let closeButton = document.createElement('span');
    closeButton.className = 'closeButton toggleable';
    closeButton.innerHTML = '&times;';
    closeButton.onclick = function () {
        if (isGalleryListUsed) {
            galleryListDialog.showModal();
        }
        modal.remove();
        tagsPanel.remove();
    };

    document.addEventListener('keydown', function (event) {
        if (event.key === ' ') {
            let modal = document.querySelector('#mediaModal');
            if (modal && modal.style.display === 'flex') {
                event.preventDefault(); // Забороняємо стандартну поведінку прокрутки
            }
        }
    });

    let buttonContainer = document.createElement('div');
    buttonContainer.className = 'buttonContainer';

    if (!isFavorite) {
        let heartIcon = document.createElement('i');
        heartIcon.className = 'fa fa-heart toggleable';
        heartIcon.id = 'heart_icon';
        buttonContainer.appendChild(heartIcon);
    }

    // Додаємо кнопку для перемикання видимості контролів
    let toggleButton = document.createElement('i');
    toggleButton.className = 'fa fa-eye-slash toggleable';
    toggleButton.id = 'toggle_controls';
    toggleButton.title = 'Toggle controls visibility';
    toggleButton.onclick = function () {
        let controls = document.querySelectorAll('.toggleable');
        controls.forEach(control => control.classList.toggle('hidden-controls'));
    };
    buttonContainer.appendChild(toggleButton);

    // Додаємо нову кнопку для відкриття сторінки в новій вкладці
    let openLinkButton = document.createElement('i');
    openLinkButton.className = 'fa fa-external-link toggleable';
    openLinkButton.id = 'open_link';
    openLinkButton.title = 'Open post in new tab';
    openLinkButton.onclick = function () {
        let currentPost = GalleryPostList[currentIndex];
        console.table(GalleryPostList[0]);
        console.log(`https://rule34.xxx/index.php?page=post&s=view&id=${currentPost.id}`);
        window.open(`https://rule34.xxx/index.php?page=post&s=view&id=${currentPost.id}`, '_blank');
    };
    buttonContainer.appendChild(openLinkButton);

    let openTagsButton = document.createElement('i');
    openTagsButton.className = 'fa fa-tags toggleable';
    openTagsButton.id = 'open_tags';
    openTagsButton.title = 'Open post tags tab';
    openTagsButton.onclick = async function () {
        if (tagsPanel.classList.contains('hidden')) {
            if (!tagsPanel.hasChildNodes()) {
                await populateTagsPanel(GalleryPostList[currentIndex].id, tagsPanel);
            }
        }
        tagsPanel.classList.toggle('hidden');
    };
    buttonContainer.appendChild(openTagsButton);

    contentWrapper.appendChild(buttonContainer);

    let [imgElement, videoElement] = createMediaElements();

    let prevButton = document.createElement('button');
    prevButton.className = 'navButton prevButton toggleable';
    prevButton.innerHTML = '<i class="fa fa-circle-left"></i>';
    prevButton.onclick = function () {
        currentIndex = (currentIndex > 0) ? currentIndex - 1 : GalleryPostList.length - 1;
        updateMedia(isFavorite);
    };

    let nextButton = document.createElement('button');
    nextButton.className = 'navButton nextButton toggleable';
    nextButton.innerHTML = '<i class="fa fa-circle-right"></i>';
    nextButton.onclick = function () {
        currentIndex = (currentIndex < GalleryPostList.length - 1) ? currentIndex + 1 : 0;
        updateMedia(isFavorite);
    };

    let paginator = document.createElement('div');
    paginator.id = 'paginator';
    paginator.className = 'paginator toggleable';

    let firstButton = document.createElement('button');
    firstButton.className = 'navButton firstButton toggleable';
    firstButton.innerHTML = '<i class="fa fa-fast-backward"></i>';
    firstButton.onclick = function () {
        currentIndex = 0;
        updateMedia(isFavorite);
        updatePaginator();
    };

    let paginatorText = document.createElement('span');
    paginatorText.id = 'paginatorText';
    paginatorText.innerText = `${currentIndex + 1} / ${GalleryPostList.length}`;

    let lastButton = document.createElement('button');
    lastButton.className = 'navButton lastButton toggleable';
    lastButton.innerHTML = '<i class="fa fa-fast-forward"></i>';
    lastButton.onclick = function () {
        currentIndex = GalleryPostList.length - 1;
        updateMedia(isFavorite);
        updatePaginator();
    };


    document.body.appendChild(tagsPanel);
    // Додаємо лише текст у пагінатор по центру
    paginator.appendChild(paginatorText);

    // Додаємо кнопки у contentWrapper, щоб вони були окремо від тексту
    contentWrapper.appendChild(firstButton);
    contentWrapper.appendChild(paginator);
    contentWrapper.appendChild(lastButton);

    mediaWrapper.appendChild(imgElement);
    mediaWrapper.appendChild(videoElement);


    contentWrapper.appendChild(closeButton);
    contentWrapper.appendChild(prevButton);
    contentWrapper.appendChild(nextButton);
    modal.appendChild(contentWrapper);
    modal.appendChild(mediaWrapper);
    document.body.appendChild(modal);

    return modal;
}

function updatePaginator() {
    let paginatorText = document.querySelector('#paginatorText');
    if (paginatorText) {
        paginatorText.innerText = `${currentIndex + 1} / ${GalleryPostList.length}`;
    }
}

export function showModal(index) {
    let modal = document.querySelector('#mediaModal');
    currentIndex = index;
    updateMedia();
    modal.style.display = 'flex';
}

document.addEventListener('keydown', function (event) {
    let modal = document.querySelector('#mediaModal');
    if (modal && modal.style.display === 'flex') {
        if (event.key === 'ArrowLeft') {
            currentIndex = (currentIndex > 0) ? currentIndex - 1 : GalleryPostList.length - 1;
            updateMedia();
        } else if (event.key === 'ArrowRight') {
            currentIndex = (currentIndex < GalleryPostList.length - 1) ? currentIndex + 1 : 0;
            updateMedia();
        } else if (event.key === 'Escape') {
            modal.style.display = 'none';
        }
        updatePaginator();
    }
});
