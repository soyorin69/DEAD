// weapons.js - 武器数据库与初始配置（含天赋绑定）
const weaponsDB = [
  // ===== 剑类 =====
  { type: CONST.WEAPON_TYPES.SWORD, name: '短剑', attack: 2, critBonus: 0.05, description: '一把普通的短剑' },
  { type: CONST.WEAPON_TYPES.SWORD, name: '长剑', attack: 3, critBonus: 0.05, description: '攻击范围更大' },
  { type: CONST.WEAPON_TYPES.SWORD, name: '巨剑', attack: 4, critBonus: 0.05, description: '沉重但威力巨大' },
  { type: CONST.WEAPON_TYPES.SWORD, name: '痛苦双刀', attack: 2, critBonus: 0.15, doubleStrike: true, selfDamage: 2, description: '每次攻击进行两次打击，若未暴击则反噬自身' },

  // ===== 弓类 =====
  { type: CONST.WEAPON_TYPES.BOW, name: '短弓', attack: 2, ammo: 10, effect: CONST.AMMO_EFFECTS.NORMAL, description: '可以远程攻击' },
  { type: CONST.WEAPON_TYPES.BOW, name: '长弓', attack: 3, ammo: 10, effect: CONST.AMMO_EFFECTS.NORMAL, description: '射程更远' },
  { type: CONST.WEAPON_TYPES.BOW, name: '火焰弓', attack: 2, ammo: 8, effect: CONST.AMMO_EFFECTS.FIRE, description: '发射火焰箭，造成额外1点伤害' },
  { type: CONST.WEAPON_TYPES.BOW, name: '穿透弓', attack: 2, ammo: 8, effect: CONST.AMMO_EFFECTS.PIERCE, description: '箭矢可穿透第一个敌人' },
  { type: CONST.WEAPON_TYPES.BOW, name: '冰霜弓', attack: 2, ammo: 8, effect: CONST.AMMO_EFFECTS.ICE, description: '箭矢可减速敌人（预留）' },

  // ===== 乐器类 =====
  { type: CONST.WEAPON_TYPES.INSTRUMENT, name: '竖琴', attack: 1, buffEffect: CONST.BUFF_TYPES.ATTACK_UP, buffDuration: 3, description: '攻击力提升50%，持续3回合' },
  { type: CONST.WEAPON_TYPES.INSTRUMENT, name: '战鼓', attack: 2, buffEffect: CONST.BUFF_TYPES.ATTACK_UP, buffDuration: 4, description: '攻击力提升50%，持续4回合' },
  { type: CONST.WEAPON_TYPES.INSTRUMENT, name: '长笛', attack: 1, buffEffect: CONST.BUFF_TYPES.ATTACK_UP, buffDuration: 5, description: '攻击力提升50%，持续5回合' },

  // ===== 法杖类 =====
  { type: CONST.WEAPON_TYPES.STAFF, name: '木杖', attack: 1, spellBoost: 1.5, description: '法术伤害提升50%' },
  { type: CONST.WEAPON_TYPES.STAFF, name: '水晶杖', attack: 2, spellBoost: 1.5, description: '法术伤害提升50%' },
  { type: CONST.WEAPON_TYPES.STAFF, name: '龙骨杖', attack: 3, spellBoost: 1.5, description: '法术伤害提升50%' },
  { type: CONST.WEAPON_TYPES.STAFF, name: '残忍之杖', attack: 2, critBonus: 0.05, summonOnKill: true, description: '击杀敌人时有几率召唤一只小鬼协助作战' },

  // ===== 盾类 =====
  { type: CONST.WEAPON_TYPES.SHIELD, name: '小圆盾', attack: 1, damageReduction: 0.2, description: '减伤20%' },
  { type: CONST.WEAPON_TYPES.SHIELD, name: '骑士盾', attack: 2, damageReduction: 0.2, description: '减伤20%' },
  { type: CONST.WEAPON_TYPES.SHIELD, name: '塔盾', attack: 3, damageReduction: 0.2, description: '减伤20%' }
];

// 初始装备组合（新增 talents 字段绑定专属天赋）
const startingLoadouts = [
  {
    name: '🛡️ 剑盾战士',
    description: '短剑 + 小圆盾 | 天赋：弹反（预警区内50%概率弹反Boss攻击）',
    weapons: [
      { ...weaponsDB.find(w => w.name === '短剑') },
      { ...weaponsDB.find(w => w.name === '小圆盾') }
    ],
    talents: ['弹反'] // ← 绑定天赋
  },
  {
    name: '⚔️ 双剑士',
    description: '双短剑 | 天赋：双持精通（每次攻击30%概率额外攻击一次）',
    weapons: [
      { ...weaponsDB.find(w => w.name === '短剑') },
      { ...weaponsDB.find(w => w.name === '短剑') }
    ],
    talents: ['双持精通'] // ← 绑定天赋
  },
  {
    name: '🏹 弓箭手',
    description: '短弓 + 箭矢袋 | 天赋：精准射击（远程攻击暴击率+15%）',
    weapons: [
      { ...weaponsDB.find(w => w.name === '短弓') }
    ],
    items: [CONST.ITEM_TYPES.ARROW_QUIVER],
    talents: ['精准射击'] // ← 绑定天赋
  },
  {
    name: '🔮 法师',
    description: '木杖 + 火球术 | 天赋：法术共鸣（法术伤害+30%，MP消耗-1）',
    weapons: [
      { ...weaponsDB.find(w => w.name === '木杖') }
    ],
    spells: ['火球术'],
    talents: ['法术共鸣'] // ← 绑定天赋
  },
  {
    name: '🎵 乐师',
    description: '竖琴 + 血瓶 | 天赋：鼓舞旋律（乐器buff持续时间+2回合）',
    weapons: [
      { ...weaponsDB.find(w => w.name === '竖琴') }
    ],
    items: [CONST.ITEM_TYPES.HEALTH_POTION],
    talents: ['鼓舞旋律'] // ← 绑定天赋
  }
];

// 随机武器（深拷贝）
function randomWeapon() {
  const weapon = { ...weaponsDB[Math.floor(Math.random() * weaponsDB.length)] };
  if (weapon.type === CONST.WEAPON_TYPES.BOW && weapon.ammo === undefined) {
    weapon.ammo = 10;
  }
  return weapon;
}

// 暴露接口
window.weaponsDB = weaponsDB;
window.randomWeapon = randomWeapon;
window.startingLoadouts = startingLoadouts;