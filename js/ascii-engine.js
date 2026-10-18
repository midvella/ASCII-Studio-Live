
class AsciiEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
        
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
        
        this.charsets = {
            standard: "@%#*+=-:. ",
            dense: "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ",
            blocks: "█▓▒░ ",
            minimal: "#+:. ",
            binary: "01 ",
            math: "+-=*^~/ ",
            katakana: "日ﾊﾐﾋｰｳｼﾅﾓ ",
            custom: "@#S%?*+;:,._ "
        };

        this.params = {
            columns: 100,
            targetFps: 30,
            charAspect: 0.52,
            colorMode: 'truecolor',
            charColor: '#00ff66',
            bgColor: '#05080d',
            invert: false,
            contrast: 1.1,
            brightness: 0,
            gamma: 1.0,
            edgeDetect: false,
            selectedCharset: 'standard'
        };

        this.lut = new Uint8Array(256);
        this.activeChars = this.charsets.standard;
        this.charTable = [];
        this.updateLookupTable();

        this.lastFrameTime = performance.now();
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdate = performance.now();
        this.currentTextBuffer = '';

        this.fontSize = 12;
        this.charWidth = 7;
        this.charHeight = 13;
    }

    updateLookupTable() {
        const { contrast, brightness, gamma, invert } = this.params;
        const chars = this.charsets[this.params.selectedCharset] || this.charsets.standard;
        this.activeChars = chars;
        const charLen = chars.length;

        this.charTable = new Array(256);
        
        for (let i = 0; i < 256; i++) {
            let val = i + brightness;
            val = ((val / 255 - 0.5) * contrast + 0.5) * 255;
            
            if (gamma !== 1.0 && val > 0) {
                val = Math.pow(val / 255, 1 / gamma) * 255;
            }

            val = Math.max(0, Math.min(255, Math.round(val)));
            
            if (invert) {
                val = 255 - val;
            }

            this.lut[i] = val;

            const charIdx = Math.floor((val / 255) * (charLen - 1));
            this.charTable[i] = chars[charIdx];
        }
    }

    setParam(key, value) {
        this.params[key] = value;
        if (['contrast', 'brightness', 'gamma', 'invert', 'selectedCharset'].includes(key)) {
            this.updateLookupTable();
        }
    }

    setCustomCharset(chars) {
        if (chars && chars.length > 0) {
            this.charsets.custom = chars;
            if (this.params.selectedCharset === 'custom') {
                this.updateLookupTable();
            }
        }
    }

    calculateDimensions(sourceWidth, sourceHeight) {
        const cols = this.params.columns;
        const aspectRatio = sourceHeight / sourceWidth;
        const rows = Math.max(1, Math.round(cols * aspectRatio * this.params.charAspect));
        return { cols, rows };
    }

    applySobel(pixels, width, height) {
        const gray = new Uint8Array(width * height);
        for (let i = 0, j = 0; i < pixels.length; i += 4, j++) {
            gray[j] = (pixels[i] * 77 + pixels[i + 1] * 150 + pixels[i + 2] * 29) >> 8;
        }

        const edgeMap = new Uint8Array(width * height);
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x;
                const gx = 
                    -gray[idx - width - 1] + gray[idx - width + 1]
                    -2 * gray[idx - 1] + 2 * gray[idx + 1]
                    -gray[idx + width - 1] + gray[idx + width + 1];
                const gy = 
                    -gray[idx - width - 1] - 2 * gray[idx - width] - gray[idx - width + 1]
                    +gray[idx + width - 1] + 2 * gray[idx + width] + gray[idx + width + 1];

                const mag = Math.min(255, Math.hypot(gx, gy));
                edgeMap[idx] = mag;
            }
        }
        return edgeMap;
    }

    renderFrame(source) {
        if (!source) return;

        const sourceW = source.videoWidth || source.naturalWidth || source.width || 640;
        const sourceH = source.videoHeight || source.naturalHeight || source.height || 480;

        if (sourceW === 0 || sourceH === 0) return;

        const { cols, rows } = this.calculateDimensions(sourceW, sourceH);

        if (this.offscreenCanvas.width !== cols || this.offscreenCanvas.height !== rows) {
            this.offscreenCanvas.width = cols;
            this.offscreenCanvas.height = rows;
        }

        this.offscreenCtx.drawImage(source, 0, 0, cols, rows);
        const imgData = this.offscreenCtx.getImageData(0, 0, cols, rows);
        const pixels = imgData.data;

        this.charWidth = Math.max(6, Math.floor(1920 / (cols * 1.5)));
        this.charHeight = Math.round(this.charWidth / this.params.charAspect);

        const targetCanvasW = cols * this.charWidth;
        const targetCanvasH = rows * this.charHeight;

        if (this.canvas.width !== targetCanvasW || this.canvas.height !== targetCanvasH) {
            this.canvas.width = targetCanvasW;
            this.canvas.height = targetCanvasH;
        }

        const ctx = this.ctx;
        const { colorMode, bgColor, charColor, edgeDetect } = this.params;

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, targetCanvasW, targetCanvasH);

        ctx.font = `600 ${this.charHeight - 2}px "Fira Code", monospace`;
        ctx.textBaseline = 'top';

        let edgeMap = null;
        if (edgeDetect) {
            edgeMap = this.applySobel(pixels, cols, rows);
        }

        let textBuffer = '';
        let pixelIndex = 0;

        for (let y = 0; y < rows; y++) {
            let rowText = '';
            for (let x = 0; x < cols; x++) {
                const r = pixels[pixelIndex];
                const g = pixels[pixelIndex + 1];
                const b = pixels[pixelIndex + 2];

                let lum = (r * 77 + g * 150 + b * 29) >> 8;

                if (edgeDetect && edgeMap) {
                    lum = edgeMap[y * cols + x];
                }

                const finalLum = this.lut[lum];
                const char = this.charTable[lum] || ' ';
                rowText += char;

                if (char !== ' ') {
                    if (colorMode === 'truecolor') {
                        ctx.fillStyle = `rgb(${r},${g},${b})`;
                    } else if (colorMode === 'mono') {
                        ctx.fillStyle = charColor;
                    } else if (colorMode === 'matrix') {
                        const greenVal = Math.min(255, finalLum + 50);
                        ctx.fillStyle = `rgb(20, ${greenVal}, 40)`;
                    } else if (colorMode === 'amber') {
                        const amberVal = Math.min(255, finalLum);
                        ctx.fillStyle = `rgb(${amberVal}, ${Math.round(amberVal * 0.7)}, 0)`;
                    } else if (colorMode === 'cyber') {
                        if (finalLum > 150) {
                            ctx.fillStyle = `rgb(0, 242, 254)`;
                        } else {
                            ctx.fillStyle = `rgb(255, 0, 128)`;
                        }
                    }

                    ctx.fillText(char, x * this.charWidth, y * this.charHeight);
                }

                pixelIndex += 4;
            }
            textBuffer += rowText + '\n';
        }

        this.currentTextBuffer = textBuffer;

        this.calculateFps();

        return { cols, rows };
    }

    calculateFps() {
        const now = performance.now();
        this.frameCount++;
        if (now - this.lastFpsUpdate >= 500) {
            this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
            this.frameCount = 0;
            this.lastFpsUpdate = now;
        }
    }

    getTextArt() {
        return this.currentTextBuffer;
    }

    toDataURL(type = 'image/png') {
        return this.canvas.toDataURL(type);
    }

    clear() {
        this.ctx.fillStyle = this.params.bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.currentTextBuffer = '';
        this.fps = 0;
    }
}

window.AsciiEngine = AsciiEngine;
