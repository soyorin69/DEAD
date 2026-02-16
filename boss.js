// boss.js - 第一版 Boss 逻辑（难度调整版）
window.bossState = {
  warning: null,
  warningActive: false
};

// 重置 Boss 状态
function resetBossState() {
  window.bossState = {
    warning: null,
    warningActive: false
  };
}

// Boss 回合主逻辑
function bossTurn(boss) {
  // 面向玩家
  const dx = game.player.x - boss.x;
  const dy = game.player.y - boss.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    boss.facing = { x: dx > 0 ? 1 : -1, y: 0 };
  } else {
    boss.facing = { x: 0, y: dy > 0 ? 1 : -1 };
  }

  // 如果处于预警阶段，执行技能
  if (window.bossState.warningActive) {
    executeBloodVine(boss);
    window.bossState.warningActive = false;
    window.bossState.warning = null;
    return;
  }

  // 50% 移动，50% 技能（保持原比例，因Boss血量已大幅提升）
  if (Math.random() < 0.5) {
    moveBoss(boss);
  } else {
    const skill = Math.floor(Math.random() * 4) + 1;
    switch (skill) {
      case 1: summonMinions(boss); break;
      case 2: terrifyingScream(boss); break;
      case 3: prepareBloodVine(boss); break;
      case 4: bloodDrain(boss); break;
    }
  }
}

// 移动（向玩家靠近）
function moveBoss(boss) {
  const dx = game.player.x - boss.x;
  const dy = game.player.y - boss.y;
  let moveX = 0, moveY = 0;
  if (Math.abs(dx) > Math.abs(dy)) {
    moveX = dx > 0 ? 1 : -1;
  } else {
    moveY = dy > 0 ? 1 : -1;
  }
  const newX = boss.x + moveX;
  const newY = boss.y + moveY;
  if (
    newX >= 0 && newX < CONST.MAP_WIDTH &&
    newY >= 0 && newY < CONST.MAP_HEIGHT &&
    game.map[newY][newX] === 0 &&
    !game.enemies.some(e => e.x === newX && e.y === newY)
  ) {
    boss.x = newX;
    boss.y = newY;
    gameLog('Boss移动', 'boss');
  }
}

// 召唤小怪
function summonMinions(boss) {
  gameLog('Boss使用召唤小怪', 'boss');
  let summoned = 0;
  const dirs = [[0,1],[1,0],[0,-1],[-1,0]];
  for (let i = 0; i < 2; i++) {
    for (let d of dirs) {
      const nx = boss.x + d[0];
      const ny = boss.y + d[1];
      if (
        nx >= 0 && nx < CONST.MAP_WIDTH &&
        ny >= 0 && ny < CONST.MAP_HEIGHT &&
        game.map[ny][nx] === 0 &&
        !game.enemies.some(e => e.x === nx && e.y === ny)
      ) {
        game.enemies.push({
          x: nx, y: ny,
          hp: 5, attack: 1,
          isMinion: true,
          master: boss
        });
        summoned++;
        break;
      }
    }
  }
  gameLog(`召唤了 ${summoned} 个小怪`, 'boss');
}

// 恐怖尖叫（眩晕）
function terrifyingScream(boss) {
  gameLog('Boss使用恐怖尖叫', 'boss');
  const range = 2;
  const dx = Math.abs(game.player.x - boss.x);
  const dy = Math.abs(game.player.y - boss.y);
  if (dx <= range && dy <= range) {
    game.player.stunned = true;
    gameLog('玩家被眩晕，下回合无法行动', 'info');
  }
}

// 血色藤蔓（预警）
function prepareBloodVine(boss) {
  gameLog('Boss准备血色藤蔓，下一回合施放', 'boss');
  const dirX = game.player.x - boss.x;
  const dirY = game.player.y - boss.y;
  let dir;
  if (Math.abs(dirX) > Math.abs(dirY)) {
    dir = { x: dirX > 0 ? 1 : -1, y: 0 };
  } else {
    dir = { x: 0, y: dirY > 0 ? 1 : -1 };
  }
  let x = boss.x + dir.x;
  let y = boss.y + dir.y;
  const path = [];
  while (x >= 0 && x < CONST.MAP_WIDTH && y >= 0 && y < CONST.MAP_HEIGHT) {
    if (game.map[y][x] === 1) break;
    path.push({ x, y });
    x += dir.x;
    y += dir.y;
  }
  window.bossState.warning = path;
  window.bossState.warningActive = true;
}

// 执行血色藤蔓
function executeBloodVine(boss) {
  gameLog('Boss施放血色藤蔓', 'boss');
  if (!window.bossState.warning) return;

  window.bossState.warning.forEach(pos => {
    if (game.player.x === pos.x && game.player.y === pos.y) {
      // ========== 【关键修改】伤害提升至8 + 统一走 playerTakeDamage ==========
      if (typeof window.playerTakeDamage === 'function') {
        window.playerTakeDamage(8, boss); // 原5→8，触发弹反等天赋
      } else {
        // 兼容旧逻辑（临时）
        if (!window.cheats.godMode) {
          game.player.hp -= 8;
          updateStatusBar();
          gameLog('玩家被藤蔓击中', 'combat');
          if (game.player.hp <= 0 && !window.cheats.godMode) {
            checkGameOver();
          }
        }
      }
    }
  });
}

// 吸血（伤害提升）
function bloodDrain(boss) {
  gameLog('Boss尝试吸血', 'boss');
  if (boss.hp >= game.player.hp) return;
  const dx = Math.abs(boss.x - game.player.x);
  const dy = Math.abs(boss.y - game.player.y);
  if (dx + dy !== 1) return;
  const toBossX = boss.x - game.player.x;
  const toBossY = boss.y - game.player.y;
  if (game.player.facing.x === toBossX && game.player.facing.y === toBossY) {
    return; // 面对Boss，不能吸血
  }
  // ========== 【关键修改】吸血量提升至60% ==========
  const drain = Math.ceil(game.player.hp * 0.6); // 原0.5→0.6
  game.player.hp -= drain;
  boss.hp += drain;
  gameLog(`吸血！玩家损失${drain}，Boss恢复${drain}`, 'combat');
  updateStatusBar();
  if (game.player.hp <= 0 && !window.cheats.godMode) {
    checkGameOver();
  }
}

// 暴露全局接口
window.bossTurn = bossTurn;
window.resetBossState = resetBossState;