let link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css';
document.head.appendChild(link);

let currentIndex = 0;

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
    let heartIcon = document.querySelector('#heart_icon');
    
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

    injectScript(function(postId) {
        let heartIcon = document.querySelector('#heart_icon');
        heartIcon.onclick = function () {
            addFav(postId);
        };
    }, currentPost.id);
}

export function createModal() {
    let modal = document.createElement('div');
    modal.id = 'mediaModal';

    let contentWrapper = document.createElement('div');
    contentWrapper.className = 'contentWrapper';

    let closeButton = document.createElement('span');
    closeButton.className = 'closeButton';
    closeButton.innerHTML = '&times;';
    closeButton.onclick = function () {
        modal.style.display = 'none';
    };

    let heartIcon = document.createElement('i');
    heartIcon.className = 'fa fa-heart';
    heartIcon.id = 'heart_icon';

    let [imgElement, videoElement] = createMediaElements();

    let prevButton = document.createElement('button');
    prevButton.className = 'navButton prevButton';
    prevButton.innerHTML = '<i class="fa fa-arrow-circle-o-left"></i>';
    prevButton.onclick = function () {
        currentIndex = (currentIndex > 0) ? currentIndex - 1 : PostList.length - 1;
        updateMedia();
    };

    let nextButton = document.createElement('button');
    nextButton.className = 'navButton nextButton';
    nextButton.innerHTML = '<i class="fa fa-arrow-circle-o-right"></i>';
    nextButton.onclick = function () {
        currentIndex = (currentIndex < PostList.length - 1) ? currentIndex + 1 : 0;
        updateMedia();
    };

    contentWrapper.appendChild(imgElement);
    contentWrapper.appendChild(videoElement);
    contentWrapper.appendChild(closeButton);
    contentWrapper.appendChild(heartIcon);
    contentWrapper.appendChild(prevButton);
    contentWrapper.appendChild(nextButton);
    modal.appendChild(contentWrapper);
    document.body.appendChild(modal);

    return modal;
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
    }
});
