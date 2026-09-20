(function (root) {
  const game = root.JQGame;

  const ART = {
    mingcha: 'assets/zhenhai/01-mingcha.jpg',
    xunyou: 'assets/zhenhai/02-xunyou.jpg',
    tainan: 'assets/zhenhai/03-tainan.jpg',
    mengxia: 'assets/zhenhai/04-mengxia.jpg',
    zhuluo: 'assets/zhenhai/05-zhuluo.jpg',
    madou: 'assets/zhenhai/06-madou.jpg',
    goldSeal: 'assets/zhenhai/07-gold-seal.jpg',
    sword: 'assets/zhenhai/08-sword.jpg',
    gun: 'assets/zhenhai/09-gun.jpg',
    pomelo: 'assets/zhenhai/10-pomelo.jpg',
    jiaqingOrder: 'assets/zhenhai/11-jiaqing-order.jpg',
    wangOrder: 'assets/zhenhai/12-wang-order.jpg',
    bully: 'assets/zhenhai/13-bully.jpg',
    fire: 'assets/zhenhai/14-fire.jpg',
    flower: 'assets/zhenhai/15-flower.jpg',
    cardBack: 'assets/zhenhai/card-back.jpg'
  };

  game.LOCATIONS = {
    // Internal IDs remain unchanged so all original movement/gameplay logic stays intact.
    tainan: { id: 'tainan', name: '鸿山石壁', treasure: 'goldSeal', asset: ART.tainan },
    mengxia: { id: 'mengxia', name: '圭屿海口', treasure: 'gun', asset: ART.mengxia },
    zhuluo: { id: 'zhuluo', name: '浯屿水寨', treasure: 'sword', asset: ART.zhuluo },
    madou: { id: 'madou', name: '澎湖风柜尾', treasure: 'pomelo', asset: ART.madou }
  };

  game.TREASURES = {
    goldSeal: { id: 'goldSeal', name: '出征将领', shortName: '将领', initialStock: 3, asset: ART.goldSeal },
    sword: { id: 'sword', name: '水师战船', shortName: '战船', initialStock: 3, asset: ART.sword },
    gun: { id: 'gun', name: '防海方略', shortName: '方略', initialStock: 3, asset: ART.gun },
    pomelo: { id: 'pomelo', name: '红夷大炮', shortName: '大炮', initialStock: 3, asset: ART.pomelo }
  };

  const repeated = (type, key, name, count, asset, extra = {}) =>
    Array.from({ length: count }, () => ({ type, key, name, asset, ...extra }));

  game.CATALOG = { cardBack: ART.cardBack };

  game.buildDeckDefinition = function buildDeckDefinition() {
    return [
      ...repeated('travel', 'travel', '巡防', 34, ART.xunyou),
      ...repeated('inspect', 'inspect', '探海', 19, ART.mingcha),
      ...Object.values(game.LOCATIONS).flatMap(loc => repeated('location', loc.id, loc.name, 3, loc.asset, { locationId: loc.id })),
      { type: 'tactic', key: 'bully', name: '封港戒严', asset: ART.bully },
      { type: 'tactic', key: 'fire', name: '东风火攻', asset: ART.fire },
      { type: 'tactic', key: 'flower', name: '调营换防', asset: ART.flower },
      { type: 'trump', key: 'jiaqingOrder', name: '徐都督令', asset: ART.jiaqingOrder },
      { type: 'trump', key: 'wangOrder', name: '赵游击令', asset: ART.wangOrder }
    ];
  };
})(globalThis);
