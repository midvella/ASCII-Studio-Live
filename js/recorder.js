class AsciiConverter {
    constructor(canvas, engine, mediaHandler) {
        this.canvas = canvas;
        this.engine = engine;
        this.mediaHandler = mediaHandler;

        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isConverting = false;
        
        this.currentDuration = 0;
        this.animFrameId = null;


        this.onProgress = null;
        this.onConversionComplete = null;
    }

    getBestMimeType() {
        const candidates = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8',
            'video/webm',
            'video/mp4;codecs=avc1',
            'video/mp4'
        ];
        for (const type of candidates) {
            if (window.MediaRecorder && MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return '';
    }

    async fixWebmDuration(blob, durationMs) {
        if (!blob || !blob.type.includes('webm') || durationMs <= 0) {
            return blob;
        }

        try {
            const buffer = await blob.arrayBuffer();
            const view = new DataView(buffer);
            const uint8 = new Uint8Array(buffer);


            const infoTag = [0x15, 0x49, 0xA9, 0x66];
            let infoOffset = -1;

            const searchLimit = Math.min(uint8.length - 8, 8192);
            for (let i = 0; i < searchLimit; i++) {
                if (uint8[i] === infoTag[0] &&
                    uint8[i+1] === infoTag[1] &&
                    uint8[i+2] === infoTag[2] &&
                    uint8[i+3] === infoTag[3]) {
                    infoOffset = i;
                    break;
                }
            }

            if (infoOffset !== -1) {

                const durationTag = [0x44, 0x89];
                const infoSearchLimit = Math.min(infoOffset + 500, uint8.length - 8);

                for (let i = infoOffset + 4; i < infoSearchLimit; i++) {
                    if (uint8[i] === durationTag[0] && uint8[i+1] === durationTag[1]) {
                        const len = uint8[i+2];
                        if (len === 4) {
                            view.setFloat32(i + 3, durationMs, false);
                            return new Blob([buffer], { type: blob.type });
                        } else if (len === 8) {
                            view.setFloat64(i + 3, durationMs, false);
                            return new Blob([buffer], { type: blob.type });
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('WebM EBML duration patch uygulanamadı:', e);
        }

        return blob;
    }

    createCombinedStream(fps = 30) {
        const stream = this.canvas.captureStream(fps);

        if (this.mediaHandler && this.mediaHandler.mediaType === 'video' && this.mediaHandler.video) {
            try {
                const vid = this.mediaHandler.video;
                const audioStream = vid.captureStream ? vid.captureStream() : (vid.mozCaptureStream ? vid.mozCaptureStream() : null);
                if (audioStream && audioStream.getAudioTracks().length > 0) {
                    audioStream.getAudioTracks().forEach(track => stream.addTrack(track));
                }
            } catch (e) {
                console.warn('Ses akışı eklenemedi, sessiz video oluşturuluyor:', e);
            }
        }

        return stream;
    }

    async convertVideo(fps = 30) {
        if (this.isConverting) return;
        if (!this.mediaHandler || this.mediaHandler.mediaType !== 'video') {
            throw new Error('Dönüştürmek için lütfen önce bir video dosyası yükleyin.');
        }

        const video = this.mediaHandler.video;
        if (!video.duration || isNaN(video.duration)) {
            throw new Error('Video süresi henüz okunamadı. Lütfen birkaç saniye sonra tekrar deneyin.');
        }

        this.recordedChunks = [];
        this.isConverting = true;
        this.currentDuration = video.duration * 1000;


        video.pause();
        video.currentTime = 0;
        await new Promise(r => setTimeout(r, 200));


        const mimeType = this.getBestMimeType();
        const stream = this.createCombinedStream(fps);
        const options = mimeType ? { mimeType } : {};

        try {
            this.mediaRecorder = new MediaRecorder(stream, options);
        } catch (e) {
            this.mediaRecorder = new MediaRecorder(stream);
        }

        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                this.recordedChunks.push(event.data);
            }
        };

        this.mediaRecorder.onstop = async () => {
            await this.finalizeConvertedVideo();
        };

        this.mediaRecorder.start(100);


        const checkProgress = () => {
            if (!this.isConverting) return;

            const current = video.currentTime;
            const total = video.duration;
            const percent = Math.min(100, Math.round((current / total) * 100));

            const curM = String(Math.floor(current / 60)).padStart(2, '0');
            const curS = String(Math.floor(current % 60)).padStart(2, '0');
            const totM = String(Math.floor(total / 60)).padStart(2, '0');
            const totS = String(Math.floor(total % 60)).padStart(2, '0');

            if (this.onProgress) {
                this.onProgress(percent, `${curM}:${curS}`, `${totM}:${totS}`);
            }


            if (video.ended || current >= total - 0.08) {
                this.stopConversion();
                return;
            }

            this.animFrameId = requestAnimationFrame(checkProgress);
        };

        this.animFrameId = requestAnimationFrame(checkProgress);


        await video.play();
    }

    stopConversion() {
        if (!this.isConverting) return;
        this.isConverting = false;

        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }

        if (this.mediaHandler && this.mediaHandler.video) {
            this.mediaHandler.video.pause();
        }

        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
    }

    cancelConversion() {
        if (!this.isConverting) return;
        this.isConverting = false;

        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }

        if (this.mediaHandler && this.mediaHandler.video) {
            this.mediaHandler.video.pause();
        }

        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.ondataavailable = null;
            this.mediaRecorder.onstop = null;
            this.mediaRecorder.stop();
        }
        this.recordedChunks = [];
    }

    async finalizeConvertedVideo() {
        const mime = this.mediaRecorder.mimeType || 'video/webm';
        const ext = mime.includes('mp4') ? 'mp4' : 'webm';
        const rawBlob = new Blob(this.recordedChunks, { type: mime });


        const finalBlob = await this.fixWebmDuration(rawBlob, this.currentDuration);
        const url = URL.createObjectURL(finalBlob);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `ascii-video-${timestamp}.${ext}`;
        const sizeStr = this.formatFileSize(finalBlob.size);


        this.triggerDownload(url, filename);

        if (this.onConversionComplete) {
            this.onConversionComplete({
                blob: finalBlob,
                url,
                filename,
                sizeStr,
                type: 'video',
                ext
            });
        }
    }

    exportImage(format = 'png') {
        const isJpg = format === 'jpg' || format === 'jpeg';
        const mime = isJpg ? 'image/jpeg' : 'image/png';
        const ext = isJpg ? 'jpg' : 'png';

        this.canvas.toBlob((blob) => {
            if (!blob) {
                console.error('Canvas blob oluşturulamadı');
                return;
            }

            const url = URL.createObjectURL(blob);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const filename = `ascii-art-${timestamp}.${ext}`;
            const sizeStr = this.formatFileSize(blob.size);

            this.triggerDownload(url, filename);

            if (this.onConversionComplete) {
                this.onConversionComplete({
                    blob,
                    url,
                    filename,
                    sizeStr,
                    type: 'image',
                    ext
                });
            }
        }, mime, 0.95);
    }

    exportTXT() {
        const text = this.engine.getTextArt();
        if (!text || text.trim().length === 0) {
            throw new Error('Dışa aktarılacak ASCII metni bulunamadı. Lütfen önce bir görsel veya video yükleyin.');
        }

        const blob = new Blob(["\uFEFF" + text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `ascii-art-${timestamp}.txt`;
        const sizeStr = this.formatFileSize(blob.size);

        this.triggerDownload(url, filename);

        if (this.onConversionComplete) {
            this.onConversionComplete({
                blob,
                url,
                filename,
                sizeStr,
                type: 'text',
                ext: 'txt'
            });
        }
    }

    async copyToClipboard() {
        const text = this.engine.getTextArt();
        if (!text || text.trim().length === 0) return false;
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            const success = document.execCommand('copy');
            document.body.removeChild(ta);
            return success;
        }
    }

    triggerDownload(url, filename) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
        }, 500);
    }

    formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

window.AsciiConverter = AsciiConverter;

window.AsciiRecorder = AsciiConverter;
