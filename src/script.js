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

// Edit state
let rotation = 0; // 0, 90, 180, 270
let flipHorizontal = false;
let flipVertical = false;
let cropSettings = null; // { x, y, width, height }

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
    const lossy = ['image/jpeg', 'image/webp'];
    const value = e.target.value;
    
    if(value === 'same' || lossy.includes(value)) {
        qualityGroup.style.opacity = '1';
        qualityRange.disabled = false;
    } else {
        qualityGroup.style.opacity = '0.5';
        qualityRange.disabled = true;
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

// 5. Edit Controls
document.getElementById('rotate90Btn').addEventListener('click', () => {
    rotation = (rotation + 90) % 360;
    updateEditIndicator();
    showToast('↻ Rotation: ' + rotation + '°');
});

document.getElementById('rotate180Btn').addEventListener('click', () => {
    rotation = (rotation + 180) % 360;
    updateEditIndicator();
    showToast('↻ Rotation: ' + rotation + '°');
});

document.getElementById('rotate270Btn').addEventListener('click', () => {
    rotation = (rotation + 270) % 360;
    updateEditIndicator();
    showToast('↻ Rotation: ' + rotation + '°');
});

document.getElementById('flipHBtn').addEventListener('click', () => {
    flipHorizontal = !flipHorizontal;
    updateEditIndicator();
    showToast((flipHorizontal ? '✅' : '❌') + ' Flip Horizontal');
});

document.getElementById('flipVBtn').addEventListener('click', () => {
    flipVertical = !flipVertical;
    updateEditIndicator();
    showToast((flipVertical ? '✅' : '❌') + ' Flip Vertical');
});

document.getElementById('cropBtn').addEventListener('click', openCropModal);
document.getElementById('previewBtn').addEventListener('click', showPreview);
document.getElementById('closePreviewBtn').addEventListener('click', () => {
    document.getElementById('previewPanel').classList.add('hidden');
});

// 6. Keyboard Shortcuts
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
    
    Array.from(files).forEach(async file => {
        if (file.type.startsWith('image/')) {
            const item = {
                file: file,
                id: Math.random().toString(36).substr(2, 9),
                status: 'pending', // pending, processing, done, error
                thumbnail: null,
                format: getFormatName(file.type),
                progress: 0,
                error: null,
                estimatedSize: null,
                isHEIC: file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')
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
    item.thumbnailLoading = true;
    
    // Check if HEIC and needs conversion
    if (item.isHEIC && typeof heic2any !== 'undefined') {
        heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.5
        })
        .then(convertedBlob => {
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
            reader.readAsDataURL(convertedBlob);
        })
        .catch(err => {
            console.error('HEIC thumbnail error:', err);
            item.thumbnailLoading = false;
            item.thumbnail = null;
            updateQueueUI();
        });
    } else {
        // Standard thumbnail generation
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
            img.onerror = () => {
                item.thumbnailLoading = false;
                item.thumbnail = null;
                updateQueueUI();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function getFormatName(mimeType) {
    if (mimeType === 'image/png') return 'PNG';
    if (mimeType === 'image/jpeg') return 'JPG';
    if (mimeType === 'image/webp') return 'WEBP';
    if (mimeType === 'image/bmp') return 'BMP';
    if (mimeType === 'image/gif') return 'GIF';
    if (mimeType === 'image/tiff' || mimeType === 'image/tif') return 'TIFF';
    if (mimeType === 'image/svg+xml') return 'SVG';
    if (mimeType === 'image/x-icon' || mimeType === 'image/vnd.microsoft.icon') return 'ICO';
    if (mimeType === 'image/heic' || mimeType === 'image/heif') return 'HEIC';
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
        // Check if file is HEIC and needs preprocessing
        const isHEIC = file.type === 'image/heic' || file.type === 'image/heif' || 
                       file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
        
        if (isHEIC && typeof heic2any !== 'undefined') {
            // Convert HEIC to blob first
            heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality: 0.9
            })
            .then(convertedBlob => {
                // Now process the converted blob as normal
                const reader = new FileReader();
                reader.onload = (event) => {
                    processImage(event.target.result, resolve, reject, file);
                };
                reader.readAsDataURL(convertedBlob);
            })
            .catch(err => {
                console.error('HEIC conversion error:', err);
                reject(new Error('Failed to convert HEIC file'));
            });
        } else {
            // Standard processing
            const reader = new FileReader();
            reader.onload = (event) => {
                processImage(event.target.result, resolve, reject, file);
            };
            reader.readAsDataURL(file);
        }
    });
}

function processImage(dataUrl, resolve, reject, originalFile) {
    const img = new Image();
    img.onload = () => {
        let targetFormat = formatSelect.value;
        
        // Handle "same as original" format
        if (targetFormat === 'same' && originalFile) {
            targetFormat = originalFile.type || 'image/jpeg';
        }
        
        // Handle SVG output (wrap raster image in SVG)
        if (targetFormat === 'image/svg+xml') {
            const svgContent = createSVGWrapper(img, dataUrl);
            resolve(svgContent);
            return;
        }
        
        // Handle ICO output (create multi-size ICO)
        if (targetFormat === 'image/x-icon') {
            const icoData = createICO(img);
            resolve(icoData);
            return;
        }
        
        // Standard canvas conversion with edits
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        let targetWidth = img.width;
        let targetHeight = img.height;
        
        // Apply rotation to dimensions
        if (rotation === 90 || rotation === 270) {
            [targetWidth, targetHeight] = [targetHeight, targetWidth];
        }

        // Handle Cropping first
        let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height;
        if (cropSettings) {
            sourceX = cropSettings.x;
            sourceY = cropSettings.y;
            sourceWidth = cropSettings.width;
            sourceHeight = cropSettings.height;
            targetWidth = sourceWidth;
            targetHeight = sourceHeight;
            
            // Adjust for rotation
            if (rotation === 90 || rotation === 270) {
                [targetWidth, targetHeight] = [targetHeight, targetWidth];
            }
        }

        // Handle Resizing
        if (resizeCheck.checked) {
            const wInput = parseInt(widthInput.value);
            const hInput = parseInt(heightInput.value);

            if (wInput && hInput) {
                targetWidth = wInput;
                targetHeight = hInput;
            } else if (wInput) {
                const ratio = targetHeight / targetWidth;
                targetWidth = wInput;
                targetHeight = Math.round(wInput * ratio);
            } else if (hInput) {
                const ratio = targetWidth / targetHeight;
                targetHeight = hInput;
                targetWidth = Math.round(hInput * ratio);
            }
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Handle Transparency
        if(targetFormat === 'image/jpeg' || targetFormat === 'image/bmp') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Apply transformations
        ctx.save();
        
        // Center point for transformations
        const centerX = targetWidth / 2;
        const centerY = targetHeight / 2;
        
        ctx.translate(centerX, centerY);
        
        // Apply rotation
        if (rotation !== 0) {
            ctx.rotate((rotation * Math.PI) / 180);
        }
        
        // Apply flips
        let scaleX = flipHorizontal ? -1 : 1;
        let scaleY = flipVertical ? -1 : 1;
        ctx.scale(scaleX, scaleY);
        
        // Draw image (accounting for crop)
        const drawWidth = rotation === 90 || rotation === 270 ? targetHeight : targetWidth;
        const drawHeight = rotation === 90 || rotation === 270 ? targetWidth : targetHeight;
        
        ctx.drawImage(
            img,
            sourceX, sourceY, sourceWidth, sourceHeight,
            -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight
        );
        
        ctx.restore();
        
        resolve(canvas.toDataURL(targetFormat, parseFloat(qualityRange.value)));
    };
    img.onerror = reject;
    img.src = dataUrl;
}

function getExtension(mimeType) {
    if(mimeType === 'image/png') return 'png';
    if(mimeType === 'image/webp') return 'webp';
    if(mimeType === 'image/bmp') return 'bmp';
    if(mimeType === 'image/gif') return 'gif';
    if(mimeType === 'image/tiff') return 'tiff';
    if(mimeType === 'image/svg+xml') return 'svg';
    if(mimeType === 'image/x-icon') return 'ico';
    return 'jpg';
}

function createSVGWrapper(img, dataUrl) {
    const width = resizeCheck.checked && widthInput.value ? widthInput.value : img.width;
    const height = resizeCheck.checked && heightInput.value ? heightInput.value : img.height;
    
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <image width="${width}" height="${height}" xlink:href="${dataUrl}"/>
</svg>`;
    
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgContent)));
}

function createICO(img) {
    // Create 32x32 PNG (standard ICO size)
    // Full ICO format with multiple sizes requires complex binary encoding
    // This creates a usable 32x32 PNG that works as favicon
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    // Fill white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 32, 32);
    
    // Draw image scaled to 32x32
    ctx.drawImage(img, 0, 0, 32, 32);
    
    return canvas.toDataURL('image/png');
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

function updateEditIndicator() {
    const hasEdits = rotation !== 0 || flipHorizontal || flipVertical || cropSettings;
    const editBtns = document.querySelectorAll('.edit-btn');
    
    document.getElementById('rotate90Btn').classList.toggle('active', rotation === 90);
    document.getElementById('rotate180Btn').classList.toggle('active', rotation === 180);
    document.getElementById('rotate270Btn').classList.toggle('active', rotation === 270);
    document.getElementById('flipHBtn').classList.toggle('active', flipHorizontal);
    document.getElementById('flipVBtn').classList.toggle('active', flipVertical);
    document.getElementById('cropBtn').classList.toggle('active', cropSettings !== null);
}

function showPreview() {
    if (fileQueue.length === 0) {
        showToast('⚠️ No files to preview');
        return;
    }
    
    const firstFile = fileQueue[0];
    const previewPanel = document.getElementById('previewPanel');
    const originalImg = document.getElementById('previewOriginal');
    const convertedImg = document.getElementById('previewConverted');
    const originalInfo = document.getElementById('originalInfo');
    const convertedInfo = document.getElementById('convertedInfo');
    
    // Show original
    const reader = new FileReader();
    reader.onload = async (e) => {
        originalImg.src = e.target.result;
        originalInfo.textContent = `${firstFile.format} - ${(firstFile.file.size / 1024).toFixed(0)} KB`;
        
        // Generate preview conversion
        try {
            const converted = await convertSingleImage(firstFile.file);
            convertedImg.src = converted;
            
            // Estimate size
            const base64Length = converted.split(',')[1].length;
            const sizeKB = (base64Length * 0.75 / 1024).toFixed(0);
            const targetFormat = formatSelect.value === 'same' ? firstFile.format : getFormatName(formatSelect.value);
            convertedInfo.textContent = `${targetFormat} - ~${sizeKB} KB`;
        } catch (err) {
            convertedInfo.textContent = 'Preview failed';
        }
    };
    reader.readAsDataURL(firstFile.file);
    
    previewPanel.classList.remove('hidden');
}

function openCropModal() {
    if (fileQueue.length === 0) {
        showToast('⚠️ Add images first');
        return;
    }
    
    showToast('🚧 Crop feature - Basic implementation');
    // Simplified: Set a default center crop
    cropSettings = { x: 0, y: 0, width: 100, height: 100 };
    updateEditIndicator();
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
        estimate = file.size * 1.2;
    } else if (format === 'image/bmp') {
        estimate = file.size * 3;
    } else if (format === 'image/gif') {
        estimate = file.size * 0.9;
    } else if (format === 'image/tiff') {
        estimate = file.size * 2;
    } else if (format === 'image/svg+xml') {
        estimate = file.size * 0.3; // SVG wrapper is small
    } else if (format === 'image/x-icon') {
        estimate = 5000; // ICO typically small (32x32)
    }
    
    // Adjust for resize
    if (resizeCheck.checked) {
        const w = parseInt(widthInput.value);
        const h = parseInt(heightInput.value);
        if (w || h) {
            estimate *= 0.7;
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