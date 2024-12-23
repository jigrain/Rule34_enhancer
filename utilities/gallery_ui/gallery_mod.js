let link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css';
document.head.appendChild(link);

let currentIndex = 0;
let isFavorite = false;
let currentPage = 0; // Відстежуємо сторінку для дозавантаження
const batchSize = 100; // Розмір партії (перевірка кожні 100 елементів)
let lastThreshold = batchSize; // Порогова позначка для дозавантаження
let isLoadingMore = false;

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
    const response = await fetch(`https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&tags=${tags}&pid=${currentPage}&limit=${100}`);
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
        PostList.push({ fileUrl, id }); // Додаємо до списку
    });

    currentPage += 1; // Збільшуємо номер сторінки
    console.log(`Loaded ${posts.length} images. Total: ${PostList.length}`);
    return posts.length === limit; // Повертаємо `true`, якщо є ще зображення
}


function updateMedia(isFavorite = false) {
    let imgElement = document.querySelector('#gallery_img');
    let videoElement = document.querySelector('#gallery_video');
    let imgWrapper = document.getElementById("mediaWrapper");
    let contentWrapper = document.getElementById("contentWrapper");

    let currentPost = PostList[currentIndex];

    if (currentPost.fileUrl.match(/\.(jpeg|jpg|gif|png)$/) != null) {
        imgElement.src = currentPost.fileUrl;

        // Додаємо подію onload для зображення
        imgElement.onload = function () {
            // Отримуємо розміри imgWrapper після завантаження зображення
            const imgDimensions = imgWrapper.getBoundingClientRect();
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


    if (currentIndex + 1 >= lastThreshold && isFavorite==false) {
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

export function createModal(isFavorite = false, lastPage = 0) {
    currentPage = lastPage;
    let modal = document.createElement('div');
    modal.id = 'mediaModal';

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
        modal.style.display = 'none';
    };

    document.addEventListener('keydown', function (event) {
        if (event.key === ' ') {
            let modal = document.querySelector('#mediaModal');
            if (modal && modal.style.display === 'flex') {
                event.preventDefault(); // Забороняємо стандартну поведінку прокрутки
            }
        }
    });

    if (!isFavorite) {
        let heartIcon = document.createElement('i');
        heartIcon.className = 'fa fa-heart toggleable';
        heartIcon.id = 'heart_icon';
        contentWrapper.appendChild(heartIcon);
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
    contentWrapper.appendChild(toggleButton);

    // Додаємо нову кнопку для відкриття сторінки в новій вкладці
    let openLinkButton = document.createElement('i');
    openLinkButton.className = 'fa fa-external-link toggleable';
    openLinkButton.id = 'open_link';
    openLinkButton.title = 'Open post in new tab';
    openLinkButton.onclick = function () {
        let currentPost = PostList[currentIndex];
        console.table(PostList[0]);
        console.log(`https://rule34.xxx/index.php?page=post&s=view&id=${currentPost.id}`);
        window.open(`https://rule34.xxx/index.php?page=post&s=view&id=${currentPost.id}`, '_blank');
    };
    contentWrapper.appendChild(openLinkButton);

    let [imgElement, videoElement] = createMediaElements();

    let prevButton = document.createElement('button');
    prevButton.className = 'navButton prevButton toggleable';
    prevButton.innerHTML = '<i class="fa fa-arrow-circle-o-left"></i>';
    prevButton.onclick = function () {
        currentIndex = (currentIndex > 0) ? currentIndex - 1 : PostList.length - 1;
        updateMedia(isFavorite);
    };

    let nextButton = document.createElement('button');
    nextButton.className = 'navButton nextButton toggleable';
    nextButton.innerHTML = '<i class="fa fa-arrow-circle-o-right"></i>';
    nextButton.onclick = function () {
        currentIndex = (currentIndex < PostList.length - 1) ? currentIndex + 1 : 0;
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
    paginatorText.innerText = `${currentIndex + 1} / ${PostList.length}`;

    let lastButton = document.createElement('button');
    lastButton.className = 'navButton lastButton toggleable';
    lastButton.innerHTML = '<i class="fa fa-fast-forward"></i>';
    lastButton.onclick = function () {
        currentIndex = PostList.length - 1;
        updateMedia(isFavorite);
        updatePaginator();
    };

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
        paginatorText.innerText = `${currentIndex + 1} / ${PostList.length}`;
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
    if (modal.style.display === 'flex' && modal != null) {
        if (event.key === 'ArrowLeft') {
            currentIndex = (currentIndex > 0) ? currentIndex - 1 : PostList.length - 1;
            updateMedia();
        } else if (event.key === 'ArrowRight') {
            currentIndex = (currentIndex < PostList.length - 1) ? currentIndex + 1 : 0;
            updateMedia();
        } else if (event.key === 'Escape') {
            modal.style.display = 'none';
        }
        updatePaginator();
    }
});
