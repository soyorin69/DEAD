function moveEnemy(enemy) {
    const dx = game.player.x - enemy.x;
    const dy = game.player.y - enemy.y;
    let primaryDir, secondaryDir;
    if (Math.abs(dx) > Math.abs(dy)) {
        primaryDir = dx > 0 ? [1, 0] : [-1, 0];
        secondaryDir = dy > 0 ? [0, 1] : [0, -1];
    } else {
        primaryDir = dy > 0 ? [0, 1] : [0, -1];
        secondaryDir = dx > 0 ? [1, 0] : [-1, 0];
    }
    const directions = [primaryDir, secondaryDir];
    let occupied = new Set(game.enemies.map(e => `${e.x},${e.y}`));
    occupied.add(`${game.player.x},${game.player.y}`);
    for (let [dx, dy] of directions) {
        let newX = enemy.x + dx;
        let newY = enemy.y + dy;
        if (newX >= 0 && newX < CONST.MAP_WIDTH && newY >= 0 && newY < CONST.MAP_HEIGHT &&
            game.map[newY][newX] === 0 && !occupied.has(`${newX},${newY}`)) {
            enemy.x = newX;
            enemy.y = newY;
            occupied.add(`${newX},${newY}`);
            return true;
        }
    }
    return false;
}
function enemiesTurn() {
    let enemiesCopy = [...game.enemies];
    for (let enemy of enemiesCopy) {
        if (enemy.isBoss) {
            if (typeof window.bossTurn === 'function') {
                window.bossTurn(enemy);
            }
        } else {
            const dx = Math.abs(enemy.x - game.player.x);
            const dy = Math.abs(enemy.y - game.player.y);
            if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
                game.player.hp -= enemy.attack || 1;
                console.log('ATK! 敌人攻击玩家');
                updateStatusBar();
                if (game.player.hp <= 0) {
                    checkGameOver();
                    return;
                }
            } else {
                moveEnemy(enemy);
            }
        }
    }
}