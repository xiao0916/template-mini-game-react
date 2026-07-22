import assert from "node:assert/strict";
import test from "node:test";

import { createGameAudioManager } from "../src/utils/game-audio.ts";

class FakeAudio {
  currentTime = 0;
  loop = false;
  paused = true;
  playCalls = 0;
  volume = 1;

  async play() {
    this.playCalls += 1;
    this.paused = false;
  }

  pause() {
    this.paused = true;
  }

  addEventListener() {}
}

test("背景音乐会等待首次解锁后才播放", async () => {
  const audios: FakeAudio[] = [];
  const audio = createGameAudioManager({
    createAudio: () => {
      const instance = new FakeAudio();
      audios.push(instance);
      return instance as unknown as HTMLAudioElement;
    },
  });

  audio.configure({ resourceBaseUrl: "https://cdn.example.com/game" });

  assert.equal(await audio.playBgm(), "queued");
  assert.equal(audios.length, 0);

  assert.equal(await audio.unlock(), "played");
  assert.equal(audios.length, 1);
  assert.equal(audios[0].loop, true);
  assert.equal(audios[0].playCalls, 1);
});

test("手势解锁接口会在一次调用中启动背景音乐", async () => {
  const audios: FakeAudio[] = [];
  const audio = createGameAudioManager({
    createAudio: () => {
      const instance = new FakeAudio();
      audios.push(instance);
      return instance as unknown as HTMLAudioElement;
    },
  });
  audio.configure({ resourceBaseUrl: "./resources/" });

  assert.equal(await audio.unlockAndPlayBgm(), "played");
  assert.equal(audios.length, 1);
  assert.equal(audios[0].playCalls, 1);
});

test("停止背景音乐会暂停、归零并清除待播放请求", async () => {
  const audios: FakeAudio[] = [];
  const audio = createGameAudioManager({
    createAudio: () => {
      const instance = new FakeAudio();
      audios.push(instance);
      return instance as unknown as HTMLAudioElement;
    },
  });

  await audio.unlockAndPlayBgm();
  audios[0].currentTime = 12;
  audio.stopBgm();

  assert.equal(audios[0].paused, true);
  assert.equal(audios[0].currentTime, 0);
  assert.equal(await audio.unlock(), "skipped");
  assert.equal(await audio.playBgm(), "played");
  assert.equal(audios.length, 2);
});

test("静音会抑制音效，音效音量会应用到新实例", async () => {
  const audios: FakeAudio[] = [];
  const audio = createGameAudioManager({
    createAudio: () => {
      const instance = new FakeAudio();
      audios.push(instance);
      return instance as unknown as HTMLAudioElement;
    },
  });

  audio.configure({ resourceBaseUrl: "./resources/" });
  await audio.unlock();
  audio.setMuted(true);

  assert.equal(await audio.playSfx("effect"), "skipped");
  assert.equal(audios.length, 0);

  audio.setMuted(false);
  audio.setSfxVolume(0.25);

  assert.equal(await audio.playSfx("effect"), "played");
  assert.equal(audios.length, 1);
  assert.equal(audios[0].volume, 0.25);
});

test("分类音量会裁剪、持久化并通知订阅者", () => {
  const values = new Map<string, string>();
  const audio = createGameAudioManager({
    storage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
  });
  const snapshots: number[] = [];
  const unsubscribe = audio.subscribe((snapshot) => snapshots.push(snapshot.bgmVolume));

  audio.setBgmVolume(2);
  unsubscribe();

  assert.equal(audio.getSnapshot().bgmVolume, 1);
  assert.deepEqual(snapshots, [0.5, 1]);
  assert.match(values.get("sdk-game:audio-preferences:v1") ?? "", /"bgmVolume":1/);
});

test("同类效果音最多同时播放六个实例", async () => {
  const audio = createGameAudioManager({ createAudio: () => new FakeAudio() as unknown as HTMLAudioElement });
  audio.configure({ resourceBaseUrl: "./resources/" });
  await audio.unlock();

  const results = await Promise.all(Array.from({ length: 7 }, () => audio.playSfx("effect")));

  assert.deepEqual(results, ["played", "played", "played", "played", "played", "played", "skipped"]);
});
