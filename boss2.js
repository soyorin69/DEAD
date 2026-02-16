// boss2.js - 薪王们的化身（难度调整版）
window.boss2State = {
  phase: 1,
  form: 'curved',
  warning: null,
  warningActive: false,
  currentSkill: null
};

function resetBoss2State() {
  window.boss2State = {
    phase: 1,
    form: 'curved',
    warning: null,
    warningActive: false,
    currentSkill: null
  };
}

function randomForm() {
  const forms = ['curved', 'great', 'staff', 'spear'];
  return forms[Math.floor(Math.random() * forms.length)];
}

function boss2Turn(boss) {
  // 更新boss面向方向指向玩家
  const dx = game.player.x - boss.x;
  const dy = game.player.y - boss.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    boss.facing = { x: dx > 0 ? 1 : -1, y: 0 };
  } else {
    boss.facing = { x: 0, y: dy > 0 ? 1 : -1 };
  }
  gameLog(`薪王当前血量: ${boss.hp}/${boss.maxHp} 阶段: ${window.boss2State.phase}`, 'boss');

  // 检查是否应该进入二阶段（血量归零且仍为一阶段）
  if (boss.hp <= 0 && window.boss2State.phase === 1) {
    gameLog('薪王第一次被击败，但并没有倒下...他进入了二阶段！', 'boss');
    window.boss2State.phase = 2;
    window.boss2State.form = 'straight';
    boss.hp = boss.maxHp;
    boss.maxHp = Math.floor(boss.maxHp * 1.5);
    window.bossMessage = { text: '薪王二阶段 觉醒', timer: 60 };
    return;
  }

  if (window.boss2State.warningActive) {
    executeWarningSkill(boss);
    window.boss2State.warningActive = false;
    window.boss2State.warning = null;
    window.boss2State.currentSkill = null;
    return;
  }

  // ========== 【关键修改】降低移动概率（增加技能频率） ==========
  const moveProb = window.boss2State.phase === 1 ? 0.6 : 0.5; // 一阶段60%，二阶段50%
  if (Math.random() < moveProb) {
    moveEnemy(boss);
    gameLog('薪王移动', 'boss');
  } else {
    let skill;
    if (window.boss2State.phase === 1) {
      if (Math.random() < 0.2) window.boss2State.form = randomForm();
      const skills = getPhase1Skills(window.boss2State.form);
      skill = skills[Math.floor(Math.random() * skills.length)];
    } else {
      const skills = ['flame_sweep', 'meteor_shower', 'chaos_spin'];
      skill = skills[Math.floor(Math.random() * skills.length)];
    }
    window.boss2State.currentSkill = skill;
    prepareWarning(boss, skill);
  }
}

function getPhase1Skills(form) {
  switch (form) {
    case 'curved': return ['curved_spin'];
    case 'great': return ['great_sweep'];
    case 'staff': return ['staff_shot'];
    case 'spear': return ['spear_thrust'];
    default: return [];
  }
}

function prepareWarning(boss, skill) {
  gameLog(`薪王准备使用技能: ${skill}`, 'boss');
  const warningPath = [];
  switch (skill) {
    case 'curved_spin':
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          let wx = boss.x + dx;
          let wy = boss.y + dy;
          if (wx >= 0 && wx < CONST.MAP_WIDTH && wy >= 0 && wy < CONST.MAP_HEIGHT) {
            warningPath.push({ x: wx, y: wy });
          }
        }
      }
      break;
    case 'great_sweep':
      for (let i = 1; i <= 3; i++) {
        let wx = boss.x + boss.facing.x * i;
        let wy = boss.y + boss.facing.y * i;
        if (wx >= 0 && wx < CONST.MAP_WIDTH && wy >= 0 && wy < CONST.MAP_HEIGHT) {
          warningPath.push({ x: wx, y: wy });
        }
      }
      break;
    case 'staff_shot':
      let wx = boss.x + boss.facing.x;
      let wy = boss.y + boss.facing.y;
      while (wx >= 0 && wx < CONST.MAP_WIDTH && wy >= 0 && wy < CONST.MAP_HEIGHT) {
        if (game.map[wy][wx] === 1) break;
        warningPath.push({ x: wx, y: wy });
        wx += boss.facing.x;
        wy += boss.facing.y;
      }
      break;
    case 'spear_thrust':
      for (let i = 1; i <= 2; i++) {
        let wx = boss.x + boss.facing.x * i;
        let wy = boss.y + boss.facing.y * i;
        if (wx >= 0 && wx < CONST.MAP_WIDTH && wy >= 0 && wy < CONST.MAP_HEIGHT) {
          warningPath.push({ x: wx, y: wy });
        }
      }
      break;
    case 'flame_sweep':
      for (let i = 1; i <= 3; i++) {
        let wx = boss.x + boss.facing.x * i;
        let wy = boss.y + boss.facing.y * i;
        if (wx >= 0 && wx < CONST.MAP_WIDTH && wy >= 0 && wy < CONST.MAP_HEIGHT) {
          warningPath.push({ x: wx, y: wy });
        }
      }
      break;
    case 'meteor_shower':
      const count = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        let wx = Math.floor(Math.random() * CONST.MAP_WIDTH);
        let wy = Math.floor(Math.random() * CONST.MAP_HEIGHT);
        while (game.map[wy][wx] === 1) {
          wx = Math.floor(Math.random() * CONST.MAP_WIDTH);
          wy = Math.floor(Math.random() * CONST.MAP_HEIGHT);
        }
        warningPath.push({ x: wx, y: wy });
      }
      break;
    case 'chaos_spin':
      for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
          let wx = boss.x + dx;
          let wy = boss.y + dy;
          if (wx >= 0 && wx < CONST.MAP_WIDTH && wy >= 0 && wy < CONST.MAP_HEIGHT &&
              game.map[wy][wx] === 0) {
            warningPath.push({ x: wx, y: wy });
          }
        }
      }
      break;
  }

  window.boss2State.warning = warningPath;
  window.boss2State.warningActive = true;
}

function executeWarningSkill(boss) {
  if (!window.boss2State.warning) return;
  const skill = window.boss2State.currentSkill;
  gameLog('薪王施放技能: ' + skill, 'boss');

  // 先处理位移（长枪突刺）
  if (skill === 'spear_thrust') {
    let targetX = boss.x + boss.facing.x * 2;
    let targetY = boss.y + boss.facing.y * 2;
    if (targetX >= 0 && targetX < CONST.MAP_WIDTH && targetY >= 0 && targetY < CONST.MAP_HEIGHT &&
        game.map[targetY][targetX] === 0 && !window.getEnemyAt(targetX, targetY)) {
      boss.x = targetX;
      boss.y = targetY;
      gameLog('薪王长枪突刺位移！', 'boss');
    } else {
      let firstX = boss.x + boss.facing.x;
      let firstY = boss.y + boss.facing.y;
      if (firstX >= 0 && firstX < CONST.MAP_WIDTH && firstY >= 0 && firstY < CONST.MAP_HEIGHT &&
          game.map[firstY][firstX] === 0 && !window.getEnemyAt(firstX, firstY)) {
        boss.x = firstX;
        boss.y = firstY;
        gameLog('薪王长枪突刺位移（部分）', 'boss');
      }
    }
  }

  // ========== 【关键修改】技能伤害全面提升 ==========
  window.boss2State.warning.forEach(pos => {
    if (game.player.x === pos.x && game.player.y === pos.y) {
      let damage = 0;
      const form = window.boss2State.phase === 1 ? window.boss2State.form : 'straight';

      if (window.boss2State.phase === 1) {
        switch (form) {
          case 'curved': damage = 5; break;   // 原3→5
          case 'great': damage = 6; break;    // 原4→6
          case 'staff': damage = 5; break;    // 原3→5
          case 'spear': damage = 6; break;    // 原4→6
        }
      } else {
        damage = 10 + Math.floor(Math.random() * 4); // 原6-8→10-13
      }

      // 【关键】统一走 playerTakeDamage 流程（触发弹反等天赋）
      if (typeof window.playerTakeDamage === 'function') {
        window.playerTakeDamage(damage, boss); // 传入伤害源
      } else {
        // 兼容旧逻辑（临时）
        if (!window.cheats.godMode) {
          game.player.hp -= damage;
          updateStatusBar();
          gameLog(`玩家被击中，伤害 ${damage}`, 'combat');
          if (game.player.hp <= 0 && !window.cheats.godMode) {
            checkGameOver();
          }
        }
      }
    }
  });

  // ========== 【关键修改】二阶段连续攻击概率提升至70% ==========
  if (window.boss2State.phase === 2 && Math.random() < 0.7) {
    gameLog('薪王二阶段连续攻击！', 'boss');
    setTimeout(() => boss2Turn(boss), 500);
  }
}

// 暴露全局接口
window.boss2Turn = boss2Turn;
window.resetBoss2State = resetBoss2State;