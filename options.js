// options.js
document.addEventListener('DOMContentLoaded', async () => {
    const favoritesTableBody = document.querySelector('#favoritesTable tbody');

    // Завантажуємо favoritesData з локального сховища
    const { favoritesData } = await browser.storage.local.get('favoritesData');

    // Перевіряємо, чи є дані
    if (!favoritesData || favoritesData.length === 0) {
        favoritesTableBody.innerHTML = '<tr><td colspan="3">No favorites found.</td></tr>';
        return;
    }

    // Додаємо дані до таблиці
    favoritesData.forEach(item => {
        const row = document.createElement('tr');
        
        // ID поста
        const idCell = document.createElement('td');
        idCell.textContent = item.id;
        row.appendChild(idCell);

        // Зображення прев'ю
        const previewCell = document.createElement('td');
        const img = document.createElement('img');
        img.src = item.preview_url;
        img.alt = 'Preview';
        img.width = 100;
        previewCell.appendChild(img);
        row.appendChild(previewCell);

        // Теги
        const tagsCell = document.createElement('td');
        tagsCell.textContent = item.tags;
        row.appendChild(tagsCell);

        favoritesTableBody.appendChild(row);
    });
});
