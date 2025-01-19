export class ProgressBar {
    constructor(container, width = '50%') { // Додано параметр width із значенням за замовчуванням
        this.container = container;
        this.width = width; // Зберігаємо ширину контейнера
        this.progressWrapper = null;
        this.progressBar = null;
        this.progressText = null;

        // Для розрахунку часу
        this.startTime = null;
        this.totalItems = 0;
    }

    create() {
        const wrapper = document.createElement('div');
        wrapper.id = 'progressWrapper';
        wrapper.style.position = 'relative';
        wrapper.style.marginTop = '10px';
        wrapper.style.marginBottom = '30px';
        wrapper.style.width = this.width; // Використовуємо задану ширину
        
        const progressBar = document.createElement('div');
        progressBar.id = 'progressBar';
        progressBar.style.position = 'absolute';
        progressBar.style.bottom = '0';
        progressBar.style.left = '0';
        progressBar.style.height = '10px';
        progressBar.style.width = '0%';
        progressBar.style.backgroundColor = '#4CAF50';
        progressBar.style.borderRadius = '5px';
        progressBar.style.transition = 'width 0.3s ease';

        const progressText = document.createElement('div');
        progressText.id = 'progressText';
        progressText.style.position = 'absolute';
        progressText.style.bottom = '-20px';
        progressText.style.left = '0';
        progressText.style.fontSize = '12px';
        progressText.style.color = '#333';
        progressText.style.fontWeight = 'bold';

        wrapper.appendChild(progressBar);
        wrapper.appendChild(progressText);
        this.container.appendChild(wrapper);

        this.progressWrapper = wrapper;
        this.progressBar = progressBar;
        this.progressText = progressText;
    }

    show() {
        this.progressWrapper.style.display = 'block';
    }

    hide() {
        this.progressWrapper.style.display = 'none';
        this.update(0, '');
    }

    update(progress, text = '') {
        this.progressBar.style.width = `${progress}%`;
        if (this.startTime && this.totalItems > 0) {
            const elapsedTime = Date.now() - this.startTime;
            const estimatedTotalTime = (elapsedTime / (progress / 100)) || 0;
            const remainingTime = estimatedTotalTime - elapsedTime;
            text += ` Залишилося: ~${(remainingTime / 1000).toFixed(1)} с.`;
        }
        this.progressText.textContent = text;
    }

    startTimer(totalItems) {
        this.startTime = Date.now();
        this.totalItems = totalItems;
    }
}
