let link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css';
document.head.appendChild(link);
let currentUrl = window.location.href;

let customStyleLink = document.createElement('link');
customStyleLink.rel = 'stylesheet';
customStyleLink.href = 'galleryStyles.css';
document.head.appendChild(customStyleLink);

let PostList = [];
let currentIndex = 0;

async function logMovies(tags) {
    const limit = 966; // Отримуємо до 966 медіафайлів за один запит
    let page = 0;
    let hasMoreResults = true;

    while (hasMoreResults) {
        const response = await fetch(`https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&tags=${tags}&pid=${page}&limit=${limit}`);
        const text = await response.text();
        let parser = new DOMParser();
        let xmlDoc = parser.parseFromString(text, "text/xml");

        let posts = xmlDoc.querySelectorAll('post');
        if (posts.length === 0) {
            hasMoreResults = false; // Якщо постів більше немає, виходимо з циклу
        } else {
            posts.forEach(post => {
                let fileUrl = post.getAttribute('file_url');
                let id = post.getAttribute('id');
                PostList.push({ fileUrl, id }); // Зберігаємо URL і id у PostList
            });
            page += 1; // Стрибок на наступну сторінку з прогресією
        }

        console.log(`Оброблено сторінку ${page}, зібрано ${PostList.length} медіафайлів.`);
    }

    console.log(`Загалом зібрано ${PostList.length} медіафайлів.`);
}


function injectScript(fn, postId) {
    const script = document.createElement('script');
    script.textContent = '(' + fn.toString() + ')(' + JSON.stringify(postId) + ');';
    document.documentElement.appendChild(script);
    script.remove(); // Видаляємо після виконання, щоб не залишати слідів
}

function createMediaElements() {
	let imgElement = document.createElement('img');
	imgElement.id = 'gallery_img';

	let videoElement = document.createElement('video');
	videoElement.controls = true;
	videoElement.id = 'gallery_video';

    return [imgElement, videoElement];
}

function updateMedia() {
    let imgElement = document.querySelector('#gallery_img');
    let videoElement = document.querySelector('#gallery_video');
    let heartIcon = document.querySelector('#heart_icon'); // Доступ до сердечка

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
        console.log("Непідтримуваний формат медіафайлу.");
    }

    injectScript(function(postId) {
        let heartIcon = document.querySelector('#heart_icon');
        heartIcon.onclick = function () {
            addFav(postId); // Ця функція буде виконуватись в контексті сторінки
        };
    }, currentPost.id);
}

function createModal() {
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

    // Серце завжди червоне, без анімації
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
    contentWrapper.appendChild(heartIcon); // Додаємо серце до модального вікна
    contentWrapper.appendChild(prevButton);
    contentWrapper.appendChild(nextButton);
    modal.appendChild(contentWrapper);
    document.body.appendChild(modal);

    return modal;
}

function showModal(index) {
    let modal = document.querySelector('#mediaModal');
    currentIndex = index;
    updateMedia();
    modal.style.display = 'flex';
}

async function processTags() {
    let inputTags = document.querySelector('input[name="tags"]');
    if (inputTags) {
        let tags = inputTags.value.replace(/ /g, "+");
        console.log("Вміст input з name='tags': ", tags);
        await logMovies(tags);
        createModal();
        showModal(0); 
    } else {
        console.log("Елемента input з name='tags' не знайдено на сторінці.");
    }
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
			console.log("Елемента з class='tag-search' не знайдено в sidebar.");
		}
	} else {
		console.log("Елемента з class='sidebar' не знайдено на сторінці.");
	}
}

