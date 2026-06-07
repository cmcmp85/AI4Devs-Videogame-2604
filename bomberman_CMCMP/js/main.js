const GAME_WIDTH = GameScene.MAP_COLS * GameScene.TILE_SIZE;
const GAME_HEIGHT = GameScene.MAP_ROWS * GameScene.TILE_SIZE;

const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene, UIScene]
};

const game = new Phaser.Game(config);
