// Main application logic
let currentFile = null;
let formattedCanvas = null;
let isProcessing = false;
let cameraStream = null;

// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileInfo = document.getElementById('file-info');
const fileName = document.getElementById('file-name');
const fileType = document.getElementById('file-type');
const processingSection = document.getElementById('processing-section');
const previewSection = document.getElementById('preview-section');
const viewerSection = document.getElementById('viewer-section');
const downloadBtn = document.getElementById('download-btn');
const viewerModeBtn = document.getElementById('viewer-mode-btn');
const cameraBtn = document.getElementById('camera-btn');
const cameraSection = document.getElementById('camera-section');
const cameraPreview = document.getElementById('camera-preview');
const captureBtn = document.getElementById('capture-btn');
const cameraCancelBtn = document.getElementById('camera-cancel-btn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

function setupEventListeners() {
    // File input click
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        handleFileSelect(e.target.files[0]);
    });

    // Drag and drop
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
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    // Download button
    downloadBtn.addEventListener('click', handleDownload);

    // Viewer mode button
    viewerModeBtn.addEventListener('click', () => {
        if (formattedCanvas) {
            enterViewerMode();
        }
    });

    // Camera: open camera
    if (cameraBtn) {
        cameraBtn.addEventListener('click', openCamera);
    }
    if (captureBtn) {
        captureBtn.addEventListener('click', captureFromCamera);
    }
    if (cameraCancelBtn) {
        cameraCancelBtn.addEventListener('click', closeCamera);
    }
}

function handleFileSelect(file) {
    if (!file) return;

    // Validate file type
    const validTypes = ['image/', 'video/'];
    if (!validTypes.some(type => file.type.startsWith(type))) {
        alert('Please upload an image or video file.');
        return;
    }

    currentFile = file;
    
    // Show file info
    fileName.textContent = file.name;
    fileType.textContent = file.type || 'Unknown';
    fileInfo.classList.remove('hidden');

    // Process file
    processFile(file);
}

function processFile(file) {
    isProcessing = true;
    processingSection.classList.remove('hidden');
    previewSection.classList.add('hidden');
    viewerSection.classList.add('hidden');

    // Update progress
    updateProgress(10);

    if (file.type.startsWith('image/')) {
        processImage(file);
    } else if (file.type.startsWith('video/')) {
        processVideo(file);
    }
}

function processImage(file) {
    updateProgress(30);
    
    const reader = new FileReader();
    reader.onload = (e) => {
        updateProgress(50);
        const img = new Image();
        img.onload = () => {
            updateProgress(70);
            formattedCanvas = ImageProcessor.formatForHologram(img);
            updateProgress(100);
            showPreview();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function processVideo(file) {
    updateProgress(30);
    
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true; // Mute for processing
    video.onloadedmetadata = () => {
        updateProgress(50);
        video.currentTime = 0.1; // Seek to a frame
        video.onseeked = () => {
            VideoProcessor.formatForHologram(video, file, (canvas) => {
                updateProgress(100);
                formattedCanvas = canvas;
                showPreview();
            });
        };
    };
    video.src = URL.createObjectURL(file);
    video.load();
}

function updateProgress(percent) {
    const progressFill = document.getElementById('progress-fill');
    if (progressFill) {
        progressFill.style.width = percent + '%';
    }
}

function showPreview() {
    isProcessing = false;
    processingSection.classList.add('hidden');
    previewSection.classList.remove('hidden');
    
    // Display preview
    Preview.showPreview(formattedCanvas);
}

function handleDownload() {
    if (!formattedCanvas) return;

    const fileName = currentFile.name.split('.')[0];
    const extension = currentFile.type.startsWith('video/') ? 'mp4' : 'png';
    
    if (currentFile.type.startsWith('video/')) {
        // For videos, we need to handle differently
        VideoProcessor.downloadVideo(formattedCanvas, fileName);
    } else {
        // For images
        formattedCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileName}_hologram.${extension}`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }
}

function enterViewerMode() {
    previewSection.classList.add('hidden');
    viewerSection.classList.remove('hidden');
    const isVideo = currentFile && currentFile.type.startsWith('video/');
    Viewer.initialize(formattedCanvas, isVideo);
}

async function openCamera() {
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        if (cameraPreview) {
            cameraPreview.srcObject = cameraStream;
        }
        if (cameraSection) {
            cameraSection.classList.remove('hidden');
        }
    } catch (err) {
        console.error('Camera error:', err);
        alert('Could not access the camera. Please allow camera access or use upload instead.');
    }
}

function closeCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
        cameraStream = null;
    }
    if (cameraPreview) {
        cameraPreview.srcObject = null;
    }
    if (cameraSection) {
        cameraSection.classList.add('hidden');
    }
}

function captureFromCamera() {
    if (!cameraPreview || !cameraStream) return;
    const video = cameraPreview;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
        alert('Waiting for camera… Try again in a moment.');
        return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    closeCamera();
    canvas.toBlob((blob) => {
        if (!blob) return;
        const file = new File([blob], 'camera-capture.png', { type: 'image/png' });
        currentFile = file;
        if (fileName) fileName.textContent = file.name;
        if (fileType) fileType.textContent = file.type;
        if (fileInfo) fileInfo.classList.remove('hidden');
        processFile(file);
    }, 'image/png');
}

// Export for use in other modules
window.App = {
    exitViewerMode: () => {
        viewerSection.classList.add('hidden');
        previewSection.classList.remove('hidden');
    },
    getFormattedCanvas: () => formattedCanvas
};
