// --- Elements ---
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('previewContainer');
const controls = document.getElementById('controls');
const previewImg = document.getElementById('preview');
const fileDetails = document.getElementById('fileDetails');
const formatSelect = document.getElementById('formatSelect');
const qualityGroup = document.getElementById('qualityGroup');
const qualityRange = document.getElementById('qualityRange');
const qualityValue = document.getElementById('qualityValue');
const convertBtn = document.getElementById('convertBtn');
const resetBtn = document.getElementById('resetBtn');
const toast = document.getElementById('toast');

// --- State ---
let currentFile = null;
let originalImage = null; // Stores the actual Image object

// --- Event Listeners ---

// Drag and Drop Logic
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
    }
});

// Click to Upload
dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

// Slider Updates
qualityRange.addEventListener('input', (e) => {
    const val = Math.round(e.target.value * 100);
    qualityValue.textContent = `${val}%`;
});

// Format Change Logic (Smart Format Handling)
formatSelect.addEventListener('change', (e) => {
    const format = e.target.value;
    // PNG and BMP are lossless, so quality slider doesn't apply
    if (format === 'image/png' || format === 'image/bmp') {
        qualityGroup.classList.add('disabled-control');
    } else {
        qualityGroup.classList.remove('disabled-control');
    }
});

// Buttons
convertBtn.addEventListener('click', convertAndDownload);
resetBtn.addEventListener('click', resetUI);

// --- Core Functions ---

function showToast(message) {
    toast.textContent = message;
    toast.className = "show";
    setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
}

function handleFile(file) {
    // Validation
    if (!file.type.startsWith('image/')) {
        showToast("Error: Please upload a valid image file.");
        return;
    }

    currentFile = file;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            originalImage = img;
            setupPreview(file.name, img.width, img.height, file.size);
        };
        img.src = e.target.result;
        // Set preview source immediately
        previewImg.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function setupPreview(name, width, height, sizeBytes) {
    const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);
    
    fileDetails.innerHTML = `
        <strong>${name}</strong><br>
        Original: ${width}x${height} px • ${sizeMB} MB
    `;

    // UI Transitions
    dropZone.classList.add('hidden');
    previewContainer.style.display = 'flex';
    controls.style.display = 'block';
}

function convertAndDownload() {
    if (!originalImage) return;

    showToast("Processing conversion...");
    convertBtn.disabled = true;
    convertBtn.textContent = "Processing...";

    // Use setTimeout to allow the UI to render the Toast before heavy canvas work
    setTimeout(() => {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas size to match original image
            canvas.width = originalImage.width;
            canvas.height = originalImage.height;

            const targetFormat = formatSelect.value;
            const quality = parseFloat(qualityRange.value);

            // --- SMART FORMAT HANDLING ---
            
            // 1. JPEG Transparency Fix
            // If converting to JPEG, transparent pixels turn black by default.
            // We fill the canvas with white first to handle this.
            if (targetFormat === 'image/jpeg' || targetFormat === 'image/bmp') {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            // Draw the image onto the canvas
            ctx.drawImage(originalImage, 0, 0);

            // Convert to data URL
            const newDataUrl = canvas.toDataURL(targetFormat, quality);

            // Trigger Download
            const link = document.createElement('a');
            link.download = generateFilename(currentFile.name, targetFormat);
            link.href = newDataUrl;
            document.body.appendChild(link); // Required for Firefox
            link.click();
            document.body.removeChild(link);

            showToast("Download started!");
        } catch (err) {
            console.error(err);
            showToast("Error during conversion.");
        } finally {
            convertBtn.disabled = false;
            convertBtn.textContent = "Convert & Download";
        }
    }, 100);
}

function generateFilename(originalName, mimeType) {
    const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    let ext = "";
    
    switch (mimeType) {
        case 'image/jpeg': ext = 'jpg'; break;
        case 'image/png': ext = 'png'; break;
        case 'image/webp': ext = 'webp'; break;
        case 'image/bmp': ext = 'bmp'; break;
        default: ext = 'jpg';
    }

    return `${nameWithoutExt}_converted.${ext}`;
}

function resetUI() {
    currentFile = null;
    originalImage = null;
    previewImg.src = "";
    fileInput.value = ""; // Reset input so same file can be selected again
    
    dropZone.classList.remove('hidden');
    previewContainer.style.display = 'none';
    controls.style.display = 'none';
}