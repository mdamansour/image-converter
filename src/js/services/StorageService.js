/**
 * Storage Service
 * Handles local storage operations for settings persistence
 */

import { STORAGE_KEYS } from '../core/constants.js';

export class StorageService {
    /**
     * Save settings to localStorage
     */
    static saveSettings(settings) {
        try {
            const data = JSON.stringify(settings);
            localStorage.setItem(STORAGE_KEYS.SETTINGS, data);
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    }

    /**
     * Load settings from localStorage
     */
    static loadSettings() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to load settings:', error);
            return null;
        }
    }

    /**
     * Clear settings from localStorage
     */
    static clearSettings() {
        try {
            localStorage.removeItem(STORAGE_KEYS.SETTINGS);
            return true;
        } catch (error) {
            console.error('Failed to clear settings:', error);
            return false;
        }
    }

    /**
     * Check if localStorage is available
     */
    static isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }
}
