// --- DOM Elements ---
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const workspace = document.getElementById('workspace');
const fileList = document.getElementById('fileList');
const queueCount = document.getElementById('queueCount');

// Controls
const formatSelect = document.getElementById('formatSelect');
const qualityGroup = document.getElementById('qualityGroup');
const qualityRange = document.getElementById('qualityRange');
const qualityValue = document.getElementById('qualityValue');

// Resize Controls
const resizeCheck = document.getElementById('resizeCheck');
const resizeControls = document.getElementById('resizeControls');
const widthInput = document.getElementById('widthInput');
const heightInput = document.getElementById('heightInput');
const aspectLockBtn = document.getElementById('aspectLockBtn');

let aspectRatioLocked = false;
let currentAspectRatio = null;

// Buttons & Toast
const convertBtn = document.getElementById('convertBtn');
const addMoreBtn = document.getElementById('addMoreBtn');
const clearQueueBtn = document.getElementById('clearQueueBtn');
const toast = document.getElementById('toast');

// --- State Variables ---
let fileQueue = []; // Array of { file, id, status }
let draggedItemId = null;

// --- Event Listeners ---

// 1. Upload Logic
dropZone.addEventListener('click', () => fileInput.click());
addMoreBtn.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if(e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
});
fileInput.addEventListener('change', (e) => {
    if(e.target.files.length) handleFiles(e.target.files);
});

// 2. Settings Logic
qualityRange.addEventListener('input', (e) => {
    qualityValue.textContent = Math.round(e.target.value * 100) + '%';
    saveSettings();
});

formatSelect.addEventListener('change', (e) => {
    if(e.target.value === 'image/png' || e.target.value === 'image/bmp') {
        qualityGroup.style.opacity = '0.5';
        qualityRange.disabled = true;
    } else {
        qualityGroup.style.opacity = '1';
        qualityRange.disabled = false;
    }
    saveSettings();
});

resizeCheck.addEventListener('change', (e) => {
    if(e.target.checked) {
        resizeControls.classList.remove('disabled');
    } else {
        resizeControls.classList.add('disabled');
    }
    saveSettings();
});

widthInput.addEventListener('change', saveSettings);
heightInput.addEventListener('change', saveSettings);

// Aspect ratio lock functionality
if (aspectLockBtn) {
    aspectLockBtn.addEventListener('click', () => {
        aspectRatioLocked = !aspectRatioLocked;
        aspectLockBtn.classList.toggle('locked');
        
        if (aspectRatioLocked && fileQueue.length > 0) {
            // Calculate aspect ratio from first image
            const firstItem = fileQueue[0];
            const img = new Image();
            const reader = new FileReader();
            reader.onload = (e) => {
                img.onload = () => {
                    currentAspectRatio = img.width / img.height;
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(firstItem.file);
        }
        
        saveSettings();
    });
    
    widthInput.addEventListener('input', (e) => {
        if (aspectRatioLocked && currentAspectRatio && e.target.value) {
            const w = parseInt(e.target.value);
            heightInput.value = Math.round(w / currentAspectRatio);
        }
    });
    
    heightInput.addEventListener('input', (e) => {
        if (aspectRatioLocked && currentAspectRatio && e.target.value) {
            const h = parseInt(e.target.value);
            widthInput.value = Math.round(h * currentAspectRatio);
        }
    });
}

// 3. Queue Management
clearQueueBtn.addEventListener('click', () => {
    if (fileQueue.length > 0 && confirm(`Remove all ${fileQueue.length} files from queue?`)) {
        fileQueue = [];
        updateQueueUI();
        resetApp();
        showToast('Queue cleared');
    }
});

// 4. Conversion Logic
convertBtn.addEventListener('click', processBatch);

// 5. Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    // Enter to convert
    if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && fileQueue.length > 0 && !convertBtn.disabled) {
        if (document.activeElement.tagName !== 'INPUT') {
            e.preventDefault();
            convertBtn.click();
        }
    }
    
    // Escape to clear/reset
    if (e.key === 'Escape') {
        if (fileQueue.length > 0) {
            clearQueueBtn.click();
        }
    }
    
    // Space/Enter to upload when focused on drop zone
    if ((e.key === ' ' || e.key === 'Enter') && document.activeElement === dropZone) {
        e.preventDefault();
        fileInput.click();
    }
});

// Make drop zone focusable
dropZone.setAttribute('tabindex', '0');

// --- Core Functions ---

function handleFiles(files) {
    let newFilesAdded = false;
    
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const item = {
                file: file,
                id: Math.random().toString(36).substr(2, 9),
                status: 'pending', // pending, processing, done, error
                thumbnail: null,
                format: getFormatName(file.type),
                progress: 0,
                error: null,
                estimatedSize: null
            };
            item.estimatedSize = estimateOutputSize(file);
            fileQueue.push(item);
            generateThumbnail(file, item);
            newFilesAdded = true;
        }
    });

    if (newFilesAdded) {
        dropZone.style.display = 'none';
        workspace.classList.remove('hidden');
        updateQueueUI();
        updateConvertButton();
        showToast(`Added ${files.length} images to queue`);
    } else {
        showToast('⚠️ No valid images found');
    }
    
    // Reset input to allow selecting same files again
    fileInput.value = '';
}

function generateThumbnail(file, item) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const size = 48;
            canvas.width = size;
            canvas.height = size;
            
            const scale = Math.max(size / img.width, size / img.height);
            const x = (size - img.width * scale) / 2;
            const y = (size - img.height * scale) / 2;
            
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            item.thumbnail = canvas.toDataURL();
            item.thumbnailLoading = false;
            updateQueueUI();
        };
        img.src = e.target.result;
    };
    item.thumbnailLoading = true;
    reader.readAsDataURL(file);
}

function getFormatName(mimeType) {
    if (mimeType === 'image/png') return 'PNG';
    if (mimeType === 'image/jpeg') return 'JPG';
    if (mimeType === 'image/webp') return 'WEBP';
    if (mimeType === 'image/bmp') return 'BMP';
    if (mimeType === 'image/gif') return 'GIF';
    return 'IMG';
}

function updateQueueUI() {
    queueCount.textContent = fileQueue.length;
    fileList.innerHTML = '';

    fileQueue.forEach(item => {
        const div = document.createElement('div');
        div.className = 'file-item';
        
        let thumbnailHTML;
        if (item.thumbnailLoading) {
            thumbnailHTML = `<div class="file-thumbnail-placeholder skeleton-loading"></div>`;
        } else if (item.thumbnail) {
            thumbnailHTML = `<img src="${item.thumbnail}" class="file-thumbnail" alt="thumbnail">`;
        } else {
            thumbnailHTML = `<div class="file-thumbnail-placeholder">📄</div>`;
        }
        
        let statusHTML = '';
        if (item.status === 'processing') {
            statusHTML = `
                <div class="file-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${item.progress}%"></div>
                    </div>
                    <div class="progress-text">${item.progress}%</div>
                </div>
            `;
        } else if (item.status === 'error') {
            statusHTML = `
                <div class="status-indicator error">${item.error || 'ERROR'}</div>
                <button class="retry-btn" data-id="${item.id}" title="Retry conversion">↻</button>
            `;
        } else {
            statusHTML = `
                <div class="status-indicator ${item.status === 'done' ? 'done' : ''}">
                    ${item.status.toUpperCase()}
                </div>
            `;
        }
        
        const sizeEstimate = item.estimatedSize ? `
            <span class="size-estimate" title="Estimated output size">→ ~${(item.estimatedSize / 1024 / 1024).toFixed(2)} MB</span>
        ` : '';
        
        div.innerHTML = `
            ${thumbnailHTML}
            <div class="file-info">
                <div class="file-name">${item.file.name}</div>
                <div class="file-meta">
                    <span class="format-badge">${item.format}</span>
                    ${(item.file.size / 1024 / 1024).toFixed(2)} MB
                    ${sizeEstimate}
                </div>
            </div>
            ${statusHTML}
            <button class="remove-btn" data-id="${item.id}" title="Remove file">✕</button>
        `;
        
        // Make draggable
        div.setAttribute('draggable', item.status === 'pending');
        div.dataset.id = item.id;
        
        if (item.status === 'pending') {
            div.addEventListener('dragstart', handleDragStart);
            div.addEventListener('dragover', handleDragOver);
            div.addEventListener('drop', handleDrop);
            div.addEventListener('dragend', handleDragEnd);
            div.addEventListener('dragenter', handleDragEnter);
            div.addEventListener('dragleave', handleDragLeave);
        }
        
        fileList.appendChild(div);
    });
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            removeFile(id);
        });
    });
    
    // Add event listeners to retry buttons
    document.querySelectorAll('.retry-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = e.target.dataset.id;
            await retryFile(id);
        });
    });

    if (fileQueue.length === 0) resetApp();
}

function removeFile(id) {
    fileQueue = fileQueue.filter(item => item.id !== id);
    updateQueueUI();
    updateConvertButton();
    showToast('File removed from queue');
}

function updateConvertButton() {
    if (fileQueue.length === 1) {
        convertBtn.innerHTML = '<span>Convert & Download</span>';
    } else {
        convertBtn.innerHTML = '<span>Convert All & Download ZIP</span>';
    }
}

async function processBatch() {
    if(fileQueue.length === 0) return;

    const totalFiles = fileQueue.length;
    const isSingleFile = totalFiles === 1;
    
    convertBtn.disabled = true;
    
    // Initialize ZIP only if multiple files
    const zip = isSingleFile ? null : new JSZip();
    let processedCount = 0;
    let singleFileData = null;
    let singleFileName = null;

    try {
        for (let i = 0; i < fileQueue.length; i++) {
            const item = fileQueue[i];
            
            // Skip already processed or errored files
            if (item.status === 'done' || item.status === 'error') {
                if (item.status === 'done') processedCount++;
                continue;
            }
            
            item.status = 'processing';
            item.progress = 0;
            
            // Update progress
            convertBtn.textContent = `Processing ${processedCount + 1}/${totalFiles}...`;
            updateQueueUI();

            try {
                // Simulate progress updates
                item.progress = 30;
                updateQueueUI();
                
                // Convert Image
                const convertedData = await convertSingleImage(item.file);
                
                item.progress = 70;
                updateQueueUI();
                
                const ext = getExtension(formatSelect.value);
                const filename = item.file.name.replace(/\.[^/.]+$/, "") + `_converted.${ext}`;
                
                if (isSingleFile) {
                    // Store for direct download
                    singleFileData = convertedData;
                    singleFileName = filename;
                } else {
                    // Add to ZIP
                    const base64Data = convertedData.split(',')[1];
                    zip.file(filename, base64Data, {base64: true});
                }
                
                item.progress = 100;
                item.status = 'done';
                processedCount++;
            } catch (error) {
                console.error(`Error processing ${item.file.name}:`, error);
                item.status = 'error';
                item.error = 'Failed';
                item.progress = 0;
            }
            
            updateQueueUI();
        }

        updateQueueUI();
        
        if (isSingleFile) {
            // Direct download for single file
            const link = document.createElement('a');
            link.href = singleFileData;
            link.download = singleFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast('✅ Download Started!');
        } else {
            // Generate and Download ZIP for multiple files
            showToast('📦 Generating ZIP file...');
            const zipContent = await zip.generateAsync({type: "blob"});
            const zipUrl = URL.createObjectURL(zipContent);
            
            const link = document.createElement('a');
            link.href = zipUrl;
            link.download = "converted_images.zip";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(zipUrl);
            showToast('✅ Download Started!');
        }

    } catch (error) {
        console.error(error);
        showToast('❌ Error during conversion');
    } finally {
        convertBtn.textContent = isSingleFile ? 'Convert & Download' : 'Convert All & Download ZIP';
        convertBtn.disabled = false;
    }
}

function convertSingleImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                let targetWidth = img.width;
                let targetHeight = img.height;

                // Handle Resizing
                if (resizeCheck.checked) {
                    const wInput = parseInt(widthInput.value);
                    const hInput = parseInt(heightInput.value);

                    if (wInput && hInput) {
                        targetWidth = wInput;
                        targetHeight = hInput;
                    } else if (wInput) {
                        const ratio = img.height / img.width;
                        targetWidth = wInput;
                        targetHeight = Math.round(wInput * ratio);
                    } else if (hInput) {
                        const ratio = img.width / img.height;
                        targetHeight = hInput;
                        targetWidth = Math.round(hInput * ratio);
                    }
                }

                canvas.width = targetWidth;
                canvas.height = targetHeight;

                // Handle Transparency
                if(formatSelect.value === 'image/jpeg' || formatSelect.value === 'image/bmp') {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                resolve(canvas.toDataURL(formatSelect.value, parseFloat(qualityRange.value)));
            };
            img.onerror = reject;
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function getExtension(mimeType) {
    if(mimeType === 'image/png') return 'png';
    if(mimeType === 'image/webp') return 'webp';
    if(mimeType === 'image/bmp') return 'bmp';
    return 'jpg';
}

function resetApp() {
    dropZone.style.display = 'block';
    workspace.classList.add('hidden');
    fileQueue = [];
    fileInput.value = '';
}

function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function saveSettings() {
    const settings = {
        format: formatSelect.value,
        quality: qualityRange.value,
        resize: resizeCheck.checked,
        width: widthInput.value,
        height: heightInput.value,
        aspectLock: aspectRatioLocked
    };
    localStorage.setItem('imageConverterSettings', JSON.stringify(settings));
}

function loadSettings() {
    try {
        const saved = localStorage.getItem('imageConverterSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            formatSelect.value = settings.format || 'image/jpeg';
            qualityRange.value = settings.quality || 0.9;
            qualityValue.textContent = Math.round(qualityRange.value * 100) + '%';
            resizeCheck.checked = settings.resize || false;
            widthInput.value = settings.width || '';
            heightInput.value = settings.height || '';
            aspectRatioLocked = settings.aspectLock || false;
            
            if (resizeCheck.checked) {
                resizeControls.classList.remove('disabled');
            }
            
            if (aspectRatioLocked && aspectLockBtn) {
                aspectLockBtn.classList.add('locked');
            }
            
            // Trigger format change to update UI
            formatSelect.dispatchEvent(new Event('change'));
        }
    } catch (e) {
        console.error('Failed to load settings:', e);
    }
}

function retryFile(id) {
    const item = fileQueue.find(f => f.id === id);
    if (item) {
        item.status = 'pending';
        item.error = null;
        item.progress = 0;
        updateQueueUI();
        showToast('File reset - click Convert to retry');
    }
}

// Drag-to-reorder handlers
function handleDragStart(e) {
    draggedItemId = e.currentTarget.dataset.id;
    e.currentTarget.style.opacity = '0.5';
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    e.currentTarget.style.opacity = '1';
    // Remove all drag-over classes
    document.querySelectorAll('.file-item').forEach(item => {
        item.classList.remove('drag-over-top', 'drag-over-bottom');
    });
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    const currentId = e.currentTarget.dataset.id;
    if (currentId !== draggedItemId) {
        const rect = e.currentTarget.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        
        if (e.clientY < midpoint) {
            e.currentTarget.classList.add('drag-over-top');
            e.currentTarget.classList.remove('drag-over-bottom');
        } else {
            e.currentTarget.classList.add('drag-over-bottom');
            e.currentTarget.classList.remove('drag-over-top');
        }
    }
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over-top', 'drag-over-bottom');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    const targetId = e.currentTarget.dataset.id;
    if (draggedItemId === targetId) return;
    
    const draggedIndex = fileQueue.findIndex(f => f.id === draggedItemId);
    const targetIndex = fileQueue.findIndex(f => f.id === targetId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
        // Remove dragged item
        const [draggedItem] = fileQueue.splice(draggedIndex, 1);
        
        // Determine insert position based on drop location
        const rect = e.currentTarget.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        let insertIndex = targetIndex;
        
        if (e.clientY > midpoint) {
            insertIndex++;
        }
        
        // Adjust if we removed from before the target
        if (draggedIndex < targetIndex) {
            insertIndex--;
        }
        
        // Insert at new position
        fileQueue.splice(insertIndex, 0, draggedItem);
        updateQueueUI();
        showToast('↕️ File reordered');
    }
    
    return false;
}

function estimateOutputSize(file) {
    // Rough estimation based on format and quality
    const format = formatSelect.value;
    const quality = parseFloat(qualityRange.value);
    let estimate = file.size;
    
    if (format === 'image/jpeg') {
        estimate = file.size * quality * 0.6;
    } else if (format === 'image/webp') {
        estimate = file.size * quality * 0.5;
    } else if (format === 'image/png') {
        estimate = file.size * 1.2; // PNG can be larger
    } else if (format === 'image/bmp') {
        estimate = file.size * 3; // BMP is much larger
    }
    
    // Adjust for resize
    if (resizeCheck.checked) {
        const w = parseInt(widthInput.value);
        const h = parseInt(heightInput.value);
        if (w || h) {
            estimate *= 0.7; // Assume smaller size when resizing
        }
    }
    
    return estimate;
}

// Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js');
    });
}

// Load saved settings on page load
loadSettings();

// Update size estimates when settings change
formatSelect.addEventListener('change', updateAllEstimates);
qualityRange.addEventListener('input', updateAllEstimates);
resizeCheck.addEventListener('change', updateAllEstimates);
widthInput.addEventListener('input', updateAllEstimates);
heightInput.addEventListener('input', updateAllEstimates);

function updateAllEstimates() {
    fileQueue.forEach(item => {
        item.estimatedSize = estimateOutputSize(item.file);
    });
    updateQueueUI();
}