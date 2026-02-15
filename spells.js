// 动画锁
window.isAnimating = false;

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

function castFireball() {
    if (window.isAnimating) {
        console.log('动画中，请稍后');
        return false;
    }
    if (!game.spells.includes('火球术')) {
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

window.castFireball = castFireball;