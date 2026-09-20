(function(root){
  const game=root.JQGame;
  if(!game||typeof document==='undefined')return;
  let active=false,overlay=null,complete=null;
  const BUILD='video-v2-20260921b';

  function ensureOverlay(){
    if(overlay)return overlay;
    overlay=document.createElement('div');
    overlay.id='skill-cinematic';
    overlay.className='skill-cinematic';
    overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML='<div class="skill-cinematic__backdrop"></div><div class="skill-cinematic__frame" role="dialog" aria-modal="true" aria-label="特殊牌影片"><video class="skill-cinematic__video" playsinline preload="auto" muted></video><div class="skill-cinematic__details" role="status"></div><button class="skill-cinematic__continue" hidden type="button">返回战局</button></div>';
    document.body.appendChild(overlay);
    const video=overlay.querySelector('.skill-cinematic__video');
    video.style.objectFit='contain';
    video.style.background='#000';
    return overlay;
  }

  function playVideo(video,src){
    video.pause();
    video.removeAttribute('src');
    video.load();
    const cacheBust='v=20260921b';
    video.src=src+(src.includes('?')?'&':'?')+cacheBust;
    video.currentTime=0;
    video.hidden=false;

    const canStartWithSound=Boolean(root.navigator?.userActivation?.isActive);
    video.muted=!canStartWithSound;

    return new Promise(resolve=>{
      let finished=false;
      const done=()=>{
        if(finished)return;
        finished=true;
        clearTimeout(hardStop);
        video.removeEventListener('ended',done);
        video.removeEventListener('error',done);
        resolve();
      };
      const hardStop=setTimeout(done,12000);
      video.addEventListener('ended',done,{once:true});
      video.addEventListener('error',done,{once:true});

      const attempt=video.play();
      if(attempt?.catch){
        attempt.catch(()=>{
          video.muted=true;
          video.setAttribute('muted','');
          const retry=video.play();
          if(retry?.catch)retry.catch(done);
        });
      }
    });
  }

  async function playCard(card,result){
    const definition=game.SkillCinematicLogic?.getCinematic?.(card?.key);
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
    details.hidden=true;
    video.hidden=false;
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden','false');
    document.documentElement.classList.add('skill-cinematic-active');

    await playVideo(video,definition.src);
    video.pause();
    video.hidden=true;

    details.hidden=false;
    details.textContent=result?.displayResult||result?.message||definition.title;
    if(game.MobilePrompts?.isMobile?.()){
      await new Promise(r=>setTimeout(r,Math.min(7000,Math.max(3200,details.textContent.length*60))));
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

  game.SkillCinematic={playCard,isActive:()=>active,close:()=>complete?.(),build:BUILD};
  game.CINEMATIC_BUILD=BUILD;
})(globalThis);
