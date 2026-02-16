// 移动端按钮事件绑定
document.addEventListener('DOMContentLoaded', () => {
    // 方向键
    document.getElementById('btn-up').addEventListener('click', () => simulateKey('ArrowUp'));
    document.getElementById('btn-down').addEventListener('click', () => simulateKey('ArrowDown'));
    document.getElementById('btn-left').addEventListener('click', () => simulateKey('ArrowLeft'));
    document.getElementById('btn-right').addEventListener('click', () => simulateKey('ArrowRight'));

    // 攻击（空格）
    document.getElementById('btn-attack').addEventListener('click', () => simulateKey('Space'));

    // 切换武器（F键）
    document.getElementById('btn-switch').addEventListener('click', () => simulateKey('f'));

    // 下楼（Shift + . 组合键）
    document.getElementById('btn-downfloor').addEventListener('click', () => {
        // 模拟 Shift + >  (即 . 键)
        const event = new KeyboardEvent('keydown', {
            key: '>',
            code: 'Period',
            shiftKey: true,
            bubbles: true
        });
        document.dispatchEvent(event);
    });

    // 法术按钮 Q W E R T
    document.getElementById('btn-spell-q').addEventListener('click', () => simulateKey('q'));
    document.getElementById('btn-spell-w').addEventListener('click', () => simulateKey('w'));
    document.getElementById('btn-spell-e').addEventListener('click', () => simulateKey('e'));
    document.getElementById('btn-spell-r').addEventListener('click', () => simulateKey('r'));
    document.getElementById('btn-spell-t').addEventListener('click', () => simulateKey('t'));

    // 物品栏 1 2 3 4
    document.getElementById('btn-item1').addEventListener('click', () => simulateKey('1'));
    document.getElementById('btn-item2').addEventListener('click', () => simulateKey('2'));
    document.getElementById('btn-item3').addEventListener('click', () => simulateKey('3'));
    document.getElementById('btn-item4').addEventListener('click', () => simulateKey('4'));

    // 辅助函数：模拟键盘事件
    function simulateKey(key) {
        // 如果游戏正在动画或玩家眩晕，直接忽略
        if (window.isAnimating || game.player.stunned) return;

        // 根据 key 创建事件并分发
        let event;
        if (key === 'Space') {
            event = new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true });
        } else {
            event = new KeyboardEvent('keydown', { key: key, bubbles: true });
        }
        document.dispatchEvent(event);
    }
});
