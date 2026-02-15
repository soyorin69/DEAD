// weapons.js
const weaponsDB = [
    // 剑派生（+5%暴击）
    { type: CONST.WEAPON_TYPES.SWORD, name: '短剑', attack: 2, critBonus: 0.05, description: '一把普通的短剑' },
    { type: CONST.WEAPON_TYPES.SWORD, name: '长剑', attack: 3, critBonus: 0.05, description: '攻击范围更大' },
    { type: CONST.WEAPON_TYPES.SWORD, name: '巨剑', attack: 4, critBonus: 0.05, description: '沉重但威力巨大' },
    // 弓派生（无暴击加成）
    { type: CONST.WEAPON_TYPES.BOW, name: '短弓', attack: 2, ammo: 10, effect: CONST.AMMO_EFFECTS.NORMAL, description: '可以远程攻击' },
    { type: CONST.WEAPON_TYPES.BOW, name: '长弓', attack: 3, ammo: 10, effect: CONST.AMMO_EFFECTS.NORMAL, description: '射程更远' },
    { type: CONST.WEAPON_TYPES.BOW, name: '火焰弓', attack: 2, ammo: 8, effect: CONST.AMMO_EFFECTS.FIRE, description: '发射火焰箭，造成额外1点伤害' },
    { type: CONST.WEAPON_TYPES.BOW, name: '穿透弓', attack: 2, ammo: 8, effect: CONST.AMMO_EFFECTS.PIERCE, description: '箭矢可穿透第一个敌人' },
    { type: CONST.WEAPON_TYPES.BOW, name: '冰霜弓', attack: 2, ammo: 8, effect: CONST.AMMO_EFFECTS.ICE, description: '箭矢可减速敌人（预留）' },
    // 乐器派生（+10%暴击）
    { type: CONST.WEAPON_TYPES.INSTRUMENT, name: '竖琴', attack: 1, critBonus: 0.10, description: '攻击时恢复MP' },
    { type: CONST.WEAPON_TYPES.INSTRUMENT, name: '战鼓', attack: 2, critBonus: 0.10, description: '提升周围友军攻击力' },
    { type: CONST.WEAPON_TYPES.INSTRUMENT, name: '长笛', attack: 1, critBonus: 0.10, description: '降低敌人防御' },
    // 法杖派生（+10%暴击）
    { type: CONST.WEAPON_TYPES.STAFF, name: '木杖', attack: 1, critBonus: 0.10, description: '增强法术伤害' },
    { type: CONST.WEAPON_TYPES.STAFF, name: '水晶杖', attack: 2, critBonus: 0.10, description: '减少法力消耗' },
    { type: CONST.WEAPON_TYPES.STAFF, name: '龙骨杖', attack: 3, critBonus: 0.10, description: '强大但稀有' },
    // 盾派生（+5%暴击）
    { type: CONST.WEAPON_TYPES.SHIELD, name: '小圆盾', attack: 1, critBonus: 0.05, description: '格挡部分伤害' },
    { type: CONST.WEAPON_TYPES.SHIELD, name: '骑士盾', attack: 2, critBonus: 0.05, description: '坚固防御' },
    { type: CONST.WEAPON_TYPES.SHIELD, name: '塔盾', attack: 3, critBonus: 0.05, description: '几乎无法穿透' }
];

function randomWeapon() {
    const index = Math.floor(Math.random() * weaponsDB.length);
    const weapon = { ...weaponsDB[index] };
    if (weapon.type === CONST.WEAPON_TYPES.BOW && weapon.ammo === undefined) {
        weapon.ammo = 10;
    }
    return weapon;
}

function getInitialWeapons() {
    return [
        { type: CONST.WEAPON_TYPES.SWORD, name: '短剑', attack: 2, critBonus: 0.05, description: '一把普通的短剑' },
        { type: CONST.WEAPON_TYPES.BOW, name: '短弓', attack: 2, ammo: 10, effect: CONST.AMMO_EFFECTS.NORMAL, description: '可以远程攻击' }
    ];
}

window.weaponsDB = weaponsDB;
window.randomWeapon = randomWeapon;
window.getInitialWeapons = getInitialWeapons;