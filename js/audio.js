/* Efeitos sonoros do jogo, sintetizados via Web Audio API.
   Sem arquivos de áudio externos — funciona 100% offline/estático (GitHub Pages). */

const AudioEngine = (() => {
  let ctx = null;
  let muted = false;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone({ freq, start, duration, type = "sine", gain = 0.2, slideTo = null }) {
    const audioCtx = getCtx();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
    gainNode.gain.setValueAtTime(0, start);
    gainNode.gain.linearRampToValueAtTime(gain, start + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gainNode).connect(audioCtx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.03);
  }

  function playCorrect() {
    if (muted) return;
    const t = getCtx().currentTime;
    // arpejo ascendente (C5 - E5 - G5 - C6): soa como um "acerto"
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      tone({ freq, start: t + i * 0.09, duration: 0.24, type: "triangle", gain: 0.22 });
    });
  }

  function playWrong() {
    if (muted) return;
    const t = getCtx().currentTime;
    tone({ freq: 196, start: t, duration: 0.5, type: "sawtooth", gain: 0.2, slideTo: 98 });
    tone({ freq: 185, start: t, duration: 0.5, type: "square", gain: 0.08, slideTo: 90 });
  }

  function playNextQuestion() {
    if (muted) return;
    const t = getCtx().currentTime;
    tone({ freq: 420, start: t, duration: 0.16, type: "sine", gain: 0.14, slideTo: 680 });
  }

  function setMuted(value) {
    muted = value;
  }
  function isMuted() {
    return muted;
  }

  return { playCorrect, playWrong, playNextQuestion, setMuted, isMuted };
})();
