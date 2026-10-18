
class MediaHandler {
    constructor(engine, callbacks) {
        this.engine = engine;
        this.callbacks = callbacks || {};

        this.mediaType = null;
        this.activeMedia = null;
        this.mediaStream = null;
        this.isPlaying = false;
        this.animationFrameId = null;
        this.lastRenderTime = 0;

        this.video = document.createElement('video');
        this.video.crossOrigin = 'anonymous';
        this.video.playsInline = true;
        this.video.autoplay = true;
        this.video.loop = true;
        this.video.muted = false;

        this.image = new Image();
        this.image.crossOrigin = 'anonymous';

        this.demoCanvas = document.createElement('canvas');
        this.demoCanvas.width = 640;
        this.demoCanvas.height = 360;
        this.demoCtx = this.demoCanvas.getContext('2d');
        this.demoAngle = 0;

        this.initEventListeners();
    }

    initEventListeners() {
        this.video.addEventListener('timeupdate', () => {
            if (this.callbacks.onTimeUpdate && this.video.duration) {
                this.callbacks.onTimeUpdate(this.video.currentTime, this.video.duration);
            }
        });

        this.video.addEventListener('ended', () => {
            if (!this.video.loop) {
                this.pause();
            }
        });

        this.video.addEventListener('play', () => {
            this.isPlaying = true;
            this.startLoop();
            if (this.callbacks.onPlayStateChange) this.callbacks.onPlayStateChange(true);
        });

        this.video.addEventListener('pause', () => {
            this.isPlaying = false;
            if (this.callbacks.onPlayStateChange) this.callbacks.onPlayStateChange(false);
        });
    }

    async loadFile(file) {
        this.stopCurrentMedia();

        const fileType = file.type;
        const objectUrl = URL.createObjectURL(file);

        if (fileType.startsWith('video/')) {
            this.mediaType = 'video';
            this.activeMedia = this.video;
            this.video.src = objectUrl;
            
            await new Promise((resolve, reject) => {
                this.video.onloadedmetadata = () => {
                    resolve();
                };
                this.video.onerror = (e) => reject(e);
            });

            await this.video.play().catch(() => {
                this.video.muted = true;
                this.video.play();
            });

            if (this.callbacks.onMediaLoaded) {
                this.callbacks.onMediaLoaded({
                    type: 'video',
                    name: file.name,
                    duration: this.video.duration,
                    width: this.video.videoWidth,
                    height: this.video.videoHeight
                });
            }

        } else if (fileType.startsWith('image/')) {
            this.mediaType = 'image';
            this.activeMedia = this.image;

            await new Promise((resolve, reject) => {
                this.image.onload = () => resolve();
                this.image.onerror = (e) => reject(e);
                this.image.src = objectUrl;
            });

            this.engine.renderFrame(this.image);

            if (this.callbacks.onMediaLoaded) {
                this.callbacks.onMediaLoaded({
                    type: 'image',
                    name: file.name,
                    width: this.image.naturalWidth,
                    height: this.image.naturalHeight
                });
            }
        } else {
            throw new Error('Desteklenmeyen dosya formatı. Lütfen bir video veya görsel dosyası seçin.');
        }
    }

    async startWebcam() {
        this.stopCurrentMedia();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: false
            });

            this.mediaStream = stream;
            this.mediaType = 'webcam';
            this.activeMedia = this.video;
            this.video.srcObject = stream;
            await this.video.play();

            if (this.callbacks.onMediaLoaded) {
                this.callbacks.onMediaLoaded({
                    type: 'webcam',
                    name: 'Canlı Web Kamerası',
                    width: this.video.videoWidth,
                    height: this.video.videoHeight
                });
            }
        } catch (err) {
            console.error('Kamera erişim hatası:', err);
            throw new Error('Kamera başlatılamadı. Lütfen kamera izinlerini kontrol edin.');
        }
    }

    loadDemo() {
        this.stopCurrentMedia();
        this.mediaType = 'demo';
        this.activeMedia = this.demoCanvas;
        this.isPlaying = true;
        this.startLoop();

        if (this.callbacks.onMediaLoaded) {
            this.callbacks.onMediaLoaded({
                type: 'demo',
                name: '3D Cyber Matrix Demo',
                width: 640,
                height: 360
            });
        }
    }

    renderDemoFrame() {
        const ctx = this.demoCtx;
        const w = this.demoCanvas.width;
        const h = this.demoCanvas.height;

        ctx.fillStyle = '#05070c';
        ctx.fillRect(0, 0, w, h);

        this.demoAngle += 0.025;

        ctx.strokeStyle = '#0e2538';
        ctx.lineWidth = 1;
        for (let i = 0; i < w; i += 30) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, h);
            ctx.stroke();
        }
        for (let i = 0; i < h; i += 30) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(w, i);
            ctx.stroke();
        }

        const cx = w / 2;
        const cy = h / 2;

        ctx.save();
        ctx.translate(cx, cy);

        for (let r = 20; r <= 140; r += 20) {
            const pulse = Math.sin(this.demoAngle * 2 + r * 0.05) * 15;
            ctx.beginPath();
            ctx.arc(0, 0, r + pulse, 0, Math.PI * 2);
            ctx.strokeStyle = `hsl(${(this.demoAngle * 40 + r) % 360}, 100%, 65%)`;
            ctx.lineWidth = 4;
            ctx.stroke();
        }

        ctx.rotate(this.demoAngle);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px "Fira Code", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ASCII LIVE', 0, 0);

        ctx.restore();
    }

    startLoop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        const tick = (now) => {
            const targetFps = this.engine.params.targetFps || 30;
            const interval = 1000 / targetFps;
            const delta = now - this.lastRenderTime;

            if (delta >= interval) {
                this.lastRenderTime = now - (delta % interval);

                if (this.mediaType === 'demo') {
                    this.renderDemoFrame();
                    this.engine.renderFrame(this.demoCanvas);
                } else if (this.activeMedia && (this.isPlaying || this.mediaType === 'image')) {
                    this.engine.renderFrame(this.activeMedia);
                }
            }

            if (this.isPlaying || this.mediaType === 'demo') {
                this.animationFrameId = requestAnimationFrame(tick);
            }
        };

        this.animationFrameId = requestAnimationFrame(tick);
    }

    requestSingleFrame() {
        if (this.mediaType === 'demo') {
            this.renderDemoFrame();
            this.engine.renderFrame(this.demoCanvas);
        } else if (this.activeMedia) {
            this.engine.renderFrame(this.activeMedia);
        }
    }

    play() {
        if (this.mediaType === 'video') {
            this.video.play();
        } else {
            this.isPlaying = true;
            this.startLoop();
        }
    }

    pause() {
        if (this.mediaType === 'video') {
            this.video.pause();
        }
        this.isPlaying = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        if (this.callbacks.onPlayStateChange) {
            this.callbacks.onPlayStateChange(false);
        }
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    seek(seconds) {
        if (this.mediaType === 'video' && Number.isFinite(seconds)) {
            this.video.currentTime = Math.max(0, Math.min(seconds, this.video.duration));
            this.requestSingleFrame();
        }
    }

    toggleMute() {
        if (this.video) {
            this.video.muted = !this.video.muted;
            return this.video.muted;
        }
        return false;
    }

    stopCurrentMedia() {
        this.pause();

        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        if (this.video.srcObject) {
            this.video.srcObject = null;
        }

        if (this.video.src) {
            this.video.removeAttribute('src');
            this.video.load();
        }

        this.activeMedia = null;
        this.mediaType = null;
    }
}

window.MediaHandler = MediaHandler;
