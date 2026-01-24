/**
 * File Service
 * Handles file operations, validation, and metadata extraction
 */

import { IMAGE_FORMATS, FORMAT_LABELS, FILE_STATUS, UI_CONFIG } from '../core/constants.js';

export class FileService {
    /**
     * Validate if file is a supported image
     */
    static isValidImage(file) {
        // Warn for very large files (may cause performance issues)
        if (file.size > 50 * 1024 * 1024) { // 50MB
            console.warn(`File ${file.name} exceeds 50MB (${(file.size / 1024 / 1024).toFixed(1)}MB), may cause performance issues`);
        }
        return file.type.startsWith('image/') || 
               file.name.toLowerCase().match(/\.(heic|heif)$/);
    }

    /**
     * Check if file is HEIC format
     */
    static isHEIC(file) {
        return file.type === IMAGE_FORMATS.HEIC || 
               file.type === IMAGE_FORMATS.HEIF || 
               file.name.toLowerCase().endsWith('.heic') || 
               file.name.toLowerCase().endsWith('.heif');
    }

    /**
     * Get format label from MIME type
     */
    static getFormatLabel(mimeType) {
        return FORMAT_LABELS[mimeType] || 'IMG';
    }

    /**
     * Create file item object
     */
    static createFileItem(file) {
        return {
            file: file,
            id: this.generateId(),
            status: FILE_STATUS.PENDING,
            thumbnail: null,
            thumbnailLoading: false,
            format: this.getFormatLabel(file.type),
            progress: 0,
            error: null,
            estimatedSize: null,
            isHEIC: this.isHEIC(file)
        };
    }

    /**
     * Generate unique ID
     */
    static generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    /**
     * Generate thumbnail for file
     */
    static async generateThumbnail(file, item) {
        item.thumbnailLoading = true;

        try {
            let blob = file;

            // Convert HEIC first if needed
            if (item.isHEIC && typeof heic2any !== 'undefined') {
                blob = await heic2any({
                    blob: file,
                    toType: IMAGE_FORMATS.JPEG,
                    quality: 0.5
                });
            }

            const dataUrl = await this.readFileAsDataURL(blob);
            const thumbnail = await this.createThumbnailFromDataURL(dataUrl);
            
            item.thumbnail = thumbnail;
            item.thumbnailLoading = false;
            
            return thumbnail;
        } catch (error) {
            console.error('Thumbnail generation error:', error);
            item.thumbnailLoading = false;
            item.thumbnail = null;
            return null;
        }
    }

    /**
     * Read file as Data URL
     */
    static readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Create thumbnail from data URL
     */
    static createThumbnailFromDataURL(dataUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const size = UI_CONFIG.THUMBNAIL_SIZE;
                
                canvas.width = size;
                canvas.height = size;

                const scale = Math.max(size / img.width, size / img.height);
                const x = (size - img.width * scale) / 2;
                const y = (size - img.height * scale) / 2;

                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
                resolve(canvas.toDataURL());
            };
            img.onerror = reject;
            img.src = dataUrl;
        });
    }

    /**
     * Format file size in bytes to human readable
     */
    static formatFileSize(bytes) {
        const mb = bytes / 1024 / 1024;
        return mb.toFixed(2) + ' MB';
    }

    /**
     * Get actual file size from data URL
     */
    static getDataURLSize(dataUrl) {
        // Remove data URL prefix to get base64 data
        const base64 = dataUrl.split(',')[1];
        if (!base64) return 0;
        
        // Calculate size: base64 is ~4/3 of original binary size
        // Account for padding characters
        const padding = (base64.match(/=/g) || []).length;
        return Math.round((base64.length * 3) / 4 - padding);
    }

    /**
     * Get sanitized filename without extension
     */
    static getFilenameWithoutExtension(filename) {
        return filename.replace(/\.[^/.]+$/, "");
    }
}
