// player.js
// 获取当前武器的暴击率加成
function getCritBonus(weapon) {
    return weapon?.critBonus || 0;
}

// 计算最终伤害（是否暴击）
function applyCritDamage(baseDamage, weapon) {
    const totalCritChance = game.player.critChance + getCritBonus(weapon);
    const isCrit = Math.random() < totalCritChance;
    const damage = isCrit ? Math.floor(baseDamage * game.player.critMultiplier) : baseDamage;
    if (isCrit) console.log('暴击！');
    return damage;
}
// 辅助函数：获取直线上的所有敌人（用于穿透箭）
function getAllRangedTargets() {
    const dir = game.player.facing;
    let x = game.player.x + dir.x;
    let y = game.player.y + dir.y;
    const targets = [];
    while (x >= 0 && x < CONST.MAP_WIDTH && y >= 0 && y < CONST.MAP_HEIGHT) {
        if (game.map[y][x] === 1) break;
        const enemy = game.enemies.find(e => e.x === x && e.y === y);
        if (enemy) targets.push(enemy);
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
        const enemy = game.enemies.find(e => e.x === x && e.y === y);
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

// 升级
function levelUp() {
    game.player.level++;
    game.player.maxHp += 10;
    game.player.maxMp += 10;
    game.player.hp = game.player.maxHp;
    game.player.mp = game.player.maxMp;
    game.player.exp -= game.player.expToNext;
    game.player.expToNext = Math.floor(game.player.expToNext * 1.5);

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
    }
    return used;
}

// 下楼
function goToNextFloor() {
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

// 火球术
function castFireball() {
    function castFireball() {
    const currentWeapon = game.weapons[game.currentWeaponIndex]; // 新增
    // ... 原有代码
}
    if (!game.spells.includes('火球术')) {
        console.log('你不会火球术！');
        return false;
    }
    if (game.player.mp < 5) {
        console.log('MP不足！');
        return false;
    }

    const dir = game.player.facing;
    let x = game.player.x + dir.x;
    let y = game.player.y + dir.y;
    let hitEnemy = null;

    while (x >= 0 && x < CONST.MAP_WIDTH && y >= 0 && y < CONST.MAP_HEIGHT) {
        if (game.map[y][x] === 1) break;
        const enemy = game.enemies.find(e => e.x === x && e.y === y);
        if (enemy) {
            enemy.hp -= 3;
            hitEnemy = enemy;
            break;
        }
        x += dir.x;
        y += dir.y;
    }

    if (hitEnemy) {
          const baseDamage = 3; // 火球基础伤害
    const damage = applyCritDamage(baseDamage, currentWeapon); // 使用当前武器（可能是法杖）
    hitEnemy.hp -= damage;
        game.player.mp -= 5;
        console.log('火球术击中敌人！');
        if (hitEnemy.hp <= 0) {
            game.enemies = game.enemies.filter(e => e !== hitEnemy);
            gainExp(hitEnemy.isBoss ? 20 : 5);
        }
        draw();
        updateStatusBar();
        enemiesTurn();
        draw();
        updateStatusBar();
        checkGameOver();
        return true;
    } else {
        console.log('火球术未击中任何目标');
        return false;
    }
}

// 玩家攻击
// 玩家攻击
function playerAttack() {
    const currentWeapon = game.weapons[game.currentWeaponIndex];
    if (!currentWeapon) return;

    let attackSuccess = false;

   if (currentWeapon.type === CONST.WEAPON_TYPES.BOW) {
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
                const damage = applyCritDamage(baseAttack, currentWeapon);
                enemy.hp -= damage;
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
            damage = applyCritDamage(damage, currentWeapon);
            target.hp -= damage;
            currentWeapon.ammo -= 1;
            if (target.hp <= 0) {
                game.enemies = game.enemies.filter(e => e !== target);
                gainExp(target.isBoss ? 20 : 5);
            }
            console.log(`射箭！击中敌人，造成 ${damage} 伤害，剩余箭矢: ${currentWeapon.ammo}`);
            attackSuccess = true;
        }
    }
}
    else {
        // 近战（包括痛苦双刀和残忍之杖）
        const dir = game.player.facing;
        const targetX = game.player.x + dir.x;
        const targetY = game.player.y + dir.y;
        const enemy = game.enemies.find(e => e.x === targetX && e.y === targetY);
        if (enemy) {
            const baseDamage = currentWeapon.attack + (game.player.baseAttack || 0);
            let totalDamage = 0;

            if (currentWeapon.doubleStrike) {
                // 痛苦双刀：两段攻击
                for (let i = 0; i < 2; i++) {
                    const damage = applyCritDamage(baseDamage, currentWeapon);
                    totalDamage += damage;
                    if (damage === baseDamage && currentWeapon.selfDamage > 0) {
                        // 未暴击的段扣血
                        game.player.hp = Math.max(1, game.player.hp - currentWeapon.selfDamage);
                        console.log('痛苦双刀反噬，扣2血');
                    }
                }
            } else {
                totalDamage = applyCritDamage(baseDamage, currentWeapon);
            }

            enemy.hp -= totalDamage;
            if (enemy.hp <= 0) {
                // 残忍之杖召唤
                if (currentWeapon.summonOnKill && !game.summon) {
                    summonMinion(enemy);
                }
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
    }
}
// 移除敌人（统一处理）
function removeEnemy(enemy) {
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
    if (!game.spells.some(s => s.name === '血魔藤蔓')) {
        game.spells.push({ name: '血魔藤蔓', key: 'e', cost: 3, cast: window.castBloodVine });
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

// 血魔藤蔓法术
function castBloodVine() {
    if (!game.spells.includes('血魔藤蔓')) {
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
                removeEnemy(enemy);
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
// 召唤小鬼（残忍之杖）
function summonMinion(killedEnemy) {
    const dirs = [[0,1],[1,0],[0,-1],[-1,0]];
    for (let d of dirs) {
        let nx = killedEnemy.x + d[0];
        let ny = killedEnemy.y + d[1];
        if (nx >= 0 && nx < CONST.MAP_WIDTH && ny >= 0 && ny < CONST.MAP_HEIGHT &&
            game.map[ny][nx] === 0 && !game.enemies.some(e => e.x === nx && e.y === ny)) {
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



// 键盘事件
document.addEventListener('keydown', (e) => {
    if (game.player.stunned) {
    console.log('玩家被眩晕，本回合无法行动');
    game.player.stunned = false;
    e.preventDefault();
    return;
}

    if (window.isAnimating) {
        e.preventDefault();
        return;
    }

    // 下楼键
    if (e.key === '>' || (e.code === 'Period' && e.shiftKey)) {
        e.preventDefault();
        goToNextFloor();
        return;
    }

    // 数字键 1-4 使用背包物品
    if (e.key >= '1' && e.key <= '4') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        useInventoryItem(index);
        return;
    }

// 在键盘事件中，替换原来的 Q/E 分支
const key = e.key.toLowerCase();
const spell = game.spells.find(s => s.key === key);
if (spell) {
    e.preventDefault();
    spell.cast();
    return;
}

// F键 切换武器
if (e.key === 'f' || e.key === 'F') {
    e.preventDefault();
    switchWeapon();
    return;
}

// 空格攻击
if (e.code === 'Space') {
    e.preventDefault();
    playerAttack();
    return;
}
    // 方向键移动
    if (!e.key.startsWith('Arrow')) return;
    e.preventDefault();

    let dx = 0, dy = 0;
    switch (e.key) {
        case 'ArrowUp':    dy = -1; break;
        case 'ArrowDown':  dy = 1; break;
        case 'ArrowLeft':  dx = -1; break;
        case 'ArrowRight': dx = 1; break;
    }

    game.player.facing = { x: dx, y: dy };

    let newX = game.player.x + dx;
    let newY = game.player.y + dy;

    if (newY >= 0 && newY < CONST.MAP_HEIGHT && newX >= 0 && newX < CONST.MAP_WIDTH) {
        if (game.map[newY][newX] === 0 && !game.enemies.some(e => e.x === newX && e.y === newY)) {
            game.player.x = newX;
            game.player.y = newY;
            pickupItem();
        }
    }

    enemiesTurn();
    draw();
    updateStatusBar();
    checkGameOver();
  
}
);

window.gainExp = gainExp;
window.removeEnemy = removeEnemy;

window.addEventListener('load', initGame);
window.applyCritDamage = applyCritDamage;
window.getRangedTarget = getRangedTarget;
window.getAllRangedTargets = getAllRangedTargets;
window.removeEnemy = removeEnemy;
window.gainExp = gainExp;

