/**
 * Toast UI Component
 * Displays temporary notification messages
 */

import { UI_CONFIG } from '../core/constants.js';

export class Toast {
    constructor(element) {
        this.element = element;
    }

    /**
     * Show toast message
     */
    show(message, duration = UI_CONFIG.TOAST_DURATION) {
        this.element.textContent = message;
        this.element.classList.add('show');

        setTimeout(() => {
            this.hide();
        }, duration);
    }

    /**
     * Hide toast
     */
    hide() {
        this.element.classList.remove('show');
    }
}
