/**
 * Application Constants
 * Central location for all constant values used throughout the application
 */

export const APP_CONFIG = {
    NAME: 'Image Converter',
    VERSION: '4.0.0',
    CACHE_NAME: 'image-converter-v4'
};

export const IMAGE_FORMATS = {
    JPEG: 'image/jpeg',
    PNG: 'image/png',
    WEBP: 'image/webp',
    GIF: 'image/gif',
    BMP: 'image/bmp',
    TIFF: 'image/tiff',
    SVG: 'image/svg+xml',
    ICO: 'image/x-icon',
    HEIC: 'image/heic',
    HEIF: 'image/heif'
};

export const FORMAT_LABELS = {
    [IMAGE_FORMATS.JPEG]: 'JPG',
    [IMAGE_FORMATS.PNG]: 'PNG',
    [IMAGE_FORMATS.WEBP]: 'WEBP',
    [IMAGE_FORMATS.GIF]: 'GIF',
    [IMAGE_FORMATS.BMP]: 'BMP',
    [IMAGE_FORMATS.TIFF]: 'TIFF',
    [IMAGE_FORMATS.SVG]: 'SVG',
    [IMAGE_FORMATS.ICO]: 'ICO',
    [IMAGE_FORMATS.HEIC]: 'HEIC',
    [IMAGE_FORMATS.HEIF]: 'HEIF'
};

export const FORMAT_EXTENSIONS = {
    [IMAGE_FORMATS.JPEG]: 'jpg',
    [IMAGE_FORMATS.PNG]: 'png',
    [IMAGE_FORMATS.WEBP]: 'webp',
    [IMAGE_FORMATS.GIF]: 'gif',
    [IMAGE_FORMATS.BMP]: 'bmp',
    [IMAGE_FORMATS.TIFF]: 'tiff',
    [IMAGE_FORMATS.SVG]: 'svg',
    [IMAGE_FORMATS.ICO]: 'ico'
};

export const LOSSY_FORMATS = [
    IMAGE_FORMATS.JPEG,
    IMAGE_FORMATS.WEBP
];

export const FILE_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    DONE: 'done',
    ERROR: 'error'
};

export const CROP_RATIOS = {
    FREE: 'free',
    SQUARE: '1:1',
    LANDSCAPE_4_3: '4:3',
    LANDSCAPE_16_9: '16:9',
    PORTRAIT_3_2: '3:2',
    PORTRAIT_2_3: '2:3'
};

export const CROP_RATIO_VALUES = {
    [CROP_RATIOS.SQUARE]: 1,
    [CROP_RATIOS.LANDSCAPE_4_3]: 4/3,
    [CROP_RATIOS.LANDSCAPE_16_9]: 16/9,
    [CROP_RATIOS.PORTRAIT_3_2]: 3/2,
    [CROP_RATIOS.PORTRAIT_2_3]: 2/3
};

export const DEFAULT_SETTINGS = {
    format: 'same',
    quality: 0.9,
    resize: false,
    width: '',
    height: '',
    aspectLock: false
};

export const UI_CONFIG = {
    TOAST_DURATION: 3000,
    THUMBNAIL_SIZE: 48,
    MIN_CROP_SIZE: 50,
    INITIAL_CROP_PERCENTAGE: 0.8
};

export const STORAGE_KEYS = {
    SETTINGS: 'imageConverterSettings'
};
