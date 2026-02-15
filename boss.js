// boss.js
window.bossState = {
    warning: null,        // 预警路径坐标数组
    warningActive: false  // 是否正在预警
};

// 处理Boss回合
function bossTurn(boss) {
    if (bossState.warningActive) {
        executeBloodVine(boss);
        bossState.warningActive = false;
        bossState.warning = null;
        return;
    }

    const skill = Math.floor(Math.random() * 4) + 1; // 1-4
    switch (skill) {
        case 1: summonMinions(boss); break;
        case 2: terrifyingScream(boss); break;
        case 3: prepareBloodVine(boss); break;
        case 4: bloodDrain(boss); break;
    }
}

// 技能1：召唤小怪
function summonMinions(boss) {
    console.log('Boss使用召唤小怪');
    let summoned = 0;
    const dirs = [[0,1],[1,0],[0,-1],[-1,0]];
    for (let i = 0; i < 2; i++) {
        for (let d of dirs) {
            let nx = boss.x + d[0];
            let ny = boss.y + d[1];
            if (nx >= 0 && nx < CONST.MAP_WIDTH && ny >= 0 && ny < CONST.MAP_HEIGHT &&
                game.map[ny][nx] === 0 && !game.enemies.some(e => e.x === nx && e.y === ny)) {
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
    console.log(`召唤了 ${summoned} 个小怪`);
}

// 技能2：恐怖尖叫
function terrifyingScream(boss) {
    console.log('Boss使用恐怖尖叫');
    const range = 2; // 圆形范围（曼哈顿距离≤2）
    const dx = Math.abs(game.player.x - boss.x);
    const dy = Math.abs(game.player.y - boss.y);
    if (dx <= range && dy <= range) {
        game.player.stunned = true;
        console.log('玩家被眩晕，下回合无法行动');
    }
}

// 技能3：血色藤蔓（预警）
function prepareBloodVine(boss) {
    console.log('Boss准备血色藤蔓，下一回合施放');
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
    bossState.warning = path;
    bossState.warningActive = true;
}

// 执行血色藤蔓
function executeBloodVine(boss) {
    console.log('Boss施放血色藤蔓');
    if (!bossState.warning) return;
    bossState.warning.forEach(pos => {
        if (game.player.x === pos.x && game.player.y === pos.y) {
            game.player.hp -= 5;
            console.log('玩家被藤蔓击中');
        }
    });
}

// 技能4：吸血
function bloodDrain(boss) {
    console.log('Boss尝试吸血');
    if (boss.hp >= game.player.hp) return;
    const dx = Math.abs(boss.x - game.player.x);
    const dy = Math.abs(boss.y - game.player.y);
    if (dx + dy !== 1) return;
    const toBossX = boss.x - game.player.x;
    const toBossY = boss.y - game.player.y;
    if (game.player.facing.x === toBossX && game.player.facing.y === toBossY) {
        return; // 面对Boss，不能吸血
    }
    const drain = Math.ceil(game.player.hp / 2);
    game.player.hp -= drain;
    boss.hp += drain;
    console.log(`吸血！玩家损失${drain}，Boss恢复${drain}`);
}

// 重置Boss状态（新楼层时）
function resetBossState() {
    bossState = { warning: null, warningActive: false };
}

window.bossTurn = bossTurn;
window.resetBossState = resetBossState;