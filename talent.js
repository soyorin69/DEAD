// talent.js - 天赋系统（流派天赋效果+安全调用修复版）
class TalentSystem {
  constructor() {
    this.list = new Set();
    this.handlers = {
      onPlayerTakeDamage: [],
      onPlayerAttack: [],
      onSpellCast: [],
      onBuffApply: []
    };
  }

  add(talentName) {
    if (!this.list.has(talentName)) {
      this.list.add(talentName);
      // ✅ 安全调用 window.gameLog
      if (typeof window.gameLog === 'function') {
        window.gameLog(`获得天赋：${talentName}`, 'info');
      }
    }
  }

  has(talentName) {
    return this.list.has(talentName);
  }

  registerOnTakeDamage(handler) {
    this.handlers.onPlayerTakeDamage.push(handler);
  }

  registerOnAttack(handler) {
    this.handlers.onPlayerAttack.push(handler);
  }

  registerOnSpellCast(handler) {
    this.handlers.onSpellCast.push(handler);
  }

  registerOnBuffApply(handler) {
    this.handlers.onBuffApply.push(handler);
  }

  handlePlayerTakeDamage({ damage, source, playerPos }) {
    for (const handler of this.handlers.onPlayerTakeDamage) {
      const result = handler({ damage, source, playerPos });
      if (result === true) return true;
    }
    return false;
  }

  handlePlayerAttack({ weapon, target }) {
    for (const handler of this.handlers.onPlayerAttack) {
      handler({ weapon, target });
    }
  }

  handleSpellCast({ spell, damage }) {
    let finalDamage = damage;
    for (const handler of this.handlers.onSpellCast) {
      finalDamage = handler({ spell, damage: finalDamage }) || finalDamage;
    }
    return finalDamage;
  }

  handleBuffApply({ buff }) {
    let duration = buff.duration;
    for (const handler of this.handlers.onBuffApply) {
      duration = handler({ buff, duration }) || duration;
    }
    return duration;
  }
}

// 初始化全局天赋系统
const talentSystem = new TalentSystem();

// ========== 弹反逻辑（解耦版）==========
function tryParryHandler({ damage, source, playerPos }) {
  if (!talentSystem.has('弹反')) return false;
  const currentWeapon = game.weapons[game.currentWeaponIndex];
  if (!currentWeapon || currentWeapon.type !== CONST.WEAPON_TYPES.SHIELD) return false;
  
  let inWarning = false;
  const warnings = [];
  if (window.bossState?.warningActive && window.bossState.warning) {
    warnings.push(...window.bossState.warning);
  }
  if (window.boss2State?.warningActive && window.boss2State.warning) {
    warnings.push(...window.boss2State.warning);
  }
  inWarning = warnings.some(pos => pos.x === playerPos.x && pos.y === playerPos.y);
  if (!inWarning) return false;
  
  if (Math.random() < 0.5) {
    // ✅ 安全调用
    if (typeof window.gameLog === 'function') window.gameLog('弹反成功！Boss陷入眩晕，可处决！', 'combat');
    source.stunned = true;
    source.stunTurns = 1;
    game.player.executable = true;
    game.player.executableTarget = source;
    return true;
  } else {
    // ✅ 安全调用
    if (typeof window.gameLog === 'function') window.gameLog('弹反失败', 'combat');
    return false;
  }
}
talentSystem.registerOnTakeDamage(tryParryHandler);

// ========== 双持精通 ==========
function dualWieldHandler({ weapon, target }) {
  if (!talentSystem.has('双持精通')) return;
  if (weapon.type !== CONST.WEAPON_TYPES.SWORD) return;
  
  if (Math.random() < 0.3) {
    // ✅ 安全调用
    if (typeof window.gameLog === 'function') window.gameLog('双持精通触发！额外攻击一次', 'combat');
    const extraDamage = weapon.attack + (game.player.baseAttack || 0);
    if (target) {
      target.hp -= extraDamage;
      if (target.hp <= 0 && typeof window.removeEnemy === 'function') {
        window.removeEnemy(target);
      }
    }
  }
}
talentSystem.registerOnAttack(dualWieldHandler);

// ========== 法术共鸣 ==========
function spellResonanceHandler({ spell, damage }) {
  if (!talentSystem.has('法术共鸣')) return damage;
  return Math.floor(damage * 1.3);
}
talentSystem.registerOnSpellCast(spellResonanceHandler);

// ========== 鼓舞旋律 ==========
function inspiringMelodyHandler({ buff, duration }) {
  if (!talentSystem.has('鼓舞旋律')) return duration;
  if (buff.type === CONST.BUFF_TYPES.ATTACK_UP) {
    return duration + 2;
  }
  return duration;
}
talentSystem.registerOnBuffApply(inspiringMelodyHandler);

// 处决逻辑
function tryExecute() {
  if (!game.player.executable || !game.player.executableTarget) return false;
  const boss = game.player.executableTarget;
  if (!boss || boss.hp <= 0) {
    game.player.executable = false;
    game.player.executableTarget = null;
    return false;
  }
  
  const damage = Math.floor(boss.maxHp * 0.2);
  boss.hp -= damage;
  // ✅ 安全调用
  if (typeof window.gameLog === 'function') window.gameLog(`处决！造成 ${damage} 点伤害（20%最大生命值）`, 'combat');
  
  if (boss.hp <= 0 && boss.isBoss) {
    if (typeof window.handleBossDefeat === 'function') {
      window.handleBossDefeat(boss);
    }
  }
  
  game.player.executable = false;
  game.player.executableTarget = null;
  return true;
}

// 兼容旧接口
window.talents = {
  list: [...talentSystem.list],
  add: (name) => talentSystem.add(name),
  has: (name) => talentSystem.has(name)
};

window.initTalents = () => {
  talentSystem.list.clear();
  window.talents.list = [];
};

window.tryParry = (boss, damage) => {
  console.warn('window.tryParry 已废弃，请使用 talentSystem.handlePlayerTakeDamage');
  return talentSystem.handlePlayerTakeDamage({
    damage,
    source: boss,
    playerPos: { x: game.player.x, y: game.player.y }
  });
};

window.tryExecute = tryExecute;
window.talentSystem = talentSystem;