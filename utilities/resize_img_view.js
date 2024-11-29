const image = document.getElementById("image");

if (image) {
  const resizeImage = () => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Співвідношення сторін зображення
    const imageRatio = image.naturalWidth / image.naturalHeight;

    // Співвідношення сторін вікна
    const windowRatio = windowWidth / windowHeight;

    if (imageRatio > windowRatio) {
      // Якщо зображення ширше, ніж вікно
      image.style.width = `${windowWidth}px`;
      image.style.height = `${windowWidth / imageRatio}px`;
    } else {
      // Якщо зображення вище, ніж вікно
      image.style.height = `${windowHeight}px`;
      image.style.width = `${windowHeight * imageRatio}px`;
    }
  };

  // Виклик функції при завантаженні сторінки та зміні розмірів вікна
  resizeImage();
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
