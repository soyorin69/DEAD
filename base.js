// base.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
window.ctx = ctx;

window.game = {
    map: [],
    player: {
        x: 1, y: 1,
    hp: 10, mp: 10,
    maxHp: 10, maxMp: 10,
    baseAttack: 1,
    critChance: 0.1,        // 基础暴击率 10%
    critMultiplier: 1.2,    // 暴击倍率 1.2倍
    facing: { x: 1, y: 0 },
    level: 1,
    exp: 0,
    expToNext: 10,
    stunned: false,
    hasBloodDemon: false
        ,stunned: false,
        hasBloodDemon: false // 血魔状态标记
    },
    enemies: [],
    items: [],
    inventory: [],
    spells: ['火球术'],
    floor: 1,
    weapons: [],
    currentWeaponIndex: 0,
    summon: null // 当前召唤物（残忍之杖使用）
};
function generateNewFloor(floor) {
    if (typeof window.resetBossState === 'function') {
    window.resetBossState();
}
    // 重置地图
    game.map = Array(CONST.MAP_HEIGHT).fill().map(() => Array(CONST.MAP_WIDTH).fill(0));
    // 四周墙壁
    for (let y = 0; y < CONST.MAP_HEIGHT; y++) {
        for (let x = 0; x < CONST.MAP_WIDTH; x++) {
            if (x === 0 || y === 0 || x === CONST.MAP_WIDTH - 1 || y === CONST.MAP_HEIGHT - 1) {
                game.map[y][x] = 1;
            }
        }
    }
    // 随机内部墙壁
    for (let i = 0; i < 10; i++) {
        let x = Math.floor(Math.random() * (CONST.MAP_WIDTH - 2)) + 1;
        let y = Math.floor(Math.random() * (CONST.MAP_HEIGHT - 2)) + 1;
        if (!(x === 1 && y === 1)) {
            game.map[y][x] = 1;
        }
    }

    // 计算地图等级
    const mapLevel = Math.floor((floor - 1) / 10) + 1;

   // 生成敌人
game.enemies = [];
const isBossFloor = floor % 10 === 0;

if (isBossFloor) {
    // Boss层
    const bossHp = Math.floor(20 * Math.pow(1.8, mapLevel - 1));
    const bossAttack = Math.floor(5 * Math.pow(1.4, mapLevel - 1));
    // 寻找空地放置Boss
    for (let tries = 0; tries < 100; tries++) {
        let x = Math.floor(Math.random() * (CONST.MAP_WIDTH - 2)) + 1;
        let y = Math.floor(Math.random() * (CONST.MAP_HEIGHT - 2)) + 1;
        if (game.map[y][x] === 0 && !(x === 1 && y === 1)) {
            game.enemies.push({ 
                x, y, 
                hp: bossHp, 
                attack: bossAttack,
                isBoss: true,
                name: 'Boss'
            });
            break;
        }
    }
} else {
    // 普通层
    let enemyCount = 3 + Math.floor(floor / 2) + Math.floor(mapLevel * 1.5);
    for (let i = 0; i < enemyCount; i++) {
        let placed = false;
        for (let tries = 0; tries < 100; tries++) {
            let x = Math.floor(Math.random() * (CONST.MAP_WIDTH - 2)) + 1;
            let y = Math.floor(Math.random() * (CONST.MAP_HEIGHT - 2)) + 1;
            if (game.map[y][x] === 0 && !(x === 1 && y === 1) &&
                !game.enemies.some(e => e.x === x && e.y === y)) {
                
                // 基础属性指数增长
                const baseHp = Math.floor(3 * Math.pow(1.5, mapLevel - 1)) + Math.floor(mapLevel / 2) * 2;
                const baseAttack = Math.floor(1 * Math.pow(1.3, mapLevel - 1)) + Math.floor(mapLevel / 2);
                
                // 随机波动
                const hp = baseHp + Math.floor(Math.random() * 3);
                const attack = baseAttack + Math.floor(Math.random() * 2);
                
                game.enemies.push({ x, y, hp, attack });
                placed = true;
                break;
            }
        }
        if (!placed) console.log("无法放置第", i, "个敌人");
    }
}

    // 生成道具（道具也可能随地图等级变化，暂不实现）
    game.items = [];
    let itemCount = 3 + Math.floor(floor / 2);
    for (let i = 0; i < itemCount; i++) {
        let placed = false;
        for (let tries = 0; tries < 100; tries++) {
            let x = Math.floor(Math.random() * (CONST.MAP_WIDTH - 2)) + 1;
            let y = Math.floor(Math.random() * (CONST.MAP_HEIGHT - 2)) + 1;
            if (game.map[y][x] === 0 && !(x === 1 && y === 1) &&
                !game.enemies.some(e => e.x === x && e.y === y) &&
                !game.items.some(it => it.x === x && it.y === y)) {
                const types = [
                    CONST.ITEM_TYPES.HEALTH_POTION,
                    CONST.ITEM_TYPES.MANA_POTION,
                    CONST.ITEM_TYPES.ATTACK_POTION,
                    CONST.ITEM_TYPES.BOMB,
                    CONST.ITEM_TYPES.ARROW_QUIVER
                ];
                const type = types[Math.floor(Math.random() * types.length)];
                game.items.push({ x, y, type });
                placed = true;
                break;
            }
        }
        if (!placed) console.log("无法放置第", i, "个道具");
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 绘制地图
    for (let y = 0; y < CONST.MAP_HEIGHT; y++) {
        for (let x = 0; x < CONST.MAP_WIDTH; x++) {
            let tile = game.map[y][x];
            ctx.fillStyle = tile === 1 ? '#666' : '#222';
            ctx.fillRect(x * CONST.TILE_SIZE, y * CONST.TILE_SIZE, CONST.TILE_SIZE - 1, CONST.TILE_SIZE - 1);
            ctx.strokeStyle = '#333';
            ctx.strokeRect(x * CONST.TILE_SIZE, y * CONST.TILE_SIZE, CONST.TILE_SIZE, CONST.TILE_SIZE);
        }
    }
    // 绘制道具
    game.items.forEach(item => {
        let color;
        switch (item.type) {
            case CONST.ITEM_TYPES.HEALTH_POTION: color = '#f0f'; break;
            case CONST.ITEM_TYPES.MANA_POTION: color = '#0ff'; break;
            case CONST.ITEM_TYPES.ATTACK_POTION: color = '#ff0'; break;
            case CONST.ITEM_TYPES.BOMB: color = '#f80'; break;
            case CONST.ITEM_TYPES.ARROW_QUIVER: color = '#8b4513'; break;
            default: color = '#fff';
        }
        ctx.fillStyle = color;
        ctx.fillRect(item.x * CONST.TILE_SIZE + 5, item.y * CONST.TILE_SIZE + 5,
                     CONST.TILE_SIZE - 10, CONST.TILE_SIZE - 10);
    });
    // 绘制玩家
    ctx.fillStyle = '#0f0';
    ctx.fillRect(game.player.x * CONST.TILE_SIZE, game.player.y * CONST.TILE_SIZE, CONST.TILE_SIZE - 1, CONST.TILE_SIZE - 1);
    // 绘制敌人
   game.enemies.forEach(enemy => {
    if (enemy.isBoss) {
        ctx.fillStyle = '#f0f'; // 紫色表示Boss
    } else {
        ctx.fillStyle = '#f00';
    }
    ctx.fillRect(enemy.x * CONST.TILE_SIZE, enemy.y * CONST.TILE_SIZE, CONST.TILE_SIZE - 1, CONST.TILE_SIZE - 1);
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.fillText(enemy.hp, enemy.x * CONST.TILE_SIZE + 5, enemy.y * CONST.TILE_SIZE + 15);
});
    // 显示玩家血量和楼层
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`HP: ${game.player.hp}  Floor: ${game.floor}`, 10, 20);
    // 面向方向箭头
    const fx = game.player.x * CONST.TILE_SIZE + CONST.TILE_SIZE/2;
    const fy = game.player.y * CONST.TILE_SIZE + CONST.TILE_SIZE/2;
    ctx.strokeStyle = '#ff0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + game.player.facing.x * 20, fy + game.player.facing.y * 20);
    ctx.stroke();
    // 显示地图等级
const mapLevel = Math.floor((game.floor - 1) / 10) + 1;
ctx.fillStyle = '#fff';
ctx.font = '14px monospace';
ctx.fillText(`地图等级: ${mapLevel}`, 10, 40);
if (game.floor % 10 === 0) {
    ctx.fillStyle = '#f0f';
    ctx.fillText('BOSS FLOOR!', 10, 60);
}
if (window.bossState && window.bossState.warningActive && window.bossState.warning) {
    ctx.fillStyle = '#f00';
    ctx.font = 'bold 20px monospace';
    window.bossState.warning.forEach(pos => {
        ctx.fillText('危', pos.x * CONST.TILE_SIZE + 8, pos.y * CONST.TILE_SIZE + 25);
    });
}
}

function updateStatusBar() {
    document.getElementById('hpValue').textContent = game.player.hp;
    document.getElementById('mpValue').textContent = game.player.mp;
    document.getElementById('levelValue').textContent = game.player.level;
    document.getElementById('expValue').textContent = game.player.exp;
    document.getElementById('expNextValue').textContent = game.player.expToNext;

    const equipmentList = document.getElementById('equipmentList');
    if (game.weapons.length === 0) {
        equipmentList.innerHTML = '<li>无武器</li>';
    } else {
        let weaponsHtml = '';
        game.weapons.forEach((w, idx) => {
            const isCurrent = idx === game.currentWeaponIndex ? '▶ ' : '  ';
            const totalAttack = w.attack + (game.player.baseAttack || 0);
            let weaponText = `${isCurrent}${w.name} (武器 ${w.attack}`;
            if (game.player.baseAttack > 0) {
                weaponText += ` + 基础 ${game.player.baseAttack}`;
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
    spellList.innerHTML = game.spells.length ? game.spells.map(s => `<li>${s}</li>`).join('') : '<li>无</li>';

    const inventoryList = document.getElementById('inventoryList');
    if (game.inventory.length === 0) {
        inventoryList.innerHTML = '<li>空</li>';
    } else {
        inventoryList.innerHTML = game.inventory.map(itemType => `<li>${getItemName(itemType)}</li>`).join('');
    }
}

function checkGameOver() {
    if (game.player.hp <= 0) {
        alert(`游戏结束！你到达了第 ${game.floor} 层`);
    }
}

function initGame() {
    generateNewFloor(1);
    game.weapons = getInitialWeapons();
    game.currentWeaponIndex = 0;
    draw();
    updateStatusBar();
}

window.draw = draw;
window.updateStatusBar = updateStatusBar;
window.checkGameOver = checkGameOver;
window.generateNewFloor = generateNewFloor;

initGame();