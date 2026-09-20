(function (root) {
  const game = root.JQGame;

  const ADJACENCY = {
    center: ['tainan', 'mengxia', 'zhuluo', 'madou'],
    tainan: ['center'],
    mengxia: ['center'],
    zhuluo: ['center'],
    madou: ['center']
  };

  function findPlayer(state, playerId) {
    return state.players.find(player => player.id === playerId) || null;
  }

  function findCard(player, runtimeId) {
    return player ? player.hand.find(card => card.runtimeId === runtimeId) || null : null;
  }

  function takeCard(player, runtimeId) {
    const index = player.hand.findIndex(card => card.runtimeId === runtimeId);
    if (index < 0) return null;
    return player.hand.splice(index, 1)[0];
  }

  function canAct(state, playerId) {
    if (state.winnerId) return false;
    const current = state.players[state.currentPlayerIndex];
    return state.phase === 'action' && current && current.id === playerId;
  }

  game._findPlayer = findPlayer;
  game.ADJACENCY = ADJACENCY;

  game.countTreasureKinds = function countTreasureKinds(player) {
    return Object.values(player.treasures).filter(value => value > 0).length;
  };

  game.checkWinner = function checkWinner(state) {
    const winner = state.players.find(player => game.countTreasureKinds(player) >= 4) || null;
    state.winnerId = winner ? winner.id : null;
    return state.winnerId;
  };

  game.mustDiscard = function mustDiscard(state, playerId) {
    const player = findPlayer(state, playerId);
    return Boolean(player && player.hand.length > 3);
  };

  game.discardCard = function discardCard(state, playerId, runtimeId) {
    const player = findPlayer(state, playerId);
    const card = findCard(player, runtimeId);
    if (!player || !card) return { ok: false, message: '找不到这张牌。' };

    const duplicateLocation = card.type === 'location' && Boolean(state.openedLocations[card.locationId]);
    const legalByPhase = state.phase === 'discard' || (state.phase === 'action' && duplicateLocation);
    if (!legalByPhase) return { ok: false, message: '当前不能弃置这张牌。' };

    const removed = takeCard(player, runtimeId);
    state.discardPile.push(removed);
    const message = duplicateLocation ? `重复地牌【${removed.name}】作为废牌弃置。` : `【${removed.name}】进入弃牌堆。`;
    state.log.push(`${player.name}：${message}`);
    player.lastAction = message;
    return { ok: true, message };
  };

  game.playLocationCard = function playLocationCard(state, playerId, runtimeId) {
    if (!canAct(state, playerId)) return { ok: false, message: '当前不是你的行动阶段。' };
    const player = findPlayer(state, playerId);
    const card = findCard(player, runtimeId);
    if (!card || card.type !== 'location') return { ok: false, message: '这不是地牌。' };

    if (state.openedLocations[card.locationId]) {
      return game.discardCard(state, playerId, runtimeId);
    }

    const removed = takeCard(player, runtimeId);
    state.openedLocations[removed.locationId] = true;
    state.locationCards[removed.locationId] = removed;
    const message = `开放地点【${removed.name}】，该地牌永久留在地图。`;
    state.log.push(`${player.name}：${message}`);
    player.lastAction = message;
    return { ok: true, message, locationId: removed.locationId };
  };

  game.playTravelCard = function playTravelCard(state, playerId, runtimeId, destination) {
    if (!canAct(state, playerId)) return { ok: false, message: '当前不是你的行动阶段。' };
    const player = findPlayer(state, playerId);
    const card = findCard(player, runtimeId);
    if (!card || card.type !== 'travel') return { ok: false, message: '这不是巡防牌。' };
    if (!ADJACENCY[player.position] || !ADJACENCY[player.position].includes(destination)) {
      return { ok: false, message: '巡防每次只能沿连线移动1格。' };
    }
    if (destination !== 'center' && !state.openedLocations[destination]) {
      return { ok: false, message: '目标地点尚未出现地牌，不能进入。' };
    }

    const removed = takeCard(player, runtimeId);
    state.discardPile.push(removed);
    player.position = destination;
    const destinationName = destination === 'center' ? '中左所军门' : game.LOCATIONS[destination].name;
    const message = `打出【巡防】，移动至${destinationName}。`;
    state.log.push(`${player.name}：${message}`);
    player.lastAction = message;
    return { ok: true, message, destination };
  };

  game.playInspectCard = function playInspectCard(state, playerId, runtimeId) {
    if (!canAct(state, playerId)) return { ok: false, message: '当前不是你的行动阶段。' };
    const player = findPlayer(state, playerId);
    const card = findCard(player, runtimeId);
    if (!card || card.type !== 'inspect') return { ok: false, message: '这不是探海牌。' };
    if (player.position === 'center') return { ok: false, message: '中左所军门不能探海。' };
    if (!state.openedLocations[player.position]) return { ok: false, message: '当前位置没有有效地牌，不能探海。' };

    const location = game.LOCATIONS[player.position];
    const treasureId = location.treasure;
    const removed = takeCard(player, runtimeId);
    state.discardPile.push(removed);

    if (state.treasureStock[treasureId] <= 0) {
      const message = '该地点对应镇海战备已被取完。';
      state.log.push(`${player.name}：${message}`);
      player.lastAction = message;
      return { ok: true, message, treasureId, gained: false };
    }

    state.treasureStock[treasureId] -= 1;
    player.treasures[treasureId] += 1;
    const message = `探海成功，取得【${game.TREASURES[treasureId].name}】。`;
    state.log.push(`${player.name}：${message}`);
    player.lastAction = message;
    game.checkWinner(state);
    return { ok: true, message, treasureId, gained: true };
  };

  game.playTacticCard = function playTacticCard(state, playerId, runtimeId, targetPlayerId, rng = Math.random) {
    if (!canAct(state, playerId)) return { ok: false, message: '当前不是你的行动阶段。' };
    if (playerId === targetPlayerId) return { ok: false, message: '计策牌不能指定自己。' };
    const player = findPlayer(state, playerId);
    const target = findPlayer(state, targetPlayerId);
    const card = findCard(player, runtimeId);
    if (!target) return { ok: false, message: '找不到目标玩家。' };
    if (!card || card.type !== 'tactic') return { ok: false, message: '这不是计策牌。' };
    if (!['bully', 'fire', 'flower'].includes(card.key)) return { ok: false, message: '未知计策。' };

    const removed = takeCard(player, runtimeId);
    state.discardPile.push(removed);
    let activation = `${player.name}发动【${removed.name}】，指定${target.name}。`;
    let message;
    let burnedCard = null;
    if (removed.key === 'bully') {
      target.skipTurns += 1;
      message = `${target.name}下一个完整回合无法行动。`;
    } else if (removed.key === 'fire') {
      if (target.hand.length) {
        burnedCard = target.hand.splice(Math.floor(rng() * target.hand.length), 1)[0];
        state.discardPile.push(burnedCard);
      }
      target.skipNextRefill = true;
      message = (burnedCard
        ? `${player.name}烧毁了${target.name}的【${burnedCard.name}】。`
        : `${target.name}无手牌，本次没有烧毁任何牌。`)
        + `\n${target.name}下一回合不会自动补牌至 3 张。`;
    } else {
      const from = player.position;
      const to = target.position;
      player.position = to;
      target.position = from;
      const place = id => id === 'center' ? '中左所军门' : game.LOCATIONS[id].name;
      activation = `${player.name}发动【${removed.name}】，强制与${target.name}交换位置。`;
      message = `${player.name}移动到【${place(to)}】；${target.name}移动到【${place(from)}】；交换完成。`;
    }
    state.log.push(activation, message);
    player.lastAction = message;
    target.lastAction = message;
    return { ok: true, message, activation, targetPlayerId, burnedCard };
  };

  game.playTrumpCard = function playTrumpCard(state, playerId, runtimeId, targetPlayerId, ownTreasureId, targetTreasureId) {
    if (!canAct(state, playerId)) return { ok: false, message: '当前不是你的行动阶段。' };
    if (playerId === targetPlayerId) return { ok: false, message: '王牌不能指定自己。' };

    const player = findPlayer(state, playerId);
    const target = findPlayer(state, targetPlayerId);
    const card = findCard(player, runtimeId);
    if (!player || !target) return { ok: false, message: '找不到交换目标。' };
    if (!card || card.type !== 'trump') return { ok: false, message: '这不是王牌。' };
    if (!game.TREASURES[ownTreasureId] || !game.TREASURES[targetTreasureId]) return { ok: false, message: '无效的镇海战备类型。' };
    if ((player.treasures[ownTreasureId] || 0) <= 0) return { ok: false, message: '你没有可作为交换筹码的镇海战备。' };
    if ((target.treasures[targetTreasureId] || 0) <= 0) return { ok: false, message: '目标玩家没有该镇海战备。' };

    const removed = takeCard(player, runtimeId);
    state.discardPile.push(removed);
    player.treasures[ownTreasureId] -= 1;
    target.treasures[ownTreasureId] += 1;
    target.treasures[targetTreasureId] -= 1;
    player.treasures[targetTreasureId] += 1;

    const message = `${player.name}交出【${game.TREASURES[ownTreasureId].name}】，${target.name}交出【${game.TREASURES[targetTreasureId].name}】。镇海战备交换完成。`;
    const activation = `${player.name}发动【${removed.name}】，强制与${target.name}交换镇海战备。`;
    state.log.push(activation, message);
    player.lastAction = message;
    target.lastAction = message;
    game.checkWinner(state);
    return { ok: true, message, activation, targetPlayerId, ownTreasureId, targetTreasureId };
  };

  game.advancePlayer = function advancePlayer(state) {
    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
    state.turnNumber += 1;
    state.phase = 'turnStart';
  };

  game.beginTurn = function beginTurn(state, rng = Math.random) {
    if (state.winnerId) return { ok: false, skipped: false, message: '游戏已经结束。' };
    const player = state.players[state.currentPlayerIndex];
    if (!player) return { ok: false, skipped: false, message: '当前玩家不存在。' };

    const skipRefill = Boolean(player.skipNextRefill);
    player.skipNextRefill = false;
    if (player.skipTurns > 0) {
      player.skipTurns -= 1;
      const message = `${player.name}受到【封港戒严】影响，本回合跳过。`;
      state.log.push(message);
      player.lastAction = message;
      game.advancePlayer(state);
      return { ok: true, skipped: true, message };
    }

    state.phase = 'action';
    const { cards } = skipRefill ? {cards: []} : game.refillHandToLimit(state, player.id, 3, rng);
    const message = skipRefill
      ? `${player.name}受到【东风火攻】影响，本回合开始不自动补牌至 3 张，进入行动阶段。`
      : cards.length > 0
      ? `${player.name}补牌${cards.length}张，手牌恢复至${player.hand.length}张，进入行动阶段。`
      : `${player.name}进入行动阶段。`;
    state.log.push(message);
    player.lastAction = message;
    return { ok: true, skipped: false, cards, message };
  };

  game.completeSingleActionTurn = function completeSingleActionTurn(state, rng = Math.random) {
    if (state.winnerId) return { ok: false, message: '游戏已经结束。' };
    const player = state.players[state.currentPlayerIndex];
    if (!player || state.phase !== 'action') return { ok: false, message: '当前不在行动阶段。' };

    const { cards } = game.refillHandToLimit(state, player.id, 3, rng);
    const message = cards.length > 0
      ? `${player.name}补牌${cards.length}张，手牌保持${player.hand.length}张，回合结束。`
      : `${player.name}回合结束。`;
    state.log.push(message);
    player.lastAction = `${player.lastAction} ${message}`.trim();
    game.advancePlayer(state);
    return { ok: true, cards, message };
  };


  game.passTurnBySwappingCard = function passTurnBySwappingCard(state, playerId, runtimeId, rng = Math.random) {
    if (!canAct(state, playerId)) return { ok: false, message: '当前不是你的行动阶段。' };
    const player = findPlayer(state, playerId);
    const card = findCard(player, runtimeId);
    if (!player || !card) return { ok: false, message: '请选择1张手牌进行换牌。' };

    const removed = takeCard(player, runtimeId);
    state.discardPile.push(removed);
    const { cards } = game.refillHandToLimit(state, playerId, 3, rng);
    const drawMessage = cards.length ? `并补入${cards.length}张新牌` : '，但牌堆暂时无法补牌';
    const message = `${player.name}将【${removed.name}】换入弃牌堆${drawMessage}，结束回合。`;
    state.log.push(message);
    player.lastAction = message;
    game.advancePlayer(state);
    return { ok: true, message, discarded: removed, cards };
  };

  game.endActionPhase = function endActionPhase(state) {
    if (state.winnerId) return { ok: false, needsDiscard: false, message: '游戏已经结束。' };
    const player = state.players[state.currentPlayerIndex];
    if (!player || state.phase !== 'action') return { ok: false, needsDiscard: false, message: '当前不在行动阶段。' };

    const message = `${player.name}本回合未出牌，直接结束回合。`;
    state.log.push(message);
    player.lastAction = message;
    game.advancePlayer(state);
    return { ok: true, needsDiscard: false, message };
  };

  game.finishDiscardPhase = function finishDiscardPhase(state) {
    const player = state.players[state.currentPlayerIndex];
    if (!player || state.phase !== 'discard') return { ok: false, message: '当前不在弃牌阶段。' };
    if (player.hand.length > 3) return { ok: false, message: '手牌仍超过3张，请继续弃牌。' };

    const message = `${player.name}完成弃牌，结束回合。`;
    state.log.push(message);
    game.advancePlayer(state);
    return { ok: true, message };
  };

  game.getLegalActions = function getLegalActions(state, playerId) {
    const player = findPlayer(state, playerId);
    if (!player || state.winnerId) return [];

    if (state.phase === 'discard') {
      return player.hand.map(card => ({ type: 'discard', runtimeId: card.runtimeId }));
    }
    if (!canAct(state, playerId)) return [];

    const actions = [];
    for (const card of player.hand) {
      if (card.type === 'location') {
        actions.push({ type: 'location', runtimeId: card.runtimeId, duplicate: Boolean(state.openedLocations[card.locationId]), locationId: card.locationId });
      } else if (card.type === 'travel') {
        const destinations = (ADJACENCY[player.position] || []).filter(destination => destination === 'center' || state.openedLocations[destination]);
        if (destinations.length) actions.push({ type: 'travel', runtimeId: card.runtimeId, destinations });
      } else if (card.type === 'inspect') {
        if (player.position !== 'center' && state.openedLocations[player.position]) {
          actions.push({ type: 'inspect', runtimeId: card.runtimeId, locationId: player.position });
        }
      } else if (card.type === 'tactic') {
        const targets = state.players.filter(p => p.id !== playerId).map(p => p.id);
        if (targets.length) actions.push({ type: 'tactic', runtimeId: card.runtimeId, targets });
      } else if (card.type === 'trump') {
        const targets = state.players.filter(p => p.id !== playerId && Object.values(p.treasures).some(v => v > 0)).map(p => p.id);
        if (Object.values(player.treasures).some(v => v > 0) && targets.length) {
          actions.push({ type: 'trump', runtimeId: card.runtimeId, targets });
        }
      }
    }
    actions.push({ type: 'end' });
    return actions;
  };
})(globalThis);
