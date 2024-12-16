(function loadFontAwesome() {
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href =
            "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css";
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
    "<img id='img_hover_container' style='display:none; float:left; position:absolute; max-width:200px; overflow:hidden; z-index:9999;' src=''>"
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
            console.log('Видаляємо елемент:', a); // Для перевірки
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

        // Використовуємо injectScript для прив'язки обробника до кнопки
        injectScript(
            function (heartBtnId, postId) {
                const heartIcon = document.getElementById(heartBtnId);
                if (heartIcon) {
                    heartIcon.onclick = function () {
                        addFav(postId);
                    };
                }
            },
            heartBtnId,
            postId
        );

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

// Викликаємо функцію одразу після завантаження сторінки
window.addEventListener("load", enhanceThumbnails);

// Також запускаємо при зміні DOM (на випадок динамічного завантаження контенту)
const observer = new MutationObserver(enhanceThumbnails);
observer.observe(document.body, { childList: true, subtree: true });
