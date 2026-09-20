(function(root){
  const game=root.JQGame;
  let active=false,overlay=null,complete=null;
  const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  async function playCard(card,result){
    const definition=game.SkillCinematicLogic.getCinematic(card?.key);
    if(!definition||active)return false;
    active=true;
    const app=document.getElementById('app'),wasInert=app.inert,focus=document.activeElement;
    app.inert=true;
    if(!overlay){
      overlay=document.createElement('div');overlay.id='skill-cinematic';overlay.className='skill-cinematic';
      overlay.innerHTML='<div class="skill-cinematic__backdrop"></div><div class="skill-cinematic__frame" role="dialog" aria-modal="true" aria-label="军令演出"><div class="skill-cinematic__details" role="status"></div><div class="zh-battle" hidden><img alt=""><div class="zh-battle__caption"></div></div><button class="skill-cinematic__continue" hidden type="button">返回战局</button></div>';
      document.body.appendChild(overlay);
    }
    const details=overlay.querySelector('.skill-cinematic__details'),battle=overlay.querySelector('.zh-battle'),button=overlay.querySelector('button');
    button.hidden=true;battle.hidden=true;details.hidden=false;details.textContent=result.activation;
    overlay.classList.add('is-open');overlay.setAttribute('aria-hidden','false');
    document.documentElement.classList.add('skill-cinematic-active');
    await delay(1800);
    details.hidden=true;battle.dataset.effect=card.key;battle.querySelector('img').src=card.asset;
    battle.querySelector('.zh-battle__caption').textContent=card.name+'发动';battle.hidden=false;
    await delay(definition.durationMs);
    battle.hidden=true;details.hidden=false;details.textContent=result.displayResult||result.message;
    if(game.MobilePrompts.isMobile())await delay(Math.min(7000,Math.max(4000,details.textContent.length*65)));
    else {button.hidden=false;await new Promise(resolve=>{complete=resolve;button.onclick=resolve;button.focus();});}
    complete=null;button.onclick=null;
    overlay.classList.remove('is-open');overlay.setAttribute('aria-hidden','true');
    document.documentElement.classList.remove('skill-cinematic-active');app.inert=wasInert;active=false;focus?.focus();
    return true;
  }
  game.SkillCinematic={playCard,isActive:()=>active,close:()=>complete?.()};
})(globalThis);
