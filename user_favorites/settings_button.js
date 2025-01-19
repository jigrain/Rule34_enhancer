export class DropdownButton {
    constructor(container) {
        this.container = container;
        this.button = null;
        this.dropdown = null;
        this.isOpen = false;
    }

    create() {
        // Створюємо кнопку
        const button = document.createElement('button');
        button.id = 'dropdownButton';
        button.style.backgroundColor = '#4CAF50';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.padding = '10px';
        button.style.width = '40px'; // Встановлюємо фіксовану ширину
        button.style.height = '40px'; // Встановлюємо таку ж висоту
        button.style.cursor = 'pointer';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.position = 'relative';
        button.style.marginLeft = 'auto';

        // Додаємо іконку шестерні
        const icon = document.createElement('i');
        icon.className = 'fa fa-cog fa-lg';
        button.appendChild(icon);

        // Створюємо випадаючий список
        const dropdown = document.createElement('ul');
        dropdown.id = 'dropdownMenu';
        dropdown.style.position = 'absolute';
        dropdown.style.top = '100%';
        dropdown.style.left = '0';
        dropdown.style.listStyle = 'none';
        dropdown.style.margin = '0';
        dropdown.style.padding = '10px 0';
        dropdown.style.backgroundColor = 'white';
        dropdown.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        dropdown.style.display = 'none';
        dropdown.style.minWidth = '150px';
        dropdown.style.zIndex = '1000';

        // Фіксовані пункти меню
        const menuItems = [
            { text: 'Export favourite tags and galleries', iconClass: 'fa fa-download', action: () => this.exportFavouriteTagsAndGalleries() },
            { text: 'Import favourite tags and galleries', iconClass: 'fa fa-upload', action: () => this.importFavouriteTagsAndGalleries() },
            { text: 'Open extension settings', iconClass: 'fa fa-cogs', action: () => this.openExtensionSettings() },
        ];

        menuItems.forEach(({ text, iconClass, action }) => {
            const li = document.createElement('li');
            li.style.display = 'flex'; // Для розміщення іконки та тексту в одному рядку
            li.style.alignItems = 'center';
            li.style.padding = '10px 20px';
            li.style.cursor = 'pointer';
            li.style.color = '#333';
            li.style.transition = 'background-color 0.2s ease';
            li.style.whiteSpace = 'nowrap';
            li.style.overflow = 'hidden';
            li.style.textOverflow = 'ellipsis';
            li.style.boxSizing = 'border-box';
            li.style.marginLeft = '0.5em';
        
            // Додаємо іконку
            const icon = document.createElement('i');
            icon.className = iconClass; // Додаємо клас іконки
            icon.style.marginRight = '10px'; // Відступ між іконкою та текстом
            li.appendChild(icon);
        
            // Додаємо текст
            const textNode = document.createTextNode(text);
            li.appendChild(textNode);
        
            li.addEventListener('click', (e) => {
                e.stopPropagation();
                action();
                this.toggleDropdown(); // Закриваємо меню після вибору
            });
        
            li.addEventListener('mouseover', () => {
                li.style.backgroundColor = '#f0f0f0';
            });
        
            li.addEventListener('mouseout', () => {
                li.style.backgroundColor = 'white';
            });
        
            dropdown.appendChild(li);
        });        

        // Подія кліку на кнопку
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });

        // Закриття меню при кліку поза ним
        document.addEventListener('click', () => {
            if (this.isOpen) {
                this.toggleDropdown();
            }
        });

        this.container.style.position = 'relative'; // Позиціювання для меню
        this.container.appendChild(button);
        this.container.appendChild(dropdown);

        this.button = button;
        this.dropdown = dropdown;
    }

    toggleDropdown() {
        this.isOpen = !this.isOpen;
        this.dropdown.style.display = this.isOpen ? 'block' : 'none';
    
        // Розташовуємо меню під кнопкою
        if (this.isOpen) {
            const buttonRect = this.button.getBoundingClientRect();
            const containerRect = this.container.getBoundingClientRect();
    
            // Встановлюємо координати для меню
            const dropdownWidth = this.dropdown.offsetWidth;
            const buttonRightEdge = buttonRect.left - containerRect.left + buttonRect.width;
    
            // Зміщення для вирівнювання правого краю
            this.dropdown.style.left = `${buttonRightEdge - dropdownWidth}px`;
            this.dropdown.style.top = `${buttonRect.bottom - containerRect.top}px`;
        }
    }

    async exportFavouriteTagsAndGalleries() {
        const savedGalleryData = await this.getLocalData('savedGalleryData');
        const savedTagsData = await this.getLocalData('savedTagsData');

        const zip = new JSZip();
        zip.file('galleries.json', JSON.stringify(savedGalleryData, null, 2));
        zip.file('tags.json', JSON.stringify(savedTagsData, null, 2));

        zip.generateAsync({ type: 'blob' }).then((blob) => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'favourites.zip';
            link.click();
        });
    }

    async importFavouriteTagsAndGalleries() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.zip';
        input.style.display = 'none';
    
        input.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) {
                console.warn('No file selected.');
                return;
            }
    
            console.log('Selected file:', file);
    
            const reader = new FileReader();
    
            // Start reading the file
            reader.onload = (e) => {
                console.log('File read result (ArrayBuffer):', e.target.result);
    
                // Use JSZip to process the loaded file
                const zip = new JSZip();
    
                zip.loadAsync(e.target.result)
                    .then((zipContent) => {
                        console.log('ZIP content loaded:', zipContent);
    
                        // Check for the required files
                        if (!zipContent.file('galleries.json') || !zipContent.file('tags.json')) {
                            throw new Error('Missing required files: galleries.json or tags.json');
                        }
    
                        // Read and parse the files from ZIP
                        const galleriesPromise = zipContent.file('galleries.json').async('string');
                        const tagsPromise = zipContent.file('tags.json').async('string');
    
                        return Promise.all([galleriesPromise, tagsPromise]);
                    })
                    .then(([galleriesContent, tagsContent]) => {
                        const galleries = JSON.parse(galleriesContent);
                        const tags = JSON.parse(tagsContent);
    
                        console.log('Galleries data:', galleries);
                        console.log('Tags data:', tags);
    
                        // Save the parsed data to local storage
                        return Promise.all([
                            this.setLocalData('savedGalleryData', galleries),
                            this.setLocalData('savedTagsData', tags),
                        ]);
                    })
                    .then(() => {
                        console.log('Import complete!');

                        this.toggleDropdown();
                    })
                    .catch((error) => {
                        console.error('Error processing ZIP file:', error);
                    });
            };
    
            reader.onerror = (e) => {
                console.error('File read error:', e);
            };
    
            reader.readAsBinaryString(file); // Read file as ArrayBuffer
        });
    
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }
       

    async getLocalData(key) {
        return new Promise((resolve) => {
            chrome.storage.local.get([key], (result) => resolve(result[key] || []));
        });
    }

    async setLocalData(key, value) {
        return new Promise((resolve) => {
            const data = {};
            data[key] = value;
            chrome.storage.local.set(data, resolve);
        });
    }
    
    openExtensionSettings() {
        chrome.runtime.sendMessage({ action: 'openOptionsPage' });
    }
    
}
