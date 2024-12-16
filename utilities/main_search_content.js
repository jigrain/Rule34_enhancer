const contentSidebar = document.querySelector(".sidebarRight");
const contentDiv = document.querySelector('.content');
if (contentSidebar) {
    contentSidebar.remove();
}
if (contentDiv) {
    const spanElements = contentDiv.querySelectorAll('span');

    // Знайти перший span, який не має класу і ID
    for (const span of spanElements) {
        if (!span.className && !span.id) {
            // Видалити span, якщо він не має класу і ID
            span.remove();
            break; // Зупинити цикл після видалення
        }
    }
}
