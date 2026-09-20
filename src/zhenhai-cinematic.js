(function(root){
  const game=root.JQGame;
  let active=false,overlay=null,complete=null;
  const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));

  function ensureOverlay(){
    if(overlay)return overlay;
    overlay=document.createElement('div');
    overlay.id='skill-cinematic';
    overlay.className='skill-cinematic';
    overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML='<div class="skill-cinematic__backdrop"></div><div class="skill-cinematic__frame" role="dialog" aria-modal="true" aria-label="特殊牌演出"><video class="skill-cinematic__video" playsinline preload="auto"></video><div class="skill-cinematic__details" role="status"></div><button class="skill-cinematic__continue" hidden type="button">返回战局</button></div>';
    document.body.appendChild(overlay);
    return overlay;
  }

  async function playVideo(video,src){
    video.pause();
    video.src=src+(src.includes('?')?'&':'?')+'v=20260921';
    video.currentTime=0;
    video.muted=false;
    video.hidden=false;
    return new Promise(resolve=>{
      let finished=false;
      const done=()=>{
        if(finished)return;
        finished=true;
        clearTimeout(hardStop);
        video.removeEventListener('ended',done);
        video.removeEventListener('error',done);
        video.pause();
        resolve();
      };
      const hardStop=setTimeout(done,12000);
      video.addEventListener('ended',done,{once:true});
      video.addEventListener('error',done,{once:true});
      const started=video.play();
      if(started?.catch){
        started.catch(()=>{
          video.muted=true;
          video.play().catch(done);
        });
      }
    });
  }

  async function playCard(card,result){
    const definition=game.SkillCinematicLogic.getCinematic(card?.key);
    if(!definition||active)return false;
    active=true;
    const app=document.getElementById('app');
    const wasInert=Boolean(app?.inert);
    const focus=document.activeElement;
    if(app)app.inert=true;

    ensureOverlay();
    const video=overlay.querySelector('.skill-cinematic__video');
    const details=overlay.querySelector('.skill-cinematic__details');
    const button=overlay.querySelector('.skill-cinematic__continue');

    button.hidden=true;
    video.hidden=true;
    details.hidden=false;
    details.textContent=result?.activation||definition.title;
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden','false');
    document.documentElement.classList.add('skill-cinematic-active');

    await delay(game.MobilePrompts?.isMobile?.()?550:400);
    details.hidden=true;
    await playVideo(video,definition.src);
    video.hidden=true;

    details.hidden=false;
    details.textContent=result?.displayResult||result?.message||definition.title;
    if(game.MobilePrompts?.isMobile?.()){
      await delay(Math.min(7000,Math.max(3200,details.textContent.length*60)));
    }else{
      button.hidden=false;
      await new Promise(resolve=>{
        complete=resolve;
        button.onclick=resolve;
        button.focus();
      });
    }

    complete=null;
    button.onclick=null;
    video.pause();
    video.removeAttribute('src');
    video.load();
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden','true');
    document.documentElement.classList.remove('skill-cinematic-active');
    if(app)app.inert=wasInert;
    active=false;
    focus?.focus?.();
    return true;
  }

  game.SkillCinematic={playCard,isActive:()=>active,close:()=>complete?.()};
})(globalThis);
