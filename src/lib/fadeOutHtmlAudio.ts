/** HTMLAudioElement 볼륨 램프 후 제거(포털 전환 시 클릭 끊김 완화). */
export function fadeOutAndTeardownAudio(
  el: HTMLAudioElement,
  ms: number,
  onDone: () => void
): void {
  const start = el.volume;
  const t0 = performance.now();
  const step = () => {
    const elapsed = performance.now() - t0;
    if (elapsed >= ms) {
      el.pause();
      el.removeAttribute("src");
      el.load();
      el.remove();
      onDone();
      return;
    }
    el.volume = Math.max(0, start * (1 - elapsed / ms));
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
