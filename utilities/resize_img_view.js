(() => {
const image = document.getElementById("image");
const content = document.getElementById("content");
const right_col = document.getElementById("right-col");
const sidebar = document.querySelector(".sidebar");
const sidebar_right = document.querySelector(".sidebarRight");
let currentUrl = window.location.href;
let url = new URL(currentUrl); 
let current_postId = url.searchParams.get('id'); 

function injectScript(fn, postId) {
  const script = document.createElement('script');
  script.textContent = '(' + fn.toString() + ')(' + JSON.stringify(postId) + ');';
  document.documentElement.appendChild(script);
  script.remove();
}

let tagSearchContainer = sidebar.querySelector('.tag-search');
let existingPanels = tagSearchContainer.parentElement.querySelectorAll('.panel');

if (existingPanels.length === 0) {
const panel = document.createElement('div');
panel.className = 'post_panel';

const buttonContainer = document.createElement('div');
buttonContainer.className = 'button-container';

const horizontalButtons = document.createElement('div');
horizontalButtons.className = 'post_horizontal-buttons';

const post_panep_button = document.createElement('button');
post_panep_button.id = "open-search-history"
post_panep_button.className = 'button horizontal-button';
post_panep_button.innerHTML = '<i class="fa fa-square-plus fa-2xl"></i>'
horizontalButtons.appendChild(post_panep_button);

post_panep_button.addEventListener("click", function () {
  openModalDialog(current_postId);
});


const post_panep_button2 = document.createElement('button');
post_panep_button2.id = "add-post-favorite"
post_panep_button2.className = 'button horizontal-button';
post_panep_button2.innerHTML = '<i class="fa fa-heart-circle-plus fa-2xl"></i>';
horizontalButtons.appendChild(post_panep_button2);

// Додаємо горизонтальні кнопки до контейнера
buttonContainer.appendChild(horizontalButtons);

// Додаємо контейнер до панелі
panel.appendChild(buttonContainer);

// Вставляємо панель після tagSearchContainer
tagSearchContainer.insertAdjacentElement('afterend', panel);
}


injectScript(function (postId) {
  let heartIcon = document.querySelector('#add-post-favorite');
  if (heartIcon) {
      heartIcon.onclick = function () {
          addFav(postId);
      };
  }
}, current_postId);

if (image) {
  const resizeImage = () => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    if (sidebar_right) {
      sidebar_right.remove();
    }
    // Ширина sidebar
    const sidebarWidth = sidebar.offsetWidth;

    const style = getComputedStyle(right_col);
    const right_colMarginLeft = parseInt(style.marginLeft, 10)
    const right_colMarginFight = parseInt(style.marginRight, 10)

    const sidebar_style = getComputedStyle(sidebar);

    const sidebarMarginLeft = parseInt(sidebar_style.marginLeft, 10)
    const sidebarMarginFight = parseInt(sidebar_style.marginRight, 10)

    const content_style = getComputedStyle(content);

    const contentPaddingLeft = (parseInt(content_style.paddingLeft, 10) / 2)

    // Доступна ширина для зображення
    const availableWidth = (windowWidth - sidebarWidth) - right_colMarginLeft - right_colMarginFight - sidebarMarginLeft - sidebarMarginFight - contentPaddingLeft;

    // Співвідношення сторін зображення
    const imageRatio = image.naturalWidth / image.naturalHeight;

    // Співвідношення сторін доступної області
    const availableRatio = availableWidth / windowHeight;

    if (imageRatio > availableRatio) {
      // Якщо зображення ширше, ніж доступна область
      image.style.width = `${availableWidth}px`;
      image.style.height = `${availableWidth / imageRatio}px`;
    } else {
      // Якщо зображення вище, ніж доступна область
      image.style.height = `${windowHeight}px`;
      image.style.width = `${windowHeight * imageRatio}px`;
    }
  };

  resizeImage();
    
  // Виклик функції при завантаженні зображення
  image.addEventListener("load", resizeImage);

  // Виклик функції при зміні розмірів вікна
  window.addEventListener("resize", resizeImage);

  // Створюємо елементи модального вікна
  const modalOverlay = document.createElement("div");
  const modalImage = document.createElement("img");

  modalOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgb(72,72,72);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  `;

  modalImage.style.cssText = `
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 8px;
  `;

  // Додаємо зображення до модального контейнера
  modalOverlay.appendChild(modalImage);
  document.body.appendChild(modalOverlay);

  // Відкриття модального вікна при кліку на зображення
  image.addEventListener("click", () => {
    modalImage.src = image.src;
    modalOverlay.style.display = "flex";
  });

  // Закриття модального вікна при кліку на оверлей
  modalOverlay.addEventListener("click", () => {
    modalOverlay.style.display = "none";
  });
}
})();
