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
}
