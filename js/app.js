// Main application logic
let currentFile = null;
let formattedCanvas = null;
let isProcessing = false;
let cameraStream = null;
let activeMode = 'single'; // 'single' | 'animation'

// Recording state
let isRecording = false;
let mediaRecorder = null;
let recordedChunks = [];
let recordingSecondsLeft = 10;
let recordingTimerInterval = null;

// Animation state
let animationImageAFile = null;
let animationImageBFile = null;
let animationFrames = [];
let animationOptions = {
    durationSeconds: 2,
    fps: 24,
    direction: 'pingpong',
    loop: true
};
let animationVideoBlob = null;
let animationGifBlob = null;
let liveVideoPreviewCleanup = null;
let liveVideoPreviewUrl = null;
let liveVideoPreviewFile = null;

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
const toggleUploadBtn = document.getElementById('toggle-upload-btn');
const uploadPanel = document.getElementById('upload-panel');
const cameraSection = document.getElementById('camera-section');
const cameraPreview = document.getElementById('camera-preview');
const captureBtn = document.getElementById('capture-btn');
const recordBtn = document.getElementById('record-btn');
const stopRecordBtn = document.getElementById('stop-record-btn');
const recordingStatus = document.getElementById('recording-status');
const recordingTimer = document.getElementById('recording-timer');
const cameraCancelBtn = document.getElementById('camera-cancel-btn');

// Animation DOM
const animationImage1Input = document.getElementById('animation-image-1');
const animationImage2Input = document.getElementById('animation-image-2');
const fadeDurationInput = document.getElementById('fade-duration');
const fadeDurationValue = document.getElementById('fade-duration-value');
const fadeFpsSelect = document.getElementById('fade-fps');
const fadeDirectionSelect = document.getElementById('fade-direction');
const fadeLoopInput = document.getElementById('fade-loop');
const generateAnimationBtn = document.getElementById('generate-animation-btn');
const animationExportFormat = document.getElementById('animation-export-format');
const downloadAnimationBtn = document.getElementById('download-animation-btn');
const animationStatus = document.getElementById('animation-status');
const animationExportProgressWrap = document.getElementById('animation-export-progress-wrap');
const animationExportProgressFill = document.getElementById('animation-export-progress-fill');
const animationExportProgressText = document.getElementById('animation-export-progress-text');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

function setupEventListeners() {
    if (dropZone && fileInput) {
        dropZone.addEventListener('click', () => {
            fileInput.click();
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            handleFileSelect(e.target.files[0]);
        });
    }

    if (dropZone) {
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
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', handleDownload);
    }

    if (viewerModeBtn) {
        viewerModeBtn.addEventListener('click', () => {
            if (formattedCanvas) {
                enterViewerMode();
            }
        });
    }

    if (cameraBtn) {
        cameraBtn.addEventListener('click', openCamera);
    }
    if (toggleUploadBtn) {
        toggleUploadBtn.addEventListener('click', toggleUploadPanel);
    }
    if (captureBtn) {
        captureBtn.addEventListener('click', captureFromCamera);
    }
    if (recordBtn) {
        recordBtn.addEventListener('click', startRecording);
    }
    if (stopRecordBtn) {
        stopRecordBtn.addEventListener('click', stopRecording);
    }
    if (cameraCancelBtn) {
        cameraCancelBtn.addEventListener('click', closeCamera);
    }

    if (animationImage1Input) {
        animationImage1Input.addEventListener('change', (e) => {
            animationImageAFile = e.target.files[0] || null;
        });
    }
    if (animationImage2Input) {
        animationImage2Input.addEventListener('change', (e) => {
            animationImageBFile = e.target.files[0] || null;
        });
    }
    if (fadeDurationInput && fadeDurationValue) {
        fadeDurationInput.addEventListener('input', () => {
            fadeDurationValue.textContent = Number(fadeDurationInput.value).toFixed(1);
        });
    }
    if (generateAnimationBtn) {
        generateAnimationBtn.addEventListener('click', generateFadeAnimation);
    }
    if (downloadAnimationBtn) {
        downloadAnimationBtn.addEventListener('click', downloadAnimation);
    }
}

function handleFileSelect(file) {
    if (!file) return;

    const validTypes = ['image/', 'video/'];
    if (!validTypes.some((type) => file.type.startsWith(type))) {
        alert('Please upload an image or video file.');
        return;
    }

    activeMode = 'single';
    cleanupLiveVideoPreview();
    animationFrames = [];
    animationVideoBlob = null;
    animationGifBlob = null;
    if (downloadAnimationBtn) {
        downloadAnimationBtn.disabled = true;
    }
    if (generateAnimationBtn) {
        generateAnimationBtn.disabled = false;
    }
    setAnimationStatus('');
    setAnimationExportProgress(0, false);
    if (Preview.stopAnimation) {
        Preview.stopAnimation();
    }

    currentFile = file;

    if (fileName) fileName.textContent = file.name;
    if (fileType) fileType.textContent = file.type || 'Unknown';
    if (fileInfo) fileInfo.classList.remove('hidden');

    processFile(file);
}

function processFile(file) {
    isProcessing = true;
    if (processingSection) processingSection.classList.remove('hidden');
    if (previewSection) previewSection.classList.add('hidden');
    if (viewerSection) viewerSection.classList.add('hidden');

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
            updateProgress(75);
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
    video.muted = true;
    video.playsInline = true;

    const objectUrl = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
        updateProgress(50);
        const seekTo = Math.min(0.1, Math.max((video.duration || 0) / 2, 0));
        video.currentTime = seekTo;
    };
    video.onseeked = () => {
        VideoProcessor.formatForHologram(video, file, (canvas) => {
            updateProgress(100);
            formattedCanvas = canvas;
            URL.revokeObjectURL(objectUrl);
            showPreview();
        });
    };
    video.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        isProcessing = false;
        if (processingSection) processingSection.classList.add('hidden');
        alert('Could not process this video file.');
    };
    video.src = objectUrl;
    video.load();
}

function updateProgress(percent) {
    const progressFill = document.getElementById('progress-fill');
    if (progressFill) {
        progressFill.style.width = `${percent}%`;
    }
}

function showPreview() {
    isProcessing = false;
    if (processingSection) processingSection.classList.add('hidden');
    if (previewSection) previewSection.classList.remove('hidden');

    if (activeMode === 'animation' && animationFrames.length > 0) {
        Preview.showAnimatedPreview(animationFrames, animationOptions.fps, animationOptions.loop);
    } else if (formattedCanvas) {
        Preview.showPreview(formattedCanvas);
    }
}

async function handleDownload() {
    if (!formattedCanvas || !currentFile) return;

    const baseName = currentFile.name.split('.')[0];
    if (downloadBtn) {
        downloadBtn.disabled = true;
    }

    try {
        if (currentFile.type.startsWith('video/')) {
            await VideoProcessor.downloadVideo(currentFile, baseName);
        } else {
            formattedCanvas.toBlob((blob) => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${baseName}_hologram.png`;
                a.click();
                URL.revokeObjectURL(url);
            }, 'image/png');
        }
    } catch (err) {
        console.error(err);
        alert('Download failed. Please try again.');
    } finally {
        if (downloadBtn) {
            downloadBtn.disabled = false;
        }
    }
}

function enterViewerMode() {
    cleanupLiveVideoPreview();
    if (Preview.stopAnimation) {
        Preview.stopAnimation();
    }
    if (previewSection) previewSection.classList.add('hidden');
    if (viewerSection) viewerSection.classList.remove('hidden');
    const isVideo = currentFile && currentFile.type.startsWith('video/');
    Viewer.initialize(formattedCanvas, isVideo);
}

async function openCamera() {
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: true
        });
        if (cameraPreview) {
            cameraPreview.srcObject = cameraStream;
        }
        if (cameraSection) {
            cameraSection.classList.remove('hidden');
        }
        resetRecordingUi();
    } catch (err) {
        console.error('Camera error:', err);
        alert('Could not access camera/microphone. Please allow permissions.');
    }
}

function resetRecordingUi() {
    recordingSecondsLeft = 10;
    if (recordingTimer) {
        recordingTimer.textContent = String(recordingSecondsLeft);
    }
    if (recordingStatus) {
        recordingStatus.classList.add('hidden');
        recordingStatus.classList.remove('recording-live');
    }
    if (recordBtn) {
        recordBtn.disabled = false;
    }
    if (stopRecordBtn) {
        stopRecordBtn.classList.add('hidden');
    }
}

function getSupportedRecordingMimeType() {
    const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4'
    ];
    for (const mimeType of mimeTypes) {
        if (window.MediaRecorder && MediaRecorder.isTypeSupported(mimeType)) {
            return mimeType;
        }
    }
    return '';
}

function startRecordingTimer() {
    if (recordingStatus) {
        recordingStatus.classList.remove('hidden');
        recordingStatus.classList.add('recording-live');
    }
    if (recordingTimer) {
        recordingTimer.textContent = String(recordingSecondsLeft);
    }

    recordingTimerInterval = window.setInterval(() => {
        recordingSecondsLeft -= 1;
        if (recordingTimer) {
            recordingTimer.textContent = String(Math.max(recordingSecondsLeft, 0));
        }
        if (recordingSecondsLeft <= 0) {
            stopRecording();
        }
    }, 1000);
}

function startRecording() {
    if (!cameraStream) {
        alert('Open the camera first.');
        return;
    }
    if (!window.MediaRecorder) {
        alert('Recording is not supported in this browser.');
        return;
    }
    if (isRecording) return;

    try {
        const mimeType = getSupportedRecordingMimeType();
        mediaRecorder = mimeType ? new MediaRecorder(cameraStream, { mimeType }) : new MediaRecorder(cameraStream);
    } catch (err) {
        console.error(err);
        alert('Could not start recording with this browser/device.');
        return;
    }

    isRecording = true;
    recordingSecondsLeft = 10;
    recordedChunks = [];

    mediaRecorder.addEventListener('dataavailable', (e) => {
        if (e.data && e.data.size > 0) {
            recordedChunks.push(e.data);
        }
    });

    mediaRecorder.addEventListener('stop', () => {
        isRecording = false;
        if (recordingTimerInterval) {
            window.clearInterval(recordingTimerInterval);
            recordingTimerInterval = null;
        }

        const type = mediaRecorder.mimeType || 'video/webm';
        const blob = new Blob(recordedChunks, { type });
        const ext = type.includes('mp4') ? 'mp4' : 'webm';
        const file = new File([blob], `camera-recording.${ext}`, { type: blob.type || `video/${ext}` });

        closeCamera(false);
        previewRecordedVideoInBrowser(file);
        resetRecordingUi();
    });

    mediaRecorder.start(250);

    if (recordBtn) {
        recordBtn.disabled = true;
    }
    if (stopRecordBtn) {
        stopRecordBtn.classList.remove('hidden');
    }
    startRecordingTimer();
}

function stopRecording() {
    if (!isRecording || !mediaRecorder) return;
    if (recordingTimerInterval) {
        window.clearInterval(recordingTimerInterval);
        recordingTimerInterval = null;
    }
    if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
}

function closeCamera(keepSectionOpen = false) {
    if (isRecording) {
        stopRecording();
    }
    if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
        cameraStream = null;
    }
    if (cameraPreview) {
        cameraPreview.srcObject = null;
    }
    if (cameraSection && !keepSectionOpen) {
        cameraSection.classList.add('hidden');
    }
    resetRecordingUi();
}

function captureFromCamera() {
    if (!cameraPreview || !cameraStream) return;
    const video = cameraPreview;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
        alert('Waiting for camera. Try again in a moment.');
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
        activeMode = 'single';
        handleFileSelect(file);
    }, 'image/png');
}

async function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function generateFadeAnimation() {
    if (!animationImageAFile || !animationImageBFile) {
        alert('Please choose both Image A and Image B.');
        return;
    }

    if (typeof AnimationProcessor === 'undefined') {
        alert('Animation processor is not loaded.');
        return;
    }

    isProcessing = true;
    cleanupLiveVideoPreview();
    setButtonBusy(generateAnimationBtn, true, 'Generating...', 'Generate Fade Animation');
    if (downloadAnimationBtn) downloadAnimationBtn.disabled = true;
    setAnimationStatus('Generating hologram fade frames...');
    setAnimationExportProgress(0, false);
    if (processingSection) processingSection.classList.remove('hidden');
    if (previewSection) previewSection.classList.add('hidden');
    if (viewerSection) viewerSection.classList.add('hidden');
    updateProgress(10);
    try {
        const [imgA, imgB] = await Promise.all([
            loadImageFromFile(animationImageAFile),
            loadImageFromFile(animationImageBFile)
        ]);
        updateProgress(45);

        animationOptions = {
            durationSeconds: Number(fadeDurationInput?.value || 2),
            fps: Number(fadeFpsSelect?.value || 24),
            direction: fadeDirectionSelect?.value || 'pingpong',
            loop: !!fadeLoopInput?.checked
        };

        animationFrames = AnimationProcessor.generateFadeAnimation(imgA, imgB, animationOptions);
        updateProgress(90);
        if (!animationFrames.length) {
            throw new Error('No animation frames generated');
        }

        activeMode = 'animation';
        formattedCanvas = animationFrames[0];
        currentFile = new File([new Blob()], 'fade-animation', { type: 'application/x-animation' });
        if (fileName) fileName.textContent = 'fade-animation';
        if (fileType) fileType.textContent = 'Animation';
        if (fileInfo) fileInfo.classList.remove('hidden');

        animationVideoBlob = null;
        animationGifBlob = null;
        if (downloadAnimationBtn) downloadAnimationBtn.disabled = false;
        setAnimationStatus(`Ready: ${animationFrames.length} frames generated.`);
        setAnimationExportProgress(0, false);

        updateProgress(100);
        showPreview();
    } catch (err) {
        console.error(err);
        isProcessing = false;
        if (processingSection) processingSection.classList.add('hidden');
        setAnimationStatus('Could not generate fade animation.', true);
        alert('Could not generate fade animation.');
    } finally {
        setButtonBusy(generateAnimationBtn, false, 'Generating...', 'Generate Fade Animation');
    }
}

async function downloadAnimation() {
    if (!animationFrames.length) {
        alert('Generate an animation first.');
        return;
    }
    const format = animationExportFormat?.value || 'video';
    setButtonBusy(downloadAnimationBtn, true, 'Exporting...', 'Download Animation');
    setAnimationStatus(format === 'gif' ? 'Exporting GIF, please wait...' : 'Encoding video, please wait...');
    setAnimationExportProgress(0, true);

    try {
        if (format === 'gif') {
            if (!animationGifBlob) {
                animationGifBlob = await AnimationProcessor.exportAsGIF(
                    animationFrames,
                    animationOptions.fps,
                    (pct) => {
                        setAnimationExportProgress(pct, true);
                        setAnimationStatus(`Exporting GIF... ${pct}%`);
                    }
                );
            }
            saveBlob(animationGifBlob, 'fade-animation_hologram.gif');
            setAnimationStatus('GIF export complete.');
            setAnimationExportProgress(100, true);
        } else {
            if (!animationVideoBlob) {
                animationVideoBlob = await AnimationProcessor.exportAsVideo(
                    animationFrames,
                    animationOptions.fps,
                    (pct) => {
                        setAnimationExportProgress(pct, true);
                        setAnimationStatus(`Encoding video... ${pct}%`);
                    }
                );
            }
            const ext = animationVideoBlob.type.includes('mp4') ? 'mp4' : 'webm';
            saveBlob(animationVideoBlob, `fade-animation_hologram.${ext}`);
            setAnimationStatus(`Video export complete (${ext.toUpperCase()}).`);
            setAnimationExportProgress(100, true);
        }
    } catch (err) {
        console.error(err);
        setAnimationStatus('Animation export failed. Try another format.', true);
        setAnimationExportProgress(0, false);
        alert('Animation export failed. Try another format.');
    } finally {
        setButtonBusy(downloadAnimationBtn, false, 'Exporting...', 'Download Animation');
    }
}

function saveBlob(blob, fileNameToSave) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileNameToSave;
    a.click();
    URL.revokeObjectURL(url);
}

function setButtonBusy(button, isBusy, busyText, idleText) {
    if (!button) return;
    button.disabled = isBusy;
    button.textContent = isBusy ? busyText : idleText;
    button.classList.toggle('is-busy', isBusy);
}

function setAnimationStatus(message, isError = false) {
    if (!animationStatus) return;
    if (!message) {
        animationStatus.textContent = '';
        animationStatus.classList.add('hidden');
        animationStatus.classList.remove('text-red-600');
        animationStatus.classList.add('text-[#1865BF]');
        return;
    }
    animationStatus.textContent = message;
    animationStatus.classList.remove('hidden');
    if (isError) {
        animationStatus.classList.remove('text-[#1865BF]');
        animationStatus.classList.add('text-red-600');
    } else {
        animationStatus.classList.remove('text-red-600');
        animationStatus.classList.add('text-[#1865BF]');
    }
}

function setAnimationExportProgress(percent, visible) {
    if (!animationExportProgressWrap || !animationExportProgressFill || !animationExportProgressText) return;
    const safePercent = Math.max(0, Math.min(100, Math.round(percent)));
    if (visible) {
        animationExportProgressWrap.classList.remove('hidden');
    } else {
        animationExportProgressWrap.classList.add('hidden');
    }
    animationExportProgressFill.style.width = `${safePercent}%`;
    animationExportProgressText.textContent = `${safePercent}%`;
}

function toggleUploadPanel() {
    if (!uploadPanel || !toggleUploadBtn) return;
    const willOpen = uploadPanel.classList.contains('hidden');
    uploadPanel.classList.toggle('hidden');
    toggleUploadBtn.textContent = willOpen ? 'Hide upload' : 'Upload file';
}

function cleanupLiveVideoPreview() {
    if (liveVideoPreviewCleanup) {
        liveVideoPreviewCleanup();
        liveVideoPreviewCleanup = null;
    }
    if (liveVideoPreviewUrl) {
        URL.revokeObjectURL(liveVideoPreviewUrl);
        liveVideoPreviewUrl = null;
    }
    liveVideoPreviewFile = null;
}

function previewRecordedVideoInBrowser(file) {
    cleanupLiveVideoPreview();
    if (Preview.stopAnimation) {
        Preview.stopAnimation();
    }
    activeMode = 'single';
    currentFile = file;
    liveVideoPreviewFile = file;

    if (fileName) fileName.textContent = file.name;
    if (fileType) fileType.textContent = file.type || 'video/webm';
    if (fileInfo) fileInfo.classList.remove('hidden');

    isProcessing = true;
    if (processingSection) processingSection.classList.remove('hidden');
    if (previewSection) previewSection.classList.add('hidden');
    if (viewerSection) viewerSection.classList.add('hidden');
    updateProgress(20);

    const previewCanvas = document.getElementById('preview-canvas');
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    liveVideoPreviewUrl = URL.createObjectURL(file);
    video.src = liveVideoPreviewUrl;

    video.addEventListener('loadeddata', () => {
        if (previewCanvas) {
            liveVideoPreviewCleanup = VideoProcessor.startHologramPreview(video, previewCanvas, {
                maxWidth: 800,
                loop: true,
                onFrame: (frameCanvas) => {
                    // Keep Viewer Mode synced to a real rendered frame, not metadata timing.
                    formattedCanvas = frameCanvas;
                },
                onAfterDraw: (ctx, width, height) => {
                    Preview.drawCrossGuides(ctx, width, height);
                }
            });
        }

        updateProgress(70);
        updateProgress(100);
        isProcessing = false;
        if (processingSection) processingSection.classList.add('hidden');
        if (previewSection) previewSection.classList.remove('hidden');
    }, { once: true });

    video.addEventListener('error', () => {
        cleanupLiveVideoPreview();
        isProcessing = false;
        if (processingSection) processingSection.classList.add('hidden');
        alert('Could not preview recorded video.');
    }, { once: true });
}

// Export for use in other modules
window.App = {
    exitViewerMode: () => {
        if (viewerSection) viewerSection.classList.add('hidden');
        if (previewSection) previewSection.classList.remove('hidden');
        if (liveVideoPreviewFile) {
            previewRecordedVideoInBrowser(liveVideoPreviewFile);
        } else if (activeMode === 'animation' && animationFrames.length > 0) {
            Preview.showAnimatedPreview(animationFrames, animationOptions.fps, animationOptions.loop);
        }
    },
    getFormattedCanvas: () => formattedCanvas
};
