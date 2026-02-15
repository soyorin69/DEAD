// spells.js
window.isAnimating = false;

// 法术数据库
const spellsDB = [
    { name: '火球术', key: 'q', cost: 5, cast: castFireball },
    { name: '血魔藤蔓', key: 'e', cost: 3, cast: castBloodVine },
    // 预留更多法术，可后续添加
    // { name: '冰霜新星', key: 'w', cost: 4, cast: castFrostNova },
    // { name: '雷电术', key: 'r', cost: 6, cast: castLightning },
    // { name: '治疗术', key: 't', cost: 4, cast: castHeal }
];

// 获取随机未拥有的法术
function getRandomSpell(existingSpells) {
    const available = spellsDB.filter(s => !existingSpells.some(e => e.name === s.name));
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
}

// 火球术动画
function animateFireball(startX, startY, dir, onHit, onComplete) {
    window.isAnimating = true;
    const ctx = window.ctx;
    let x = startX + dir.x;
    let y = startY + dir.y;
    const path = [];
    let hitEnemy = null;

    while (x >= 0 && x < CONST.MAP_WIDTH && y >= 0 && y < CONST.MAP_HEIGHT) {
        if (game.map[y][x] === 1) break;
        const enemy = game.enemies.find(e => e.x === x && e.y === y);
        if (enemy) {
            hitEnemy = enemy;
            path.push({ x, y });
            break;
        }
        path.push({ x, y });
        x += dir.x;
        y += dir.y;
    }

    if (path.length === 0) {
        window.isAnimating = false;
        onComplete(false);
        return;
    }

    let step = 0;
    function drawFrame() {
        draw();
        ctx.save();
        for (let i = 0; i <= step && i < path.length; i++) {
            const p = path[i];
            ctx.beginPath();
            ctx.arc(p.x * CONST.TILE_SIZE + CONST.TILE_SIZE/2,
                    p.y * CONST.TILE_SIZE + CONST.TILE_SIZE/2,
                    8, 0, 2 * Math.PI);
            ctx.fillStyle = '#ff8c00';
            ctx.shadowColor = '#ff4500';
            ctx.shadowBlur = 10;
            ctx.fill();
        }
        ctx.restore();

        if (step < path.length - 1) {
            step++;
            requestAnimationFrame(drawFrame);
        } else {
            if (hitEnemy) {
                hitEnemy.hp -= 3;
                if (hitEnemy.hp <= 0) {
                    if (typeof window.removeEnemy === 'function') {
                        window.removeEnemy(hitEnemy);
                    } else {
                        game.enemies = game.enemies.filter(e => e !== hitEnemy);
                    }
                    if (typeof window.gainExp === 'function') {
                        window.gainExp(hitEnemy.isBoss ? 20 : 5);
                    }
                }
                onHit(hitEnemy);
            }
            window.isAnimating = false;
            onComplete(!!hitEnemy);
        }
    }
    drawFrame();
}

// 火球术
function castFireball() {
    if (window.isAnimating) {
        console.log('动画中，请稍后');
        return false;
    }
    if (!game.spells.some(s => s.name === '火球术')) {
        console.log('你不会火球术！');
        return false;
    }
    if (game.player.mp < 5) {
        console.log('MP不足！');
        return false;
    }

    game.player.mp -= 5;
    updateStatusBar();

    const dir = game.player.facing;
    animateFireball(game.player.x, game.player.y, dir,
        (enemy) => {
            console.log('火球术击中敌人！');
            draw();
            updateStatusBar();
        },
        (hit) => {
            if (!hit) {
                console.log('火球术未击中任何目标');
            }
            enemiesTurn();
            draw();
            updateStatusBar();
            checkGameOver();
        }
    );
    return true;
}

// 血魔藤蔓
function castBloodVine() {
    if (!game.spells.some(s => s.name === '血魔藤蔓')) {
        console.log('你不会血魔藤蔓！');
        return false;
    }
    if (game.player.mp < 3) {
        console.log('MP不足！');
        return false;
    }
    const dir = game.player.facing;
    let x = game.player.x + dir.x;
    let y = game.player.y + dir.y;
    while (x >= 0 && x < CONST.MAP_WIDTH && y >= 0 && y < CONST.MAP_HEIGHT) {
        if (game.map[y][x] === 1) break;
        const enemy = game.enemies.find(e => e.x === x && e.y === y);
        if (enemy) {
            enemy.hp -= 3;
            if (enemy.hp <= 0) {
                if (typeof window.removeEnemy === 'function') {
                    window.removeEnemy(enemy);
                } else {
                    game.enemies = game.enemies.filter(e => e !== enemy);
                }
                if (typeof window.gainExp === 'function') {
                    window.gainExp(enemy.isBoss ? 20 : 5);
                }
            }
            game.player.mp -= 3;
            draw();
            updateStatusBar();
            enemiesTurn();
            draw();
            updateStatusBar();
            checkGameOver();
            return true;
        }
        x += dir.x;
        y += dir.y;
    }
    console.log('血魔藤蔓未击中任何目标');
    return false;
}

// 暴露
window.spellsDB = spellsDB;
window.getRandomSpell = getRandomSpell;
window.castFireball = castFireball;
window.castBloodVine = castBloodVine;
