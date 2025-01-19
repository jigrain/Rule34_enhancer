(function loadFontAwesome() {
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href =
            "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css";
        document.head.appendChild(link);
    }
})();

if (!document.querySelector('link[data-enhance-thumbnails]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('thumbnails.css'); // Замініть на фактичний шлях
    link.setAttribute('data-enhance-thumbnails', 'true');
    document.head.appendChild(link);
}

document.body.insertAdjacentHTML(
    "afterbegin",
    "<img id='img_hover_container' class='img-hover-container' src=''>"
);

var img_type = "jpg";
var mouse_offset_x = 16;
var mouse_offset_y = 16;
var mouse_side = false;
var currentMousePos = { x: -1, y: -1 };

// Відстеження руху миші
document.addEventListener("mousemove", function (event) {
    currentMousePos.x = event.pageX;
    currentMousePos.y = event.pageY;
    updatePos();
});

// Оновлення позиції контейнера
function updatePos() {
    const container = document.getElementById("img_hover_container");
    if (!container) return;

    // Горизонтальне позиціонування
    if (currentMousePos.x > window.innerWidth / 2) {
        mouse_side = true;
        mouse_offset_x = -container.offsetWidth - 16;
        container.style.maxWidth = currentMousePos.x - 16 + "px";
    } else {
        mouse_side = false;
        mouse_offset_x = 16;
        container.style.maxWidth = window.innerWidth - currentMousePos.x + "px";
    }

    // Вертикальне позиціонування
    if (currentMousePos.y > window.innerHeight - container.offsetHeight) {
        mouse_offset_y =
            window.innerHeight - container.offsetHeight + window.scrollY;
    } else {
        mouse_offset_y = currentMousePos.y + 16;
    }

    container.style.top = mouse_offset_y + "px";
    container.style.left = currentMousePos.x + mouse_offset_x + "px";
}

// Обробка помилок завантаження зображень
document
    .getElementById("img_hover_container")
    .addEventListener("error", function () {
        const container = document.getElementById("img_hover_container");
        if (img_type === "jpg") {
            container.src = container.src.replace("jpg", "png");
            img_type = "png";
        } else if (img_type === "png") {
            container.src = container.src.replace("png", "jpeg");
            img_type = "jpeg";
        } else if (img_type === "jpeg") {
            container.src = container.src.replace("jpeg", "gif");
            img_type = "gif";
        }
    });

function injectScript(fn, ...args) {
    const script = document.createElement("script");
    script.textContent = `(${fn.toString()})(${args
        .map((arg) => JSON.stringify(arg))
        .join(",")});`;
    document.documentElement.appendChild(script);
    script.remove();
}

// Функція для додавання кнопок
function enhanceThumbnails() {
    document.querySelectorAll('a').forEach(a => {
        if (a.innerHTML.includes('<b>Remove</b>')) {
            //console.log('Видаляємо елемент:', a); // Для перевірки
            a.remove(); // Видаляємо елемент з DOM
        }
    });

    const contentDiv = document.getElementById('content');
    if (contentDiv) {
        contentDiv.setAttribute('style', 'padding: 20px 15px 0 15px');
    }

    document.querySelectorAll(".thumb").forEach((thumb, index) => {
        const hoverContainer = document.getElementById("img_hover_container");
        const anchor = thumb.querySelector("a");
        const img = thumb.querySelector("img");
        if (!anchor || !img) return; // Пропускаємо, якщо немає <a> або <img>

        // Перевіряємо, чи кнопки вже додані
        if (thumb.querySelector(".action-btn")) return;

        if (anchor.hasAttribute("onclick")) {
            anchor.removeAttribute("onclick");
        }

        anchor.setAttribute("target", "_blank");

        const postIdMatch = anchor.href.match(/id=(\d+)/);
        const postId = postIdMatch ? postIdMatch[1] : null;

        if (!postId) return; // Пропускаємо, якщо не знайдено postId

        // Створюємо унікальний id для кнопки
        const heartBtnId = `add_to_favorite_${index}`;

        // Створюємо кнопку сердечка
        if (!currentUrl.includes("page=favorites")) {
            const heartBtn = document.createElement("button");
            heartBtn.className = "action-btn heart-btn";
            heartBtn.id = heartBtnId;
            heartBtn.innerHTML = '<i class="fa fa-heart"></i>';
            thumb.appendChild(heartBtn);

            // Використовуємо injectScript для прив'язки обробника до кнопки
            injectScript(
                function (postId, buttonId) {
                    const button = document.getElementById(buttonId);
                    if (button) {
                        button.onclick = function () {
                            addFav(postId);
                        };
                    }
                },
                postId,
                heartBtnId
            );
        } else {
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "action-btn heart-btn";
            deleteBtn.id = "deleteBtnId";
            deleteBtn.innerHTML = '<i class="fa fa-trash"></i>';
            thumb.appendChild(deleteBtn);

            deleteBtn.addEventListener('click', () => {
                const url = `index.php?page=favorites&s=delete&id=${postId}&return_pid=0`;

                document.location.href = url;
                return false;
            })
        }

        const plusBtn = document.createElement("button");
        plusBtn.className = "action-btn plus-btn";
        plusBtn.setAttribute("id", "plusBtnId");
        plusBtn.innerHTML = '<i class="fa fa-plus"></i>';
        plusBtn.style.top = "50px"; // Нижче кнопки сердечка
        thumb.appendChild(plusBtn);

        // Обробник натискання на кнопку з плюсом
        plusBtn.addEventListener("click", function () {
            openModalDialog(postId);
        });

        // Створюємо кнопку з лупою
        const zoomBtn = document.createElement("button");
        zoomBtn.className = "action-btn zoom-btn show_full";
        zoomBtn.innerHTML = '<i class="fa fa-search"></i>';

        zoomBtn.addEventListener("mouseenter", function () {
            img_type = "jpg";
            document.getElementById("img_hover_container").src = img.src
                .replace("thumbnails", "/images")
                .replace("thumbnail_", "");
            document.getElementById("img_hover_container").style.maxHeight =
                window.innerHeight + "px";
            hoverContainer.style.display = "block";
        });

        zoomBtn.addEventListener("mouseleave", function () {
            document.getElementById("img_hover_container").src = "";
            hoverContainer.style.display = "none";
        });

        thumb.appendChild(zoomBtn);
    });
}

const dialog = document.createElement("dialog");
dialog.id = "modal_dialog";
dialog.className = "addToGalery-custom-modal";
dialog.innerHTML = `
    <div class="addToGalery-modal-header">
        <button id="close_modal" class="addToGalery-modal-close-btn">&times;</button>
        <h3 id="modal_title" class="addToGalery-modal-title">Додати пост в галерею</h3>
    </div>
    <div class="addToGalery-modal-tabs">
        <button id="tab_existing_gallery" class="addToGalery-modal-tab-btn addToGalery-active-tab">Додати в галерею</button>
        <button id="tab_new_gallery" class="addToGalery-modal-tab-btn">Створити нову</button>
    </div>
    <div id="tab_content_existing" class="addToGalery-tab-content addToGalery-active-tab-content">
        <h4 class="addToGalery-tab-title">Існуючі галереї</h4>
        <select id="gallery_select" class="addToGalery-modal-input"></select>
        <button id="add_to_gallery" class="addToGalery-modal-btn primary-btn">Додати в обрану галерею</button>
    </div>
    <div id="tab_content_new" class="addToGalery-tab-content">
        <h4 class="addToGalery-tab-title">Створити нову галерею</h4>
        <input id="new_gallery_name" type="text" placeholder="Назва галереї" class="addToGalery-modal-input">
        <button id="create_new_gallery" class="addToGalery-modal-btn success-btn">Створити і додати</button>
    </div>
`;
document.body.appendChild(dialog);

// Функція для переключення вкладок
function setupTabSwitching() {
    const tabExisting = document.getElementById("tab_existing_gallery");
    const tabNew = document.getElementById("tab_new_gallery");
    const contentExisting = document.getElementById("tab_content_existing");
    const contentNew = document.getElementById("tab_content_new");

    tabExisting.addEventListener("click", () => {
        tabExisting.classList.add("addToGalery-active-tab");
        tabNew.classList.remove("addToGalery-active-tab");
        contentExisting.classList.add("addToGalery-active-tab-content");
        contentNew.classList.remove("addToGalery-active-tab-content");
    });

    tabNew.addEventListener("click", () => {
        tabNew.classList.add("addToGalery-active-tab");
        tabExisting.classList.remove("addToGalery-active-tab");
        contentNew.classList.add("addToGalery-active-tab-content");
        contentExisting.classList.remove("addToGalery-active-tab-content");
    });
}


// Функція для відкриття модального вікна
function openModalDialog(postId) {
    const modal = document.getElementById("modal_dialog");
    const gallerySelect = document.getElementById("gallery_select");
    const modalTitle = document.getElementById("modal_title");

    modalTitle.textContent = `Додати пост #${postId} в галерею`;
    gallerySelect.innerHTML = ""; // Очищуємо попередні опції

    // Завантажуємо галереї з browser.storage.local
    browser.storage.local.get("savedGalleryData").then((result) => {
        const galleries = result.savedGalleryData || [];
        galleries.forEach((gallery) => {
            const option = document.createElement("option");
            option.value = gallery.name;
            option.textContent = gallery.name;
            gallerySelect.appendChild(option);
        });
    });

    // Прив'язуємо постId до кнопок
    const addToGalleryBtn = document.getElementById("add_to_gallery");
    const createNewGalleryBtn = document.getElementById("create_new_gallery");

    addToGalleryBtn.onclick = () => addPostToGallery(postId);
    createNewGalleryBtn.onclick = () => createNewGalleryAndAddPost(postId);

    if (modal) {
        modal.showModal();
        setupTabSwitching();
    }
}

// Обробник закриття модального вікна
document.getElementById("close_modal").addEventListener("click", function () {
    const modal = document.getElementById("modal_dialog");
    if (modal) {
        modal.close();
    }
});

function addPostToGallery(postId) {
    const galleryName = document.getElementById("gallery_select").value;
    if (!galleryName) {
        alert("Виберіть галерею!");
        return;
    }

    browser.storage.local.get("savedGalleryData").then((result) => {
        const galleries = result.savedGalleryData || [];
        const gallery = galleries.find((g) => g.name === galleryName);

        if (!gallery) {
            alert("Галерея не знайдена!");
            return;
        }

        // Перевіряємо, чи пост вже існує в галереї
        if (gallery.content.some((post) => post.postId === postId)) {
            alert("Цей пост вже додано в галерею!");
            return;
        }

        // Завантажуємо дані з API
        const url = `https://api.rule34.xxx/index.php?page=dapi&q=index&json=1&s=post&id=${postId}`;
        fetch(url)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Помилка при отриманні даних з API.");
                }
                return response.json();
            })
            .then((data) => {
                if (!data || data.length === 0) {
                    alert("Дані для цього поста не знайдені.");
                    return;
                }

                let fileUrl = data[0].file_url;
                let PrevUrl = data[0].preview_url;
                let type = /\.(jpeg|jpg|gif|png)$/i.test(fileUrl) ? "image" : "video";

                // Додаємо пост в галерею
                gallery.content.push({ postId, url: fileUrl, type, preview_url: PrevUrl });
                browser.storage.local.set({ savedGalleryData: galleries });
                alert(`Пост #${postId} додано до галереї ${galleryName}`);
            })
            .catch((error) => {
                console.error(error);
                alert("Не вдалося додати пост. Спробуйте ще раз.");
            });
    });
}

function createNewGalleryAndAddPost(postId) {
    const newGalleryName = document.getElementById("new_gallery_name").value.trim();
    if (!newGalleryName) {
        alert("Введіть назву для нової галереї!");
        return;
    }

    browser.storage.local.get("savedGalleryData").then((result) => {
        const galleries = result.savedGalleryData || [];
        const galleryExists = galleries.some((g) => g.name === newGalleryName);

        if (galleryExists) {
            alert("Галерея з такою назвою вже існує!");
            return;
        }

        // Завантажуємо дані з API
        const url = `https://api.rule34.xxx/index.php?page=dapi&q=index&json=1&s=post&id=${postId}`;
        fetch(url)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Помилка при отриманні даних з API.");
                }
                return response.json();
            })
            .then((data) => {
                if (!data || data.length === 0) {
                    alert("Дані для цього поста не знайдені.");
                    return;
                }

                let fileUrl = data[0].file_url;
                let PrevUrl = data[0].preview_url;
                let type = /\.(jpeg|jpg|gif|png)$/i.test(fileUrl) ? "image" : "video";

                // Створюємо нову галерею і додаємо пост
                const newGallery = {
                    name: newGalleryName,
                    content: [{ postId, url: fileUrl, type, preview_url: PrevUrl }],
                    tags: [],
                    favorite: false,
                };
                galleries.push(newGallery);
                browser.storage.local.set({ savedGalleryData: galleries });
                alert(`Галерея ${newGalleryName} створена і пост #${postId} додано!`);
            })
            .catch((error) => {
                console.error(error);
                alert("Не вдалося створити галерею. Спробуйте ще раз.");
            });
    });
}

// Викликаємо функцію одразу після завантаження сторінки
window.addEventListener("load", enhanceThumbnails);

// Також запускаємо при зміні DOM (на випадок динамічного завантаження контенту)
const observer = new MutationObserver(enhanceThumbnails);
observer.observe(document.body, { childList: true, subtree: true });
