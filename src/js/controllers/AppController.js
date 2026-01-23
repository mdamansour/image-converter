/**
 * Application Controller
 * Main controller orchestrating all app functionality
 */

import { appState } from '../core/state.js';
import { appConfig } from '../core/config.js';
import { LOSSY_FORMATS, FILE_STATUS, IMAGE_FORMATS } from '../core/constants.js';
import { FileService } from '../services/FileService.js';
import { ConversionService } from '../services/ConversionService.js';
import { StorageService } from '../services/StorageService.js';
import { DownloadService } from '../services/DownloadService.js';
import { Toast } from '../ui/Toast.js';
import { FileQueueUI } from '../ui/FileQueueUI.js';

export class AppController {
    constructor() {
        this.dom = {};
        this.ui = {};
        
        this.initializeDOM();
        this.initializeUI();
        this.loadSettings();
        this.setupEventListeners();
        this.setupStateObservers();
    }

    /**
     * Initialize DOM element references
     */
    initializeDOM() {
        this.dom = {
            dropZone: document.getElementById('dropZone'),
            fileInput: document.getElementById('fileInput'),
            workspace: document.getElementById('workspace'),
            fileList: document.getElementById('fileList'),
            queueCount: document.getElementById('queueCount'),
            
            formatSelect: document.getElementById('formatSelect'),
            qualityGroup: document.getElementById('qualityGroup'),
            qualityRange: document.getElementById('qualityRange'),
            qualityValue: document.getElementById('qualityValue'),
            
            resizeCheck: document.getElementById('resizeCheck'),
            resizeControls: document.getElementById('resizeControls'),
            widthInput: document.getElementById('widthInput'),
            heightInput: document.getElementById('heightInput'),
            aspectLockBtn: document.getElementById('aspectLockBtn'),
            
            convertBtn: document.getElementById('convertBtn'),
            addMoreBtn: document.getElementById('addMoreBtn'),
            clearQueueBtn: document.getElementById('clearQueueBtn'),
            
            toast: document.getElementById('toast')
        };
    }

    /**
     * Initialize UI components
     */
    initializeUI() {
        this.ui.toast = new Toast(this.dom.toast);
        this.ui.fileQueue = new FileQueueUI(this.dom.fileList, this.dom.queueCount);
        
        // Setup component callbacks
        this.ui.fileQueue.onRemove = (id) => this.removeFile(id);
        this.ui.fileQueue.onRetry = (id) => this.retryFile(id);
        this.ui.fileQueue.onDragStart = (e) => this.handleDragStart(e);
        this.ui.fileQueue.onDrop = (e) => this.handleDrop(e);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // File upload
        this.dom.dropZone.addEventListener('click', () => this.dom.fileInput.click());
        this.dom.addMoreBtn.addEventListener('click', () => this.dom.fileInput.click());
        this.dom.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop
        this.dom.dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.dom.dropZone.addEventListener('dragleave', () => this.handleDragLeave());
        this.dom.dropZone.addEventListener('drop', (e) => this.handleFileDrop(e));
        
        // Settings
        this.dom.formatSelect.addEventListener('change', () => this.handleFormatChange());
        this.dom.qualityRange.addEventListener('input', () => this.handleQualityChange());
        this.dom.resizeCheck.addEventListener('change', () => this.handleResizeToggle());
        this.dom.widthInput.addEventListener('change', () => this.saveSettings());
        this.dom.heightInput.addEventListener('change', () => this.saveSettings());
        this.dom.widthInput.addEventListener('input', () => this.handleWidthInput());
        this.dom.heightInput.addEventListener('input', () => this.handleHeightInput());
        
        if (this.dom.aspectLockBtn) {
            this.dom.aspectLockBtn.addEventListener('click', () => this.toggleAspectLock());
        }
        
        // Buttons
        this.dom.convertBtn.addEventListener('click', () => this.processBatch());
        this.dom.clearQueueBtn.addEventListener('click', () => this.clearQueue());
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Enter to convert
            if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && 
                appState.getFileQueue().length > 0 && !this.dom.convertBtn.disabled) {
                if (document.activeElement.tagName !== 'INPUT') {
                    e.preventDefault();
                    this.processBatch();
                }
            }
            
            // Escape to clear
            if (e.key === 'Escape' && appState.getFileQueue().length > 0) {
                this.clearQueue();
            }
            
            // Space/Enter on drop zone
            if ((e.key === ' ' || e.key === 'Enter') && document.activeElement === this.dom.dropZone) {
                e.preventDefault();
                this.dom.fileInput.click();
            }
        });
        
        // Make drop zone focusable
        this.dom.dropZone.setAttribute('tabindex', '0');
    }

    /**
     * Setup state observers
     */
    setupStateObservers() {
        appState.subscribe((changeType, data) => {
            switch (changeType) {
                case 'FILES_ADDED':
                case 'FILE_REMOVED':
                case 'FILE_UPDATED':
                case 'QUEUE_CLEARED':
                case 'FILES_REORDERED':
                    this.updateQueueUI();
                    break;
            }
        });
    }

    /**
     * Handle file selection
     */
    handleFileSelect(e) {
        if (e.target.files.length) {
            this.addFiles(e.target.files);
        }
    }

    /**
     * Handle file drop
     */
    handleFileDrop(e) {
        e.preventDefault();
        this.dom.dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) {
            this.addFiles(e.dataTransfer.files);
        }
    }

    /**
     * Handle drag over
     */
    handleDragOver(e) {
        e.preventDefault();
        this.dom.dropZone.classList.add('drag-over');
    }

    /**
     * Handle drag leave
     */
    handleDragLeave() {
        this.dom.dropZone.classList.remove('drag-over');
    }

    /**
     * Add files to queue
     */
    async addFiles(files) {
        const validFiles = Array.from(files).filter(f => FileService.isValidImage(f));
        
        if (validFiles.length === 0) {
            this.ui.toast.show('⚠️ No valid images found');
            return;
        }

        const fileItems = validFiles.map(f => FileService.createFileItem(f));
        
        // Generate thumbnails asynchronously
        fileItems.forEach(item => {
            FileService.generateThumbnail(item.file, item).then(() => {
                appState.updateFile(item.id, { 
                    thumbnail: item.thumbnail,
                    thumbnailLoading: item.thumbnailLoading 
                });
            });
            
            // Estimate size
            const settings = appConfig.getAllSettings();
            item.estimatedSize = ConversionService.estimateOutputSize(item.file, settings);
        });

        appState.addFiles(fileItems);
        
        this.dom.dropZone.style.display = 'none';
        this.dom.workspace.classList.remove('hidden');
        this.updateConvertButton();
        this.ui.toast.show(`Added ${validFiles.length} images to queue`);
        
        // Reset input
        this.dom.fileInput.value = '';
    }

    /**
     * Remove file from queue
     */
    removeFile(id) {
        appState.removeFile(id);
        this.updateConvertButton();
        this.ui.toast.show('File removed from queue');
    }

    /**
     * Retry failed file
     */
    retryFile(id) {
        appState.updateFile(id, {
            status: FILE_STATUS.PENDING,
            error: null,
            progress: 0
        });
        this.ui.toast.show('File reset - click Convert to retry');
    }

    /**
     * Clear queue
     */
    clearQueue() {
        const count = appState.getFileQueue().length;
        if (count > 0 && confirm(`Remove all ${count} files from queue?`)) {
            appState.clearQueue();
            this.resetApp();
            this.ui.toast.show('Queue cleared');
        }
    }

    /**
     * Update queue UI
     */
    updateQueueUI() {
        const queue = appState.getFileQueue();
        this.ui.fileQueue.render(queue);
        
        if (queue.length === 0) {
            this.resetApp();
        }
    }

    /**
     * Update convert button text
     */
    updateConvertButton() {
        const count = appState.getFileQueue().length;
        if (count === 1) {
            this.dom.convertBtn.innerHTML = '<span>Convert & Download</span>';
        } else {
            this.dom.convertBtn.innerHTML = '<span>Convert All & Download ZIP</span>';
        }
    }

    /**
     * Reset app to initial state
     */
    resetApp() {
        this.dom.dropZone.style.display = 'block';
        this.dom.workspace.classList.add('hidden');
    }

    /**
     * Process batch conversion
     */
    async processBatch() {
        const fileQueue = appState.getFileQueue();
        if (fileQueue.length === 0) return;

        const isSingleFile = fileQueue.length === 1;
        const settings = appConfig.getAllSettings();
        // No editing features - use default empty edit state
        const editState = {
            rotation: 0,
            flipHorizontal: false,
            flipVertical: false,
            cropSettings: null
        };
        
        this.dom.convertBtn.disabled = true;
        
        const results = [];
        let processedCount = 0;

        for (let i = 0; i < fileQueue.length; i++) {
            const item = fileQueue[i];
            
            if (item.status === FILE_STATUS.DONE || item.status === FILE_STATUS.ERROR) {
                if (item.status === FILE_STATUS.DONE) processedCount++;
                continue;
            }

            appState.updateFile(item.id, { 
                status: FILE_STATUS.PROCESSING, 
                progress: 30 
            });

            this.dom.convertBtn.textContent = `Processing ${processedCount + 1}/${fileQueue.length}...`;

            try {
                const convertedData = await ConversionService.convertImage(
                    item.file, 
                    settings, 
                    editState
                );

                appState.updateFile(item.id, { progress: 70 });

                const filename = ConversionService.generateFilename(
                    item.file.name, 
                    settings.format === 'same' ? item.file.type : settings.format
                );

                results.push({ data: convertedData, filename });

                appState.updateFile(item.id, { 
                    status: FILE_STATUS.DONE, 
                    progress: 100 
                });
                processedCount++;

            } catch (error) {
                console.error(`Error processing ${item.file.name}:`, error);
                appState.updateFile(item.id, { 
                    status: FILE_STATUS.ERROR, 
                    error: 'Failed',
                    progress: 0 
                });
            }
        }

        // Download results
        try {
            await DownloadService.downloadResults(results, isSingleFile);
            this.ui.toast.show('✅ Download Started!');
        } catch (error) {
            console.error(error);
            this.ui.toast.show('❌ Error during download');
        }

        this.dom.convertBtn.textContent = isSingleFile ? 
            'Convert & Download' : 'Convert All & Download ZIP';
        this.dom.convertBtn.disabled = false;
    }

    /**
     * Format change handler
     */
    handleFormatChange() {
        const format = this.dom.formatSelect.value;
        const lossy = LOSSY_FORMATS.includes(format);

        if (format === 'same' || lossy) {
            this.dom.qualityGroup.style.opacity = '1';
            this.dom.qualityRange.disabled = false;
        } else {
            this.dom.qualityGroup.style.opacity = '0.5';
            this.dom.qualityRange.disabled = true;
        }

        appConfig.updateSetting('format', format);
        this.saveSettings();
        this.updateEstimates();
    }

    /**
     * Quality change handler
     */
    handleQualityChange() {
        const quality = parseFloat(this.dom.qualityRange.value);
        this.dom.qualityValue.textContent = Math.round(quality * 100) + '%';
        appConfig.updateSetting('quality', quality);
        this.saveSettings();
        this.updateEstimates();
    }

    /**
     * Resize toggle handler
     */
    handleResizeToggle() {
        const checked = this.dom.resizeCheck.checked;
        if (checked) {
            this.dom.resizeControls.classList.remove('disabled');
        } else {
            this.dom.resizeControls.classList.add('disabled');
        }
        appConfig.updateSetting('resize', checked);
        this.saveSettings();
        this.updateEstimates();
    }

    /**
     * Width input handler
     */
    handleWidthInput() {
        const state = appState.getAspectRatioState();
        if (state.locked && state.ratio && this.dom.widthInput.value) {
            const w = parseInt(this.dom.widthInput.value);
            this.dom.heightInput.value = Math.round(w / state.ratio);
        }
        this.updateEstimates();
    }

    /**
     * Height input handler
     */
    handleHeightInput() {
        const state = appState.getAspectRatioState();
        if (state.locked && state.ratio && this.dom.heightInput.value) {
            const h = parseInt(this.dom.heightInput.value);
            this.dom.widthInput.value = Math.round(h * state.ratio);
        }
        this.updateEstimates();
    }

    /**
     * Toggle aspect ratio lock
     */
    async toggleAspectLock() {
        const state = appState.getAspectRatioState();
        const newLocked = !state.locked;
        
        let ratio = null;
        if (newLocked && appState.getFileQueue().length > 0) {
            const firstFile = appState.getFileQueue()[0].file;
            ratio = await this.calculateAspectRatio(firstFile);
        }

        appState.setAspectRatioLock(newLocked, ratio);
        this.dom.aspectLockBtn.classList.toggle('locked');
        this.saveSettings();
    }

    /**
     * Calculate aspect ratio from file
     */
    async calculateAspectRatio(file) {
        return new Promise((resolve) => {
            const img = new Image();
            const reader = new FileReader();
            reader.onload = (e) => {
                img.onload = () => resolve(img.width / img.height);
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    /**
     * Update size estimates
     */
    updateEstimates() {
        const settings = appConfig.getAllSettings();
        appConfig.updateSettings({
            width: this.dom.widthInput.value,
            height: this.dom.heightInput.value
        });
        
        appState.getFileQueue().forEach(item => {
            const estimatedSize = ConversionService.estimateOutputSize(item.file, settings);
            appState.updateFile(item.id, { estimatedSize });
        });
    }

    /**
     * Handle drag start for reordering
     */
    handleDragStart(e) {
        appState.setDraggedItemId(e.currentTarget.dataset.id);
        e.currentTarget.style.opacity = '0.5';
        e.dataTransfer.effectAllowed = 'move';
    }

    /**
     * Handle drop for reordering
     */
    handleDrop(e) {
        e.stopPropagation();
        
        const draggedId = appState.getDraggedItemId();
        const targetId = e.currentTarget.dataset.id;
        
        if (draggedId === targetId) return;

        const queue = appState.getFileQueue();
        const draggedIndex = queue.findIndex(f => f.id === draggedId);
        const targetIndex = queue.findIndex(f => f.id === targetId);

        if (draggedIndex !== -1 && targetIndex !== -1) {
            const rect = e.currentTarget.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            let insertIndex = targetIndex;

            if (e.clientY > midpoint) {
                insertIndex++;
            }

            if (draggedIndex < targetIndex) {
                insertIndex--;
            }

            appState.reorderFiles(draggedIndex, insertIndex);
            this.ui.toast.show('↕️ File reordered');
        }
    }

    /**
     * Save settings to storage
     */
    saveSettings() {
        const settings = {
            ...appConfig.getAllSettings(),
            width: this.dom.widthInput.value,
            height: this.dom.heightInput.value,
            aspectLock: appState.getAspectRatioState().locked
        };
        StorageService.saveSettings(settings);
    }

    /**
     * Load settings from storage
     */
    loadSettings() {
        const saved = StorageService.loadSettings();
        if (saved) {
            appConfig.updateSettings(saved);
            
            this.dom.formatSelect.value = saved.format || IMAGE_FORMATS.JPEG;
            this.dom.qualityRange.value = saved.quality || 0.9;
            this.dom.qualityValue.textContent = Math.round(this.dom.qualityRange.value * 100) + '%';
            this.dom.resizeCheck.checked = saved.resize || false;
            this.dom.widthInput.value = saved.width || '';
            this.dom.heightInput.value = saved.height || '';

            if (saved.resize) {
                this.dom.resizeControls.classList.remove('disabled');
            }

            if (saved.aspectLock && this.dom.aspectLockBtn) {
                this.dom.aspectLockBtn.classList.add('locked');
                appState.setAspectRatioLock(true);
            }

            this.dom.formatSelect.dispatchEvent(new Event('change'));
        }
    }
}
