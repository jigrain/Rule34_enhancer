// Отримуємо всі зображення
const images = document.querySelectorAll('.image-list .thumb img.preview');

// Відправляємо запит на завантаження кожного зображення через фоновий скрипт
function fetchImageBackground(src, callback) {
  chrome.runtime.sendMessage({ action: 'fetchImage', src: src }, callback);
}

// Функція для зміни розміру зображення
function resizeImage(imageBitmap, scale = 0.1) {
  const canvas = document.createElement('canvas');
  canvas.width = imageBitmap.width * scale;
  canvas.height = imageBitmap.height * scale;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);

  return new Promise(resolve => canvas.toBlob(resolve));
}

// Основна функція обробки
async function processImages() {
  for (let img of images) {
    const src = img.src;

    // Зберігаємо початкові розміри зображення
    const originalHeight = img.height;
    const originalWidth = img.width;

    console.log('Original Height:', originalHeight);
    console.log('Original Width:', originalWidth);

    try {
      // Завантажуємо зображення через фоновий скрипт
      fetchImageBackground(src, async (res) => {
        if (res.success) {
          const imageBitmap = await createImageBitmap(res.blob);
          const resizedBlob = await resizeImage(imageBitmap);

          // Створюємо нове посилання на зменшене зображення
          const resizedUrl = URL.createObjectURL(resizedBlob);

          // Зберігаємо зображення в локальне сховище
          const key = `image-${src}`;
          localStorage.setItem(key, resizedUrl);

          // Змінюємо оригінальне зображення на зменшене
          img.src = resizedUrl;

          // Встановлюємо збережені розміри до нового зображення
          img.style.width = `${originalWidth}px`;
          img.style.height = `${originalHeight}px`;

        } else {
          console.error(`Не вдалося завантажити зображення: ${src}`);
        }
      });

    } catch (err) {
      console.error(`Помилка при обробці зображення: ${src}`, err);
    }
  }
}

// Викликаємо функцію обробки зображень
processImages();
