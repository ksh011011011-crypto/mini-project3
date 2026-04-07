/**
 * 외부 파일 없이 Web Audio로 만드는 부드러운 앰비언트.
 * 방문(마운트)마다 랜덤 주파수·패닝·리듬 — "AI 생성" 대체용 데모 톤.
 */
export function startProceduralMallSound(): () => void {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return () => {};

  const ctx = new Ctx();
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  const master = ctx.createGain();
  master.gain.value = 0.0001;
  const now = ctx.currentTime;
  master.gain.linearRampToValueAtTime(0.07, now + 1.2);

  const base = 55 + Math.random() * 18;
  const ratios = [1, 1.25, 1.5, 2, 2.5].sort(() => Math.random() - 0.5).slice(0, 3);

  const nodes: OscillatorNode[] = [];

  for (let k = 0; k < ratios.length; k++) {
    const osc = ctx.createOscillator();
    osc.type = k === 0 ? "sine" : "triangle";
    osc.frequency.value = base * ratios[k]! * (0.985 + Math.random() * 0.03);

    const g = ctx.createGain();
    g.gain.value = 0.12 + Math.random() * 0.1;

    const pan = ctx.createStereoPanner();
    pan.pan.value = (Math.random() * 2 - 1) * 0.65;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.03 + Math.random() * 0.06;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 0.04 + Math.random() * 0.04;
    lfo.connect(lfoG);
    lfoG.connect(g.gain);

    osc.connect(g).connect(pan).connect(master);
    osc.start();
    lfo.start();
    nodes.push(osc, lfo);
  }

  master.connect(ctx.destination);

  return () => {
    try {
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(0.0001, t + 0.35);
      window.setTimeout(() => {
        nodes.forEach((n) => {
          try {
            n.stop();
          } catch {
            /* noop */
          }
        });
        ctx.close();
      }, 400);
    } catch {
      ctx.close();
    }
  };
}
