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

    public initialize(audioAssets: Record<string, string>) {
        if (this.initialized) return;
        
        this.sounds.set('bolt', new Howl({
            src: [audioAssets.boltSound],
            volume: 0.5
        }));

        this.sounds.set('hit', new Howl({
            src: [audioAssets.hitSound],
            volume: 0.3
        }));

        this.sounds.set('death', new Howl({
            src: [audioAssets.deathSound],
            volume: 0.7
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
}