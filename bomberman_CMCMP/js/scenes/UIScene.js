class UIScene extends Phaser.Scene {
    static BAR_HEIGHT = 48;
    static SUDDEN_DEATH_SECONDS = 180;

    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        this.score = 0;
        this.lives = 3;
        this.elapsedSeconds = 0;
        this.gameEnded = false;
        this.suddenDeathTriggered = false;
        this.restarting = false;
        this.gameSceneEventsBound = false;

        this.createTopBar();
        this.createEndScreens();
        this.bindGameSceneEvents();
        this.startTimer();

        this.events.once('shutdown', this.cleanup, this);
    }

    getGameWidth() {
        return GameScene.MAP_COLS * GameScene.TILE_SIZE;
    }

    createTopBar() {
        const width = this.getGameWidth();
        const barHeight = UIScene.BAR_HEIGHT;

        this.add.rectangle(width / 2, barHeight / 2, width, barHeight, 0x000000, 0.65)
            .setScrollFactor(0)
            .setDepth(200);

        const textStyle = {
            fontFamily: 'Arial, sans-serif',
            fontSize: '18px',
            color: '#ffffff'
        };

        this.scoreText = this.add.text(16, barHeight / 2, 'SCORE: 0', textStyle)
            .setOrigin(0, 0.5)
            .setScrollFactor(0)
            .setDepth(201);

        this.timeText = this.add.text(width - 16, barHeight / 2, 'TIME: 0:00', textStyle)
            .setOrigin(1, 0.5)
            .setScrollFactor(0)
            .setDepth(201);

        this.livesContainer = this.add.container(width / 2, barHeight / 2)
            .setScrollFactor(0)
            .setDepth(201);

        this.updateLivesIcons(this.lives);
    }

    createEndScreens() {
        const width = this.getGameWidth();
        const height = GameScene.MAP_ROWS * GameScene.TILE_SIZE;
        const centerX = width / 2;
        const centerY = height / 2;

        this.endOverlay = this.add.rectangle(centerX, centerY, width, height, 0x000000, 0.75)
            .setScrollFactor(0)
            .setDepth(300)
            .setVisible(false);

        this.endTitle = this.add.text(centerX, centerY - 60, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '48px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301).setVisible(false);

        this.endScoreText = this.add.text(centerX, centerY, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301).setVisible(false);

        this.restartText = this.add.text(centerX, centerY + 60, 'Pulsa R o ENTER para reiniciar', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '18px',
            color: '#cccccc'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301).setVisible(false);

        this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    }

    bindGameSceneEvents() {
        const gameScene = this.scene.get('GameScene');

        if (!gameScene) {
            return;
        }

        gameScene.events.on('score-changed', this.onScoreChanged, this);
        gameScene.events.on('lives-changed', this.onLivesChanged, this);
        gameScene.events.on('game-over', this.showGameOverScreen, this);
        gameScene.events.on('victory', this.showVictoryScreen, this);
        this.gameSceneEventsBound = true;

        if (gameScene.player) {
            this.onScoreChanged(gameScene.score);
            this.onLivesChanged(gameScene.player.lives);
        }
    }

    unbindGameSceneEvents() {
        const gameScene = this.scene.get('GameScene');

        if (!gameScene || !this.gameSceneEventsBound) {
            return;
        }

        gameScene.events.off('score-changed', this.onScoreChanged, this);
        gameScene.events.off('lives-changed', this.onLivesChanged, this);
        gameScene.events.off('game-over', this.showGameOverScreen, this);
        gameScene.events.off('victory', this.showVictoryScreen, this);
        this.gameSceneEventsBound = false;
    }

    startTimer() {
        if (this.timerEvent) {
            this.timerEvent.remove(false);
        }

        this.timerEvent = this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                if (this.gameEnded) {
                    return;
                }

                this.elapsedSeconds += 1;
                this.updateTimeDisplay();

                if (this.elapsedSeconds >= UIScene.SUDDEN_DEATH_SECONDS && !this.suddenDeathTriggered) {
                    this.triggerSuddenDeath();
                }
            }
        });
    }

    onScoreChanged(score) {
        this.score = score;
        this.scoreText.setText(`SCORE: ${score}`);
    }

    onLivesChanged(lives) {
        this.lives = lives;
        this.updateLivesIcons(lives);
    }

    updateLivesIcons(lives) {
        this.livesContainer.removeAll(true);

        const iconSpacing = 22;
        const totalWidth = Math.max(lives - 1, 0) * iconSpacing;
        const startX = -totalWidth / 2;

        for (let i = 0; i < lives; i++) {
            const icon = this.add.image(startX + i * iconSpacing, 0, 'player');
            icon.setScale(1.2);
            this.livesContainer.add(icon);
        }
    }

    updateTimeDisplay() {
        this.timeText.setText(`TIME: ${this.formatTime(this.elapsedSeconds)}`);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    triggerSuddenDeath() {
        this.suddenDeathTriggered = true;

        const gameScene = this.scene.get('GameScene');
        if (gameScene && gameScene.triggerSuddenDeath) {
            gameScene.triggerSuddenDeath();
        }
    }

    showGameOverScreen(data) {
        this.showEndScreen('GAME OVER', '#ff4444', data.score);
    }

    showVictoryScreen(data) {
        this.showEndScreen('VICTORIA', '#44ff88', data.score);
    }

    showEndScreen(title, color, score) {
        if (this.gameEnded) {
            return;
        }

        this.gameEnded = true;

        this.endTitle.setText(title);
        this.endTitle.setColor(color);
        this.endScoreText.setText(`Puntuación final: ${score}`);

        this.endOverlay.setVisible(true);
        this.endTitle.setVisible(true);
        this.endScoreText.setVisible(true);
        this.restartText.setVisible(true);
    }

    restartGame() {
        if (!this.gameEnded || this.restarting) {
            return;
        }

        this.restarting = true;

        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.performRestart();
        });
    }

    performRestart() {
        this.cleanup();
        this.scene.stop('UIScene');
        this.scene.start('GameScene');
        this.scene.launch('UIScene');
    }

    cleanup() {
        if (this.timerEvent) {
            this.timerEvent.remove(false);
            this.timerEvent = null;
        }

        this.unbindGameSceneEvents();
        this.tweens.killAll();
    }

    update() {
        if (!this.gameEnded || this.restarting) {
            return;
        }

        if (Phaser.Input.Keyboard.JustDown(this.restartKey) ||
            Phaser.Input.Keyboard.JustDown(this.enterKey)) {
            this.restartGame();
        }
    }
}
