import { Injectable, signal } from '@angular/core';

interface SoundDef {
  local: string;
  remote: string;
  volume: number;
}

const SOUNDS: Record<string, SoundDef> = {
  intro: {
    local: 'sounds/play_intro.mp3',
    remote: 'https://www.myinstants.com/media/sounds/play_EWmkW31.mp3',
    volume: 0.75,
  },
  questionBg: {
    local: 'sounds/question_bg.mp3',
    remote: 'https://www.myinstants.com/media/sounds/question3_2.mp3',
    volume: 0.45,
  },
  selectOption: {
    local: 'sounds/select_option.mp3',
    remote: 'https://www.myinstants.com/media/sounds/final_2_41YMqQj.mp3',
    volume: 0.75,
  },
  correct: {
    local: 'sounds/correct.mp3',
    remote: 'https://www.myinstants.com/media/sounds/correct_VsVqwRb.mp3',
    volume: 0.85,
  },
  wrong: {
    local: 'sounds/wrong.mp3',
    remote: 'https://www.myinstants.com/media/sounds/wrong_JbK803k.mp3',
    volume: 0.85,
  },
};

const SOUND_STORAGE_KEY = 'aws_ai_sound_enabled';

@Injectable({ providedIn: 'root' })
export class SoundService {
  readonly enabled = signal<boolean>(localStorage.getItem(SOUND_STORAGE_KEY) === 'true');

  private introAudio: HTMLAudioElement | null = null;
  private bgAudio: HTMLAudioElement | null = null;
  private sfxAudio: HTMLAudioElement | null = null;

  constructor() {
    if (typeof Audio !== 'undefined') {
      this.initAudio();
    }
  }

  private initAudio() {
    this.introAudio = this.createAudio(SOUNDS['intro'], false);
    this.bgAudio = this.createAudio(SOUNDS['questionBg'], true);

    this.introAudio.addEventListener('ended', () => {
      if (this.enabled()) {
        this.playBackground();
      }
    });
  }

  private createAudio(cfg: SoundDef, loop = false): HTMLAudioElement {
    const audio = new Audio();
    audio.src = cfg.local;
    audio.loop = loop;
    audio.volume = cfg.volume;
    audio.preload = 'auto';

    audio.addEventListener('error', () => {
      if (audio.src !== cfg.remote) {
        audio.src = cfg.remote;
      }
    });
    return audio;
  }

  toggle(): boolean {
    const next = !this.enabled();
    this.enabled.set(next);
    localStorage.setItem(SOUND_STORAGE_KEY, String(next));
    if (!next) {
      this.stopAll();
    }
    return next;
  }

  playIntro() {
    if (!this.enabled() || !this.introAudio) return;
    this.stopBackground();
    this.introAudio.currentTime = 0;
    this.introAudio.play().catch(() => {});
  }

  playBackground() {
    if (!this.enabled() || !this.bgAudio) return;
    this.bgAudio.currentTime = 0;
    this.bgAudio.play().catch(() => {});
  }

  stopBackground() {
    if (!this.bgAudio) return;
    this.bgAudio.pause();
    this.bgAudio.currentTime = 0;
  }

  playSelectOption() {
    this.playSfx(SOUNDS['selectOption']);
  }

  playCorrect() {
    this.stopBackground();
    this.playSfx(SOUNDS['correct']);
  }

  playWrong() {
    this.stopBackground();
    this.playSfx(SOUNDS['wrong']);
  }

  stopAll() {
    if (this.introAudio) {
      this.introAudio.pause();
      this.introAudio.currentTime = 0;
    }
    this.stopBackground();
    this.stopSfx();
  }

  private stopSfx() {
    if (this.sfxAudio) {
      this.sfxAudio.pause();
      this.sfxAudio.currentTime = 0;
    }
  }

  private playSfx(cfg: SoundDef) {
    if (!this.enabled() || typeof Audio === 'undefined') return;
    try {
      this.stopSfx();
      this.sfxAudio = this.createAudio(cfg, false);
      this.sfxAudio.play().catch(() => {});
    } catch {
      /* ignore audio error */
    }
  }
}
