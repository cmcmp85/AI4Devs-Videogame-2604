class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        this.starting = false;

        const width = GameScene.MAP_COLS * GameScene.TILE_SIZE;
        const height = GameScene.MAP_ROWS * GameScene.TILE_SIZE;
        const centerX = width / 2;
        const centerY = height / 2;

        this.add.rectangle(centerX, centerY, width, height, 0x1a1a2e);

        this.add.text(centerX, centerY - 100, 'BOMBERMAN', {
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '56px',
            fontStyle: 'bold',
            color: '#ff6600',
            stroke: '#ffcc00',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.startText = this.add.text(centerX, centerY + 10, 'Pulsa ENTER para jugar', {
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '22px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(centerX, centerY + 80, [
            'Controles:',
            'Flechas / WASD — Mover',
            'SPACE / X — Colocar bomba'
        ].join('\n'), {
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '16px',
            color: '#aaaaaa',
            align: 'center',
            lineSpacing: 6
        }).setOrigin(0.5);

        this.tweens.add({
            targets: this.startText,
            alpha: 0.3,
            duration: 700,
            yoyo: true,
            repeat: -1
        });

        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

        this.cameras.main.fadeIn(500, 0, 0, 0);

        this.events.once('shutdown', this.cleanup, this);
    }

    cleanup() {
        this.tweens.killAll();
    }

    startGame() {
        if (this.starting) {
            return;
        }

        this.starting = true;
        this.tweens.killAll();

        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('GameScene');
            this.scene.launch('UIScene');
        });
    }

    update() {
        if (this.starting) {
            return;
        }

        if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
            this.startGame();
        }
    }
}
