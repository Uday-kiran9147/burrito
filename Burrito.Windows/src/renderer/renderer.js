// State
let currentSettings = {
    imageQuality: parseInt(localStorage.getItem('imageQuality') || '80', 10),
    videoQuality: parseInt(localStorage.getItem('videoQuality') || '80', 10)
};

let isProcessing = false;
let detectedMediaType = 'unknown';

// DOM Elements
const dropzoneView = document.getElementById('dropzone-view');
const settingsView = document.getElementById('settings-view');
const settingsBtn = document.getElementById('settings-btn');
const pinBtn = document.getElementById('pin-btn');
const backBtn = document.getElementById('back-btn');

let isPinned = localStorage.getItem('isPinned') === 'true';

async function updatePinState(pinned) {
    isPinned = pinned;
    localStorage.setItem('isPinned', isPinned ? 'true' : 'false');
    if (isPinned) {
        pinBtn.classList.add('active');
        pinBtn.title = "Unpin Window (Auto-Hide on click outside)";
    } else {
        pinBtn.classList.remove('active');
        pinBtn.title = "Pin Window (Stay Open)";
    }
    if (window.burritoAPI && window.burritoAPI.setPinned) {
        await window.burritoAPI.setPinned(isPinned);
    }
}

// Initial pin state sync
updatePinState(isPinned);

pinBtn.addEventListener('click', () => {
    updatePinState(!isPinned);
});

const zonePng = document.getElementById('zone-png');
const zoneWebp = document.getElementById('zone-webp');
const labelPng = document.getElementById('label-png');
const labelWebp = document.getElementById('label-webp');

const contentContainer = document.querySelector('.content-container');
const processingOverlay = document.getElementById('processing-overlay');
const fannedStack = document.getElementById('fanned-stack');

const statusProcessing = document.getElementById('status-processing');
const statusSuccess = document.getElementById('status-success');
const statusError = document.getElementById('status-error');
const savingsPill = document.getElementById('savings-pill');
const errorMessage = document.getElementById('error-message');

const imgSlider = document.getElementById('image-quality-slider');
const imgVal = document.getElementById('image-quality-val');
const videoSlider = document.getElementById('video-quality-slider');
const videoVal = document.getElementById('video-quality-val');

const canvas = document.getElementById('fluid-canvas');
const ctx = canvas.getContext('2d');

// Canvas Fluid Background Animation
let animTime = 0;
let animFrameId = null;

function resizeCanvas() {
    canvas.width = contentContainer.clientWidth || 316;
    canvas.height = contentContainer.clientHeight || 120;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function drawFluidBackground(state = 'processing') {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Dark base
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    animTime += 0.03;

    // Glowing dynamic circles
    const cx1 = w * 0.35 + Math.sin(animTime * 0.8) * 30;
    const cy1 = h * 0.4 + Math.cos(animTime * 0.6) * 15;

    const cx2 = w * 0.65 + Math.cos(animTime * 0.7) * 30;
    const cy2 = h * 0.6 + Math.sin(animTime * 0.9) * 15;

    let col1, col2;
    if (state === 'success') {
        col1 = 'rgba(51, 198, 99, 0.5)';
        col2 = 'rgba(255, 255, 255, 0.2)';
    } else if (state === 'error') {
        col1 = 'rgba(239, 68, 68, 0.6)';
        col2 = 'rgba(239, 68, 68, 0.3)';
    } else {
        col1 = 'rgba(51, 198, 99, 0.35)';
        col2 = 'rgba(255, 255, 255, 0.15)';
    }

    const grad1 = ctx.createRadialGradient(cx1, cy1, 5, cx1, cy1, 90);
    grad1.addColorStop(0, col1);
    grad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad1;
    ctx.beginPath();
    ctx.arc(cx1, cy1, 90, 0, Math.PI * 2);
    ctx.fill();

    const grad2 = ctx.createRadialGradient(cx2, cy2, 5, cx2, cy2, 80);
    grad2.addColorStop(0, col2);
    grad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad2;
    ctx.beginPath();
    ctx.arc(cx2, cy2, 80, 0, Math.PI * 2);
    ctx.fill();

    if (isProcessing) {
        animFrameId = requestAnimationFrame(() => drawFluidBackground(state));
    }
}

// Navigation
settingsBtn.addEventListener('click', () => {
    dropzoneView.classList.add('hidden');
    settingsView.classList.remove('hidden');
});

backBtn.addEventListener('click', () => {
    settingsView.classList.add('hidden');
    dropzoneView.classList.remove('hidden');
});

// Settings Sliders
imgSlider.value = currentSettings.imageQuality;
imgVal.textContent = currentSettings.imageQuality;
videoSlider.value = currentSettings.videoQuality;
videoVal.textContent = currentSettings.videoQuality;

imgSlider.addEventListener('input', (e) => {
    currentSettings.imageQuality = parseInt(e.target.value, 10);
    imgVal.textContent = currentSettings.imageQuality;
    localStorage.setItem('imageQuality', currentSettings.imageQuality);
});

videoSlider.addEventListener('input', (e) => {
    currentSettings.videoQuality = parseInt(e.target.value, 10);
    videoVal.textContent = currentSettings.videoQuality;
    localStorage.setItem('videoQuality', currentSettings.videoQuality);
});

// Update Zone Labels based on media type
function updateZoneLabels(mediaType) {
    detectedMediaType = mediaType;
    if (mediaType === 'mixed') {
        labelPng.textContent = 'PNG / MP4';
        labelWebp.textContent = 'WEBP / WEBM';
    } else if (mediaType === 'video') {
        labelPng.textContent = 'MP4';
        labelWebp.textContent = 'WEBM';
    } else {
        labelPng.textContent = 'PNG';
        labelWebp.textContent = 'WEBP';
    }
}

// Drag & Drop Handling
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    document.body.addEventListener(eventName, preventDefaults, false);
});

async function extractFilesFromEvent(e) {
    const files = Array.from(e.dataTransfer.files);
    return files.map(f => f.path).filter(Boolean);
}

document.body.addEventListener('dragover', async (e) => {
    if (isProcessing) return;
    const paths = Array.from(e.dataTransfer.files || []).map(f => f.path).filter(Boolean);
    if (paths.length > 0) {
        const mediaType = await window.burritoAPI.determineMediaType(paths);
        updateZoneLabels(mediaType);
    }
});

function setupDropZone(zoneEl, strategy) {
    zoneEl.addEventListener('dragenter', () => {
        if (!isProcessing) zoneEl.classList.add('drag-over');
    });

    zoneEl.addEventListener('dragleave', () => {
        zoneEl.classList.remove('drag-over');
    });

    zoneEl.addEventListener('drop', async (e) => {
        zoneEl.classList.remove('drag-over');
        if (isProcessing) return;

        const filePaths = await extractFilesFromEvent(e);
        if (filePaths.length > 0) {
            handleDropFiles(filePaths, strategy);
        }
    });
}

setupDropZone(zonePng, 'highQuality');
setupDropZone(zoneWebp, 'webOptimized');

// File Processing Execution
async function handleDropFiles(filePaths, strategy) {
    isProcessing = true;
    contentContainer.className = 'content-container processing';
    processingOverlay.classList.remove('hidden');

    // Create thumbnail cards (up to 3)
    fannedStack.innerHTML = '';
    const previewPaths = filePaths.slice(0, 3);
    previewPaths.forEach((filePath, index) => {
        const img = document.createElement('img');
        img.className = 'fanned-card';
        img.src = `file://${filePath}`;
        
        let rot = 0;
        let x = 0;
        let y = 0;
        if (previewPaths.length === 2) {
            rot = index === 0 ? -12 : 12;
            x = index === 0 ? -10 : 10;
            y = 2;
        } else if (previewPaths.length >= 3) {
            rot = index === 0 ? -18 : (index === 1 ? 0 : 18);
            x = index === 0 ? -15 : (index === 1 ? 0 : 15);
            y = index === 1 ? -4 : 6;
        }
        
        img.style.setProperty('--rot', `rotate(${rot}deg) translate(${x}px, ${y}px)`);
        fannedStack.appendChild(img);
    });

    statusProcessing.classList.remove('hidden');
    statusSuccess.classList.add('hidden');
    statusError.classList.add('hidden');

    resizeCanvas();
    drawFluidBackground('processing');

    const result = await window.burritoAPI.processFiles({
        filePaths,
        strategy,
        settings: currentSettings
    });

    if (result.success) {
        contentContainer.className = 'content-container success';
        statusProcessing.classList.add('hidden');
        statusSuccess.classList.remove('hidden');

        if (result.savingsPercentage !== undefined && result.savingsPercentage > 0) {
            savingsPill.textContent = `-${result.savingsPercentage}%`;
            savingsPill.style.display = 'inline-block';
        } else {
            savingsPill.style.display = 'none';
        }

        drawFluidBackground('success');

        setTimeout(() => {
            resetOverlay();
        }, 3500);

    } else {
        contentContainer.className = 'content-container error';
        statusProcessing.classList.add('hidden');
        statusError.classList.remove('hidden');
        errorMessage.textContent = result.error || 'CONVERSION FAILED';

        drawFluidBackground('error');

        setTimeout(() => {
            resetOverlay();
        }, 4000);
    }
}

function resetOverlay() {
    isProcessing = false;
    if (animFrameId) cancelAnimationFrame(animFrameId);

    processingOverlay.classList.add('hidden');
    contentContainer.className = 'content-container';
    fannedStack.innerHTML = '';

    statusProcessing.classList.add('hidden');
    statusSuccess.classList.add('hidden');
    statusError.classList.add('hidden');
}
