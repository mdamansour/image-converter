/**
 * Application State Management
 * Centralized state management using observable pattern
 */

export class AppState {
    constructor() {
        this.fileQueue = [];
        this.editState = {
            rotation: 0,
            flipHorizontal: false,
            flipVertical: false,
            cropSettings: null
        };
        this.dragState = {
            draggedItemId: null
        };
        this.aspectRatioState = {
            locked: false,
            ratio: null
        };
        this.observers = [];
    }

    /**
     * Subscribe to state changes
     */
    subscribe(callback) {
        this.observers.push(callback);
        return () => {
            this.observers = this.observers.filter(obs => obs !== callback);
        };
    }

    /**
     * Notify all observers of state change
     */
    notify(changeType, data) {
        this.observers.forEach(callback => callback(changeType, data));
    }

    /**
     * File Queue Management
     */
    addFiles(files) {
        this.fileQueue.push(...files);
        this.notify('FILES_ADDED', files);
    }

    removeFile(id) {
        this.fileQueue = this.fileQueue.filter(item => item.id !== id);
        this.notify('FILE_REMOVED', id);
    }

    updateFile(id, updates) {
        const file = this.fileQueue.find(f => f.id === id);
        if (file) {
            Object.assign(file, updates);
            this.notify('FILE_UPDATED', { id, updates });
        }
    }

    getFile(id) {
        return this.fileQueue.find(f => f.id === id);
    }

    clearQueue() {
        this.fileQueue = [];
        this.notify('QUEUE_CLEARED');
    }

    reorderFiles(fromIndex, toIndex) {
        const [movedFile] = this.fileQueue.splice(fromIndex, 1);
        this.fileQueue.splice(toIndex, 0, movedFile);
        this.notify('FILES_REORDERED');
    }

    /**
     * Edit State Management
     */
    setRotation(angle) {
        this.editState.rotation = angle;
        this.notify('EDIT_CHANGED', this.editState);
    }

    setFlipHorizontal(value) {
        this.editState.flipHorizontal = value;
        this.notify('EDIT_CHANGED', this.editState);
    }

    setFlipVertical(value) {
        this.editState.flipVertical = value;
        this.notify('EDIT_CHANGED', this.editState);
    }

    setCropSettings(settings) {
        this.editState.cropSettings = settings;
        this.notify('EDIT_CHANGED', this.editState);
    }

    resetEdits() {
        this.editState = {
            rotation: 0,
            flipHorizontal: false,
            flipVertical: false,
            cropSettings: null
        };
        this.notify('EDIT_RESET');
    }

    hasEdits() {
        return this.editState.rotation !== 0 || 
               this.editState.flipHorizontal || 
               this.editState.flipVertical || 
               this.editState.cropSettings !== null;
    }

    /**
     * Aspect Ratio State
     */
    setAspectRatioLock(locked, ratio = null) {
        this.aspectRatioState.locked = locked;
        this.aspectRatioState.ratio = ratio;
        this.notify('ASPECT_RATIO_CHANGED', this.aspectRatioState);
    }

    /**
     * Getters
     */
    getFileQueue() {
        return this.fileQueue;
    }

    getEditState() {
        return this.editState;
    }

    getAspectRatioState() {
        return this.aspectRatioState;
    }

    getDraggedItemId() {
        return this.dragState.draggedItemId;
    }

    setDraggedItemId(id) {
        this.dragState.draggedItemId = id;
    }
}

// Singleton instance
export const appState = new AppState();
