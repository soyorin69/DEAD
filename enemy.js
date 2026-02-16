// enemy.js - 敌人AI与回合逻辑（经验修复+天赋兼容版）

function moveEnemy(enemy) {
  if (enemy.size === 2) {
    return moveLargeEnemy(enemy);
  }
  const dx = game.player.x - enemy.x;
  const dy = game.player.y - enemy.y;
  let primaryDir, secondaryDir;
  if (Math.abs(dx) > Math.abs(dy)) {
    primaryDir = dx > 0 ? [1, 0] : [-1, 0];
    secondaryDir = dy > 0 ? [0, 1] : [0, -1];
  } else {
    primaryDir = dy > 0 ? [0, 1] : [0, -1];
    secondaryDir = dx > 0 ? [1, 0] : [-1, 0];
  }
  const directions = [primaryDir, secondaryDir];
  let occupied = new Set(game.enemies.map(e => `${e.x},${e.y}`));
  occupied.add(`${game.player.x},${game.player.y}`);

  for (let [dx, dy] of directions) {
    let newX = enemy.x + dx;
    let newY = enemy.y + dy;
    if (
      newX >= 0 && newX < CONST.MAP_WIDTH &&
      newY >= 0 && newY < CONST.MAP_HEIGHT &&
      game.map[newY][newX] === 0 &&
      !occupied.has(`${newX},${newY}`)
    ) {
      enemy.x = newX;
      enemy.y = newY;
      occupied.add(`${newX},${newY}`);
      return true;
    }
  }
  return false;
}

function moveLargeEnemy(enemy) {
  const dirs = [[0,1],[1,0],[0,-1],[-1,0]];
  const offset = enemy.orientation === 'horizontal' ? { x: 1, y: 0 } : { x: 0, y: 1 };
  let occupied = new Set(game.enemies.map(e => `${e.x},${e.y}`));
  occupied.add(`${game.player.x},${game.player.y}`);
  for (let [dx, dy] of dirs) {
    let newX1 = enemy.x + dx;
    let newY1 = enemy.y + dy;
    let newX2 = enemy.x + offset.x + dx;
    let newY2 = enemy.y + offset.y + dy;

    if (
      newX1 >= 0 && newX1 < CONST.MAP_WIDTH &&
      newY1 >= 0 && newY1 < CONST.MAP_HEIGHT &&
      newX2 >= 0 && newX2 < CONST.MAP_WIDTH &&
      newY2 >= 0 && newY2 < CONST.MAP_HEIGHT &&
      game.map[newY1][newX1] === 0 && game.map[newY2][newX2] === 0 &&
      !occupied.has(`${newX1},${newY1}`) && !occupied.has(`${newX2},${newY2}`)
    ) {
      enemy.x = newX1;
      enemy.y = newY1;
      return true;
    }
  }
  return false;
}

// ========== 【关键修复】敌人攻击：统一走 playerTakeDamage 流程 ==========
function enemiesTurn() {
  let enemiesCopy = [...game.enemies];
  for (let enemy of enemiesCopy) {
    if (enemy.isBoss) {
      if (enemy.bossType === 'lord_of_cinder' && typeof window.boss2Turn === 'function') {
        window.boss2Turn(enemy);
      } else if (typeof window.bossTurn === 'function') {
        window.bossTurn(enemy);
      }
    } else {
      const dx = Math.abs(enemy.x - game.player.x);
      const dy = Math.abs(enemy.y - game.player.y);
      if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
        let damage = enemy.attack || 1;
        const currentWeapon = game.weapons[game.currentWeaponIndex];

        // 盾牌减伤（保留）
        if (currentWeapon && currentWeapon.type === CONST.WEAPON_TYPES.SHIELD) {
          damage = Math.floor(damage * (1 - (currentWeapon.damageReduction || 0.2)));
        }

        // ✅ 核心修复：统一调用 playerTakeDamage（触发弹反等天赋）
        if (typeof window.playerTakeDamage === 'function') {
          window.playerTakeDamage(damage, enemy); // 传入伤害源（普通敌人）
        } else {
          // 兼容旧逻辑（临时）
          if (!window.cheats.godMode) {
            game.player.hp -= damage;
            // ✅ 安全调用日志
            if (typeof window.gameLog === 'function') {
              window.gameLog('⚔️ 敌人攻击玩家', 'combat');
            }
            updateStatusBar();
            if (game.player.hp <= 0 && !window.cheats.godMode) {
              checkGameOver();
              return;
            }
          }
        }
      } else {
        moveEnemy(enemy);
      }
    }
  }

  if (typeof window.updateBuffs === 'function') {
    window.updateBuffs();
  }
}

// 暴露全局接口
window.enemiesTurn = enemiesTurn;
window.moveLargeEnemy = moveLargeEnemy;