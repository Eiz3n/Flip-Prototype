// Camera frames one room exactly. During Transition and Stage start it eases up one room height.
import { easeOutCubic, clamp01 } from './anim/ease.js';

export function createCamera() {
  return { y: 0, offsetX: 0, offsetY: 0, shakeAmount: 0, shakeTime: 0, shakeDuration: 0 };
}

export function shake(cam, amount, time) {
  const current = cam.shakeDuration > 0 ? cam.shakeAmount * (cam.shakeTime / cam.shakeDuration) : 0;
  if (amount < current) return;
  cam.shakeAmount = amount;
  cam.shakeTime = time;
  cam.shakeDuration = time;
}

export function updateCamera(cam, game, dt, rand = Math.random) {
  const { cfg } = game;
  cam.y = game.state === 'transition' || game.state === 'stageStart'
    ? -cfg.room.height * easeOutCubic(clamp01(game.stateTime / cfg.timing.panTime))
    : 0;

  if (cam.shakeTime > 0) {
    cam.shakeTime = Math.max(0, cam.shakeTime - dt);
    const a = cam.shakeAmount * (cam.shakeTime / cam.shakeDuration);
    cam.offsetX = (rand() * 2 - 1) * a;
    cam.offsetY = (rand() * 2 - 1) * a;
  } else {
    cam.offsetX = 0;
    cam.offsetY = 0;
  }
}
