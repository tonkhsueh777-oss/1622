(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.JQGame = root.JQGame || {};
    root.JQGame.SkillCinematicLogic = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const CINEMATICS = Object.freeze({
    jiaqingOrder: Object.freeze({ key: 'jiaqingOrder', src: 'assets/video/jiaqing-order.mp4', title: '徐都督令发动', durationMs: 6000 }),
    wangOrder: Object.freeze({ key: 'wangOrder', src: 'assets/video/wang-order.mp4', title: '赵游击令发动', durationMs: 6000 }),
    bully: Object.freeze({ key: 'bully', src: 'assets/video/bully.mp4', title: '封港戒严发动', durationMs: 6000 }),
    fire: Object.freeze({ key: 'fire', src: 'assets/video/fire.mp4', title: '东风火攻发动', durationMs: 6000 }),
    flower: Object.freeze({ key: 'flower', src: 'assets/video/flower.mp4', title: '调营换防发动', durationMs: 6000 })
  });

  function getCinematic(key) {
    const item = CINEMATICS[key];
    return item ? { ...item } : null;
  }

  function hasCinematic(card) {
    if (!card || (card.type !== 'trump' && card.type !== 'tactic')) return false;
    return Boolean(CINEMATICS[card.key]);
  }

  return { CINEMATICS, getCinematic, hasCinematic };
});
