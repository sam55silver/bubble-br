import { Howl } from 'howler';

export class AudioSystem {
    private static instance: AudioSystem;
    private sounds: Map<string, Howl>;
    private initialized: boolean = false;
    
    private constructor() {
        this.sounds = new Map();
    }

    public static getInstance(): AudioSystem {
        if (!AudioSystem.instance) {
            AudioSystem.instance = new AudioSystem();
        }
        return AudioSystem.instance;
    }

    public initialize(audioAssets: AudioSystem) {
        if (this.initialized) return;
        
        this.sounds.set('bolt', new Howl({
            src: ["/assets/audio/fire_reload.mp3"],
            volume: 0.5,
        }));

        this.sounds.set('background', new Howl({
            src: ["/assets/audio/music.mp3"],
            volume: 0.5,
            loop: true,
            preload: true,
        }));

        this.initialized = true;
    }

    public playSound(soundName: string) {
        const sound = this.sounds.get(soundName);
        if (sound) {
            sound.play();
        }
    }

    public stopSound(soundName: string) {
        const sound = this.sounds.get(soundName);
        if (sound) {
            sound.stop();
        }
    }

    public playBackgroundMusic() {
        const sound = this.sounds.get('background');
        if (sound) {
            sound.play();
        }
    }
}