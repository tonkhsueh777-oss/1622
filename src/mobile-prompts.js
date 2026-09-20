(function (root) {
  const game = root.JQGame;
  const identities = {human: ['玩家（你）', '我'], ai1: ['AI玩家甲', '甲'], ai2: ['AI玩家乙', '乙']};
  const isMobile = () => typeof matchMedia !== 'undefined' && matchMedia('(max-width: 768px)').matches;
  function special(card, result, state, actorId) {
    const actor = state.players.find(p => p.id === actorId);
    const target = state.players.find(p => p.id === result.targetPlayerId);
    const a = identities[actor.id][0], t = identities[target.id][0];
    const place = id => id === 'center' ? '中左所军门' : game.LOCATIONS[id].name;
    let activation = `${a}发动【${card.name}】\n指定${t}`;
    let body = result.message;
    if (card.key === 'bully') body = `${t}\n下一个完整回合无法行动`;
    if (card.key === 'fire') {
      body = result.burnedCard
        ? `${t}的\n【${result.burnedCard.name}】\n已被烧毁`
        : `${t}无手牌\n本次没有牌被烧毁`;
      body += `\n\n${t}下一回合\n不会自动补牌至3张`;
    }
    if (card.key === 'flower') {
      activation = `${a}发动【${card.name}】\n强制与${t}交换位置`;
      body = `${a}移动到【${place(actor.position)}】\n${t}移动到【${place(target.position)}】\n\n交换完成`;
    }
    if (card.type === 'trump') {
      activation = `${a}发动【${card.name}】\n强制与${t}交换镇海战备`;
      body = `${a}交出【${game.TREASURES[result.ownTreasureId].name}】\n${t}交出【${game.TREASURES[result.targetTreasureId].name}】\n\n镇海战备交换完成`;
    }
    return {...result, activation, displayResult: `${activation}\n\n${body}`};
  }
  async function showTurn(player) {
    if (!isMobile()) return;
    const [name, badge] = identities[player.id];
    let node = document.getElementById('mobile-turn-prompt');
    if (!node) {
      node = document.createElement('div');
      node.id = 'mobile-turn-prompt';
      node.setAttribute('role', 'status');
      node.innerHTML = '<span class="turn-identity"></span><div>当前回合<strong></strong></div>';
      document.body.appendChild(node);
    }
    node.querySelector('.turn-identity').textContent = badge;
    node.querySelector('strong').textContent = name;
    node.classList.add('is-visible');
    await new Promise(resolve => setTimeout(resolve, 850));
    node.classList.remove('is-visible');
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  game.MobilePrompts = {isMobile, special, showTurn};
})(globalThis);
