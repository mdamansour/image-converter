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

// Buttons & Toast
const convertBtn = document.getElementById('convertBtn');
const addMoreBtn = document.getElementById('addMoreBtn');
const clearQueueBtn = document.getElementById('clearQueueBtn');
const toast = document.getElementById('toast');

// --- State Variables ---
let fileQueue = []; // Array of { file, id, status }

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
});

formatSelect.addEventListener('change', (e) => {
    if(e.target.value === 'image/png' || e.target.value === 'image/bmp') {
        qualityGroup.style.opacity = '0.5';
        qualityRange.disabled = true;
    } else {
        qualityGroup.style.opacity = '1';
        qualityRange.disabled = false;
    }
});

resizeCheck.addEventListener('change', (e) => {
    if(e.target.checked) {
        resizeControls.classList.remove('disabled');
    } else {
        resizeControls.classList.add('disabled');
    }
});

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

// --- Core Functions ---

function handleFiles(files) {
    let newFilesAdded = false;
    
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const item = {
                file: file,
                id: Math.random().toString(36).substr(2, 9),
                status: 'pending', // pending, processing, done
                thumbnail: null,
                format: getFormatName(file.type)
            };
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
            updateQueueUI();
        };
        img.src = e.target.result;
    };
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
        
        const thumbnailHTML = item.thumbnail 
            ? `<img src="${item.thumbnail}" class="file-thumbnail" alt="thumbnail">` 
            : `<div class="file-thumbnail-placeholder">📄</div>`;
        
        div.innerHTML = `
            ${thumbnailHTML}
            <div class="file-info">
                <div class="file-name">${item.file.name}</div>
                <div class="file-meta">
                    <span class="format-badge">${item.format}</span>
                    ${(item.file.size / 1024 / 1024).toFixed(2)} MB
                </div>
            </div>
            <div class="status-indicator ${item.status === 'done' ? 'done' : ''}">
                ${item.status.toUpperCase()}
            </div>
            <button class="remove-btn" data-id="${item.id}" title="Remove file">✕</button>
        `;
        fileList.appendChild(div);
    });
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            removeFile(id);
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
            item.status = 'processing';
            
            // Update progress
            convertBtn.textContent = `Processing ${i + 1}/${totalFiles}...`;
            updateQueueUI();

            // Convert Image
            const convertedData = await convertSingleImage(item.file);
            
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

            item.status = 'done';
            processedCount++;
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

// Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js');
    });
}