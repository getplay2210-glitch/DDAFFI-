// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand(); // На весь экран

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    physics: {
        arcade: { debug: false }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let player, companion, enemies = [];
let cursors;
let hpText, mpText;
let battleMode = false;

// Игрок (Воин)
const playerData = {
    name: 'Артан',
    hp: 100, maxHp: 100,
    mp: 20, maxMp: 20,
    attack: 15, defense: 8
};

// Напарница (Эльфийка)
const companionData = {
    name: 'Лиара',
    hp: 60, maxHp: 60,
    mp: 80, maxMp: 80,
    magic: 18
};

function preload() {
    // Здесь загружаем спрайты
    // this.load.image('player', 'sprites/warrior.png');
    // this.load.image('companion', 'sprites/elf.png');
    // this.load.tilemapTiledJSON('map', 'maps/green_area.json');
}

function create() {
    // Зелёная стартовая локация
    const graphics = this.add.graphics();
    graphics.fillStyle(0x64B464, 1);
    graphics.fillRect(0, 0, config.width, config.height);
    
    // Дорожка
    graphics.fillStyle(0xB4A078, 1);
    graphics.fillRect(0, config.height/2 - 30, config.width, 60);
    
    // Деревья по краям
    graphics.fillStyle(0x286428, 1);
    for (let i = 0; i < 10; i++) {
        graphics.fillCircle(50 + i * 80, 50, 30);
        graphics.fillCircle(50 + i * 80, config.height - 50, 30);
    }
    
    // Игрок
    player = this.add.rectangle(200, config.height/2, 40, 40, 0xC85050);
    companion = this.add.rectangle(250, config.height/2, 40, 40, 0x96DC96);
    
    // Управление
    cursors = this.input.keyboard.createCursorKeys();
    this.input.on('pointerdown', startBattle);
    
    // HUD
    hpText = this.add.text(10, 10, '', { 
        fontSize: '20px', fill: '#fff', fontFamily: 'Arial' 
    });
    mpText = this.add.text(10, 35, '', { 
        fontSize: '20px', fill: '#fff', fontFamily: 'Arial' 
    });
    
    // Вступительный диалог
    showIntroDialog();
    
    updateHUD();
}

function update() {
    if (battleMode) return;
    
    // Движение игрока
    const speed = 3;
    if (cursors.left.isDown) {
        player.x -= speed;
        companion.x -= speed;
    }
    if (cursors.right.isDown) {
        player.x += speed;
        companion.x += speed;
    }
    if (cursors.up.isDown) {
        player.y -= speed;
        companion.y -= speed;
    }
    if (cursors.down.isDown) {
        player.y += speed;
        companion.y += speed;
    }
    
    updateHUD();
}

function updateHUD() {
    hpText.setText(`HP: ${playerData.hp}/${playerData.maxHp}`);
    mpText.setText(`MP: ${playerData.mp}/${playerData.maxMp}`);
}

function showIntroDialog() {
    const dialog = [
        "...",
        "Лиара: Очнись, Артан! Пожалуйста...",
        "Лиара: Я использовала всю свою магию, чтобы вернуть тебя...",
        "Артан: Лиара... что произошло?",
        "Лиара: Нас атаковали огненные демоны...",
        "Лиара: Вперёд! Нас ждут приключения!"
    ];
    
    let index = 0;
    const dialogBox = this.add.rectangle(
        config.width/2, config.height - 100, 
        config.width - 40, 150, 0x000000, 0.8
    );
    const dialogText = this.add.text(30, config.height - 150, dialog[0], {
        fontSize: '22px', fill: '#fff', fontFamily: 'Arial',
        wordWrap: { width: config.width - 80 }
    });
    
    this.input.once('pointerdown', () => {
        const next = () => {
            index++;
            if (index >= dialog.length) {
                dialogBox.destroy();
                dialogText.destroy();
                return;
            }
            dialogText.setText(dialog[index]);
            this.input.once('pointerdown', next);
        };
        next();
    });
}

function startBattle() {
    if (battleMode) return;
    battleMode = true;
    
    // Создаём врагов
    const enemyElements = [
        { name: 'Огненный демон', color: 0xDC5032, element: 'fire' },
        { name: 'Водный элементаль', color: 0x3C78C8, element: 'water' },
        { name: 'Земной голем', color: 0x8C6E46, element: 'earth' },
        { name: 'Святой страж', color: 0xF0F0B4, element: 'holy' }
    ];
    
    const randomEnemy = enemyElements[Math.floor(Math.random() * enemyElements.length)];
    const enemy = this.add.rectangle(
        config.width - 150, config.height/2, 50, 50, randomEnemy.color
    );
    const enemyText = this.add.text(
        config.width - 200, config.height/2 - 50, 
        `${randomEnemy.name}\nHP: 50`, 
        { fontSize: '18px', fill: '#fff', align: 'center' }
    );
    
    // Кнопки действий
    const actions = [
        { text: '⚔️ Атака', action: () => playerAttack(this, enemy, enemyText, randomEnemy) },
        { text: '💫 Тройной удар', action: () => tripleStrike(this, enemy, enemyText, randomEnemy) },
        { text: '⚡ Молния (Лиара)', action: () => lightningStrike(this, enemy, enemyText, randomEnemy) },
        { text: '💚 Лечение (Лиара)', action: () => healAction(this) }
    ];
    
    let btnY = config.height - 200;
    actions.forEach((btn, i) => {
        const button = this.add.rectangle(20 + (i % 2) * 150, btnY + Math.floor(i/2) * 60, 140, 50, 0x444444)
            .setInteractive();
        this.add.text(20 + (i % 2) * 150, btnY + Math.floor(i/2) * 60, btn.text, {
            fontSize: '16px', fill: '#fff'
        }).setOrigin(0.5);
        button.on('pointerdown', btn.action);
    });
}

function playerAttack(scene, enemy, enemyText, enemyData) {
    const damage = playerData.attack + Math.floor(Math.random() * 5);
    playerData.mp = Math.max(0, playerData.mp);
    showBattleLog(scene, `${playerData.name} атакует! -${damage} HP`);
    enemyHP -= damage;
    enemyText.setText(`${enemyData.name}\nHP: ${Math.max(0, enemyHP)}`);
    
    if (enemyHP <= 0) {
        endBattle(scene, enemy, enemyText);
    } else {
        enemyTurn(scene);
    }
}

function tripleStrike(scene, enemy, enemyText, enemyData) {
    if (playerData.mp < 5) {
        showBattleLog(scene, 'Недостаточно маны!');
        return;
    }
    playerData.mp -= 5;
    const damage = Math.floor(playerData.attack * 0.7 * 3);
    showBattleLog(scene, `${playerData.name} ТРОЙНОЙ УДАР! -${damage} HP`);
    enemyHP -= damage;
    enemyText.setText(`${enemyData.name}\nHP: ${Math.max(0, enemyHP)}`);
    
    if (enemyHP <= 0) endBattle(scene, enemy, enemyText);
    else enemyTurn(scene);
}

function lightningStrike(scene, enemy, enemyText, enemyData) {
    if (companionData.mp < 10) {
        showBattleLog(scene, 'Недостаточно маны!');
        return;
    }
    companionData.mp -= 10;
    const damage = companionData.magic + Math.floor(Math.random() * 8);
    showBattleLog(scene, `⚡ ${companionData.name} вызывает МОЛНИЮ! -${damage} HP`);
    enemyHP -= damage;
    enemyText.setText(`${enemyData.name}\nHP: ${Math.max(0, enemyHP)}`);
    
    if (enemyHP <= 0) endBattle(scene, enemy, enemyText);
    else enemyTurn(scene);
}

function healAction(scene) {
    if (companionData.mp < 8) {
        showBattleLog(scene, 'Недостаточно маны!');
        return;
    }
    companionData.mp -= 8;
    const heal = companionData.magic + 10;
    playerData.hp = Math.min(playerData.maxHp, playerData.hp + heal);
    showBattleLog(scene, `💚 ${companionData.name} лечит ${playerData.name} +${heal} HP`);
    updateHUD();
    enemyTurn(scene);
}

function enemyTurn(scene) {
    scene.time.delayedCall(1000, () => {
        const damage = 10 + Math.floor(Math.random() * 5);
        playerData.hp -= damage;
        showBattleLog(scene, `Враг атакует! -${damage} HP`);
        updateHUD();
        
        if (playerData.hp <= 0) {
            // Воскрешение эльфийкой!
            if (companionData.mp >= 30) {
                companionData.mp -= 30;
                playerData.hp = playerData.maxHp / 2;
                showBattleLog(scene, `✨ ${companionData.name} ВОСКРЕШАЕТ ${playerData.name}!`);
                updateHUD();
            } else {
                showBattleLog(scene, 'ПОРАЖЕНИЕ...');
            }
        }
    });
}

let enemyHP = 50;
let battleLogText = null;

function showBattleLog(scene, text) {
    if (battleLogText) battleLogText.destroy();
    battleLogText = scene.add.text(config.width/2, config.height/2, text, {
        fontSize: '24px', fill: '#ffff00', fontFamily: 'Arial', align: 'center'
    }).setOrigin(0.5);
    scene.time.delayedCall(1500, () => {
        if (battleLogText) battleLogText.destroy();
    });
}

function endBattle(scene, enemy, enemyText) {
    enemy.destroy();
    enemyText.destroy();
    showBattleLog(scene, 'ПОБЕДА! +20 опыта');
    scene.time.delayedCall(2000, () => {
        battleMode = false;
        enemyHP = 50;
        scene.scene.restart();
    });
}