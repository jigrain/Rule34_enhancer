let link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css';
document.head.appendChild(link);

let currentIndex = 0;
let isFavorite = false;

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

function updateMedia() {
    let imgElement = document.querySelector('#gallery_img');
    let videoElement = document.querySelector('#gallery_video');
    
    let currentPost = PostList[currentIndex];

    if (currentPost.fileUrl.match(/\.(jpeg|jpg|gif|png)$/) != null) {
        imgElement.src = currentPost.fileUrl;
        imgElement.style.display = 'block';
        videoElement.style.display = 'none';
    } else if (currentPost.fileUrl.match(/\.(mp4|webm)$/) != null) {
        videoElement.src = currentPost.fileUrl;
        videoElement.style.display = 'block';
        imgElement.style.display = 'none';
    } else {
        console.log("Unsupported media format.");
    }

    if (!isFavorite) {
        injectScript(function(postId) {
            let heartIcon = document.querySelector('#heart_icon');
            if (heartIcon) {
                heartIcon.onclick = function () {
                    addFav(postId);
                };
            }
        }, currentPost.id);
    }

    updatePaginator();
}

export function createModal(isFavorite = false) {
    let modal = document.createElement('div');
    modal.id = 'mediaModal';

    let contentWrapper = document.createElement('div');
    contentWrapper.className = 'contentWrapper';

    let closeButton = document.createElement('span');
    closeButton.className = 'closeButton toggleable';
    closeButton.innerHTML = '&times;';
    closeButton.onclick = function () {
        modal.style.display = 'none';
    };

    if(!isFavorite){
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
        window.open(`https://rule34.xxx/index.php?page=post&s=view&id=${currentPost.id}`, '_blank');
    };
    contentWrapper.appendChild(openLinkButton);

    let [imgElement, videoElement] = createMediaElements();

    let prevButton = document.createElement('button');
    prevButton.className = 'navButton prevButton toggleable';
    prevButton.innerHTML = '<i class="fa fa-arrow-circle-o-left"></i>';
    prevButton.onclick = function () {
        currentIndex = (currentIndex > 0) ? currentIndex - 1 : PostList.length - 1;
        updateMedia();
    };

    let nextButton = document.createElement('button');
    nextButton.className = 'navButton nextButton toggleable';
    nextButton.innerHTML = '<i class="fa fa-arrow-circle-o-right"></i>';
    nextButton.onclick = function () {
        currentIndex = (currentIndex < PostList.length - 1) ? currentIndex + 1 : 0;
        updateMedia();
    };

    let paginator = document.createElement('div');
    paginator.id = 'paginator';
    paginator.className = 'paginator toggleable';
    
    let firstButton = document.createElement('button');
    firstButton.className = 'navButton firstButton toggleable';
    firstButton.innerHTML = '<i class="fa fa-fast-backward"></i>';
    firstButton.onclick = function () {
        currentIndex = 0;
        updateMedia();
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
        updateMedia();
        updatePaginator();
    };
    
    // Додаємо лише текст у пагінатор по центру
    paginator.appendChild(paginatorText);
    
    // Додаємо кнопки у contentWrapper, щоб вони були окремо від тексту
    contentWrapper.appendChild(firstButton);
    contentWrapper.appendChild(paginator);
    contentWrapper.appendChild(lastButton);

    contentWrapper.appendChild(imgElement);
    contentWrapper.appendChild(videoElement);
    contentWrapper.appendChild(closeButton);
    contentWrapper.appendChild(prevButton);
    contentWrapper.appendChild(nextButton);
    modal.appendChild(contentWrapper);
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
