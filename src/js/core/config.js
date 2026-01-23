/**
 * Application Configuration
 * Runtime configuration and settings management
 */

import { DEFAULT_SETTINGS } from './constants.js';

export class AppConfig {
    constructor() {
        this.settings = { ...DEFAULT_SETTINGS };
    }

    /**
     * Update a specific setting
     */
    updateSetting(key, value) {
        if (key in this.settings) {
            this.settings[key] = value;
        }
    }

    /**
     * Update multiple settings at once
     */
    updateSettings(updates) {
        Object.assign(this.settings, updates);
    }

    /**
     * Get a specific setting
     */
    getSetting(key) {
        return this.settings[key];
    }

    /**
     * Get all settings
     */
    getAllSettings() {
        return { ...this.settings };
    }

    /**
     * Reset to defaults
     */
    resetToDefaults() {
        this.settings = { ...DEFAULT_SETTINGS };
    }

    /**
     * Validate settings
     */
    isValid() {
        return this.settings.quality >= 0.1 && this.settings.quality <= 1.0;
    }
}

// Singleton instance
export const appConfig = new AppConfig();
