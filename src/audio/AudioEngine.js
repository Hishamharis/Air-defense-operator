import * as Tone from 'tone';

class AudioEngine {
    constructor() {
        this.initialized = false;
        this.synths = {};
        this.muted = false;
        this.masterVolume = new Tone.Volume(0).toDestination();
    }

    async init() {
        if (this.initialized) return;
        await Tone.start();

        // Synths setup
        this.synths.radarPing = new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: { attack: 0.01, decay: 0.05, sustain: 0, release: 0.1 }
        }).connect(this.masterVolume);

        this.synths.threatDetected = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'sine' },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 }
        }).connect(this.masterVolume);

        this.synths.missileLaunch = new Tone.Synth({
            oscillator: { type: 'sawtooth' },
            envelope: { attack: 0.1, decay: 0.2, sustain: 0, release: 0.3 }
        }).connect(this.masterVolume);

        this.synths.interceptSuccess = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.05, decay: 0.2, sustain: 0.2, release: 0.5 }
        }).connect(this.masterVolume);

        this.synths.interceptFailure = new Tone.Synth({
            oscillator: { type: 'square' },
            envelope: { attack: 0.05, decay: 0.3, sustain: 0.1, release: 0.4 }
        }).connect(this.masterVolume);

        this.synths.breachAlert = new Tone.Synth({
            oscillator: { type: 'square' },
            envelope: { attack: 0.05, decay: 0.1, sustain: 0.1, release: 0.1 }
        }).connect(this.masterVolume);

        this.synths.winchester = new Tone.Synth({
            oscillator: { type: 'square' },
            envelope: { attack: 0.05, decay: 0.4, sustain: 0.2, release: 0.5 }
        }).connect(this.masterVolume);

        this.synths.ecmNoise = new Tone.NoiseSynth({
            noise: { type: 'white' },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 }
        }).connect(this.masterVolume);

        this.synths.laserHit = new Tone.Synth({
            oscillator: { type: 'sawtooth' },
            envelope: { attack: 0.01, decay: 0.05, sustain: 0, release: 0.05 }
        }).connect(this.masterVolume);

        this.initialized = true;
    }

    toggleMute() {
        this.muted = !this.muted;
        this.masterVolume.mute = this.muted;
        return this.muted;
    }

    playRadarPing() {
        if (!this.initialized || this.muted) return;
        this.synths.radarPing.triggerAttackRelease(880, '50ms');
    }

    playThreatDetected() {
        if (!this.initialized || this.muted) return;
        const now = Tone.now();
        this.synths.threatDetected.triggerAttackRelease(440, '50ms', now);
        this.synths.threatDetected.triggerAttackRelease(440, '50ms', now + 0.1);
    }

    playMissileLaunch() {
        if (!this.initialized || this.muted) return;
        const now = Tone.now();
        this.synths.missileLaunch.triggerAttackRelease(600, '300ms', now);
        this.synths.missileLaunch.frequency.rampTo(200, 0.3, now);
    }

    playInterceptSuccess() {
        if (!this.initialized || this.muted) return;
        const now = Tone.now();
        this.synths.interceptSuccess.triggerAttackRelease('C5', '80ms', now);
        this.synths.interceptSuccess.triggerAttackRelease('E5', '80ms', now + 0.08);
        this.synths.interceptSuccess.triggerAttackRelease('G5', '80ms', now + 0.16);
    }

    playInterceptFailure() {
        if (!this.initialized || this.muted) return;
        this.synths.interceptFailure.triggerAttackRelease(150, '400ms');
    }

    playBreachAlert() {
        if (!this.initialized || this.muted) return;
        const now = Tone.now();
        for (let i = 0; i < 5; i++) {
            this.synths.breachAlert.triggerAttackRelease(220, '100ms', now + i * 0.2);
        }
    }

    playWinchester() {
        if (!this.initialized || this.muted) return;
        this.synths.winchester.triggerAttackRelease(330, '500ms');
    }

    playECMActivate() {
        if (!this.initialized || this.muted) return;
        this.synths.ecmNoise.triggerAttackRelease('200ms');
    }

    playDirectedEnergyHit() {
        if (!this.initialized || this.muted) return;
        this.synths.laserHit.triggerAttackRelease(2000, '100ms');
    }

    playWaveBanner() {
        if (!this.initialized || this.muted) return;
        const now = Tone.now();
        this.synths.radarPing.triggerAttackRelease(440, '200ms', now);
        this.synths.radarPing.triggerAttackRelease(554.37, '200ms', now + 0.2);
    }
}

export const audioEngineInstance = new AudioEngine();
