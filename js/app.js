
document.addEventListener('DOMContentLoaded', () => {

    const asciiCanvas = document.getElementById('ascii-canvas');
    const dropZone = document.getElementById('drop-zone');
    const dropOverlay = document.getElementById('drop-overlay');
    const emptyState = document.getElementById('empty-state');
    const fileUpload = document.getElementById('file-upload');
    const btnWebcam = document.getElementById('btn-webcam');
    const btnLoadDemo = document.getElementById('btn-load-demo');
    const toastEl = document.getElementById('toast');
    const crtOverlay = document.getElementById('crt-overlay');
    const btnClearScreen = document.getElementById('btn-clear-screen');


    const fpsDisplay = document.getElementById('fps-display');
    const gridDisplay = document.getElementById('grid-display');
    const statusBadge = document.getElementById('status-badge');


    const videoBar = document.getElementById('video-bar');
    const btnPlayPause = document.getElementById('btn-play-pause');
    const iconPlay = document.getElementById('icon-play');
    const iconPause = document.getElementById('icon-pause');
    const seekBar = document.getElementById('seek-bar');
    const currentTimeText = document.getElementById('current-time');
    const totalTimeText = document.getElementById('total-time');
    const btnMute = document.getElementById('btn-mute');
    const iconVolOn = document.getElementById('icon-vol-on');
    const iconVolMute = document.getElementById('icon-vol-mute');
    const btnTogglePip = document.getElementById('btn-toggle-pip');
    const pipPreview = document.getElementById('pip-preview');
    const pipContent = document.getElementById('pip-content');
    const pipClose = document.getElementById('pip-close');


    const btnCopyAscii = document.getElementById('btn-copy-ascii');
    const btnExportTxt = document.getElementById('btn-export-txt');
    const btnExportPng = document.getElementById('btn-export-png');
    const btnExportJpg = document.getElementById('btn-export-jpg');
    const btnConvertVideo = document.getElementById('btn-convert-video');
    const convertBtnText = document.getElementById('convert-btn-text');


    const modalConvert = document.getElementById('modal-convert');
    const modalConvertClose = document.getElementById('modal-convert-close');
    const convertProgressFill = document.getElementById('convert-progress-fill');
    const convertPercentText = document.getElementById('convert-percent-text');
    const convertTimeText = document.getElementById('convert-time-text');
    const btnCancelConvert = document.getElementById('btn-cancel-convert');


    const modalDownloadReady = document.getElementById('modal-download-ready');
    const modalDownloadClose = document.getElementById('modal-download-close');
    const downloadPreviewFrame = document.getElementById('download-preview-frame');
    const downloadFilename = document.getElementById('download-filename');
    const downloadFilesize = document.getElementById('download-filesize');
    const btnDirectDownload = document.getElementById('btn-direct-download');
    const btnOpenNewTab = document.getElementById('btn-open-new-tab');


    const sliderColumns = document.getElementById('slider-columns');
    const valColumns = document.getElementById('val-columns');
    const sliderTargetFps = document.getElementById('slider-target-fps');
    const valTargetFps = document.getElementById('val-target-fps');
    const sliderCharAspect = document.getElementById('slider-char-aspect');
    const valCharAspect = document.getElementById('val-char-aspect');

    const colorModeSelector = document.getElementById('color-mode-selector');
    const monoColorRow = document.getElementById('mono-color-row');
    const pickerCharColor = document.getElementById('picker-char-color');
    const pickerBgColor = document.getElementById('picker-bg-color');
    const checkInvert = document.getElementById('check-invert');
    const checkCrt = document.getElementById('check-crt');

    const charsetPreset = document.getElementById('charset-preset');
    const customCharsetWrapper = document.getElementById('custom-charset-wrapper');
    const customCharsetInput = document.getElementById('custom-charset-input');

    const sliderContrast = document.getElementById('slider-contrast');
    const valContrast = document.getElementById('val-contrast');
    const sliderBrightness = document.getElementById('slider-brightness');
    const valBrightness = document.getElementById('val-brightness');
    const sliderGamma = document.getElementById('slider-gamma');
    const valGamma = document.getElementById('val-gamma');
    const checkEdgeDetect = document.getElementById('check-edge-detect');
    const btnResetParams = document.getElementById('btn-reset-params');


    const engine = new AsciiEngine(asciiCanvas);

    const mediaHandler = new MediaHandler(engine, {
        onMediaLoaded: (info) => {
            emptyState.classList.add('hidden');
            document.getElementById('canvas-wrapper').classList.add('active');
            statusBadge.textContent = 'AKTİF';
            statusBadge.classList.add('status-ready');
            btnClearScreen.style.display = 'inline-flex';

            if (info.type === 'video') {
                videoBar.classList.remove('hidden');
                pipPreview.classList.remove('hidden');
                btnConvertVideo.style.display = 'inline-flex';
                convertBtnText.textContent = '🚀 Videoyu Dönüştür & İndir';
                pipContent.innerHTML = '';
                const pipVid = mediaHandler.video.cloneNode(true);
                pipVid.muted = true;
                pipVid.play().catch(() => {});
                pipContent.appendChild(pipVid);
                resetWebcamBtn();
                showToast(`Video yüklendi: ${info.name}`);
            } else if (info.type === 'image') {
                videoBar.classList.add('hidden');
                pipPreview.classList.remove('hidden');
                btnConvertVideo.style.display = 'inline-flex';
                convertBtnText.textContent = '🚀 ASCII Görsel İndir (PNG)';
                pipContent.innerHTML = '';
                const pipImg = mediaHandler.image.cloneNode(true);
                pipContent.appendChild(pipImg);
                resetWebcamBtn();
                showToast(`Görsel yüklendi: ${info.name}`);
            } else if (info.type === 'webcam') {
                videoBar.classList.add('hidden');
                pipPreview.classList.add('hidden');
                btnConvertVideo.style.display = 'none';
                setWebcamBtnActive();
                showToast('Kamera akışı aktif. Kapatmak için "Ekranı Temizle" veya "Kamerayı Kapat" butonuna basın.');
            } else if (info.type === 'demo') {
                videoBar.classList.add('hidden');
                pipPreview.classList.add('hidden');
                btnConvertVideo.style.display = 'none';
                resetWebcamBtn();
                showToast('3D Cyber Matrix Demo Başlatıldı');
            }
            updateGridDisplay();
        },
        onPlayStateChange: (isPlaying) => {
            if (isPlaying) {
                iconPlay.style.display = 'none';
                iconPause.style.display = 'block';
            } else {
                iconPlay.style.display = 'block';
                iconPause.style.display = 'none';
            }
        },
        onTimeUpdate: (current, duration) => {
            if (duration) {
                const progress = (current / duration) * 100;
                seekBar.value = progress;
                currentTimeText.textContent = formatTime(current);
                totalTimeText.textContent = formatTime(duration);
            }
        }
    });

    const converter = new AsciiConverter(asciiCanvas, engine, mediaHandler);


    converter.onProgress = (percent, curStr, totStr) => {
        convertProgressFill.style.width = `${percent}%`;
        convertPercentText.textContent = `${percent}%`;
        convertTimeText.textContent = `${curStr} / ${totStr}`;
    };


    converter.onConversionComplete = (info) => {
        modalConvert.classList.remove('active');


        downloadFilename.textContent = info.filename;
        downloadFilesize.textContent = info.sizeStr;
        btnDirectDownload.href = info.url;
        btnDirectDownload.download = info.filename;
        btnOpenNewTab.href = info.url;


        downloadPreviewFrame.innerHTML = '';
        if (info.type === 'video') {
            const vidPreview = document.createElement('video');
            vidPreview.src = info.url;
            vidPreview.controls = true;
            vidPreview.autoplay = true;
            vidPreview.loop = true;
            downloadPreviewFrame.appendChild(vidPreview);
        } else if (info.type === 'image') {
            const imgPreview = document.createElement('img');
            imgPreview.src = info.url;
            downloadPreviewFrame.appendChild(imgPreview);
        }

        modalDownloadReady.classList.add('active');
        showToast(`✅ Dönüştürme tamamlandı! ${info.filename} indirildi.`);
    };


    function setWebcamBtnActive() {
        btnWebcam.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="1" y1="1" x2="23" y2="23"></line>
                <path d="M21 21l-3.34-3.34L3 3M23 7l-7 5 7 5V7z"></path>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
            </svg>
            <span>Kamerayı Kapat</span>
        `;
        btnWebcam.classList.add('btn-danger');
    }

    function resetWebcamBtn() {
        btnWebcam.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 7l-7 5 7 5V7z"></path>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
            </svg>
            <span>Canlı Kamera</span>
        `;
        btnWebcam.classList.remove('btn-danger');
    }


    btnClearScreen.addEventListener('click', () => {
        mediaHandler.stopCurrentMedia();
        engine.clear();
        emptyState.classList.remove('hidden');
        document.getElementById('canvas-wrapper').classList.remove('active');
        videoBar.classList.add('hidden');
        pipPreview.classList.add('hidden');
        btnConvertVideo.style.display = 'none';
        btnClearScreen.style.display = 'none';
        statusBadge.textContent = 'HAZIR';
        statusBadge.classList.remove('status-ready');
        resetWebcamBtn();
        showToast('Ekran temizlendi.');
    });

    function showToast(msg) {
        toastEl.textContent = msg;
        toastEl.classList.add('show');
        setTimeout(() => toastEl.classList.remove('show'), 3500);
    }

    function formatTime(sec) {
        if (!sec || isNaN(sec)) return '00:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    function updateGridDisplay() {
        if (mediaHandler.activeMedia) {
            const w = mediaHandler.activeMedia.videoWidth || mediaHandler.activeMedia.naturalWidth || mediaHandler.activeMedia.width || 640;
            const h = mediaHandler.activeMedia.videoHeight || mediaHandler.activeMedia.naturalHeight || mediaHandler.activeMedia.height || 480;
            const { cols, rows } = engine.calculateDimensions(w, h);
            gridDisplay.textContent = `${cols} × ${rows}`;
        } else {
            gridDisplay.textContent = `${engine.params.columns} cols`;
        }
    }


    setInterval(() => {
        fpsDisplay.textContent = engine.fps;
    }, 500);


    fileUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            mediaHandler.loadFile(file).catch(err => showToast(err.message));
        }
        fileUpload.value = '';
    });

    btnWebcam.addEventListener('click', () => {
        if (mediaHandler.mediaType === 'webcam') {
            mediaHandler.stopCurrentMedia();
            engine.clear();
            emptyState.classList.remove('hidden');
            document.getElementById('canvas-wrapper').classList.remove('active');
            statusBadge.textContent = 'HAZIR';
            statusBadge.classList.remove('status-ready');
            btnClearScreen.style.display = 'none';
            resetWebcamBtn();
            showToast('Kamera kapatıldı.');
        } else {
            mediaHandler.startWebcam().catch(err => showToast(err.message));
        }
    });

    btnLoadDemo.addEventListener('click', () => {
        mediaHandler.loadDemo();
    });


    ['dragenter', 'dragover'].forEach(eventName => {
        window.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropOverlay.classList.add('active');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropOverlay.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropOverlay.classList.remove('active');
        });
    });

    window.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropOverlay.classList.remove('active');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            mediaHandler.loadFile(e.dataTransfer.files[0]).catch(err => showToast(err.message));
        }
    });


    window.addEventListener('paste', (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                mediaHandler.loadFile(blob).catch(err => showToast(err.message));
                showToast('Panodan resim yapıştırıldı!');
                break;
            }
        }
    });


    btnPlayPause.addEventListener('click', () => mediaHandler.togglePlay());

    seekBar.addEventListener('input', (e) => {
        if (mediaHandler.video.duration) {
            const seekTo = (e.target.value / 100) * mediaHandler.video.duration;
            mediaHandler.seek(seekTo);
        }
    });

    btnMute.addEventListener('click', () => {
        const isMuted = mediaHandler.toggleMute();
        if (isMuted) {
            iconVolOn.style.display = 'none';
            iconVolMute.style.display = 'block';
            showToast('Ses kapatıldı');
        } else {
            iconVolOn.style.display = 'block';
            iconVolMute.style.display = 'none';
            showToast('Ses açıldı');
        }
    });

    btnTogglePip.addEventListener('click', () => {
        pipPreview.classList.toggle('hidden');
    });

    pipClose.addEventListener('click', () => {
        pipPreview.classList.add('hidden');
    });




    btnConvertVideo.addEventListener('click', async () => {
        if (!mediaHandler.activeMedia) {
            showToast('Lütfen önce bir video veya görsel yükleyin.');
            return;
        }

        if (mediaHandler.mediaType === 'video') {
            try {

                convertProgressFill.style.width = '0%';
                convertPercentText.textContent = '0%';
                convertTimeText.textContent = '00:00 / 00:00';
                modalConvert.classList.add('active');


                await converter.convertVideo(engine.params.targetFps);
            } catch (err) {
                modalConvert.classList.remove('active');
                showToast(err.message);
            }
        } else if (mediaHandler.mediaType === 'image') {
            converter.exportImage('png');
        }
    });


    btnCancelConvert.addEventListener('click', () => {
        converter.cancelConversion();
        modalConvert.classList.remove('active');
        showToast('Dönüştürme iptal edildi.');
    });

    modalConvertClose.addEventListener('click', () => {
        converter.cancelConversion();
        modalConvert.classList.remove('active');
    });


    btnExportPng.addEventListener('click', () => {
        if (!mediaHandler.activeMedia) {
            showToast('Lütfen önce bir video veya görsel yükleyin.');
            return;
        }
        converter.exportImage('png');
    });


    btnExportJpg.addEventListener('click', () => {
        if (!mediaHandler.activeMedia) {
            showToast('Lütfen önce bir video veya görsel yükleyin.');
            return;
        }
        converter.exportImage('jpg');
    });


    btnExportTxt.addEventListener('click', () => {
        try {
            if (!mediaHandler.activeMedia) {
                showToast('Lütfen önce bir video veya görsel yükleyin.');
                return;
            }
            converter.exportTXT();
        } catch (err) {
            showToast(err.message);
        }
    });


    btnCopyAscii.addEventListener('click', async () => {
        if (!mediaHandler.activeMedia) {
            showToast('Lütfen önce bir video veya görsel yükleyin.');
            return;
        }
        const success = await converter.copyToClipboard();
        if (success) showToast('ASCII metni panoya kopyalandı! (Ctrl+V)');
        else showToast('Panoya kopyalama başarısız oldu.');
    });


    modalDownloadClose.addEventListener('click', () => {
        modalDownloadReady.classList.remove('active');
    });



    sliderColumns.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        valColumns.textContent = val;
        engine.setParam('columns', val);
        updateGridDisplay();
        mediaHandler.requestSingleFrame();
    });


    sliderTargetFps.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        valTargetFps.textContent = `${val} FPS`;
        engine.setParam('targetFps', val);
    });


    sliderCharAspect.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        valCharAspect.textContent = val.toFixed(2);
        engine.setParam('charAspect', val);
        updateGridDisplay();
        mediaHandler.requestSingleFrame();
    });


    colorModeSelector.addEventListener('click', (e) => {
        const btn = e.target.closest('.seg-btn');
        if (!btn) return;
        colorModeSelector.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        engine.setParam('colorMode', mode);

        if (mode === 'mono') {
            monoColorRow.style.display = 'flex';
        } else {
            monoColorRow.style.display = 'none';
        }
        mediaHandler.requestSingleFrame();
    });


    pickerCharColor.addEventListener('input', (e) => {
        engine.setParam('charColor', e.target.value);
        mediaHandler.requestSingleFrame();
    });

    pickerBgColor.addEventListener('input', (e) => {
        engine.setParam('bgColor', e.target.value);
        mediaHandler.requestSingleFrame();
    });


    checkInvert.addEventListener('change', (e) => {
        engine.setParam('invert', e.target.checked);
        mediaHandler.requestSingleFrame();
    });


    checkCrt.addEventListener('change', (e) => {
        if (e.target.checked) {
            crtOverlay.classList.remove('disabled');
        } else {
            crtOverlay.classList.add('disabled');
        }
    });


    charsetPreset.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'custom') {
            customCharsetWrapper.style.display = 'block';
        } else {
            customCharsetWrapper.style.display = 'none';
        }
        engine.setParam('selectedCharset', val);
        mediaHandler.requestSingleFrame();
    });

    customCharsetInput.addEventListener('input', (e) => {
        engine.setCustomCharset(e.target.value);
        mediaHandler.requestSingleFrame();
    });


    sliderContrast.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        valContrast.textContent = `${val.toFixed(2)}x`;
        engine.setParam('contrast', val);
        mediaHandler.requestSingleFrame();
    });

    sliderBrightness.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        valBrightness.textContent = val;
        engine.setParam('brightness', val);
        mediaHandler.requestSingleFrame();
    });

    sliderGamma.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        valGamma.textContent = val.toFixed(1);
        engine.setParam('gamma', val);
        mediaHandler.requestSingleFrame();
    });

    checkEdgeDetect.addEventListener('change', (e) => {
        engine.setParam('edgeDetect', e.target.checked);
        mediaHandler.requestSingleFrame();
    });


    btnResetParams.addEventListener('click', () => {
        sliderColumns.value = 100;
        valColumns.textContent = 100;
        engine.setParam('columns', 100);

        sliderTargetFps.value = 30;
        valTargetFps.textContent = '30 FPS';
        engine.setParam('targetFps', 30);

        sliderCharAspect.value = 0.52;
        valCharAspect.textContent = '0.52';
        engine.setParam('charAspect', 0.52);

        sliderContrast.value = 1.1;
        valContrast.textContent = '1.10x';
        engine.setParam('contrast', 1.1);

        sliderBrightness.value = 0;
        valBrightness.textContent = 0;
        engine.setParam('brightness', 0);

        sliderGamma.value = 1.0;
        valGamma.textContent = '1.0';
        engine.setParam('gamma', 1.0);

        checkInvert.checked = false;
        engine.setParam('invert', false);

        checkEdgeDetect.checked = false;
        engine.setParam('edgeDetect', false);

        pickerBgColor.value = '#05080d';
        engine.setParam('bgColor', '#05080d');

        mediaHandler.requestSingleFrame();
        showToast('Tüm ayarlar varsayılana döndürüldü');
    });


    window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

        if (e.code === 'Space') {
            e.preventDefault();
            mediaHandler.togglePlay();
        } else if (e.code === 'KeyM') {
            btnMute.click();
        } else if (e.code === 'KeyC') {
            btnCopyAscii.click();
        }
    });
});
