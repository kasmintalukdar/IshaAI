import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private isMuted = false;
  private volume = 0.5;

  constructor() {
    this.preloadSounds();
    const storedMute = localStorage.getItem('app_muted');
    this.isMuted = storedMute === 'true';
  }

  private preloadSounds() {
    // 🟢 DIRECT LINKS TO PROFESSIONAL FREE SOUNDS (Kenney.nl Assets)
    
    // 1. Soft Pop (For buttons, menu clicks)
    this.load('click', 'assets/audio/click1.wav');
    
    // 2. Bright Chime (For correct answers, completing tasks)
    this.load('success', 'assets/audio/success.wav');
    
    // 3. Low Thud/Buzz (For wrong answers)
    this.load('error', 'assets/audio/error.wav');
    
    // 4. Mechanical Switch (For Unlocking items)
    this.load('unlock', 'https://raw.githubusercontent.com/Arza-3d/kenney_assets/master/Audio/Ui/switch33.ogg');
    
    // 5. Swoosh (For Logout or Page Transitions)
    this.load('swoosh', 'https://raw.githubusercontent.com/Arza-3d/kenney_assets/master/Audio/Ui/maximize_008.ogg');
  }

  private load(key: string, src: string) {
    const audio = new Audio();
    audio.src = src;
    audio.load();
    this.sounds.set(key, audio);
  }

  play(key: string) {
    if (this.isMuted) return;

    const audio = this.sounds.get(key);
    if (audio) {
      audio.volume = this.volume;
      audio.currentTime = 0;
      audio.play().catch(e => console.warn('Audio play prevented:', e));
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('app_muted', String(this.isMuted));
    return this.isMuted;
  }
}