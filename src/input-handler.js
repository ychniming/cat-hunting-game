class InputHandler {
    constructor(canvas, onInput) {
        this.canvas = canvas;
        this.onInput = onInput;

        this._getCanvasCoords = (clientX, clientY) => {
            const rect = this.canvas.getBoundingClientRect();
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        };

        this._mouseHandler = (e) => {
            const coords = this._getCanvasCoords(e.clientX, e.clientY);
            this.onInput(coords.x, coords.y);
        };

        this._touchHandler = (e) => {
            e.preventDefault();
            for (let i = 0; i < e.touches.length; i++) {
                const coords = this._getCanvasCoords(e.touches[i].clientX, e.touches[i].clientY);
                this.onInput(coords.x, coords.y);
            }
        };

        this.canvas.addEventListener('mousedown', this._mouseHandler);
        this.canvas.addEventListener('touchstart', this._touchHandler);
    }

    destroy() {
        this.canvas.removeEventListener('mousedown', this._mouseHandler);
        this.canvas.removeEventListener('touchstart', this._touchHandler);
    }
}

export { InputHandler };
