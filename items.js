// items.js
const itemsDB = {
    [CONST.ITEM_TYPES.HEALTH_POTION]: {
        name: '❤️ 血瓶',
        description: '恢复5点生命值',
        effect: (game) => {
            game.player.hp = Math.min(game.player.hp + 5, game.player.maxHp);
            console.log('使用了血瓶，生命 +5');
        }
    },
    [CONST.ITEM_TYPES.MANA_POTION]: {
        name: '💙 魔法药水',
        description: '恢复5点法力值',
        effect: (game) => {
            game.player.mp = Math.min(game.player.mp + 5, game.player.maxMp);
            console.log('使用了魔法药水，法力 +5');
        }
    },
    [CONST.ITEM_TYPES.ATTACK_POTION]: {
        name: '⚔️ 攻击药水',
        description: '永久增加1点基础攻击力',
        effect: (game) => {
            game.player.baseAttack += 1;
            console.log('使用了攻击药水，基础攻击力 +1');
        }
    },
    [CONST.ITEM_TYPES.BOMB]: {
        name: '💣 炸弹',
        description: '对周围8格敌人造成2点伤害',
        effect: (game) => {
            const bombDamage = 2;
            let enemiesToRemove = [];
            game.enemies.forEach(enemy => {
                const dx = Math.abs(enemy.x - game.player.x);
                const dy = Math.abs(enemy.y - game.player.y);
                if (dx <= 1 && dy <= 1) {
                    enemy.hp -= bombDamage;
                    if (enemy.hp <= 0) {
                        enemiesToRemove.push(enemy);
                        if (typeof window.gainExp === 'function') {
                            window.gainExp(enemy.isBoss ? 20 : 5);
                        }
                    }
                }
            });
            game.enemies = game.enemies.filter(e => !enemiesToRemove.includes(e));
            console.log('使用了炸弹');
        }
    },
    [CONST.ITEM_TYPES.ARROW_QUIVER]: {
        name: '🏹 箭矢袋',
        description: '为当前弓补充5支箭矢',
        effect: (game) => {
            const currentWeapon = game.weapons[game.currentWeaponIndex];
            if (currentWeapon && currentWeapon.type === CONST.WEAPON_TYPES.BOW) {
                currentWeapon.ammo += 5;
                console.log(`箭矢补充，现在有 ${currentWeapon.ammo} 支箭`);
            } else {
                console.log('当前没有装备弓，无法补充箭矢');
            }
        }
    }
};

function useItem(itemType, game) {
    const item = itemsDB[itemType];
    if (item) {
        item.effect(game);
        return true;
    }
    return false;
}

function getItemName(itemType) {
    return itemsDB[itemType]?.name || itemType;
}

window.itemsDB = itemsDB;
window.useItem = useItem;
window.getItemName = getItemName;