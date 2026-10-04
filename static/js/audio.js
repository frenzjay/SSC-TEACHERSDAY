class GameAudioEngine {
    constructor() {
        this.ctx = null;
        this.masterVolume = 1.0;
        this.sfxVolume = 0.9;
        this.isMuted = false;
        this.fadeInterval = null;
        this.stopTimeout = null;
        this.masterGain = null;
        this.audioSource = null;
        this.defaultStartTime = 0;
        this.trackUrl = '';
        this.playRequestId = 0;
        this.pendingPlayTime = null;
        this.player = new Audio();
        this.player.preload = 'auto';
        this.onPlayStateChange = null;
        this.onTimeUpdate = null;

        this.setupAudioListeners();
    }

    initContext() {
        if (!this.ctx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContextClass();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.audioSource = this.ctx.createMediaElementSource(this.player);
            this.audioSource.connect(this.masterGain);
            this.masterGain.gain.value = this.masterVolume;
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setupAudioListeners() {
        this.player.addEventListener('play', () => {
            if (this.onPlayStateChange) this.onPlayStateChange(true);
        });

        this.player.addEventListener('pause', () => {
            if (this.onPlayStateChange) this.onPlayStateChange(false);
        });

        this.player.addEventListener('ended', () => {
            if (this.onPlayStateChange) this.onPlayStateChange(false);
        });

        this.player.addEventListener('error', () => {
            const mediaError = this.player.error;
            console.error('[GameAudio] Audio element error', mediaError ? mediaError.code : 'unknown', this.trackUrl);
        });

        this.player.addEventListener('timeupdate', () => {
            if (this.onTimeUpdate) {
                this.onTimeUpdate(this.player.currentTime, this.player.duration);
            }
        });
    }
    playCorrectDing() {
        this.initContext();
        if (this.isMuted) return;

        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        
        notes.forEach((freq, idx) => {
            const startTime = now + (idx * 0.08);
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.001, startTime);
            gain.gain.linearRampToValueAtTime(0.28 * this.sfxVolume, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.85);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + 0.9);
        });
    }
    playWrongBuzzer() {
        this.initContext();
        if (this.isMuted) return;

        const now = this.ctx.currentTime;
        const freqs = [125, 131];

        freqs.forEach(freq => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(700, now);
            filter.frequency.exponentialRampToValueAtTime(150, now + 0.45);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.4 * this.sfxVolume, now + 0.03);
            gain.gain.setValueAtTime(0.35 * this.sfxVolume, now + 0.35);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.55);
        });
    }
    playTimeoutBuzzer() {
        this.initContext();
        if (this.isMuted) return;

        const now = this.ctx.currentTime;
        [0, 0.28].forEach(offset => {
            const t = now + offset;
            const freqs = [130, 138];
            freqs.forEach(freq => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const filter = this.ctx.createBiquadFilter();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, t);

                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(650, t);
                filter.frequency.exponentialRampToValueAtTime(140, t + 0.24);

                gain.gain.setValueAtTime(0.001, t);
                gain.gain.linearRampToValueAtTime(0.42 * this.sfxVolume, t + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(t);
                osc.stop(t + 0.26);
            });
        });
    }
    playTick(isCritical = false) {
        this.initContext();
        if (this.isMuted) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const baseFreq = isCritical ? 1760 : 880;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.04);

        gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
    }
    playWheelTick() {
        this.initContext();
        if (this.isMuted) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(720, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.035);

        gain.gain.setValueAtTime(0.25 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.04);
    }
    playWheelWin() {
        this.initContext();
        if (this.isMuted) return;

        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 987.77, 1046.50, 1318.51];
        notes.forEach((freq, idx) => {
            const startTime = now + (idx * 0.07);
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.001, startTime);
            gain.gain.linearRampToValueAtTime(0.32 * this.sfxVolume, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.85);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + 0.9);
        });
    }
    playWarningCountdown(secondsLeft = 5) {
        this.initContext();
        if (this.isMuted) return;

        const now = this.ctx.currentTime;
        const pitchMap = {
            5: 950,
            4: 1150,
            3: 1350,
            2: 1550,
            1: 1800
        };
        const freq = pitchMap[secondsLeft] || 1200;

        [0, 0.09].forEach((offset) => {
            const startTime = now + offset;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, startTime);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2600, startTime);

            gain.gain.setValueAtTime(0.001, startTime);
            gain.gain.linearRampToValueAtTime(0.3 * this.sfxVolume, startTime + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.07);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + 0.08);
        });
    }
    playTensionRoll(duration = 2.5) {
        this.initContext();
        if (this.isMuted) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(65, now);
        osc.frequency.linearRampToValueAtTime(120, now + duration);

        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(10, now);
        lfo.frequency.linearRampToValueAtTime(24, now + duration);

        lfoGain.gain.setValueAtTime(0.15, now);

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.35 * this.sfxVolume, now + duration * 0.9);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        lfo.connect(gain.gain);
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        lfo.start(now);
        osc.start(now);
        lfo.stop(now + duration);
        osc.stop(now + duration);
    }
    loadTrack(url, startTime = 0) {
        if (!url) return;
        this.cancelPendingStop();
        this.playRequestId++;
        this.pendingPlayTime = null;
        this.trackUrl = url;
        this.defaultStartTime = Number(startTime) || 0;
        this.player.pause();
        this.player.src = url;
        this.player.load();

        const onMetadata = () => {
            if (this.defaultStartTime > 0) {
                this.setCurrentTimeSafely(this.defaultStartTime);
            }
            this.player.removeEventListener('loadedmetadata', onMetadata);
        };
        this.player.addEventListener('loadedmetadata', onMetadata);

        const onCanPlay = () => {
            if (this.defaultStartTime > 0 && this.player.currentTime < this.defaultStartTime) {
                this.setCurrentTimeSafely(this.defaultStartTime);
            }
            this.player.removeEventListener('canplay', onCanPlay);
        };
        this.player.addEventListener('canplay', onCanPlay);
    }

    setCurrentTimeSafely(seconds) {
        const target = Math.max(0, Number(seconds) || 0);
        if (target <= 0) return true;
        try {
            if (this.player.seekable.length > 0) {
                const max = this.player.seekable.end(this.player.seekable.length - 1);
                this.player.currentTime = Math.min(target, Math.max(0, max - 0.05));
            } else {
                this.player.currentTime = target;
            }
            return true;
        } catch (error) {
            console.warn('[GameAudio] Waiting for seekable audio before seeking', error);
            return false;
        }
    }

    playTrack(fromTime = null, fadeIn = true) {
        if (!this.player.src || this.player.error) {
            console.warn('[GameAudio] Cannot play: no usable audio source', this.trackUrl);
            return Promise.resolve(false);
        }
        this.cancelPendingStop();
        this.initContext();

        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
        }

        if (fromTime !== null && !isNaN(fromTime)) {
            this.setCurrentTimeSafely(fromTime);
        } else if (this.defaultStartTime > 0 && (this.player.currentTime === 0 || this.player.currentTime < this.defaultStartTime - 0.5)) {
            this.setCurrentTimeSafely(this.defaultStartTime);
        }

        if (this.isMuted) {
            this.player.muted = true;
            this.player.volume = 0;
        } else {
            this.player.muted = false;
            this.player.volume = 1;
            if (this.masterGain) {
                this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
                const now = this.ctx.currentTime;
                const targetVolume = this.masterVolume || 1.0;
                if (fadeIn) {
                    this.masterGain.gain.setValueAtTime(0, now);
                    this.masterGain.gain.linearRampToValueAtTime(targetVolume, now + 0.18);
                } else {
                    this.masterGain.gain.setValueAtTime(targetVolume, now);
                }
            }
        }

        const requestId = ++this.playRequestId;
        this.pendingPlayTime = fromTime;
        const playPromise = this.player.play();
        if (playPromise !== undefined) {
            return playPromise.then(() => true).catch(error => {
                if (error.name === 'AbortError') return false;
                console.warn('[GameAudio] Initial play attempt failed; retrying when audio is ready', error);
                if (error.name === 'NotSupportedError' || this.player.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
                    const retry = () => {
                        if (requestId !== this.playRequestId) return;
                        this.player.removeEventListener('canplay', retry);
                        this.player.removeEventListener('loadeddata', retry);
                        this.setCurrentTimeSafely(this.pendingPlayTime);
                        this.player.play().catch(retryError => {
                            console.error('[GameAudio] Audio retry failed', retryError);
                        });
                    };
                    this.player.addEventListener('canplay', retry, { once: true });
                    this.player.addEventListener('loadeddata', retry, { once: true });
                }
                return false;
            });
        }
        return Promise.resolve(true);
    }

    pauseTrack() {
        this.cancelPendingStop();
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
        }
        this.player.pause();
    }

    cancelPendingStop() {
        if (this.stopTimeout !== null) {
            window.clearTimeout(this.stopTimeout);
            this.stopTimeout = null;
        }
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
        }
    }

    fadeOutAndStop(durationMs = 2000, onComplete = null) {
        this.cancelPendingStop();
        if (!this.player || this.player.paused) {
            if (onComplete) onComplete();
            return;
        }

        const durSec = Math.max(0.5, durationMs / 1000);
        if (this.masterGain && this.ctx) {
            try {
                const now = this.ctx.currentTime;
                const currentGain = this.masterGain.gain.value || this.masterVolume || 1.0;
                this.masterGain.gain.cancelScheduledValues(now);
                this.masterGain.gain.setValueAtTime(currentGain, now);
                this.masterGain.gain.linearRampToValueAtTime(0.0001, now + durSec);
            } catch (e) {
                console.warn('[GameAudio] Master gain ramp error', e);
            }
        }

        const initialVol = this.player.volume;
        const steps = 20;
        const intervalTime = durationMs / steps;
        let step = 0;
        this.fadeInterval = setInterval(() => {
            step++;
            const factor = Math.max(0, 1 - (step / steps));
            this.player.volume = initialVol * factor;
            if (step >= steps) {
                clearInterval(this.fadeInterval);
                this.fadeInterval = null;
                this.player.pause();
                this.player.volume = 1;
                if (this.masterGain && this.ctx) {
                    try {
                        this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
                        this.masterGain.gain.setValueAtTime(this.masterVolume || 1.0, this.ctx.currentTime);
                    } catch (e) {}
                }
                if (this.onPlayStateChange) this.onPlayStateChange(false);
                if (onComplete) onComplete();
            }
        }, intervalTime);
    }

    smoothStop(fadeDuration = 300, onComplete = null) {
        this.cancelPendingStop();
        if (this.player.paused) {
            if (onComplete) onComplete();
            return;
        }

        if (this.isMuted) {
            this.player.pause();
            if (this.onPlayStateChange) this.onPlayStateChange(false);
            if (onComplete) onComplete();
            return;
        }

        if (this.masterGain && this.ctx) {
            this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
            this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
        }
        this.player.pause();
        this.player.volume = 1;
        if (this.onPlayStateChange) this.onPlayStateChange(false);
        if (onComplete) onComplete();
    }
    emergencyCut(onComplete = null) {
        this.smoothStop(180, onComplete);
    }

    seek(seconds) {
        if (this.player.duration) {
            this.player.currentTime = Math.min(Math.max(0, seconds), this.player.duration);
        }
    }

    setMusicVolume(vol) {
        this.masterVolume = Math.max(0, Math.min(1, vol));
        if (!this.isMuted) {
            this.player.volume = 1;
            if (this.masterGain && this.ctx) {
                this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
            }
        }
    }

    setMuted(muted) {
        this.isMuted = !!muted;
        this.player.muted = this.isMuted;
        if (this.isMuted) {
            this.player.volume = 0;
        } else {
            this.player.volume = 1;
        }
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
        }
        return this.isMuted;
    }

    toggleMute() {
        return this.setMuted(!this.isMuted);
    }
}
window.gameAudio = new GameAudioEngine();

['click', 'keydown', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, () => {
        if (window.gameAudio) {
            window.gameAudio.initContext();
        }
    }, { once: false });
});