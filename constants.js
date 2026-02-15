window.CONST = {
    TILE_SIZE: 40,
    MAP_WIDTH: 10,
    MAP_HEIGHT: 10,
    ITEM_TYPES: {
        HEALTH_POTION: 'health_potion',
        MANA_POTION: 'mana_potion',
        ATTACK_POTION: 'attack_potion',
        BOMB: 'bomb',
        // 新增箭矢袋（可拾取补充箭矢）
        ARROW_QUIVER: 'arrow_quiver'
    },
    WEAPON_TYPES: {
        SWORD: 'sword',
        BOW: 'bow',
        INSTRUMENT: 'instrument',
        STAFF: 'staff',
        SHIELD: 'shield'
    },
    AMMO_EFFECTS: {
        NORMAL: 'normal',   // 普通箭
        FIRE: 'fire',       // 火焰箭（额外伤害）
        PIERCE: 'pierce',   // 穿透箭（可穿过第一个敌人）
        ICE: 'ice'          // 冰霜箭（减速，预留）
    }
};