// Функція для перевірки статусу пікселізації
async function isPixelationEnabled() {
  const data = await browser.storage.local.get('pixelateEnabled');
  return data.pixelateEnabled || false;
}

// Отримуємо всі зображення
const images = document.querySelectorAll('.image-list .thumb img.preview');

// Відправляємо запит на завантаження кожного зображення через фоновий скрипт
function fetchImageBackground(src, callback) {
  browser.runtime.sendMessage({ action: 'fetchImage', src: src }, callback);
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

function getBaseUrl(url) {
  const parsedUrl = new URL(url);
  parsedUrl.search = ""; // Видаляємо параметри запиту
  return parsedUrl.toString();
}

// Основна функція обробки пікселізації
async function processImages() {
  for (let img of images) {
    const src = img.src;
    const baseUrl = getBaseUrl(src); // Отримуємо базовий URL без параметрів

    // Зберігаємо початкові розміри та оригінальний URL зображення, якщо ще не збережено
    const originalHeight = img.height;
    const originalWidth = img.width;
    const originalUrlKey = `original-image-${baseUrl}`;

    // Зберігаємо оригінальне посилання в localStorage та в dataset зображення
    if (!localStorage.getItem(originalUrlKey)) {
      console.log("Зберігаємо оригінальне посилання:", originalUrlKey);
      localStorage.setItem(originalUrlKey, src);
      img.dataset.originalUrl = src; // Зберігаємо оригінальний URL в dataset
    } else {
      img.dataset.originalUrl = localStorage.getItem(originalUrlKey); // Встановлюємо оригінал з localStorage
    }

    try {
      // Завантажуємо зображення через фоновий скрипт
      fetchImageBackground(src, async (res) => {
        if (res.success) {
          const imageBitmap = await createImageBitmap(res.blob);
          const resizedBlob = await resizeImage(imageBitmap);

          // Створюємо нове посилання на зменшене зображення
          const resizedUrl = URL.createObjectURL(resizedBlob);

          // Зберігаємо URL зменшеного зображення в локальному сховищі
          const pixelatedUrlKey = `pixelated-image-${baseUrl}`;
          localStorage.setItem(pixelatedUrlKey, resizedUrl);

          // Змінюємо зображення на зменшене
          img.src = resizedUrl;
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

// Функція для відновлення оригінальних зображень
function restoreOriginalImages() {
  for (let img of images) {
    const originalUrl = img.dataset.originalUrl; // Отримуємо оригінальне посилання з dataset

    if (originalUrl) {
      img.src = originalUrl; // Відновлюємо оригінальне зображення
      const baseUrl = getBaseUrl(originalUrl);
      localStorage.removeItem(`pixelated-image-${baseUrl}`); // Видаляємо збережене піксельне зображення
    }
  }
}

// Викликаємо функцію обробки зображень, якщо пікселізація увімкнена
isPixelationEnabled().then((enabled) => {
  if (enabled) processImages();
});

// Обробник повідомлень для оновлення статусу
browser.runtime.onMessage.addListener((message) => {
  if (message.action === 'updatePixelationStatus') {
    if (message.enabled) {
      processImages(); // Якщо увімкнено, запускаємо обробку
    } else {
      restoreOriginalImages(); // Якщо вимкнено, відновлюємо оригінальні зображення
    }
  }
});
