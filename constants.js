// constants.js - 全局常量定义（重构版）
window.CONST = {
  TILE_SIZE: 40,
  MAP_WIDTH: 10,
  MAP_HEIGHT: 10,

  // 道具类型
  ITEM_TYPES: {
    HEALTH_POTION: 'health_potion',
    MANA_POTION: 'mana_potion',
    ATTACK_POTION: 'attack_potion',
    BOMB: 'bomb',
    ARROW_QUIVER: 'arrow_quiver'
  },

  // 武器类型
  WEAPON_TYPES: {
    SWORD: 'sword',
    BOW: 'bow',
    INSTRUMENT: 'instrument',
    STAFF: 'staff',
    SHIELD: 'shield'
  },

  // 弓箭效果
  AMMO_EFFECTS: {
    NORMAL: 'normal',
    FIRE: 'fire',
    PIERCE: 'pierce',
    ICE: 'ice'
  },

  // Buff 类型
  BUFF_TYPES: {
    ATTACK_UP: 'attack_up'
  },

  // 敌人朝向（用于两格敌人）
  ORIENTATION: {
    HORIZONTAL: 'horizontal',
    VERTICAL: 'vertical'
  }
};