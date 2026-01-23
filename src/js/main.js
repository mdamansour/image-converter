/**
 * Application Main Entry Point
 * Initializes and starts the application
 */

import { AppController } from './controllers/AppController.js';

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Create app instance
    const app = new AppController();
    
    // Register service worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        });
    }
    
    // Make app globally available for debugging (optional, only in dev)
    window.app = app;
});
