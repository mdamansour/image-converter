// --- DOM Elements ---
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const workspace = document.getElementById('workspace');
const previewImg = document.getElementById('preview');
const fileInfo = document.getElementById('fileInfo');

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
const resetBtn = document.getElementById('resetBtn');
const toast = document.getElementById('toast');

// --- State Variables ---
let currentFile = null;
let originalImage = null; // Image Object
let aspectRatio = 0;

// --- Event Listeners ---

// 1. Upload Logic
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if(e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', (e) => {
    if(e.target.files.length) handleFile(e.target.files[0]);
});

// 2. Settings Logic
qualityRange.addEventListener('input', (e) => {
    qualityValue.textContent = Math.round(e.target.value * 100) + '%';
});

formatSelect.addEventListener('change', (e) => {
    // Disable quality for lossless formats
    if(e.target.value === 'image/png' || e.target.value === 'image/bmp') {
        qualityGroup.style.opacity = '0.5';
        qualityRange.disabled = true;
    } else {
        qualityGroup.style.opacity = '1';
        qualityRange.disabled = false;
    }
});

// 3. Resize Logic (Aspect Ratio Lock)
resizeCheck.addEventListener('change', (e) => {
    if(e.target.checked) {
        resizeControls.classList.remove('disabled');
        // Pre-fill with original dimensions if inputs are empty
        if(!widthInput.value) widthInput.value = originalImage.width;
        if(!heightInput.value) heightInput.value = originalImage.height;
    } else {
        resizeControls.classList.add('disabled');
    }
});

// Auto-calculate height when width changes
widthInput.addEventListener('input', () => {
    if(originalImage && aspectRatio && widthInput.value) {
        heightInput.value = Math.round(widthInput.value / aspectRatio);
    }
});

// Auto-calculate width when height changes
heightInput.addEventListener('input', () => {
    if(originalImage && aspectRatio && heightInput.value) {
        widthInput.value = Math.round(heightInput.value * aspectRatio);
    }
});

// 4. Action Buttons
resetBtn.addEventListener('click', resetApp);
convertBtn.addEventListener('click', processConversion);

// --- Core Functions ---

function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        showToast('⚠️ Please upload a valid image file');
        return;
    }

    currentFile = file;
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            originalImage = img;
            aspectRatio = img.width / img.height;
            
            // Update UI
            previewImg.src = e.target.result;
            fileInfo.textContent = `${file.name} | ${img.width}x${img.height}px | ${(file.size/1024/1024).toFixed(2)}MB`;
            
            // Clear resize inputs on new file load
            widthInput.value = '';
            heightInput.value = '';
            
            // Switch Views
            dropZone.style.display = 'none';
            workspace.classList.remove('hidden');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function processConversion() {
    if(!originalImage) return;
    
    convertBtn.textContent = 'Processing...';
    convertBtn.disabled = true;

    // Small timeout to let UI update
    setTimeout(() => {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Determine Output Dimensions
            let finalWidth = originalImage.width;
            let finalHeight = originalImage.height;

            if(resizeCheck.checked) {
                // ParseInt ensures we get numbers; fallback to original if empty/invalid
                finalWidth = parseInt(widthInput.value) || finalWidth;
                finalHeight = parseInt(heightInput.value) || finalHeight;
            }

            canvas.width = finalWidth;
            canvas.height = finalHeight;

            // Handle Transparency for JPEG/BMP (Fill White)
            if(formatSelect.value === 'image/jpeg' || formatSelect.value === 'image/bmp') {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            // Draw Image (High Quality Scaling)
            ctx.drawImage(originalImage, 0, 0, finalWidth, finalHeight);

            // Export
            const quality = parseFloat(qualityRange.value);
            const format = formatSelect.value;
            
            const dataUrl = canvas.toDataURL(format, quality);
            
            triggerDownload(dataUrl, currentFile.name, format);
            showToast('✅ Download Started!');

        } catch (error) {
            console.error(error);
            showToast('❌ Error converting image');
        } finally {
            // FIXED: 'finally' instead of 'final'
            convertBtn.textContent = 'Convert & Download';
            convertBtn.disabled = false;
        }
    }, 50);
}

function triggerDownload(url, originalName, mimeType) {
    const link = document.createElement('a');
    const namePart = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    
    let ext = 'jpg';
    if(mimeType === 'image/png') ext = 'png';
    if(mimeType === 'image/webp') ext = 'webp';
    if(mimeType === 'image/bmp') ext = 'bmp';

    link.download = `${namePart}_converted.${ext}`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function resetApp() {
    currentFile = null;
    originalImage = null;
    dropZone.style.display = 'block';
    workspace.classList.add('hidden');
    fileInput.value = ''; // Allow re-selecting same file
    resizeCheck.checked = false;
    resizeControls.classList.add('disabled');
    widthInput.value = '';
    heightInput.value = '';
}

function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('Service Worker Registered'))
            .catch(err => console.error('Service Worker Failed:', err));
    });
}