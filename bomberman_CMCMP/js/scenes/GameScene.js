class GameScene extends Phaser.Scene {
    static MAP_COLS = 15;
    static MAP_ROWS = 13;
    static TILE_SIZE = 48;
    static PLAYER_SPEED = 150;
    static GRID_ALIGN_SPEED = 240;
    static BOMB_FUSE_MS = 3000;
    static EXPLOSION_DURATION_MS = 600;
    static ENEMY_KILL_POINTS = 100;
    static ENEMY_COUNT = 3;
    static ENEMY_SPEED = 80;
    static ENEMY_MIN_SPAWN_DISTANCE = 5;
    static POWERUP_CHANCE = 0.2;
    static MAX_BOMB_RANGE = 6;
    static MAX_BOMBS = 8;
    static SUDDEN_DEATH_SECONDS = 180;
    static PLAYER_INVULNERABILITY_MS = 2000;
    static CAMERA_SHAKE_DURATION = 120;
    static CAMERA_SHAKE_INTENSITY = 0.006;

    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        this.score = 0;
        this.isGameOver = false;
        this.isVictory = false;
        this.playerInvincible = false;
        this.suddenDeathTriggered = false;
        this.enemySpeedMultiplier = 1;
        this.bombMap = new Map();
        this.activeBombs = 0;

        const { MAP_COLS, MAP_ROWS, TILE_SIZE } = GameScene;

        this.physics.world.setBounds(0, 0, MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE);

        this.map = this.generateMap(MAP_COLS, MAP_ROWS);
        this.buildMap(this.map, MAP_COLS, MAP_ROWS, TILE_SIZE);
        this.explosions = this.physics.add.group();
        this.powerUps = this.physics.add.staticGroup();
        this.createPlayer();
        this.createEnemies();
        this.setupExplosionCollisions();
        this.setupPowerUpCollisions();
        this.setupInput();

        this.emitScoreChanged();
        this.emitLivesChanged();

        this.cameras.main.fadeIn(500, 0, 0, 0);
        this.events.once('shutdown', this.cleanup, this);
    }

    cleanup() {
        this.bombMap.forEach((bomb) => {
            if (bomb.timer) {
                bomb.timer.remove(false);
            }

            if (bomb.sprite && bomb.sprite.active) {
                bomb.sprite.destroy();
            }
        });
        this.bombMap.clear();

        if (this.enemies) {
            this.enemies.getChildren().forEach((enemy) => {
                if (enemy.directionTimer) {
                    enemy.directionTimer.remove(false);
                }
            });
            this.enemies.clear(true, true);
        }

        this.stopPlayerInvulnerabilityEffects();

        if (this.explosions) {
            this.explosions.clear(true, true);
        }

        if (this.powerUps) {
            this.powerUps.clear(true, true);
        }

        if (this.walls) {
            this.walls.clear(true, true);
        }

        if (this.bricks) {
            this.bricks.clear(true, true);
        }

        this.tweens.killAll();
    }

    emitScoreChanged() {
        this.events.emit('score-changed', this.score);
    }

    emitLivesChanged() {
        this.events.emit('lives-changed', this.player.lives);
    }

    getEnemySpeed() {
        return GameScene.ENEMY_SPEED * this.enemySpeedMultiplier;
    }

    triggerSuddenDeath() {
        if (this.suddenDeathTriggered || this.isGameOver || this.isVictory) {
            return;
        }

        this.suddenDeathTriggered = true;
        this.enemySpeedMultiplier = 2;
        this.removeAllBricks();
    }

    removeAllBricks() {
        this.bricks.getChildren().slice().forEach((brick) => {
            const col = brick.getData('col');
            const row = brick.getData('row');

            if (col !== undefined && row !== undefined) {
                this.map[row][col] = 'floor';
            }

            brick.destroy();
        });
    }

    setupExplosionCollisions() {
        this.physics.add.overlap(
            this.player,
            this.explosions,
            this.handleExplosionPlayerHit,
            null,
            this
        );

        this.physics.add.overlap(
            this.enemies,
            this.explosions,
            this.handleExplosionEnemyHit,
            null,
            this
        );
    }

    setupPowerUpCollisions() {
        this.physics.add.overlap(
            this.player,
            this.powerUps,
            this.handlePowerUpPickup,
            null,
            this
        );
    }

    createPlayer() {
        const { TILE_SIZE } = GameScene;
        const startCol = 1;
        const startRow = 1;

        this.player = this.physics.add.sprite(
            startCol * TILE_SIZE + TILE_SIZE / 2,
            startRow * TILE_SIZE + TILE_SIZE / 2,
            'player'
        );

        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(14, 14);
        this.player.body.setOffset(1, 1);
        this.player.setDepth(10);

        this.player.maxBombs = 1;
        this.player.bombRange = 2;
        this.player.lives = 3;

        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.player, this.bricks);
    }

    createEnemies() {
        const { TILE_SIZE } = GameScene;

        this.enemies = this.physics.add.group();
        const spawnCells = this.getRandomEnemySpawnCells(GameScene.ENEMY_COUNT);

        spawnCells.forEach(({ col, row }) => {
            const { x, y } = this.getCellCenter(col, row);
            const enemy = this.enemies.create(x, y, 'enemy');

            enemy.body.setSize(14, 14);
            enemy.body.setOffset(1, 1);
            enemy.setDepth(10);
            enemy.setCollideWorldBounds(true);

            this.initEnemyBehavior(enemy);
        });

        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.collider(this.enemies, this.bricks);

        this.physics.add.overlap(
            this.player,
            this.enemies,
            this.handlePlayerEnemyCollision,
            null,
            this
        );
    }

    getRandomEnemySpawnCells(count) {
        const playerCol = 1;
        const playerRow = 1;
        let minDistance = GameScene.ENEMY_MIN_SPAWN_DISTANCE;
        let candidates = [];

        while (candidates.length < count && minDistance >= 2) {
            candidates = [];

            for (let row = 0; row < GameScene.MAP_ROWS; row++) {
                for (let col = 0; col < GameScene.MAP_COLS; col++) {
                    if (this.map[row][col] !== 'floor') {
                        continue;
                    }

                    const distance = Math.abs(col - playerCol) + Math.abs(row - playerRow);
                    if (distance >= minDistance) {
                        candidates.push({ col, row });
                    }
                }
            }

            if (candidates.length < count) {
                minDistance -= 1;
            }
        }

        Phaser.Utils.Array.Shuffle(candidates);
        return candidates.slice(0, count);
    }

    initEnemyBehavior(enemy) {
        enemy.setData('moving', false);
        enemy.setData('needsNewDirection', true);
        enemy.setData('targetX', enemy.x);
        enemy.setData('targetY', enemy.y);
        enemy.setData('stuckTime', 0);

        this.scheduleEnemyDirectionChange(enemy);
        this.pickEnemyDirection(enemy);
    }

    scheduleEnemyDirectionChange(enemy) {
        if (enemy.directionTimer) {
            enemy.directionTimer.remove(false);
        }

        const delay = Phaser.Math.Between(1000, 3000);
        enemy.directionTimer = this.time.delayedCall(delay, () => {
            if (!enemy.active || this.isGameOver || this.isVictory) {
                return;
            }

            enemy.setData('needsNewDirection', true);

            if (!enemy.getData('moving')) {
                this.pickEnemyDirection(enemy);
                enemy.setData('needsNewDirection', false);
            }

            this.scheduleEnemyDirectionChange(enemy);
        });
    }

    getEnemyDirections() {
        return Phaser.Utils.Array.Shuffle([
            { dc: 0, dr: -1 },
            { dc: 0, dr: 1 },
            { dc: -1, dr: 0 },
            { dc: 1, dr: 0 }
        ]);
    }

    canEnemyMoveTo(col, row) {
        if (!this.isInBounds(col, row)) {
            return false;
        }

        return this.map[row][col] === 'floor';
    }

    pickEnemyDirection(enemy) {
        const col = this.getGridCol(enemy.x);
        const row = this.getGridRow(enemy.y);
        const center = this.getCellCenter(col, row);

        enemy.x = center.x;
        enemy.y = center.y;
        enemy.body.setVelocity(0);
        enemy.setData('stuckTime', 0);

        for (const { dc, dr } of this.getEnemyDirections()) {
            const nextCol = col + dc;
            const nextRow = row + dr;

            if (!this.canEnemyMoveTo(nextCol, nextRow)) {
                continue;
            }

            const target = this.getCellCenter(nextCol, nextRow);
            enemy.setData('moving', true);
            enemy.setData('targetX', target.x);
            enemy.setData('targetY', target.y);
            return;
        }

        enemy.setData('moving', false);
    }

    updateEnemyMovement(enemy, delta) {
        if (!enemy.getData('moving')) {
            if (enemy.getData('needsNewDirection')) {
                this.pickEnemyDirection(enemy);
                enemy.setData('needsNewDirection', false);
            }
            return;
        }

        const targetX = enemy.getData('targetX');
        const targetY = enemy.getData('targetY');
        const dx = targetX - enemy.x;
        const dy = targetY - enemy.y;
        const distance = Math.hypot(dx, dy);
        const step = this.getEnemySpeed() * (delta / 1000);

        if (distance <= step) {
            enemy.x = targetX;
            enemy.y = targetY;
            enemy.body.setVelocity(0);
            enemy.setData('moving', false);
            enemy.setData('stuckTime', 0);

            if (enemy.getData('needsNewDirection')) {
                this.pickEnemyDirection(enemy);
                enemy.setData('needsNewDirection', false);
            } else {
                this.pickEnemyDirection(enemy);
            }
            return;
        }

        const previousDistance = enemy.getData('lastDistance');
        if (previousDistance !== undefined && distance >= previousDistance - 0.5) {
            enemy.setData('stuckTime', enemy.getData('stuckTime') + delta);
        } else {
            enemy.setData('stuckTime', 0);
        }

        enemy.setData('lastDistance', distance);

        if (enemy.getData('stuckTime') >= 200) {
            enemy.setData('moving', false);
            enemy.setData('stuckTime', 0);
            enemy.body.setVelocity(0);
            this.pickEnemyDirection(enemy);
            return;
        }

        enemy.body.setVelocity((dx / distance) * this.getEnemySpeed(), (dy / distance) * this.getEnemySpeed());
    }

    updateEnemies(delta) {
        this.enemies.getChildren().forEach((enemy) => {
            if (enemy.active) {
                this.updateEnemyMovement(enemy, delta);
            }
        });
    }

    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        this.bombKeys = this.input.keyboard.addKeys({
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            x: Phaser.Input.Keyboard.KeyCodes.X
        });
    }

    generateMap(cols, rows) {
        const map = [];
        const clearCells = this.getSpawnClearCells(cols, rows);

        for (let row = 0; row < rows; row++) {
            map[row] = [];
            for (let col = 0; col < cols; col++) {
                map[row][col] = this.getTileType(row, col, cols, rows, clearCells);
            }
        }

        return map;
    }

    getSpawnClearCells(cols, rows) {
        const cells = [
            [1, 1], [2, 1], [1, 2],
            [cols - 2, 1], [cols - 3, 1], [cols - 2, 2],
            [1, rows - 2], [2, rows - 2], [1, rows - 3],
            [cols - 2, rows - 2], [cols - 3, rows - 2], [cols - 2, rows - 3]
        ];

        return new Set(cells.map(([col, row]) => `${col},${row}`));
    }

    getTileType(row, col, cols, rows, clearCells) {
        const isBorder = row === 0 || row === rows - 1 || col === 0 || col === cols - 1;
        const isPillar = row % 2 === 0 && col % 2 === 0;

        if (isBorder || isPillar) {
            return 'wall';
        }

        if (clearCells.has(`${col},${row}`)) {
            return 'floor';
        }

        return Math.random() < 0.7 ? 'brick' : 'floor';
    }

    buildMap(map, cols, rows, tileSize) {
        this.walls = this.physics.add.staticGroup();
        this.bricks = this.physics.add.staticGroup();

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * tileSize + tileSize / 2;
                const y = row * tileSize + tileSize / 2;

                this.add.image(x, y, 'floor');

                const tile = map[row][col];
                if (tile === 'wall') {
                    const wall = this.walls.create(x, y, 'wall');
                    wall.setData('col', col);
                    wall.setData('row', row);
                    wall.refreshBody();
                } else if (tile === 'brick') {
                    const brick = this.bricks.create(x, y, 'brick');
                    brick.setData('col', col);
                    brick.setData('row', row);
                    brick.refreshBody();
                }
            }
        }
    }

    getGridCol(x) {
        return Math.floor(x / GameScene.TILE_SIZE);
    }

    getGridRow(y) {
        return Math.floor(y / GameScene.TILE_SIZE);
    }

    getTileCenter(value) {
        const half = GameScene.TILE_SIZE / 2;
        return Math.round((value - half) / GameScene.TILE_SIZE) * GameScene.TILE_SIZE + half;
    }

    getCellCenter(col, row) {
        const { TILE_SIZE } = GameScene;
        return {
            x: col * TILE_SIZE + TILE_SIZE / 2,
            y: row * TILE_SIZE + TILE_SIZE / 2
        };
    }

    isInBounds(col, row) {
        return col >= 0 && col < GameScene.MAP_COLS && row >= 0 && row < GameScene.MAP_ROWS;
    }

    tryPlaceBomb() {
        const col = this.getGridCol(this.player.x);
        const row = this.getGridRow(this.player.y);
        const key = `${col},${row}`;

        if (this.bombMap.has(key)) {
            return;
        }

        if (this.activeBombs >= this.player.maxBombs) {
            return;
        }

        this.placeBomb(col, row);
    }

    placeBomb(col, row) {
        const { x, y } = this.getCellCenter(col, row);
        const key = `${col},${row}`;

        const sprite = this.add.sprite(x, y, 'bomb');
        sprite.setDepth(8);

        const bomb = {
            col,
            row,
            range: this.player.bombRange,
            sprite,
            timer: null,
            exploded: false
        };

        bomb.timer = this.time.delayedCall(GameScene.BOMB_FUSE_MS, () => {
            this.explodeBomb(bomb);
        });

        this.bombMap.set(key, bomb);
        this.activeBombs += 1;
    }

    explodeBomb(bomb) {
        if (bomb.exploded || this.isGameOver || this.isVictory) {
            return;
        }

        bomb.exploded = true;

        if (bomb.timer) {
            bomb.timer.remove(false);
            bomb.timer = null;
        }

        this.bombMap.delete(`${bomb.col},${bomb.row}`);

        if (bomb.sprite && bomb.sprite.active) {
            bomb.sprite.destroy();
        }

        this.activeBombs = Math.max(0, this.activeBombs - 1);

        this.cameras.main.shake(
            GameScene.CAMERA_SHAKE_DURATION,
            GameScene.CAMERA_SHAKE_INTENSITY
        );

        this.addExplosionCell(bomb.col, bomb.row, 'explosion_center');
        this.propagateExplosion(bomb.col, bomb.row, bomb.range);
    }

    propagateExplosion(originCol, originRow, range) {
        const directions = [
            { dc: 0, dr: -1, texture: 'explosion_v' },
            { dc: 0, dr: 1, texture: 'explosion_v' },
            { dc: -1, dr: 0, texture: 'explosion_h' },
            { dc: 1, dr: 0, texture: 'explosion_h' }
        ];

        directions.forEach(({ dc, dr, texture }) => {
            for (let step = 1; step <= range; step++) {
                const col = originCol + dc * step;
                const row = originRow + dr * step;

                if (!this.isInBounds(col, row)) {
                    break;
                }

                const tile = this.map[row][col];
                const bombKey = `${col},${row}`;
                const chainedBomb = this.bombMap.get(bombKey);

                if (chainedBomb && !chainedBomb.exploded) {
                    this.addExplosionCell(col, row, texture);
                    this.explodeBomb(chainedBomb);
                    break;
                }

                if (tile === 'wall') {
                    break;
                }

                this.addExplosionCell(col, row, texture);

                if (tile === 'brick') {
                    this.destroyBrick(col, row);
                    break;
                }
            }
        });
    }

    addExplosionCell(col, row, texture) {
        const { x, y } = this.getCellCenter(col, row);
        const explosion = this.explosions.create(x, y, texture);

        explosion.setDepth(9);
        explosion.body.setSize(GameScene.TILE_SIZE - 4, GameScene.TILE_SIZE - 4);
        explosion.body.setOffset(2, 2);
        explosion.setData('col', col);
        explosion.setData('row', row);

        this.time.delayedCall(GameScene.EXPLOSION_DURATION_MS, () => {
            if (explosion.active) {
                explosion.destroy();
            }
        });
    }

    destroyBrick(col, row) {
        if (this.map[row][col] !== 'brick') {
            return;
        }

        this.map[row][col] = 'floor';

        const brick = this.bricks.getChildren().find((sprite) => {
            return sprite.getData('col') === col && sprite.getData('row') === row;
        });

        if (brick) {
            brick.destroy();
        }

        if (Math.random() < GameScene.POWERUP_CHANCE) {
            this.spawnPowerUp(col, row);
        }
    }

    spawnPowerUp(col, row) {
        const { x, y } = this.getCellCenter(col, row);
        const texture = Math.random() < 0.5 ? 'powerup_fire' : 'powerup_bomb';
        const powerUp = this.powerUps.create(x, y, texture);

        powerUp.setDepth(7);
        powerUp.setData('col', col);
        powerUp.setData('row', row);
        powerUp.setData('type', texture);
        powerUp.refreshBody();
    }

    handlePowerUpPickup(player, powerUp) {
        if (!powerUp.active || this.isGameOver || this.isVictory) {
            return;
        }

        const type = powerUp.getData('type');
        powerUp.destroy();
        this.applyPowerUp(type);
    }

    applyPowerUp(type) {
        if (type === 'powerup_fire') {
            if (this.player.bombRange < GameScene.MAX_BOMB_RANGE) {
                this.player.bombRange += 1;
            }
            this.showFloatingPowerUpText('+FUEGO', '#ff4400');
        } else if (type === 'powerup_bomb') {
            if (this.player.maxBombs < GameScene.MAX_BOMBS) {
                this.player.maxBombs += 1;
            }
            this.showFloatingPowerUpText('+BOMBA', '#ffcc00');
        }
    }

    showFloatingPowerUpText(message, color) {
        const text = this.add.text(this.player.x, this.player.y - 20, message, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '18px',
            fontStyle: 'bold',
            color,
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(20);

        this.tweens.add({
            targets: text,
            y: text.y - 32,
            alpha: 0,
            duration: 1000,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                text.destroy();
            }
        });
    }

    killEnemy(enemy) {
        if (!enemy.active) {
            return;
        }

        if (enemy.directionTimer) {
            enemy.directionTimer.remove(false);
            enemy.directionTimer = null;
        }

        enemy.destroy();
        this.score += GameScene.ENEMY_KILL_POINTS;
        this.emitScoreChanged();
        this.checkVictory();
    }

    checkVictory() {
        const aliveEnemies = this.enemies.getChildren().filter((enemy) => enemy.active);

        if (aliveEnemies.length === 0) {
            this.endVictory();
        }
    }

    damagePlayer() {
        if (this.isGameOver || this.playerInvincible) {
            return;
        }

        this.player.lives -= 1;
        this.emitLivesChanged();

        if (this.player.lives <= 0) {
            this.endGameOver();
            return;
        }

        this.startPlayerInvulnerability();
    }

    startPlayerInvulnerability() {
        this.stopPlayerInvulnerabilityEffects();

        this.playerInvincible = true;
        this.player.setAlpha(1);
        this.player.clearTint();

        this.invulnerabilityTween = this.tweens.add({
            targets: this.player,
            alpha: 0.25,
            duration: 100,
            yoyo: true,
            repeat: 9
        });

        this.playerInvincibleTimer = this.time.delayedCall(GameScene.PLAYER_INVULNERABILITY_MS, () => {
            this.playerInvincible = false;
            this.stopPlayerInvulnerabilityEffects();

            if (this.player && this.player.active) {
                this.player.setAlpha(1);
            }
        });
    }

    stopPlayerInvulnerabilityEffects() {
        if (this.invulnerabilityTween) {
            this.invulnerabilityTween.stop();
            this.invulnerabilityTween = null;
        }

        if (this.playerInvincibleTimer) {
            this.playerInvincibleTimer.remove(false);
            this.playerInvincibleTimer = null;
        }
    }

    handleExplosionPlayerHit() {
        this.damagePlayer();
    }

    handleExplosionEnemyHit(enemy) {
        this.killEnemy(enemy);
    }

    alignPlayerToGrid(axis, delta) {
        const step = GameScene.GRID_ALIGN_SPEED * (delta / 1000);
        const prop = axis === 'x' ? 'x' : 'y';
        const target = this.getTileCenter(this.player[prop]);
        const diff = target - this.player[prop];

        if (Math.abs(diff) <= step) {
            this.player[prop] = target;
        } else {
            this.player[prop] += Math.sign(diff) * step;
        }
    }

    isMovingLeft() {
        return this.cursors.left.isDown || this.keys.left.isDown;
    }

    isMovingRight() {
        return this.cursors.right.isDown || this.keys.right.isDown;
    }

    isMovingUp() {
        return this.cursors.up.isDown || this.keys.up.isDown;
    }

    isMovingDown() {
        return this.cursors.down.isDown || this.keys.down.isDown;
    }

    handlePlayerMovement(delta) {
        const speed = GameScene.PLAYER_SPEED;
        const body = this.player.body;

        body.setVelocity(0);

        const moveLeft = this.isMovingLeft();
        const moveRight = this.isMovingRight();
        const moveUp = this.isMovingUp();
        const moveDown = this.isMovingDown();

        if (moveLeft) {
            body.setVelocityX(-speed);
            this.alignPlayerToGrid('y', delta);
        } else if (moveRight) {
            body.setVelocityX(speed);
            this.alignPlayerToGrid('y', delta);
        } else if (moveUp) {
            body.setVelocityY(-speed);
            this.alignPlayerToGrid('x', delta);
        } else if (moveDown) {
            body.setVelocityY(speed);
            this.alignPlayerToGrid('x', delta);
        }
    }

    handlePlayerEnemyCollision() {
        this.damagePlayer();
    }

    handleBombInput() {
        if (Phaser.Input.Keyboard.JustDown(this.bombKeys.space) ||
            Phaser.Input.Keyboard.JustDown(this.bombKeys.x)) {
            this.tryPlaceBomb();
        }
    }

    endGameOver() {
        if (this.isGameOver) {
            return;
        }

        this.isGameOver = true;
        this.playerInvincible = false;
        this.stopPlayerInvulnerabilityEffects();
        this.player.body.setVelocity(0);
        this.physics.pause();
        this.events.emit('game-over', { score: this.score });
    }

    endVictory() {
        if (this.isVictory || this.isGameOver) {
            return;
        }

        this.isVictory = true;
        this.playerInvincible = false;
        this.stopPlayerInvulnerabilityEffects();
        this.player.body.setVelocity(0);
        this.enemies.getChildren().forEach((enemy) => {
            if (enemy.body) {
                enemy.body.setVelocity(0);
            }
        });
        this.physics.pause();
        this.events.emit('victory', { score: this.score });
    }

    update(time, delta) {
        if (this.isGameOver || this.isVictory) {
            return;
        }

        this.handlePlayerMovement(delta);
        this.handleBombInput();
        this.updateEnemies(delta);
    }
}
