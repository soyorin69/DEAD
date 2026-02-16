// base.js - 游戏核心（图片集成+经验修复+清图奖励版）

// ========== 【关键修复】全局日志函数（必须放在最顶部！）==========
function gameLog(message, type = 'info') {
  console.log(`[${type}] ${message}`);
  const logContent = document.getElementById('logContent');
  if (!logContent) return;
  const entry = document.createElement('div');
  entry.className = `log-entry log-${type}`;
  const time = new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  entry.textContent = `[${time}] ${message}`;
  logContent.appendChild(entry);
  logContent.scrollTop = logContent.scrollHeight;
  if (logContent.children.length > 50) logContent.removeChild(logContent.children[0]);
  const logPreview = document.getElementById('logPreview');
  if (logPreview) {
    const msgOnly = message.length > 30 ? message.substring(0, 30) + '...' : message;
    logPreview.innerHTML = `📜 ${msgOnly}`;
  }
}
window.gameLog = gameLog;

// ========== 全局常量 & Canvas 初始化 ==========
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
window.ctx = ctx;

// ========== 金手指系统 ==========
window.cheats = {
  godMode: false,
  oneHitKill: false,
  infiniteMP: false
};

// ========== 【关键新增】图片资源管理 ==========
const imageAssets = {
  player: null, enemy: null, boss: null, boss2: null, // ← 新增 boss2
  health_potion: null, mana_potion: null, attack_potion: null,
  bomb: null, arrow_quiver: null,
  wall: null, floor: null, warning: null
};
let imagesLoaded = false;
const loadPromises = [];

// 预加载所有图片（带容错）
function preloadImages() {
  const basePath = 'images/';
  const imageNames = Object.keys(imageAssets);
  
  imageNames.forEach(name => {
    const img = new Image();
    img.src = `${basePath}${name}.png`;
    
    img.onerror = () => {
      console.warn(`⚠️ 图片加载失败: ${name}.png（使用默认色块）`);
      imageAssets[name] = null;
    };
    
    img.onload = () => {
      imageAssets[name] = img;
    };
    
    loadPromises.push(new Promise(resolve => {
      img.onload = img.onerror = resolve;
    }));
  });
  
  Promise.all(loadPromises).then(() => {
    imagesLoaded = true;
    console.log('✅ 图片资源加载完成');
    // 自动初始化游戏（如果尚未开始）
    if (typeof initGame === 'function' && !game.floor) {
      initGame();
    }
  });
}

// ========== 游戏状态对象（含清图标记）==========
const gameState = {
  map: [],
  player: {
    x: 1, y: 1,
    hp: 10, mp: 10,
    maxHp: 10, maxMp: 10,
    baseAttack: 1,
    critChance: 0.1,
    critMultiplier: 1.2,
    facing: { x: 1, y: 0 },
    level: 1,
    exp: 0,
    expToNext: 5, // ✅ 修复：初始经验需求5（打1小怪即升级）
    stunned: false,
    hasBloodDemon: false,
    buffs: [],
    executable: false,
    executableTarget: null
  },
  enemies: [],
  items: [],
  inventory: [],
  spells: [],
  floor: 1,
  weapons: [],
  currentWeaponIndex: 0,
  summon: null,
  floorCleared: false // 清图奖励标记
};

window.game = gameState;

// ========== 【关键新增】清图奖励系统 ==========
function checkFloorClear() {
  const isBossFloor = gameState.floor % 10 === 0;
  if (!isBossFloor && !gameState.floorCleared && gameState.enemies.length === 0) {
    gameState.floorCleared = true;
    
    // 恢复20%血蓝
    const healHp = Math.floor(gameState.player.maxHp * 0.2);
    const healMp = Math.floor(gameState.player.maxMp * 0.2);
    gameState.player.hp = Math.min(gameState.player.hp + healHp, gameState.player.maxHp);
    gameState.player.mp = Math.min(gameState.player.mp + healMp, gameState.player.maxMp);
    
    // 随机道具
    const rand = Math.random();
    let itemName = '血瓶';
    let itemType = CONST.ITEM_TYPES.HEALTH_POTION;
    if (rand < 0.4) { itemName = '魔法药水'; itemType = CONST.ITEM_TYPES.MANA_POTION; }
    else if (rand < 0.7) { itemName = '攻击药水'; itemType = CONST.ITEM_TYPES.ATTACK_POTION; }
    
    gameState.inventory.push(itemType);
    
    if (typeof window.gameLog === 'function') {
      window.gameLog(`✅ 清图奖励：恢复 ${healHp} HP / ${healMp} MP + 获得 ${itemName}`, 'info');
    }
    
    updateStatusBar();
    draw();
  }
}
window.checkFloorClear = checkFloorClear;

// ========== 地图生成（含清图重置）==========
function generateNewFloor(floor) {
  if (typeof window.resetBossState === 'function') window.resetBossState();
  if (typeof window.resetBoss2State === 'function') window.resetBoss2State();
  
  gameState.floorCleared = false; // 重置清图状态
  
  gameState.map = Array(CONST.MAP_HEIGHT).fill().map(() => Array(CONST.MAP_WIDTH).fill(0));
  
  // 边界墙
  for (let y = 0; y < CONST.MAP_HEIGHT; y++) {
    for (let x = 0; x < CONST.MAP_WIDTH; x++) {
      if (x === 0 || y === 0 || x === CONST.MAP_WIDTH - 1 || y === CONST.MAP_HEIGHT - 1) {
        gameState.map[y][x] = 1;
      }
    }
  }
  
  // 随机障碍
  for (let i = 0; i < 10; i++) {
    let x = Math.floor(Math.random() * (CONST.MAP_WIDTH - 2)) + 1;
    let y = Math.floor(Math.random() * (CONST.MAP_HEIGHT - 2)) + 1;
    if (!(x === 1 && y === 1)) {
      gameState.map[y][x] = 1;
    }
  }
  
  const mapLevel = Math.floor((floor - 1) / 10) + 1;
  gameState.enemies = [];
  const isBossFloor = floor % 10 === 0;

  if (isBossFloor) {
    if (floor === 10) {
      // Boss血量翻倍
      const bossHp = Math.floor(40 * Math.pow(2.0, mapLevel - 1));
      const bossAttack = Math.floor(8 * Math.pow(1.6, mapLevel - 1));
      for (let tries = 0; tries < 100; tries++) {
        let x = Math.floor(Math.random() * (CONST.MAP_WIDTH - 2)) + 1;
        let y = Math.floor(Math.random() * (CONST.MAP_HEIGHT - 2)) + 1;
        if (gameState.map[y][x] === 0 && !(x === 1 && y === 1)) {
          gameState.enemies.push({ x, y, hp: bossHp, maxHp: bossHp, attack: bossAttack, isBoss: true, name: 'Boss' });
          break;
        }
      }
    } else if (floor === 20) {
      const bossHp = Math.floor(80 * Math.pow(1.8, mapLevel - 1));
      for (let tries = 0; tries < 100; tries++) {
        let x = Math.floor(Math.random() * (CONST.MAP_WIDTH - 2)) + 1;
        let y = Math.floor(Math.random() * (CONST.MAP_HEIGHT - 2)) + 1;
        if (gameState.map[y][x] === 0 && !(x === 1 && y === 1)) {
          gameState.enemies.push({
            x, y, hp: bossHp, maxHp: bossHp, attack: 0, isBoss: true,
            bossType: 'lord_of_cinder', name: '薪王们的化身'
          });
          break;
        }
      }
    }
  } else {
    // 小怪难度提升
    let enemyCount = 2 + Math.floor(floor / 3) + Math.floor(mapLevel * 1.2);
    for (let i = 0; i < enemyCount; i++) {
      let placed = false;
      for (let tries = 0; tries < 100; tries++) {
        let x = Math.floor(Math.random() * (CONST.MAP_WIDTH - 2)) + 1;
        let y = Math.floor(Math.random() * (CONST.MAP_HEIGHT - 2)) + 1;
        if (gameState.map[y][x] === 0 && !(x === 1 && y === 1) &&
            !gameState.enemies.some(e => e.x === x && e.y === y)) {
          const baseHp = Math.floor(5 * Math.pow(1.7, mapLevel - 1)) + Math.floor(mapLevel);
          const baseAttack = Math.floor(2 * Math.pow(1.5, mapLevel - 1)) + Math.floor(mapLevel / 2);
          const hp = baseHp + Math.floor(Math.random() * 4);
          const attack = baseAttack + Math.floor(Math.random() * 3);
          gameState.enemies.push({ x, y, hp, attack });
          placed = true;
          break;
        }
      }
      if (!placed) console.log("无法放置第 ", i, "个敌人");
    }
  }
  
  // 生成道具
  gameState.items = [];
  let itemCount = 3 + Math.floor(floor / 2);
  for (let i = 0; i < itemCount; i++) {
    let placed = false;
    for (let tries = 0; tries < 100; tries++) {
      let x = Math.floor(Math.random() * (CONST.MAP_WIDTH - 2)) + 1;
      let y = Math.floor(Math.random() * (CONST.MAP_HEIGHT - 2)) + 1;
      if (gameState.map[y][x] === 0 && !(x === 1 && y === 1) &&
          !gameState.enemies.some(e => e.x === x && e.y === y) &&
          !gameState.items.some(it => it.x === x && it.y === y)) {
        const types = [
          CONST.ITEM_TYPES.HEALTH_POTION,
          CONST.ITEM_TYPES.MANA_POTION,
          CONST.ITEM_TYPES.ATTACK_POTION,
          CONST.ITEM_TYPES.BOMB,
          CONST.ITEM_TYPES.ARROW_QUIVER
        ];
        const type = types[Math.floor(Math.random() * types.length)];
        gameState.items.push({ x, y, type });
        placed = true;
        break;
      }
    }
    if (!placed) console.log("无法放置第 ", i, "个道具");
  }
}

// ========== 【重写】渲染系统（图片优先 + 容错回退）==========
function draw() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 绘制地图（墙壁/地板）
  for (let y = 0; y < CONST.MAP_HEIGHT; y++) {
    for (let x = 0; x < CONST.MAP_WIDTH; x++) {
      const tile = gameState.map[y][x];
      const posX = x * CONST.TILE_SIZE;
      const posY = y * CONST.TILE_SIZE;
      
      if (tile === 1) {
        if (imageAssets.wall) {
          ctx.drawImage(imageAssets.wall, posX, posY, CONST.TILE_SIZE, CONST.TILE_SIZE);
        } else {
          ctx.fillStyle = '#666';
          ctx.fillRect(posX, posY, CONST.TILE_SIZE - 1, CONST.TILE_SIZE - 1);
        }
      } else {
        if (imageAssets.floor) {
          ctx.drawImage(imageAssets.floor, posX, posY, CONST.TILE_SIZE, CONST.TILE_SIZE);
        } else {
          ctx.fillStyle = '#222';
          ctx.fillRect(posX, posY, CONST.TILE_SIZE - 1, CONST.TILE_SIZE - 1);
        }
      }
      ctx.strokeStyle = '#333';
      ctx.strokeRect(posX, posY, CONST.TILE_SIZE, CONST.TILE_SIZE);
    }
  }
  
  // 绘制道具
  gameState.items.forEach(item => {
    const posX = item.x * CONST.TILE_SIZE;
    const posY = item.y * CONST.TILE_SIZE;
    let imgKey = '';
    switch (item.type) {
      case CONST.ITEM_TYPES.HEALTH_POTION: imgKey = 'health_potion'; break;
      case CONST.ITEM_TYPES.MANA_POTION: imgKey = 'mana_potion'; break;
      case CONST.ITEM_TYPES.ATTACK_POTION: imgKey = 'attack_potion'; break;
      case CONST.ITEM_TYPES.BOMB: imgKey = 'bomb'; break;
      case CONST.ITEM_TYPES.ARROW_QUIVER: imgKey = 'arrow_quiver'; break;
    }
    
    if (imageAssets[imgKey]) {
      ctx.drawImage(imageAssets[imgKey], posX + 2, posY + 2, CONST.TILE_SIZE - 4, CONST.TILE_SIZE - 4);
    } else {
      // 容错：使用原色块
      let color = '#fff';
      switch (item.type) {
        case CONST.ITEM_TYPES.HEALTH_POTION: color = '#f0f'; break;
        case CONST.ITEM_TYPES.MANA_POTION: color = '#0ff'; break;
        case CONST.ITEM_TYPES.ATTACK_POTION: color = '#ff0'; break;
        case CONST.ITEM_TYPES.BOMB: color = '#f80'; break;
        case CONST.ITEM_TYPES.ARROW_QUIVER: color = '#8b4513'; break;
      }
      ctx.fillStyle = color;
      ctx.fillRect(posX + 5, posY + 5, CONST.TILE_SIZE - 10, CONST.TILE_SIZE - 10);
    }
  });
  
  // 绘制玩家
  const playerX = gameState.player.x * CONST.TILE_SIZE;
  const playerY = gameState.player.y * CONST.TILE_SIZE;
  if (imageAssets.player) {
    ctx.drawImage(imageAssets.player, playerX, playerY, CONST.TILE_SIZE, CONST.TILE_SIZE);
  } else {
    ctx.fillStyle = '#0f0';
    ctx.fillRect(playerX, playerY, CONST.TILE_SIZE - 1, CONST.TILE_SIZE - 1);
  }
  
  // 绘制敌人
gameState.enemies.forEach(enemy => {
  const enemyX = enemy.x * CONST.TILE_SIZE;
  const enemyY = enemy.y * CONST.TILE_SIZE;
  let img = null;
  
  // ✅ 关键修改：区分 Boss1 和 Boss2
  if (enemy.isBoss) {
    if (enemy.bossType === 'lord_of_cinder') {
      img = imageAssets.boss2 || imageAssets.boss; // 优先用boss2，不存在则回退
    } else {
      img = imageAssets.boss;
    }
  } else {
    img = imageAssets.enemy;
  }
  
  if (img) {
    ctx.drawImage(img, enemyX, enemyY, CONST.TILE_SIZE, CONST.TILE_SIZE);
  } else {
    // 容错：无图片时用色块
    ctx.fillStyle = enemy.isBoss ? '#f0f' : '#f00';
    ctx.fillRect(enemyX, enemyY, CONST.TILE_SIZE - 1, CONST.TILE_SIZE - 1);
  }
  
  // 血量文字（保持不变）
  ctx.fillStyle = '#fff';
  ctx.font = '12px monospace';
  ctx.fillText(enemy.hp, enemyX + 5, enemyY + 15);
});
  
  // 绘制预警区域
  const warning = (window.bossState?.warningActive ? window.bossState.warning : null) ||
                  (window.boss2State?.warningActive ? window.boss2State.warning : null);
  if (warning) {
    if (imageAssets.warning) {
      warning.forEach(pos => {
        ctx.drawImage(
          imageAssets.warning,
          pos.x * CONST.TILE_SIZE + 2,
          pos.y * CONST.TILE_SIZE + 2,
          CONST.TILE_SIZE - 4,
          CONST.TILE_SIZE - 4
        );
      });
    } else {
      ctx.fillStyle = '#f00';
      ctx.font = 'bold 20px monospace';
      warning.forEach(pos => {
        ctx.fillText('危', pos.x * CONST.TILE_SIZE + 8, pos.y * CONST.TILE_SIZE + 25);
      });
    }
  }
  
  // UI信息
  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  ctx.fillText(`HP: ${gameState.player.hp} Floor: ${gameState.floor}`, 10, 20);
  
  // 面向箭头
  const fx = gameState.player.x * CONST.TILE_SIZE + CONST.TILE_SIZE/2;
  const fy = gameState.player.y * CONST.TILE_SIZE + CONST.TILE_SIZE/2;
  ctx.strokeStyle = '#ff0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(fx, fy);
  ctx.lineTo(fx + gameState.player.facing.x * 20, fy + gameState.player.facing.y * 20);
  ctx.stroke();
  
  // 地图等级 & Boss提示
  const mapLevel = Math.floor((gameState.floor - 1) / 10) + 1;
  ctx.fillText(`地图等级: ${mapLevel}`, 10, 40);
  if (gameState.floor % 10 === 0) {
    ctx.fillStyle = '#f0f';
    ctx.fillText('BOSS FLOOR!', 10, 60);
  }
  
  // Boss炫酷文字
  if (window.bossMessage && window.bossMessage.timer > 0) {
    ctx.save();
    ctx.font = 'bold 32px "Cinzel", serif';
    ctx.fillStyle = '#ffaa00';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 20;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(window.bossMessage.text, canvas.width/2, canvas.height/2);
    ctx.restore();
    window.bossMessage.timer--;
  }
}

// ========== UI状态更新 ==========
function updateStatusBar() {
  document.getElementById('hpValue').textContent = gameState.player.hp;
  document.getElementById('mpValue').textContent = gameState.player.mp;
  document.getElementById('levelValue').textContent = gameState.player.level;
  document.getElementById('expValue').textContent = gameState.player.exp;
  document.getElementById('expNextValue').textContent = gameState.player.expToNext;
  
  const buffList = document.getElementById('buffList');
  if (buffList) {
    buffList.innerHTML = gameState.player.buffs.map(b => `<li>${b.type} (${b.duration})</li>`).join('');
  }
  
  const equipmentList = document.getElementById('equipmentList');
  if (gameState.weapons.length === 0) {
    equipmentList.innerHTML = '<li>无武器</li>';
  } else {
    let weaponsHtml = '';
    gameState.weapons.forEach((w, idx) => {
      const isCurrent = idx === gameState.currentWeaponIndex ? '▶ ' : '  ';
      const totalAttack = w.attack + (gameState.player.baseAttack || 0);
      let weaponText = `${isCurrent}${w.name} (武器 ${w.attack}`;
      if (gameState.player.baseAttack > 0) {
        weaponText += ` + 基础 ${gameState.player.baseAttack}`;
      }
      weaponText += ` = 总 ${totalAttack})`;
      if (w.type === CONST.WEAPON_TYPES.BOW && w.ammo !== undefined) {
        weaponText += ` 箭矢: ${w.ammo}`;
        if (w.effect) weaponText += ` [${w.effect}]`;
      }
      weaponsHtml += `<li>${weaponText}</li>`;
    });
    equipmentList.innerHTML = weaponsHtml;
  }
  
  const spellList = document.getElementById('spellList');
  spellList.innerHTML = gameState.spells.length ? gameState.spells.map(s => `<li>${s.name}</li>`).join('') : '<li>无</li>';
  
  const inventoryList = document.getElementById('inventoryList');
  if (gameState.inventory.length === 0) {
    inventoryList.innerHTML = '<li>空</li>';
  } else {
    inventoryList.innerHTML = gameState.inventory.map(itemType => `<li>${getItemName(itemType)}</li>`).join('');
  }
}

// ========== 游戏结束检查 ==========
function checkGameOver() {
  if (window.cheats.godMode) {
    if (gameState.player.hp <= 0) {
      gameState.player.hp = 1;
      updateStatusBar();
    }
    return;
  }
  if (gameState.player.hp <= 0) {
    alert(`游戏结束！你到达了第 ${gameState.floor} 层`);
  }
}

// ========== 初始装备选择 ==========
function showStartModal() {
  const modal = document.getElementById('startModal');
  const optionsDiv = document.getElementById('startOptions');
  if (!modal || !optionsDiv) {
    console.error('初始选择模态框元素缺失');
    return;
  }
  optionsDiv.innerHTML = '';
  
  const loadouts = window.startingLoadouts || [];
  if (loadouts.length === 0) {
    console.error('未找到初始流派配置');
    optionsDiv.innerHTML = '<p style="color: red">错误：流派配置加载失败</p>';
    modal.style.display = 'block';
    return;
  }

  loadouts.forEach((loadout) => {
    const btn = document.createElement('button');
    btn.style.cssText = 'background: #555; color: white; border: 2px solid #888; border-radius: 5px; padding: 10px; font-size: 16px; cursor: pointer; margin: 5px; width: 100%; text-align: left;';
    btn.innerHTML = `<strong>${loadout.name}</strong><br><small>${loadout.description}</small>`;
    btn.onclick = () => {
      applyStartingLoadout(loadout);
      modal.style.display = 'none';
      draw();
      updateStatusBar();
    };
    optionsDiv.appendChild(btn);
  });
  
  modal.style.display = 'block';
}

// ========== 初始装备应用（含天赋绑定）==========
function applyStartingLoadout(loadout) {
  game.weapons = [];
  game.inventory = [];
  game.spells = [];
  
  loadout.weapons.forEach(item => {
    if (item.isItem) {
      game.inventory.push(item.type);
    } else {
      game.weapons.push(item);
    }
  });
  
  if (loadout.items) {
    loadout.items.forEach(itemType => game.inventory.push(itemType));
  }
  
  if (loadout.spells) {
    loadout.spells.forEach(spellName => {
      const spell = spellsDB.find(s => s.name.includes(spellName.split(' ')[0]));
      if (spell) game.spells.push(spell);
    });
  }
  
  game.currentWeaponIndex = 0;
  if (game.weapons.length === 0) {
    game.weapons.push({ type: CONST.WEAPON_TYPES.SWORD, name: '短剑', attack: 2, description: '默认武器' });
  }
  
  // 绑定流派天赋
  if (loadout.talents && Array.isArray(loadout.talents)) {
    loadout.talents.forEach(talentName => {
      if (typeof window.talents?.add === 'function') {
        window.talents.add(talentName);
        if (typeof window.gameLog === 'function') {
          window.gameLog(`✨ 获得流派天赋：${talentName}`, 'info');
        }
      }
    });
  }
}

// ========== 游戏初始化（等待图片加载）==========
function initGame() {
  preloadImages(); // 先加载图片
  
  const originalInit = () => {
    generateNewFloor(1);
    if (typeof initTalents === 'function') initTalents();
    showStartModal();
  };
  
  if (imagesLoaded) {
    originalInit();
  } else {
    // 等待图片加载完成
    const checkLoad = setInterval(() => {
      if (imagesLoaded) {
        clearInterval(checkLoad);
        originalInit();
      }
    }, 100);
  }
}

// ========== 日志折叠 ==========
function initLogToggle() {
  const header = document.getElementById('logHeader');
  const content = document.getElementById('logContent');
  const toggle = document.getElementById('logToggle');
  if (!header || !content || !toggle) return;
  header.addEventListener('click', () => {
    if (content.style.display === 'none') {
      content.style.display = 'block';
      toggle.textContent = '▲';
    } else {
      content.style.display = 'none';
      toggle.textContent = '▼';
    }
  });
}

// ========== 全局暴露 ==========
window.bossMessage = { text: '', timer: 0 };
window.draw = draw;
window.updateStatusBar = updateStatusBar;
window.checkGameOver = checkGameOver;
window.generateNewFloor = generateNewFloor;
window.initGame = initGame;

// 页面加载完成
window.addEventListener('load', () => {
  initLogToggle();
});