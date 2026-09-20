(function (root) {
  const game = root.JQGame = root.JQGame || {};
  const STORAGE_KEY = 'jqgame:sfx-enabled';
  const MASTER_VOLUME = 0.6;
  let enabled = true;
  let audioCtx = null;
  let master = null;
  let unlocked = false;
  let lastWinnerId = null;

  try {
    const saved = root.localStorage?.getItem?.(STORAGE_KEY);
    enabled = saved !== '0';
  } catch (_) {}

  const PATTERNS = {
    click:    [{ f: 760, d: .035, v: .11, type: 'triangle' }],
    move:     [{ f: 260, d: .07, v: .13, type: 'sine' }, { f: 390, d: .09, v: .10, type: 'triangle', at: .055 }],
    inspect:  [{ f: 430, d: .08, v: .13, type: 'triangle' }, { f: 610, d: .11, v: .12, type: 'sine', at: .08 }],
    treasure: [{ f: 523, d: .10, v: .16, type: 'triangle' }, { f: 659, d: .12, v: .15, type: 'triangle', at: .09 }, { f: 784, d: .19, v: .14, type: 'sine', at: .18 }],
    bully:    [{ f: 180, d: .14, v: .17, type: 'square' }, { f: 135, d: .18, v: .15, type: 'triangle', at: .09 }],
    fire:     [{ noise: true, d: .34, v: .13 }, { f: 125, d: .24, v: .16, type: 'sawtooth', at: .03 }, { f: 82, d: .28, v: .12, type: 'square', at: .12 }],
    swap:     [{ f: 330, d: .08, v: .13, type: 'sine' }, { f: 560, d: .08, v: .12, type: 'triangle', at: .06 }, { f: 300, d: .10, v: .10, type: 'sine', at: .12 }],
    order:    [{ f: 98, d: .10, v: .18, type: 'square' }, { f: 98, d: .10, v: .18, type: 'square', at: .13 }, { f: 196, d: .16, v: .13, type: 'triangle', at: .27 }],
    draw:     [{ f: 920, d: .035, v: .08, type: 'triangle' }, { f: 700, d: .045, v: .08, type: 'triangle', at: .04 }],
    turn:     [{ f: 392, d: .08, v: .10, type: 'sine' }, { f: 523, d: .11, v: .10, type: 'sine', at: .08 }],
    victory:  [{ f: 523, d: .13, v: .16, type: 'triangle' }, { f: 659, d: .13, v: .16, type: 'triangle', at: .13 }, { f: 784, d: .13, v: .16, type: 'triangle', at: .26 }, { f: 1047, d: .50, v: .17, type: 'sine', at: .39 }],
    defeat:   [{ f: 330, d: .16, v: .14, type: 'triangle' }, { f: 247, d: .19, v: .14, type: 'triangle', at: .14 }, { f: 165, d: .42, v: .15, type: 'sine', at: .30 }]
  };

  function has(name) { return Boolean(PATTERNS[name]); }
  function isEnabled() { return enabled; }
  function setEnabled(value) {
    enabled = Boolean(value);
    try { root.localStorage?.setItem?.(STORAGE_KEY, enabled ? '1' : '0'); } catch (_) {}
    updateToggle();
    if (enabled) unlock();
    return enabled;
  }

  function ensureContext() {
    if (!enabled) return null;
    const Ctx = root.AudioContext || root.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) {
      audioCtx = new Ctx();
      master = audioCtx.createGain();
      master.gain.value = MASTER_VOLUME;
      master.connect(audioCtx.destination);
    }
    return audioCtx;
  }

  function unlock() {
    const ctx = ensureContext();
    if (!ctx) return false;
    if (ctx.state === 'suspended') ctx.resume?.();
    unlocked = true;
    return true;
  }

  function tone(step, start) {
    const ctx = ensureContext();
    if (!ctx || !master || !unlocked) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = step.type || 'sine';
    osc.frequency.setValueAtTime(step.f || 440, start);
    const vol = Math.max(0.001, step.v || .1);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(vol, start + .008);
    gain.gain.exponentialRampToValueAtTime(0.001, start + (step.d || .08));
    osc.connect(gain); gain.connect(master);
    osc.start(start); osc.stop(start + (step.d || .08) + .02);
  }

  function noise(step, start) {
    const ctx = ensureContext();
    if (!ctx || !master || !unlocked || !ctx.createBuffer) return;
    const duration = step.d || .2;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter?.();
    source.buffer = buffer;
    gain.gain.setValueAtTime(step.v || .1, start);
    gain.gain.exponentialRampToValueAtTime(.001, start + duration);
    if (filter) {
      filter.type = 'lowpass'; filter.frequency.value = 1100;
      source.connect(filter); filter.connect(gain);
    } else source.connect(gain);
    gain.connect(master);
    source.start(start);
  }

  function play(name) {
    if (!enabled || !has(name)) return false;
    const ctx = ensureContext();
    if (!ctx || !unlocked) return false;
    const now = ctx.currentTime + .008;
    PATTERNS[name].forEach(step => {
      const start = now + (step.at || 0);
      if (step.noise) noise(step, start); else tone(step, start);
    });
    return true;
  }

  function updateToggle() {
    if (typeof document === 'undefined') return;
    const btn = document.getElementById('sfx-toggle');
    if (!btn) return;
    btn.textContent = enabled ? '🔊' : '🔇';
    btn.title = enabled ? '关闭音效' : '开启音效';
    btn.setAttribute('aria-label', btn.title);
    btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
  }

  function mountToggle() {
    if (typeof document === 'undefined' || document.getElementById('sfx-toggle')) return;
    const btn = document.createElement('button');
    btn.id = 'sfx-toggle';
    btn.type = 'button';
    btn.style.cssText = 'position:fixed;right:max(12px,env(safe-area-inset-right));top:max(12px,env(safe-area-inset-top));z-index:12000;width:44px;height:44px;border-radius:50%;border:1px solid rgba(216,183,109,.72);background:rgba(5,25,32,.86);color:#f1daa0;font-size:21px;line-height:1;box-shadow:0 6px 18px rgba(0,0,0,.28);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);cursor:pointer;';
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      unlock();
      setEnabled(!enabled);
      if (enabled) setTimeout(() => play('click'), 0);
    });
    document.body.appendChild(btn);
    updateToggle();
  }

  function wrap(name, handler) {
    const original = game[name];
    if (typeof original !== 'function' || original.__audioWrapped) return;
    function wrapped(...args) {
      const before = handler?.before?.(args);
      const result = original.apply(this, args);
      handler?.after?.(args, result, before);
      return result;
    }
    wrapped.__audioWrapped = true;
    wrapped.__audioOriginal = original;
    game[name] = wrapped;
  }

  function cardBefore(args) {
    const [state, playerId, runtimeId] = args;
    return state?.players?.find(p => p.id === playerId)?.hand?.find(c => c.runtimeId === runtimeId) || null;
  }

  function installHooks() {
    wrap('playLocationCard', { after: (_args, result) => { if (result?.ok) play('move'); } });
    wrap('playTravelCard', { after: (_args, result) => { if (result?.ok) play('move'); } });
    wrap('playInspectCard', { after: (_args, result) => { if (result?.ok) play(result.gained ? 'treasure' : 'inspect'); } });
    wrap('playTacticCard', {
      before: cardBefore,
      after: (_args, result, card) => {
        if (!result?.ok) return;
        const sound = card?.key === 'fire' ? 'fire' : card?.key === 'flower' ? 'swap' : 'bully';
        play(sound);
      }
    });
    wrap('playTrumpCard', { after: (_args, result) => { if (result?.ok) play('order'); } });
    wrap('passTurnBySwappingCard', { after: (_args, result) => { if (result?.ok) play('draw'); } });
    wrap('beginTurn', { after: (_args, result) => { if (result?.ok && !result.skipped) play('turn'); } });

    const originalWinner = game.checkWinner;
    if (typeof originalWinner === 'function' && !originalWinner.__audioWrapped) {
      function wrappedWinner(state) {
        const result = originalWinner.call(this, state);
        if (result && result !== lastWinnerId) {
          lastWinnerId = result;
          play(result === 'human' ? 'victory' : 'defeat');
        }
        if (!result) lastWinnerId = null;
        return result;
      }
      wrappedWinner.__audioWrapped = true;
      game.checkWinner = wrappedWinner;
    }

    const ui = game.UI;
    if (ui && typeof ui.showDrawRitual === 'function' && !ui.showDrawRitual.__audioWrapped) {
      const originalDraw = ui.showDrawRitual;
      ui.showDrawRitual = function (...args) {
        play('draw');
        return originalDraw.apply(this, args);
      };
      ui.showDrawRitual.__audioWrapped = true;
    }
  }

  function installGestureUnlock() {
    if (typeof document === 'undefined') return;
    const unlockOnce = () => unlock();
    document.addEventListener('pointerdown', unlockOnce, { passive: true });
    document.addEventListener('touchstart', unlockOnce, { passive: true });
    document.addEventListener('keydown', unlockOnce, { passive: true });
    document.addEventListener('click', (event) => {
      const target = event.target?.closest?.('button,.card,[data-runtime-id],.hand-card,.pile-card');
      if (target && target.id !== 'sfx-toggle') play('click');
    }, true);
  }

  game.AudioFX = { play, has, unlock, isEnabled, setEnabled, installHooks };

  installHooks();
  if (typeof document !== 'undefined') {
    installGestureUnlock();
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountToggle, { once: true });
    else mountToggle();
  }
})(globalThis);
