// mobile.js
// 为移动端虚拟按钮绑定事件
(function() {
    // 工具函数：防止触摸时页面滚动/缩放
    function attachTouchClick(elementId, handler) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handler();
        });
        el.addEventListener('mousedown', (e) => {
            e.preventDefault();
            handler();
        });
    }

    // 等待游戏初始化完成（确保所有函数可用）
    function waitForGame() {
        if (typeof playerAttack === 'function' && typeof switchWeapon === 'function') {
            initButtons();
        } else {
            setTimeout(waitForGame, 100);
        }
    }

    function initButtons() {
        // 方向键
        attachTouchClick('btn-up', () => {
            simulateKey('ArrowUp');
        });
        attachTouchClick('btn-down', () => {
            simulateKey('ArrowDown');
        });
        attachTouchClick('btn-left', () => {
            simulateKey('ArrowLeft');
        });
        attachTouchClick('btn-right', () => {
            simulateKey('ArrowRight');
        });

        // 攻击
        attachTouchClick('btn-attack', () => {
            simulateKey('Space');
        });

        // 切换武器
        attachTouchClick('btn-switch', () => {
            simulateKey('f');
        });

        // 火球术
        attachTouchClick('btn-fireball', () => {
            simulateKey('q');
        });

        // 血魔藤蔓
        attachTouchClick('btn-vine', () => {
            simulateKey('e');
        });

        // 下楼
        attachTouchClick('btn-downfloor', () => {
            simulateKey('>');
        });

        // 物品1-4
        attachTouchClick('btn-item1', () => {
            simulateKey('1');
        });
        attachTouchClick('btn-item2', () => {
            simulateKey('2');
        });
        attachTouchClick('btn-item3', () => {
            simulateKey('3');
        });
        attachTouchClick('btn-item4', () => {
            simulateKey('4');
        });
    }

    // 模拟键盘事件，触发 player.js 中的监听器
    function simulateKey(key) {
        const event = new KeyboardEvent('keydown', {
            key: key,
            code: key === ' ' ? 'Space' : key,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(event);
    }

    waitForGame();
})();