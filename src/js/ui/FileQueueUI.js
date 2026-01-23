/**
 * File Queue UI Component
 * Manages the display and interaction of the file queue
 */

import { FILE_STATUS } from '../core/constants.js';
import { FileService } from '../services/FileService.js';

export class FileQueueUI {
    constructor(container, countElement) {
        this.container = container;
        this.countElement = countElement;
        this.onRemove = null;
        this.onRetry = null;
        this.onDragStart = null;
        this.onDrop = null;
    }

    /**
     * Render the file queue
     */
    render(fileQueue) {
        this.countElement.textContent = fileQueue.length;
        this.container.innerHTML = '';

        fileQueue.forEach(item => {
            const element = this.createFileItem(item);
            this.container.appendChild(element);
        });

        this.attachEventListeners();
    }

    /**
     * Create a single file item element
     */
    createFileItem(item) {
        const div = document.createElement('div');
        div.className = 'file-item';
        div.dataset.id = item.id;

        const thumbnailHTML = this.getThumbnailHTML(item);
        const statusHTML = this.getStatusHTML(item);
        const sizeEstimate = this.getSizeEstimateHTML(item);

        div.innerHTML = `
            ${thumbnailHTML}
            <div class="file-info">
                <div class="file-name">${item.file.name}</div>
                <div class="file-meta">
                    <span class="format-badge">${item.format}</span>
                    ${FileService.formatFileSize(item.file.size)}
                    ${sizeEstimate}
                </div>
            </div>
            ${statusHTML}
            <button class="remove-btn" data-id="${item.id}" title="Remove file">✕</button>
        `;

        // Make draggable only if pending
        if (item.status === FILE_STATUS.PENDING) {
            div.setAttribute('draggable', true);
        }

        return div;
    }

    /**
     * Get thumbnail HTML
     */
    getThumbnailHTML(item) {
        if (item.thumbnailLoading) {
            return `<div class="file-thumbnail-placeholder skeleton-loading"></div>`;
        } else if (item.thumbnail) {
            return `<img src="${item.thumbnail}" class="file-thumbnail" alt="thumbnail">`;
        } else {
            return `<div class="file-thumbnail-placeholder">📄</div>`;
        }
    }

    /**
     * Get status HTML
     */
    getStatusHTML(item) {
        if (item.status === FILE_STATUS.PROCESSING) {
            return `
                <div class="file-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${item.progress}%"></div>
                    </div>
                    <div class="progress-text">${item.progress}%</div>
                </div>
            `;
        } else if (item.status === FILE_STATUS.ERROR) {
            return `
                <div class="status-indicator error">${item.error || 'ERROR'}</div>
                <button class="retry-btn" data-id="${item.id}" title="Retry conversion">↻</button>
            `;
        } else {
            return `
                <div class="status-indicator ${item.status === FILE_STATUS.DONE ? 'done' : ''}">
                    ${item.status.toUpperCase()}
                </div>
            `;
        }
    }

    /**
     * Get size estimate HTML
     */
    getSizeEstimateHTML(item) {
        if (item.estimatedSize) {
            return `<span class="size-estimate" title="Estimated output size">
                → ~${FileService.formatFileSize(item.estimatedSize)}
            </span>`;
        }
        return '';
    }

    /**
     * Attach event listeners to buttons
     */
    attachEventListeners() {
        // Remove buttons
        this.container.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                if (this.onRemove) this.onRemove(id);
            });
        });

        // Retry buttons
        this.container.querySelectorAll('.retry-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                if (this.onRetry) this.onRetry(id);
            });
        });

        // Drag events
        if (this.onDragStart || this.onDrop) {
            this.attachDragEvents();
        }
    }

    /**
     * Attach drag and drop event listeners
     */
    attachDragEvents() {
        const items = this.container.querySelectorAll('.file-item[draggable="true"]');
        
        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                if (this.onDragStart) this.onDragStart(e);
            });
            
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });
            
            item.addEventListener('dragenter', (e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                
                if (e.clientY < midpoint) {
                    e.currentTarget.classList.add('drag-over-top');
                    e.currentTarget.classList.remove('drag-over-bottom');
                } else {
                    e.currentTarget.classList.add('drag-over-bottom');
                    e.currentTarget.classList.remove('drag-over-top');
                }
            });
            
            item.addEventListener('dragleave', (e) => {
                e.currentTarget.classList.remove('drag-over-top', 'drag-over-bottom');
            });
            
            item.addEventListener('drop', (e) => {
                if (this.onDrop) this.onDrop(e);
            });
            
            item.addEventListener('dragend', (e) => {
                e.currentTarget.style.opacity = '1';
                this.container.querySelectorAll('.file-item').forEach(i => {
                    i.classList.remove('drag-over-top', 'drag-over-bottom');
                });
            });
        });
    }

    /**
     * Clear the queue display
     */
    clear() {
        this.container.innerHTML = '';
        this.countElement.textContent = '0';
    }
}
