import { resolveResourceUrl } from "./resource-url.ts";

export type AudioActionResult = "failed" | "played" | "queued" | "skipped";

export type GameAudioConfiguration = {
  resourceBaseUrl?: string;
};

export type GameAudioManagerOptions = {
  createAudio?: (url: string) => HTMLAudioElement;
  storage?: Pick<Storage, "getItem" | "setItem">;
};

export type GameAudioSnapshot = {
  bgmVolume: number;
  isMuted: boolean;
  sfxVolume: number;
};

export type GameAudioManager = {
  configure: (configuration: GameAudioConfiguration) => void;
  getSnapshot: () => GameAudioSnapshot;
  playBgm: () => Promise<AudioActionResult>;
  playSfx: (sound: "effect" | "ui-click") => Promise<AudioActionResult>;
  setBgmVolume: (volume: number) => void;
  setMuted: (isMuted: boolean) => void;
  setSfxVolume: (volume: number) => void;
  subscribe: (listener: (snapshot: GameAudioSnapshot) => void) => () => void;
  unlock: () => Promise<AudioActionResult>;
  unlockAndPlayBgm: () => Promise<AudioActionResult>;
};

const DEFAULT_BGM_PATH = "audios/bgm.mp3";
const SOUND_PATHS = {
  effect: "audios/effect.mp3",
  "ui-click": "audios/ui-click.mp3",
} as const;
const PREFERENCES_KEY = "sdk-game:audio-preferences:v1";
const MAX_CONCURRENT_SFX = 6;

/**
 * 创建游戏音频管理器。首次用户交互前的背景音乐请求会被保留，解锁后才实际播放。
 */
export function createGameAudioManager(options: GameAudioManagerOptions = {}): GameAudioManager {
  const createAudio = options.createAudio ?? ((url: string) => new Audio(url));
  const storage = options.storage ?? (() => {
    try {
      return globalThis.localStorage;
    } catch {
      return undefined;
    }
  })();
  let bgm: HTMLAudioElement | undefined;
  let bgmVolume = 0.5;
  let isUnlocked = false;
  let isBgmRequested = false;
  let isMuted = false;
  let resourceBaseUrl: string | undefined;
  let sfxVolume = 0.8;
  const activeSfx = { effect: 0, "ui-click": 0 };
  const listeners = new Set<(snapshot: GameAudioSnapshot) => void>();

  try {
    const savedPreferences = storage?.getItem(PREFERENCES_KEY);
    if (savedPreferences) {
      const saved = JSON.parse(savedPreferences) as Partial<GameAudioSnapshot>;
      if (typeof saved.bgmVolume === "number") bgmVolume = Math.min(1, Math.max(0, saved.bgmVolume));
      if (typeof saved.sfxVolume === "number") sfxVolume = Math.min(1, Math.max(0, saved.sfxVolume));
      if (typeof saved.isMuted === "boolean") isMuted = saved.isMuted;
    }
  } catch {
    // 本地存储不可用时继续使用默认设置。
  }

  const getSnapshot = (): GameAudioSnapshot => ({ bgmVolume, isMuted, sfxVolume });
  const emit = () => {
    const snapshot = getSnapshot();
    try {
      storage?.setItem(PREFERENCES_KEY, JSON.stringify(snapshot));
    } catch {
      // 隐私模式或宿主限制存储时，音频功能仍可在本次会话中使用。
    }
    listeners.forEach((listener) => listener(snapshot));
  };

  const startBgm = async (): Promise<AudioActionResult> => {
    if (!isBgmRequested) return "skipped";
    bgm ??= createAudio(resolveResourceUrl(resourceBaseUrl, DEFAULT_BGM_PATH));
    bgm.loop = true;
    bgm.volume = isMuted ? 0 : bgmVolume;

    try {
      await bgm.play();
      return "played";
    } catch {
      return "failed";
    }
  };

  return {
    configure(configuration) {
      resourceBaseUrl = configuration.resourceBaseUrl;
    },
    getSnapshot,
    async playBgm() {
      isBgmRequested = true;
      return isUnlocked ? startBgm() : "queued";
    },
    async playSfx(sound) {
      if (!isUnlocked || isMuted) return "skipped";
      if (activeSfx[sound] >= MAX_CONCURRENT_SFX) return "skipped";
      const sfx = createAudio(resolveResourceUrl(resourceBaseUrl, SOUND_PATHS[sound]));
      sfx.volume = sfxVolume;
      activeSfx[sound] += 1;
      let hasReleased = false;
      const release = () => {
        if (hasReleased) return;
        hasReleased = true;
        activeSfx[sound] -= 1;
      };
      sfx.addEventListener("ended", release, { once: true });
      try {
        await sfx.play();
        return "played";
      } catch {
        release();
        return "failed";
      }
    },
    setMuted(nextMuted) {
      isMuted = nextMuted;
      if (bgm) bgm.volume = isMuted ? 0 : bgmVolume;
      emit();
    },
    setBgmVolume(nextVolume) {
      bgmVolume = Math.min(1, Math.max(0, nextVolume));
      if (bgm && !isMuted) bgm.volume = bgmVolume;
      emit();
    },
    setSfxVolume(nextVolume) {
      sfxVolume = Math.min(1, Math.max(0, nextVolume));
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(getSnapshot());
      return () => listeners.delete(listener);
    },
    async unlock() {
      isUnlocked = true;
      return startBgm();
    },
    unlockAndPlayBgm() {
      isBgmRequested = true;
      isUnlocked = true;
      return startBgm();
    },
  };
}

export const gameAudio = createGameAudioManager();
