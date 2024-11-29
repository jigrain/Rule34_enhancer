(function loadFontAwesome() {
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href =
            "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css";
        document.head.appendChild(link);
    }
})();

if (!document.querySelector("style[data-enhance-thumbnails]")) {
    const styleElement = document.createElement("style");
    styleElement.setAttribute("data-enhance-thumbnails", "true"); // Додаємо унікальний атрибут, щоб уникнути конфліктів
    styleElement.textContent = `
        .thumb {
            position: relative;
            display: inline-block;
            transition: transform 0.3s ease;
            overflow: hidden;
        }

        .thumb:hover {
            transform: scale(1.1);
            z-index: 10;
        }

        .thumb img {
            object-fit: cover; /* Масштабуємо без викривлень */
        }

        .action-btn {
            position: absolute;
            top: 10px;
            background-color: rgba(0, 0, 0, 0.6);
            border: none;
            color: white;
            padding: 8px;
            cursor: pointer;
            border-radius: 10%;
            font-size: 18px;
            opacity: 0;
            transition: opacity 0.3s ease, transform 0.3s ease;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .thumb:hover .action-btn {
            opacity: 1;
        }

        .heart-btn {
            left: 10px;
        }

        .zoom-btn {
            right: 10px;
        }

        .popup-image {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1000;
            max-width: 90%;
            max-height: 90%;
            border: 3px solid white;
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.7);
            display: none;
        }
        
        .popup-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 999;
            display: none;
        }
    `;
    document.head.appendChild(styleElement);
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

        // Витягуємо postId з кінця URL
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
