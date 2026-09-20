(function (root) {
  const game = root.JQGame;
  const logic = game?.SkillCinematicLogic;
  if (!game || !logic || typeof document === 'undefined') return;

  let overlay = null;
  let video = null;
  let title = null;
  let active = false;
  let details = null;
  let continueButton = null;
  let appWasInert = false;

  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'skill-cinematic';
    overlay.className = 'skill-cinematic';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <div class="skill-cinematic__backdrop"></div>
      <div class="skill-cinematic__frame" role="dialog" aria-modal="true" aria-label="技能动画">
        <video class="skill-cinematic__video" playsinline preload="auto"></video>
        <div class="skill-cinematic__flare" aria-hidden="true"></div>
        <div class="skill-cinematic__title" aria-live="polite"></div>
        <div class="skill-cinematic__details" role="status"></div>
        <button class="skill-cinematic__continue" type="button" hidden>确认结算，继续</button>
      </div>`;
    document.body.appendChild(overlay);
    video = overlay.querySelector('.skill-cinematic__video');
    title = overlay.querySelector('.skill-cinematic__title');
    details = overlay.querySelector('.skill-cinematic__details');
    continueButton = overlay.querySelector('.skill-cinematic__continue');
    return overlay;
  }

  function closeOverlay() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('skill-cinematic-active');
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
    if (title) {
      title.textContent = '';
      title.classList.remove('is-visible');
    }
    active = false;
    const app = document.getElementById('app');
    if (app) app.inert = appWasInert;
  }

  async function playCard(card, result) {
    const definition = logic.getCinematic(card?.key);
    if (!definition || active) return false;
    ensureOverlay();
    active = true;
    const autoClose = Boolean(game.MobilePrompts?.isMobile());
    overlay.classList.toggle('is-auto-close', autoClose);
    const app = document.getElementById('app');
    appWasInert = Boolean(app?.inert);
    if (app) app.inert = true;
    continueButton.hidden = true;
    details.hidden = false;
    details.textContent = result?.activation || definition.title;

    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('skill-cinematic-active');
    title.textContent = definition.title;
    title.classList.remove('is-visible');
    video.src = `${definition.src}?v=34`;
    video.currentTime = 0;
    video.muted = false;
    video.hidden = true;
    await new Promise(resolve => setTimeout(resolve, autoClose ? 1800 : 1000));
    video.hidden = false;
    details.hidden = true;

    return new Promise(resolve => {
      let finished = false;
      let hardStop = null;
      const finish = () => {
        if (finished) return;
        finished = true;
        clearTimeout(hardStop);
        video.removeEventListener('timeupdate', onTimeUpdate);
        video.removeEventListener('ended', finish);
        video.removeEventListener('error', onError);
        video.pause();
        video.hidden = true;
        title.classList.remove('is-visible');
        details.hidden = false;
        details.textContent = result?.displayResult || result?.message || definition.title;
        if (autoClose) {
          // Keep the existing input lock until the result has been readable.
          const readingMs = Math.min(7000, Math.max(4000, details.textContent.length * 65));
          setTimeout(() => { closeOverlay(); resolve(true); }, readingMs);
          return;
        }
        continueButton.hidden = false;
        continueButton.onclick = () => {
          continueButton.onclick = null;
          closeOverlay();
          resolve(true);
        };
        continueButton.focus();
      };
      const onTimeUpdate = () => {
        if (video.currentTime >= 5) title.classList.add('is-visible');
      };
      const onError = () => {
        title.classList.add('is-visible');
        setTimeout(finish, 900);
      };

      video.addEventListener('timeupdate', onTimeUpdate);
      video.addEventListener('ended', finish, { once: true });
      video.addEventListener('error', onError, { once: true });
      hardStop = setTimeout(finish, definition.durationMs + 650);

      const started = video.play();
      if (started?.catch) {
        started.catch(() => {
          video.muted = true;
          video.play().catch(onError);
        });
      }
    });
  }

  game.SkillCinematic = { playCard, close: closeOverlay, isActive: () => active };
})(globalThis);
