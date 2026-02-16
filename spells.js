// spells.js - 法术系统（新增冰霜/雷电/治疗 + 经验修复版）
window.isAnimating = false;

// ========== 【关键新增】通用敌人伤害处理（含经验获取）==========
function applyDamageToEnemy(enemy, damage, source = 'player') {
  if (window.cheats.oneHitKill) {
    enemy.hp = 0;
  } else {
    enemy.hp -= damage;
  }

  if (enemy.hp <= 0) {
    // 薪王一阶段特殊处理
    if (enemy.bossType === 'lord_of_cinder' && window.boss2State?.phase === 1) {
      return true;
    }
    
    // 移除前获取经验（核心修复！）
    if (typeof window.gainExp === 'function') {
      window.gainExp(enemy.isBoss ? 20 : 5);
    }
    
    // 后续处理
    if (enemy.isMinion && enemy.master) {
      enemy.master.hp -= 5;
      if (enemy.master.hp <= 0 && typeof window.handleBossDefeat === 'function') {
        window.handleBossDefeat(enemy.master);
      }
    }
    if (enemy.isSummon) {
      game.summon = null;
    }
    if (game.player.hasBloodDemon && !enemy.isBoss && !enemy.isMinion && !enemy.isSummon) {
      if (Math.random() < 0.3) {
        game.player.hp = Math.min(game.player.hp + 2, game.player.maxHp);
      }
    }
    game.enemies = game.enemies.filter(e => e !== enemy);
    return true;
  }
  return false;
}
window.applyDamageToEnemy = applyDamageToEnemy;

// ========== 法术数据库（新增3个法术）==========
const spellsDB = [
  { name: '🔥 火球术', key: 'q', cost: 5, cast: castFireball, description: '直线火球，造成3点伤害' },
  { name: '🌿 血魔藤蔓', key: 'e', cost: 3, cast: castBloodVine, description: '直线藤蔓，造成3点伤害' },
  { name: '❄️ 冰霜新星', key: 'w', cost: 4, cast: castFrostNova, description: '范围冰冻，对周围敌人造成2点伤害' },
  { name: '⚡ 雷电术', key: 'r', cost: 6, cast: castLightning, description: '直线雷电，造成5点伤害（可穿透）' },
  { name: '❤️ 治疗术', key: 't', cost: 4, cast: castHeal, description: '回复8点生命值' }
];

// 获取随机未拥有的法术
function getRandomSpell(existingSpells) {
  const available = spellsDB.filter(s => !existingSpells.some(e => e.name.includes(s.name.split(' ')[0])));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

// ========== 【修复】火球术：使用 applyDamageToEnemy ==========
function castFireball() {
  if (window.isAnimating) {
    if (typeof window.gameLog === 'function') window.gameLog('动画中，请稍后');
    return false;
  }
  if (!game.spells.some(s => s.name.includes('火球'))) {
    if (typeof window.gameLog === 'function') window.gameLog('你不会火球术！');
    return false;
  }
  
  let cost = 5;
  if (window.talents?.has?.('法术共鸣')) {
    cost = Math.max(1, cost - 1);
  }
  if (game.player.mp < cost) {
    if (typeof window.gameLog === 'function') window.gameLog('MP不足！');
    return false;
  }

  const currentWeapon = game.weapons[game.currentWeaponIndex];
  let baseDamage = 3;
  if (currentWeapon && currentWeapon.type === CONST.WEAPON_TYPES.STAFF) {
    baseDamage = Math.floor(baseDamage * (currentWeapon.spellBoost || 1.5));
  }
  if (typeof window.talentSystem?.handleSpellCast === 'function') {
    baseDamage = window.talentSystem.handleSpellCast({ spell: { name: '火球术' }, damage: baseDamage });
  }

  game.player.mp -= cost;
  updateStatusBar();

  const dir = game.player.facing;
  animateFireball(
    game.player.x, game.player.y, dir, baseDamage,
    (enemy) => {
      if (typeof window.gameLog === 'function') window.gameLog(`火球术击中敌人！造成 ${baseDamage} 点伤害`, 'combat');
      draw(); updateStatusBar();
    },
    (hit) => {
      if (!hit && typeof window.gameLog === 'function') window.gameLog('火球术未击中任何目标');
      enemiesTurn(); draw(); updateStatusBar(); checkGameOver();
    }
  );
  return true;
}

// 火球术动画（内部调用 applyDamageToEnemy）
function animateFireball(startX, startY, dir, damage, onHit, onComplete) {
  window.isAnimating = true;
  const ctx = window.ctx;
  let x = startX + dir.x, y = startY + dir.y;
  const path = []; let hitEnemy = null;

  while (x >= 0 && x < CONST.MAP_WIDTH && y >= 0 && y < CONST.MAP_HEIGHT) {
    if (game.map[y][x] === 1) break;
    const enemy = game.enemies.find(e => e.x === x && e.y === y);
    if (enemy) { hitEnemy = enemy; path.push({x,y}); break; }
    path.push({x,y}); x += dir.x; y += dir.y;
  }

  if (path.length === 0) { window.isAnimating = false; onComplete(false); return; }

  let step = 0;
  function drawFrame() {
    draw();
    ctx.save();
    for (let i = 0; i <= step && i < path.length; i++) {
      const p = path[i];
      ctx.beginPath();
      ctx.arc(p.x * CONST.TILE_SIZE + CONST.TILE_SIZE/2, p.y * CONST.TILE_SIZE + CONST.TILE_SIZE/2, 8, 0, 2*Math.PI);
      ctx.fillStyle = '#ff8c00'; ctx.shadowColor = '#ff4500'; ctx.shadowBlur = 10; ctx.fill();
    }
    ctx.restore();

    if (step < path.length - 1) {
      step++; requestAnimationFrame(drawFrame);
    } else {
      if (hitEnemy) {
        applyDamageToEnemy(hitEnemy, damage, 'spell'); // ✅ 核心修复：统一处理伤害+经验
        onHit(hitEnemy);
      }
      window.isAnimating = false;
      onComplete(!!hitEnemy);
    }
  }
  drawFrame();
}

// ========== 【修复】血魔藤蔓：使用 applyDamageToEnemy ==========
function castBloodVine() {
  if (!game.spells.some(s => s.name.includes('血魔'))) {
    if (typeof window.gameLog === 'function') window.gameLog('你不会血魔藤蔓！');
    return false;
  }
  
  let cost = 3;
  if (window.talents?.has?.('法术共鸣')) cost = Math.max(1, cost - 1);
  if (game.player.mp < cost) {
    if (typeof window.gameLog === 'function') window.gameLog('MP不足！');
    return false;
  }

  const currentWeapon = game.weapons[game.currentWeaponIndex];
  let baseDamage = 3;
  if (currentWeapon && currentWeapon.type === CONST.WEAPON_TYPES.STAFF) {
    baseDamage = Math.floor(baseDamage * (currentWeapon.spellBoost || 1.5));
  }
  if (typeof window.talentSystem?.handleSpellCast === 'function') {
    baseDamage = window.talentSystem.handleSpellCast({ spell: { name: '血魔藤蔓' }, damage: baseDamage });
  }

  const dir = game.player.facing;
  let x = game.player.x + dir.x, y = game.player.y + dir.y;
  let hitEnemy = null;

  while (x >= 0 && x < CONST.MAP_WIDTH && y >= 0 && y < CONST.MAP_HEIGHT) {
    if (game.map[y][x] === 1) break;
    const enemy = game.enemies.find(e => e.x === x && e.y === y);
    if (enemy) {
      applyDamageToEnemy(enemy, baseDamage, 'spell'); // ✅ 核心修复
      hitEnemy = enemy;
      break;
    }
    x += dir.x; y += dir.y;
  }

  if (hitEnemy) {
    game.player.mp -= cost;
    if (typeof window.gameLog === 'function') window.gameLog(`血魔藤蔓击中敌人！造成 ${baseDamage} 点伤害`, 'combat');
    draw(); updateStatusBar(); enemiesTurn(); draw(); updateStatusBar(); checkGameOver();
    return true;
  } else {
    if (typeof window.gameLog === 'function') window.gameLog('血魔藤蔓未击中任何目标');
    return false;
  }
}

// ========== 【新增】冰霜新星 ==========
function castFrostNova() {
  if (!game.spells.some(s => s.name.includes('冰霜'))) {
    if (typeof window.gameLog === 'function') window.gameLog('你不会冰霜新星！');
    return false;
  }
  if (game.player.mp < 4) {
    if (typeof window.gameLog === 'function') window.gameLog('MP不足！');
    return false;
  }
  
  game.player.mp -= 4;
  updateStatusBar();
  
  const dirs = [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
  let hitCount = 0;
  
  dirs.forEach(([dx, dy]) => {
    const x = game.player.x + dx;
    const y = game.player.y + dy;
    if (x >= 0 && x < CONST.MAP_WIDTH && y >= 0 && y < CONST.MAP_HEIGHT) {
      const enemy = game.enemies.find(e => e.x === x && e.y === y);
      if (enemy) {
        applyDamageToEnemy(enemy, 2, 'spell'); // ✅ 统一处理
        hitCount++;
      }
    }
  });
  
  if (typeof window.gameLog === 'function') window.gameLog(`❄️ 冰霜新星！击中 ${hitCount} 个敌人`, 'combat');
  draw(); enemiesTurn(); draw(); updateStatusBar(); checkGameOver();
  return true;
}

// ========== 【新增】雷电术 ==========
function castLightning() {
  if (!game.spells.some(s => s.name.includes('雷电'))) {
    if (typeof window.gameLog === 'function') window.gameLog('你不会雷电术！');
    return false;
  }
  if (game.player.mp < 6) {
    if (typeof window.gameLog === 'function') window.gameLog('MP不足！');
    return false;
  }
  
  game.player.mp -= 6;
  updateStatusBar();
  
  const dir = game.player.facing;
  let x = game.player.x + dir.x, y = game.player.y + dir.y;
  let hitCount = 0;
  
  while (x >= 0 && x < CONST.MAP_WIDTH && y >= 0 && y < CONST.MAP_HEIGHT) {
    if (game.map[y][x] === 1) break;
    const enemy = game.enemies.find(e => e.x === x && e.y === y);
    if (enemy) {
      applyDamageToEnemy(enemy, 5, 'spell'); // ✅ 统一处理
      hitCount++;
    }
    x += dir.x; y += dir.y;
  }
  
  if (typeof window.gameLog === 'function') window.gameLog(`⚡ 雷电术！穿透击中 ${hitCount} 个敌人`, 'combat');
  draw(); enemiesTurn(); draw(); updateStatusBar(); checkGameOver();
  return true;
}

// ========== 【新增】治疗术 ==========
function castHeal() {
  if (!game.spells.some(s => s.name.includes('治疗'))) {
    if (typeof window.gameLog === 'function') window.gameLog('你不会治疗术！');
    return false;
  }
  if (game.player.mp < 4) {
    if (typeof window.gameLog === 'function') window.gameLog('MP不足！');
    return false;
  }
  
  const healAmount = 8;
  const actualHeal = Math.min(healAmount, game.player.maxHp - game.player.hp);
  game.player.hp += actualHeal;
  game.player.mp -= 4;
  
  if (typeof window.gameLog === 'function') window.gameLog(`❤️ 治疗术！回复 ${actualHeal} 点生命`, 'info');
  updateStatusBar(); draw();
  
  enemiesTurn(); draw(); updateStatusBar(); checkGameOver();
  return true;
}

// 暴露接口
window.spellsDB = spellsDB;
window.getRandomSpell = getRandomSpell;
window.castFireball = castFireball;
window.castBloodVine = castBloodVine;
window.castFrostNova = castFrostNova;
window.castLightning = castLightning;
window.castHeal = castHeal;