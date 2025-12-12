import { CollisionEvent } from '../types';

// Simple sound synthesis using Web Audio API
class SoundManager {
    private audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;

    constructor() {
        // Initialize on first user interaction to comply with browser autoplay policies
        if (typeof window !== 'undefined') {
            this.initAudio();
        }
    }

    private initAudio() {
        try {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.3; // Master volume
            this.masterGain.connect(this.audioContext.destination);
        } catch (e) {
            console.warn('Web Audio API not supported', e);
        }
    }

    private ensureContext() {
        if (!this.audioContext || !this.masterGain) {
            this.initAudio();
        }
        // Resume context if suspended (browser autoplay policy)
        if (this.audioContext?.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // Play ball-to-ball collision sound
    playBallCollision(intensity: number) {
        this.ensureContext();
        if (!this.audioContext || !this.masterGain) return;

        const now = this.audioContext.currentTime;

        // Create oscillator for impact sound
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        // Higher frequency for harder hits
        const baseFreq = 200 + (intensity * 300);
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);

        // Volume based on intensity
        const volume = Math.min(intensity * 0.5, 0.4);
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    // Play wall collision sound
    playWallCollision(intensity: number) {
        this.ensureContext();
        if (!this.audioContext || !this.masterGain) return;

        const now = this.audioContext.currentTime;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        // Lower frequency for wall hits
        const baseFreq = 150 + (intensity * 200);
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

        const volume = Math.min(intensity * 0.3, 0.3);
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    // Play pocket sound
    playPocketSound() {
        this.ensureContext();
        if (!this.audioContext || !this.masterGain) return;

        const now = this.audioContext.currentTime;

        // Create a "rolling down" sound
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.4);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.4);
    }

    // Play cue strike sound
    playStrikeSound(power: number) {
        this.ensureContext();
        if (!this.audioContext || !this.masterGain) return;

        const now = this.audioContext.currentTime;

        // Sharp impact sound
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        const baseFreq = 100 + (power * 50);
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.05);

        const volume = Math.min(power * 0.1, 0.4);
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.08);
    }

    // Handle collision event
    playCollision(collision: CollisionEvent) {
        switch (collision.type) {
            case 'ball-ball':
                this.playBallCollision(collision.intensity);
                break;
            case 'ball-wall':
                this.playWallCollision(collision.intensity);
                break;
            case 'ball-pocket':
                this.playPocketSound();
                break;
        }
    }

    // Set master volume (0-1)
    setVolume(volume: number) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, volume)) * 0.3;
        }
    }
}

// Export singleton instance
export const soundManager = new SoundManager();
