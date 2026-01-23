/**
 * Image Conversion Service
 * Handles all image conversion, transformation, and export logic
 */

import { IMAGE_FORMATS, FORMAT_EXTENSIONS } from '../core/constants.js';
import { FileService } from './FileService.js';

export class ConversionService {
    /**
     * Convert a single image file
     */
    static async convertImage(file, settings, editState) {
        try {
            let blob = file;

            // Convert HEIC first if needed
            if (FileService.isHEIC(file) && typeof heic2any !== 'undefined') {
                blob = await heic2any({
                    blob: file,
                    toType: IMAGE_FORMATS.JPEG,
                    quality: 0.9
                });
            }

            const dataUrl = await FileService.readFileAsDataURL(blob);
            return await this.processImage(dataUrl, file, settings, editState);
        } catch (error) {
            console.error('Image conversion error:', error);
            throw error;
        }
    }

    /**
     * Process image with transformations and format conversion
     */
    static async processImage(dataUrl, originalFile, settings, editState) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                let targetFormat = settings.format;

                // Handle "same as original" format
                if (targetFormat === 'same' && originalFile) {
                    targetFormat = originalFile.type || IMAGE_FORMATS.JPEG;
                }

                // Handle special formats
                if (targetFormat === IMAGE_FORMATS.SVG) {
                    resolve(this.createSVGWrapper(img, dataUrl, settings));
                    return;
                }

                if (targetFormat === IMAGE_FORMATS.ICO) {
                    resolve(this.createICO(img));
                    return;
                }

                // Standard canvas conversion
                resolve(this.convertToCanvas(img, targetFormat, settings, editState));
            };

            img.onerror = reject;
            img.src = dataUrl;
        });
    }

    /**
     * Convert image to canvas with all transformations
     */
    static convertToCanvas(img, targetFormat, settings, editState) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const { rotation, flipHorizontal, flipVertical, cropSettings } = editState;

        // Calculate dimensions
        let targetWidth = img.width;
        let targetHeight = img.height;

        // Apply rotation to dimensions
        if (rotation === 90 || rotation === 270) {
            [targetWidth, targetHeight] = [targetHeight, targetWidth];
        }

        // Handle cropping
        let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height;
        if (cropSettings) {
            sourceX = cropSettings.x;
            sourceY = cropSettings.y;
            sourceWidth = cropSettings.width;
            sourceHeight = cropSettings.height;
            targetWidth = sourceWidth;
            targetHeight = sourceHeight;

            if (rotation === 90 || rotation === 270) {
                [targetWidth, targetHeight] = [targetHeight, targetWidth];
            }
        }

        // Handle resizing
        if (settings.resize) {
            const dimensions = this.calculateResizeDimensions(
                targetWidth, 
                targetHeight, 
                settings.width, 
                settings.height
            );
            targetWidth = dimensions.width;
            targetHeight = dimensions.height;
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Fill white background for formats that don't support transparency
        if (targetFormat === IMAGE_FORMATS.JPEG || targetFormat === IMAGE_FORMATS.BMP) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Apply transformations
        this.applyTransformations(ctx, img, targetWidth, targetHeight, rotation, 
                                   flipHorizontal, flipVertical, sourceX, sourceY, 
                                   sourceWidth, sourceHeight);

        return canvas.toDataURL(targetFormat, settings.quality);
    }

    /**
     * Apply transformations to canvas context
     */
    static applyTransformations(ctx, img, width, height, rotation, flipH, flipV, 
                                 sourceX, sourceY, sourceWidth, sourceHeight) {
        ctx.save();

        const centerX = width / 2;
        const centerY = height / 2;

        ctx.translate(centerX, centerY);

        // Apply rotation
        if (rotation !== 0) {
            ctx.rotate((rotation * Math.PI) / 180);
        }

        // Apply flips
        const scaleX = flipH ? -1 : 1;
        const scaleY = flipV ? -1 : 1;
        ctx.scale(scaleX, scaleY);

        // Draw image
        const drawWidth = rotation === 90 || rotation === 270 ? height : width;
        const drawHeight = rotation === 90 || rotation === 270 ? width : height;

        ctx.drawImage(
            img,
            sourceX, sourceY, sourceWidth, sourceHeight,
            -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight
        );

        ctx.restore();
    }

    /**
     * Calculate resize dimensions maintaining aspect ratio if needed
     */
    static calculateResizeDimensions(currentWidth, currentHeight, targetWidth, targetHeight) {
        const wInput = parseInt(targetWidth);
        const hInput = parseInt(targetHeight);

        if (wInput && hInput) {
            return { width: wInput, height: hInput };
        } else if (wInput) {
            const ratio = currentHeight / currentWidth;
            return { width: wInput, height: Math.round(wInput * ratio) };
        } else if (hInput) {
            const ratio = currentWidth / currentHeight;
            return { width: Math.round(hInput * ratio), height: hInput };
        }

        return { width: currentWidth, height: currentHeight };
    }

    /**
     * Create SVG wrapper for raster image
     */
    static createSVGWrapper(img, dataUrl, settings) {
        const width = settings.resize && settings.width ? settings.width : img.width;
        const height = settings.resize && settings.height ? settings.height : img.height;

        const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <image width="${width}" height="${height}" xlink:href="${dataUrl}"/>
</svg>`;

        return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgContent)));
    }

    /**
     * Create ICO format (32x32 PNG)
     */
    static createICO(img) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 32, 32);
        ctx.drawImage(img, 0, 0, 32, 32);

        return canvas.toDataURL(IMAGE_FORMATS.PNG);
    }

    /**
     * Get file extension for format
     */
    static getExtension(mimeType) {
        return FORMAT_EXTENSIONS[mimeType] || 'jpg';
    }

    /**
     * Generate filename for converted image
     */
    static generateFilename(originalName, targetFormat) {
        const baseName = FileService.getFilenameWithoutExtension(originalName);
        const extension = this.getExtension(targetFormat);
        return `${baseName}_converted.${extension}`;
    }

    /**
     * Estimate output file size
     */
    static estimateOutputSize(file, settings) {
        const format = settings.format;
        const quality = settings.quality;
        let estimate = file.size;

        if (format === IMAGE_FORMATS.JPEG) {
            estimate = file.size * quality * 0.6;
        } else if (format === IMAGE_FORMATS.WEBP) {
            estimate = file.size * quality * 0.5;
        } else if (format === IMAGE_FORMATS.PNG) {
            estimate = file.size * 1.2;
        } else if (format === IMAGE_FORMATS.BMP) {
            estimate = file.size * 3;
        } else if (format === IMAGE_FORMATS.GIF) {
            estimate = file.size * 0.9;
        } else if (format === IMAGE_FORMATS.TIFF) {
            estimate = file.size * 2;
        } else if (format === IMAGE_FORMATS.SVG) {
            estimate = file.size * 0.3;
        } else if (format === IMAGE_FORMATS.ICO) {
            estimate = 5000;
        }

        // Adjust for resize
        if (settings.resize && (settings.width || settings.height)) {
            estimate *= 0.7;
        }

        return estimate;
    }
}
