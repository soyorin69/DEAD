// items.js - 道具系统（重构版）

const itemsDB = {
  [CONST.ITEM_TYPES.HEALTH_POTION]: {
    name: '❤️ 血瓶',
    description: '恢复5点生命值',
    effect: (game) => {
      game.player.hp = Math.min(game.player.hp + 5, game.player.maxHp);
      gameLog('使用了血瓶，生命 +5');
    }
  },
  [CONST.ITEM_TYPES.MANA_POTION]: {
    name: '💙 魔法药水',
    description: '恢复5点法力值',
    effect: (game) => {
      game.player.mp = Math.min(game.player.mp + 5, game.player.maxMp);
      gameLog('使用了魔法药水，法力 +5');
    }
  },
  [CONST.ITEM_TYPES.ATTACK_POTION]: {
    name: '⚔️ 攻击药水',
    description: '永久增加1点基础攻击力',
    effect: (game) => {
      game.player.baseAttack += 1;
      gameLog('使用了攻击药水，基础攻击力 +1');
    }
  },
  [CONST.ITEM_TYPES.BOMB]: {
    name: '💣 炸弹',
    description: '对周围8格敌人造成2点伤害',
    effect: (game) => {
      const bombDamage = 2;
      // 【关键修改】使用 applyDamageToEnemy 统一处理
      const nearbyEnemies = game.enemies.filter(enemy => {
        const dx = Math.abs(enemy.x - game.player.x);
        const dy = Math.abs(enemy.y - game.player.y);
        return dx <= 1 && dy <= 1;
      });

      nearbyEnemies.forEach(enemy => {
        // 调用统一伤害函数（会自动处理死亡、经验、血魔等）
        if (typeof window.applyDamageToEnemy === 'function') {
          window.applyDamageToEnemy(enemy, bombDamage, 'item');
        } else {
          // 兼容旧逻辑（临时）
          enemy.hp -= bombDamage;
          if (enemy.hp <= 0) {
            if (typeof window.gainExp === 'function') {
              window.gainExp(enemy.isBoss ? 20 : 5);
            }
            game.enemies = game.enemies.filter(e => e !== enemy);
          }
        }
      });

      gameLog('使用了炸弹');
    }
  },
  [CONST.ITEM_TYPES.ARROW_QUIVER]: {
    name: '🏹 箭矢袋',
    description: '为当前弓补充5支箭矢',
    effect: (game) => {
      const currentWeapon = game.weapons[game.currentWeaponIndex];
      if (currentWeapon && currentWeapon.type === CONST.WEAPON_TYPES.BOW) {
        currentWeapon.ammo += 5;
        gameLog(`箭矢补充，现在有 ${currentWeapon.ammo} 支箭`);
      } else {
        gameLog('当前没有装备弓，无法补充箭矢');
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

// 暴露接口
window.itemsDB = itemsDB;
window.useItem = useItem;
window.getItemName = getItemName;