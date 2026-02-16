// player.js - 玩家核心逻辑（经验修复+升级加速+天赋集成版）

// ========== 【关键修复】全局日志函数安全调用（前置定义）==========
function safeGameLog(message, type = 'info') {
  if (typeof window.gameLog === 'function') {
    window.gameLog(message, type);
  } else {
    console.log(`[${type}] ${message}`);
  }
}

// 获取当前武器的暴击率加成
function getCritBonus(weapon) {
  return weapon?.critBonus || 0;
}

// ========== 【关键修改】暴击计算：集成「精准射击」天赋 ==========
function applyCritDamage(baseDamage, weapon) {
  let totalCritChance = game.player.critChance + getCritBonus(weapon);
  
  // 精准射击：远程攻击时暴击率+15%
  if (weapon?.type === CONST.WEAPON_TYPES.BOW && window.talents?.has?.('精准射击')) {
    totalCritChance += 0.15;
  }
  
  const isCrit = Math.random() < totalCritChance;
  const damage = isCrit ? Math.floor(baseDamage * game.player.critMultiplier) : baseDamage;
  if (isCrit) console.log('暴击！');
  return damage;
}

// 获取指定位置的敌人（包括两格敌人的第二格）
function getEnemyAt(x, y) {
  return game.enemies.find(enemy => {
    if (enemy.x === x && enemy.y === y) return true;
    if (enemy.size === 2) {
      if (enemy.orientation === 'horizontal' && enemy.x + 1 === x && enemy.y === y) return true;
      if (enemy.orientation === 'vertical' && enemy.x === x && enemy.y + 1 === y) return true;
    }
    return false;
  });
}

// 获取直线上的所有敌人（用于穿透箭）
function getAllRangedTargets() {
  const dir = game.player.facing;
  let x = game.player.x + dir.x;
  let y = game.player.y + dir.y;
  const targets = [];
  while (x >= 0 && x < CONST.MAP_WIDTH && y >= 0 && y < CONST.MAP_HEIGHT) {
    if (game.map[y][x] === 1) break;
    const enemy = getEnemyAt(x, y);
    if (enemy && !targets.includes(enemy)) targets.push(enemy);
    x += dir.x;
    y += dir.y;
  }
  return targets;
}

// 获取直线上的第一个敌人（用于普通箭/火焰箭）
function getRangedTarget() {
  const dir = game.player.facing;
  let x = game.player.x + dir.x;
  let y = game.player.y + dir.y;
  while (x >= 0 && x < CONST.MAP_WIDTH && y >= 0 && y < CONST.MAP_HEIGHT) {
    if (game.map[y][x] === 1) return null;
    const enemy = getEnemyAt(x, y);
    if (enemy) return enemy;
    x += dir.x;
    y += dir.y;
  }
  return null;
}

// 经验获取
function gainExp(amount) {
  game.player.exp += amount;
  while (game.player.exp >= game.player.expToNext) {
    levelUp();
  }
  updateStatusBar();
}

// ========== 【关键优化】升级逻辑：更快成长 + 更温和的负面效果 ==========
function levelUp() {
  game.player.level++;
  
  // 血量/蓝量增长保持+5（已削弱过，不再回调）
  game.player.maxHp += 5; 
  game.player.maxMp += 5;
  
  // ✅ 优化1：经验需求增长倍数从1.5→1.3（升级间隔缩短）
  game.player.expToNext = Math.floor(game.player.expToNext * 1.3);
  
  // ✅ 优化2：负面效果概率从50%→30%，持续时间缩短
  if (Math.random() < 0.3 && game.player.level > 3) {
    const debuffs = [
      { type: 'debuff_weak', duration: 2, effect: '攻击力-1' },
      { type: 'debuff_slow', duration: 1, effect: '下回合无法行动' }
    ];
    const debuff = debuffs[Math.floor(Math.random() * debuffs.length)];
    game.player.buffs.push(debuff);
    safeGameLog(`⚠️ 升级副作用：${debuff.effect}，持续${debuff.duration}回合`, 'info');
  }
  
  // 恢复全满
  game.player.hp = game.player.maxHp;
  game.player.mp = game.player.maxMp;
  
  game.player.exp -= game.player.expToNext;
  generateRewards();
}

// 生成奖励
function generateRewards() {
  const rewardPools = [
    { type: 'weapon', name: '随机武器' },
    { type: 'item', name: '随机道具' },
    { type: 'spell', name: '随机法术' },
    { type: 'special', name: '永久攻击+1' },
    { type: 'special', name: '箭矢+10' },
    { type: 'special', name: '回复药剂' }
  ];
  const shuffled = [...rewardPools].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 3);
  showRewardModal(selected);
}

// 显示奖励界面
function showRewardModal(rewards) {
  const modal = document.getElementById('levelUpModal');
  const optionsDiv = document.getElementById('rewardOptions');
  if (!modal || !optionsDiv) return;
  optionsDiv.innerHTML = '';
  rewards.forEach((reward) => {
    const btn = document.createElement('button');
    btn.textContent = reward.name;
    btn.onclick = () => {
      applyReward(reward);
      modal.style.display = 'none';
      draw();
      updateStatusBar();
    };
    optionsDiv.appendChild(btn);
  });
  modal.style.display = 'block';
}

// 应用奖励
function applyReward(reward) {
  switch (reward.type) {
    case 'weapon':
      const newWeapon = randomWeapon();
      if (game.weapons.length < 2) {
        game.weapons.push(newWeapon);
      } else {
        game.weapons[game.currentWeaponIndex] = newWeapon;
      }
      console.log('获得武器:', newWeapon.name);
      break;
    case 'item':
      const itemTypes = Object.values(CONST.ITEM_TYPES);
      const randomItem = itemTypes[Math.floor(Math.random() * itemTypes.length)];
      game.inventory.push(randomItem);
      console.log('获得道具:', getItemName(randomItem));
      break;
    case 'spell':
      const newSpell = getRandomSpell(game.spells);
      if (newSpell) {
        game.spells.push(newSpell);
        console.log('学会法术:', newSpell.name);
      }
      break;
    case 'special':
      if (reward.name.includes('攻击')) {
        game.player.baseAttack += 1;
        console.log('基础攻击力 +1');
      } else if (reward.name.includes('箭矢')) {
        const currentWeapon = game.weapons[game.currentWeaponIndex];
        if (currentWeapon && currentWeapon.type === CONST.WEAPON_TYPES.BOW) {
          currentWeapon.ammo += 10;
          console.log('箭矢 +10');
        }
      } else if (reward.name.includes('回复')) {
        game.inventory.push(CONST.ITEM_TYPES.HEALTH_POTION);
        console.log('获得血瓶');
      }
      break;
  }
}

// 切换武器
function switchWeapon() {
  if (game.weapons.length < 2) return;
  game.currentWeaponIndex = (game.currentWeaponIndex + 1) % game.weapons.length;
  console.log(`切换到 ${game.weapons[game.currentWeaponIndex].name}`);
  draw();
  updateStatusBar();
}

// 拾取道具
function pickupItem() {
  const itemIndex = game.items.findIndex(it => it.x === game.player.x && it.y === game.player.y);
  if (itemIndex !== -1) {
    const item = game.items[itemIndex];
    game.inventory.push(item.type);
    game.items.splice(itemIndex, 1);
    console.log('拾取了', getItemName(item.type));
    draw();
    updateStatusBar();
  }
}

// 使用物品（通过背包索引）
function useInventoryItem(index) {
  if (index < 0 || index >= game.inventory.length) return false;
  const itemType = game.inventory[index];
  const used = window.useItem(itemType, game);
  if (used) {
    game.inventory.splice(index, 1);
    draw();
    updateStatusBar();
    // 【关键】使用物品后检查清图（特别是炸弹）
    if (typeof window.checkFloorClear === 'function') {
      window.checkFloorClear();
    }
  }
  return used;
}

// ========== 【关键修改】下楼前强制检查清图 ==========
function goToNextFloor() {
  // 下楼前检查当前层是否已清（触发清图奖励）
  if (typeof window.checkFloorClear === 'function') {
    window.checkFloorClear();
  }
  
  if (game.floor % 10 === 0 && game.enemies.length > 0) {
    console.log('必须先击败Boss才能下楼！');
    return;
  }
  game.floor++;
  generateNewFloor(game.floor);
  game.player.x = 1;
  game.player.y = 1;
  draw();
  updateStatusBar();
  console.log(`进入第 ${game.floor} 层`);
}

// ========== 【关键修改】乐器Buff：集成「鼓舞旋律」天赋 ==========
function applyInstrumentBuff(weapon) {
  if (!weapon.buffEffect) return;
  
  // 基础持续时间
  let duration = weapon.buffDuration;
  
  // 鼓舞旋律：延长持续时间
  if (window.talents?.has?.('鼓舞旋律') && typeof window.talentSystem?.handleBuffApply === 'function') {
    duration = window.talentSystem.handleBuffApply({ 
      buff: { type: weapon.buffEffect, duration } 
    });
  }
  
  const existing = game.player.buffs.find(b => b.type === weapon.buffEffect);
  if (existing) {
    existing.duration = Math.max(existing.duration, duration);
  } else {
    game.player.buffs.push({ type: weapon.buffEffect, duration });
  }
  
  safeGameLog(`获得buff: ${weapon.buffEffect}，持续${duration}回合`, 'info');
  draw();
  updateStatusBar();
}

// 更新buff（每回合调用）
function updateBuffs() {
  game.player.buffs = game.player.buffs.filter(b => {
    b.duration--;
    return b.duration > 0;
  });
}

// 玩家攻击
function playerAttack() {
  const currentWeapon = game.weapons[game.currentWeaponIndex];
  if (!currentWeapon) return;
  let attackSuccess = false;

  if (currentWeapon.type === CONST.WEAPON_TYPES.BOW) {
    // 弓系远程攻击
    if (currentWeapon.ammo <= 0) {
      console.log('箭矢不足，无法攻击');
      return;
    }
    const effect = currentWeapon.effect || CONST.AMMO_EFFECTS.NORMAL;
    const baseAttack = currentWeapon.attack + (game.player.baseAttack || 0);

    if (effect === CONST.AMMO_EFFECTS.PIERCE) {
      const targets = getAllRangedTargets();
      if (targets.length > 0) {
        targets.forEach(enemy => {
          let damage;
          if (window.cheats.oneHitKill) {
            enemy.hp = 0;
          } else {
            damage = applyCritDamage(baseAttack, currentWeapon);
            enemy.hp -= damage;
          }
        });
        const deadEnemies = targets.filter(enemy => enemy.hp <= 0);
        deadEnemies.forEach(enemy => {
          gainExp(enemy.isBoss ? 20 : 5);
        });
        game.enemies = game.enemies.filter(e => e.hp > 0);
        currentWeapon.ammo -= 1;
        console.log(`穿透箭！击中 ${targets.length} 个敌人，剩余箭矢: ${currentWeapon.ammo}`);
        attackSuccess = true;
      }
    } else {
      const target = getRangedTarget();
      if (target) {
        let damage = baseAttack;
        if (effect === CONST.AMMO_EFFECTS.FIRE) damage += 1;
        if (window.cheats.oneHitKill) {
          target.hp = 0;
        } else {
          damage = applyCritDamage(damage, currentWeapon);
          target.hp -= damage;
        }
        currentWeapon.ammo -= 1;
        if (target.hp <= 0) {
          game.enemies = game.enemies.filter(e => e !== target);
          gainExp(target.isBoss ? 20 : 5); // ✅ 核心修复：远程击杀获取经验
        }
        console.log(`射箭！击中敌人，造成 ${damage} 伤害，剩余箭矢: ${currentWeapon.ammo}`);
        attackSuccess = true;
      }
    }
  } else {
    // 近战攻击（剑、乐器、法杖、盾）
    const dir = game.player.facing;
    const targetX = game.player.x + dir.x;
    const targetY = game.player.y + dir.y;
    const enemy = getEnemyAt(targetX, targetY);
    if (enemy) {
      if (window.cheats.oneHitKill) {
        enemy.hp = 0;
      } else {
        let baseDamage = currentWeapon.attack + (game.player.baseAttack || 0);
        // 应用攻击力buff（乐器效果）
        if (game.player.buffs.some(b => b.type === CONST.BUFF_TYPES.ATTACK_UP)) {
          baseDamage = Math.floor(baseDamage * 1.5);
        }
        let totalDamage = 0;

        if (currentWeapon.doubleStrike) {
          // 痛苦双刀：两段攻击
          for (let i = 0; i < 2; i++) {
            const damage = applyCritDamage(baseDamage, currentWeapon);
            totalDamage += damage;
            if (damage === baseDamage && currentWeapon.selfDamage > 0) {
              // 未暴击的段扣血
              game.player.hp = Math.max(1, game.player.hp - currentWeapon.selfDamage);
              console.log('痛苦双刀 反噬，扣2血');
            }
          }
        } else {
          totalDamage = applyCritDamage(baseDamage, currentWeapon);
        }
        enemy.hp -= totalDamage;
        
        // ========== 【关键修改】触发「双持精通」等攻击后天赋 ==========
        if (typeof window.talentSystem?.handlePlayerAttack === 'function') {
          window.talentSystem.handlePlayerAttack({ 
            weapon: currentWeapon, 
            target: enemy 
          });
        }
      }

      if (enemy.hp <= 0) {
        // 残忍之杖召唤
        if (currentWeapon.summonOnKill && !game.summon) {
          summonMinion(enemy);
        }
        // ✅ 核心修复：近战击杀获取经验（此前缺失！）
        gainExp(enemy.isBoss ? 20 : 5);
        removeEnemy(enemy);
      }
      attackSuccess = true;
    }
  }

  if (attackSuccess) {
    draw();
    updateStatusBar();
    enemiesTurn();
    draw();
    updateStatusBar();
    checkGameOver();
    // 【关键】攻击后检查清图
    if (typeof window.checkFloorClear === 'function') {
      window.checkFloorClear();
    }
  }
}

// 移除敌人（统一处理）
function removeEnemy(enemy) {
  // 如果是薪王化身且为一阶段，hp归零应进入二阶段而不是移除
  if (enemy.bossType === 'lord_of_cinder' && enemy.hp <= 0 && window.boss2State?.phase === 1) {
    return;
  }
  // 小怪死亡Boss扣血
  if (enemy.isMinion && enemy.master) {
    enemy.master.hp -= 5;
    if (enemy.master.hp <= 0) {
      handleBossDefeat(enemy.master);
    }
  }
  // 召唤物死亡
  if (enemy.isSummon) {
    game.summon = null;
  }
  // 血魔状态触发回复
  if (game.player.hasBloodDemon && !enemy.isBoss && !enemy.isMinion && !enemy.isSummon) {
    if (Math.random() < 0.3) {
      game.player.hp = Math.min(game.player.hp + 2, game.player.maxHp);
      console.log('血魔状态触发，回复2点生命');
    }
  }
  game.enemies = game.enemies.filter(e => e !== enemy);
}

function handleBossDefeat(boss) {
  console.log('Boss被击败！');
  game.enemies = game.enemies.filter(e => e !== boss);
  // 免费获得血魔藤蔓
  if (!game.spells.some(s => s.name.includes('血魔'))) {
    game.spells.push({ name: '🌿 血魔藤蔓', key: 'e', cost: 3, cast: window.castBloodVine });
  }
  showBossRewards();
}

// Boss奖励界面
function showBossRewards() {
  const rewards = [
    { type: 'weapon', name: '痛苦双刀', weaponData: { attack: 2, critBonus: 0.15, doubleStrike: true, selfDamage: 2 } },
    { type: 'weapon', name: '残忍之杖', weaponData: { attack: 2, critBonus: 0.05, summonOnKill: true } },
    { type: 'special', name: '血魔状态', effect: () => game.player.hasBloodDemon = true }
  ];
  const modal = document.getElementById('bossRewardModal');
  const optionsDiv = document.getElementById('bossRewardOptions');
  if (!modal || !optionsDiv) return;
  optionsDiv.innerHTML = '';
  rewards.forEach((reward) => {
    const btn = document.createElement('button');
    btn.textContent = reward.name;
    btn.onclick = () => {
      applyBossReward(reward);
      modal.style.display = 'none';
      draw();
      updateStatusBar();
    };
    optionsDiv.appendChild(btn);
  });
  modal.style.display = 'block';
}

function applyBossReward(reward) {
  switch (reward.type) {
    case 'weapon':
      const newWeapon = {
        type: reward.name === '痛苦双刀' ? CONST.WEAPON_TYPES.SWORD : CONST.WEAPON_TYPES.STAFF,
        name: reward.name,
        attack: reward.weaponData.attack,
        critBonus: reward.weaponData.critBonus,
        doubleStrike: reward.weaponData.doubleStrike || false,
        selfDamage: reward.weaponData.selfDamage || 0,
        summonOnKill: reward.weaponData.summonOnKill || false
      };
      if (game.weapons.length < 2) {
        game.weapons.push(newWeapon);
      } else {
        game.weapons[game.currentWeaponIndex] = newWeapon;
      }
      break;
    case 'special':
      reward.effect();
      break;
  }
}

// 召唤小鬼（残忍之杖）
function summonMinion(killedEnemy) {
  const dirs = [[0,1],[1,0],[0,-1],[-1,0]];
  for (let d of dirs) {
    let nx = killedEnemy.x + d[0];
    let ny = killedEnemy.y + d[1];
    if (nx >= 0 && nx < CONST.MAP_WIDTH && ny >= 0 && ny < CONST.MAP_HEIGHT &&
        game.map[ny][nx] === 0 && !getEnemyAt(nx, ny)) {
      const minion = {
        x: nx, y: ny,
        hp: 3,
        attack: 1,
        isSummon: true
      };
      game.enemies.push(minion);
      game.summon = minion;
      console.log('召唤了小鬼');
      break;
    }
  }
}

// ========== 【关键新增】统一玩家受伤入口 ==========
function playerTakeDamage(damage, source = null) {
  if (window.cheats.godMode) return;

  // 弹反等天赋检查
  if (typeof window.talentSystem?.handlePlayerTakeDamage === 'function') {
    const handled = window.talentSystem.handlePlayerTakeDamage({
      damage,
      source,
      playerPos: { x: game.player.x, y: game.player.y }
    });
    if (handled) return; // 伤害已被处理（如弹反成功）
  }

  // 实际扣血
  game.player.hp -= damage;
  updateStatusBar();
  safeGameLog(`玩家受到 ${damage} 点伤害`, 'combat');

  if (game.player.hp <= 0 && !window.cheats.godMode) {
    checkGameOver();
  }
}



// 暴露全局函数
window.gainExp = gainExp;
window.removeEnemy = removeEnemy;
window.applyCritDamage = applyCritDamage;
window.getRangedTarget = getRangedTarget;
window.getAllRangedTargets = getAllRangedTargets;
window.updateBuffs = updateBuffs;
window.getEnemyAt = getEnemyAt;
// 暴露核心操作函数，供按钮直接调用
window.playerAttack = playerAttack;
window.switchWeapon = switchWeapon;
window.goToNextFloor = goToNextFloor;
window.movePlayer = function(dx, dy) {
    if (window.isAnimating || game.player.stunned) return;

    // 更新面向方向
    game.player.facing = { x: dx, y: dy };

    let newX = game.player.x + dx;
    let newY = game.player.y + dy;

    if (newY >= 0 && newY < CONST.MAP_HEIGHT && newX >= 0 && newX < CONST.MAP_WIDTH) {
        if (game.map[newY][newX] === 0 && !getEnemyAt(newX, newY)) {
            game.player.x = newX;
            game.player.y = newY;
            pickupItem(); // 拾取物品
        }
    }

    enemiesTurn();
    draw();
    updateStatusBar();
    checkGameOver();
};
window.playerTakeDamage = playerTakeDamage;

// ========== 金手指系统 ==========
function showCheatPassword() {
  document.getElementById('cheatPasswordModal').style.display = 'block';
}
function hideCheatPassword() {
  document.getElementById('cheatPasswordModal').style.display = 'none';
  document.getElementById('cheatPasswordInput').value = '';
}
function checkCheatPassword() {
  const input = document.getElementById('cheatPasswordInput').value;
  if (input === 'test123') {
    hideCheatPassword();
    showCheatMenu();
  } else {
    alert('密码错误');
  }
}
function showCheatMenu() {
  const menu = document.getElementById('cheatMenu');
  document.getElementById('cheatGodMode').checked = window.cheats.godMode;
  document.getElementById('cheatOneHitKill').checked = window.cheats.oneHitKill;
  document.getElementById('cheatInfiniteMP').checked = window.cheats.infiniteMP;
  menu.style.display = 'block';
}
function hideCheatMenu() {
  document.getElementById('cheatMenu').style.display = 'none';
}
function applyCheatSettings() {
  window.cheats.godMode = document.getElementById('cheatGodMode').checked;
  window.cheats.oneHitKill = document.getElementById('cheatOneHitKill').checked;
  window.cheats.infiniteMP = document.getElementById('cheatInfiniteMP').checked;
}
function cheatGotoFloor() {
  const floorInput = document.getElementById('cheatFloorInput');
  let floor = parseInt(floorInput.value);
  if (isNaN(floor) || floor < 1) floor = 1;
  game.floor = floor;
  generateNewFloor(floor);
  game.player.x = 1;
  game.player.y = 1;
  draw();
  updateStatusBar();
  hideCheatMenu();
}

// 绑定按钮事件
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('cheatSubmit').addEventListener('click', checkCheatPassword);
  document.getElementById('cheatCancel').addEventListener('click', hideCheatPassword);
  document.getElementById('cheatClose').addEventListener('click', () => {
    applyCheatSettings();
    hideCheatMenu();
  });
  document.getElementById('cheatGotoFloorBtn').addEventListener('click', cheatGotoFloor);
});

// 监听 F2 键
document.addEventListener('keydown', (e) => {
  if (e.key === 'F2') {
    e.preventDefault();
    showCheatPassword();
  }
});

// 游戏启动
window.addEventListener('load', () => {
  if (typeof initGame === 'function') {
    initGame();
  } else {
    console.error('initGame 未定义');
  }

});
// ========== 暴露核心操作函数，供按钮直接调用 ==========
window.playerAttack = playerAttack;
window.switchWeapon = switchWeapon;
window.goToNextFloor = goToNextFloor;

window.movePlayer = function(dx, dy) {
    if (window.isAnimating || game.player.stunned) return;

    // 更新面向方向
    game.player.facing = { x: dx, y: dy };

    let newX = game.player.x + dx;
    let newY = game.player.y + dy;

    if (newY >= 0 && newY < CONST.MAP_HEIGHT && newX >= 0 && newX < CONST.MAP_WIDTH) {
        if (game.map[newY][newX] === 0 && !window.getEnemyAt(newX, newY)) {
            game.player.x = newX;
            game.player.y = newY;
            pickupItem(); // 拾取物品
        }
    }

    enemiesTurn();
    draw();
    updateStatusBar();
    checkGameOver();
};

// ========== 移动端按钮事件绑定 ==========
document.addEventListener('DOMContentLoaded', () => {
    // 方向键
    document.getElementById('btn-up').addEventListener('click', () => window.movePlayer(0, -1));
    document.getElementById('btn-down').addEventListener('click', () => window.movePlayer(0, 1));
    document.getElementById('btn-left').addEventListener('click', () => window.movePlayer(-1, 0));
    document.getElementById('btn-right').addEventListener('click', () => window.movePlayer(1, 0));

    // 攻击
    document.getElementById('btn-attack').addEventListener('click', () => {
        if (window.isAnimating || game.player.stunned) return;
        window.playerAttack();
    });

    // 切换武器
    document.getElementById('btn-switch').addEventListener('click', () => {
        if (window.isAnimating) return;
        window.switchWeapon();
    });

    // 下楼
    document.getElementById('btn-downfloor').addEventListener('click', () => {
        if (window.isAnimating) return;
        window.goToNextFloor();
    });

    // 法术按钮 (Q W E R T)
    const spellKeys = ['q', 'w', 'e', 'r', 't'];
    spellKeys.forEach(key => {
        const btn = document.getElementById(`btn-spell-${key}`);
        if (btn) {
            btn.addEventListener('click', () => {
                if (window.isAnimating || game.player.stunned) return;
                const spell = game.spells.find(s => s.key === key);
                if (spell) spell.cast();
            });
        }
    });

    // 物品栏 1-4
    for (let i = 1; i <= 4; i++) {
        const btn = document.getElementById(`btn-item${i}`);
        if (btn) {
            btn.addEventListener('click', () => {
                if (window.isAnimating || game.player.stunned) return;
                useInventoryItem(i - 1);
            });
        }
    }
});

