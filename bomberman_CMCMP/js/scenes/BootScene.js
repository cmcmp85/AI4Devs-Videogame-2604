class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        this.generateTextures();
        this.scene.start('MenuScene');
    }

    generateTextures() {
        this.createPlayerTexture();
        this.createEnemyTexture();
        this.createWallTexture();
        this.createBrickTexture();
        this.createFloorTexture();
        this.createBombTexture();
        this.createExplosionCenterTexture();
        this.createExplosionHorizontalTexture();
        this.createExplosionVerticalTexture();
        this.createPowerupFireTexture();
        this.createPowerupBombTexture();
    }

    createPlayerTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        g.fillStyle(0x2266cc);
        g.fillRect(0, 0, 16, 16);
        g.fillStyle(0xffffff);
        g.fillRect(4, 3, 3, 3);
        g.fillRect(9, 3, 3, 3);
        g.fillRect(5, 10, 6, 2);

        g.generateTexture('player', 16, 16);
        g.destroy();
    }

    createEnemyTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        g.fillStyle(0xcc2222);
        g.fillRect(0, 0, 16, 16);
        g.fillStyle(0x880000);
        g.fillRect(3, 4, 3, 3);
        g.fillRect(10, 4, 3, 3);
        g.fillRect(5, 11, 6, 2);

        g.generateTexture('enemy', 16, 16);
        g.destroy();
    }

    createWallTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        g.fillStyle(0x3a3a3a);
        g.fillRect(0, 0, 48, 48);
        g.lineStyle(2, 0x555555);
        g.strokeRect(1, 1, 46, 46);
        g.lineStyle(1, 0x222222);
        g.strokeRect(4, 4, 40, 40);

        g.generateTexture('wall', 48, 48);
        g.destroy();
    }

    createBrickTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        g.fillStyle(0x8b4513);
        g.fillRect(0, 0, 48, 48);
        g.lineStyle(1, 0x5c2e0a);

        for (let row = 0; row < 4; row++) {
            const y = row * 12;
            const offset = row % 2 === 0 ? 0 : 12;
            for (let col = -1; col < 3; col++) {
                const x = col * 24 + offset;
                g.strokeRect(x, y, 24, 12);
            }
        }

        g.generateTexture('brick', 48, 48);
        g.destroy();
    }

    createFloorTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        g.fillStyle(0xb0b0b0);
        g.fillRect(0, 0, 48, 48);
        g.fillStyle(0xa5a5a5);
        g.fillRect(0, 0, 24, 24);
        g.fillRect(24, 24, 24, 24);

        g.generateTexture('floor', 48, 48);
        g.destroy();
    }

    createBombTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        g.fillStyle(0x111111);
        g.fillCircle(20, 24, 14);
        g.fillStyle(0x333333);
        g.fillCircle(16, 20, 4);
        g.lineStyle(2, 0xcc6600);
        g.beginPath();
        g.moveTo(20, 10);
        g.lineTo(26, 2);
        g.strokePath();
        g.fillStyle(0xffaa00);
        g.fillCircle(26, 2, 3);

        g.generateTexture('bomb', 40, 40);
        g.destroy();
    }

    createExplosionCenterTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        g.fillStyle(0xff6600);
        g.fillCircle(24, 24, 20);
        g.fillStyle(0xffaa00);
        g.fillCircle(24, 24, 12);
        g.fillStyle(0xffff44);
        g.fillCircle(24, 24, 6);

        g.generateTexture('explosion_center', 48, 48);
        g.destroy();
    }

    createExplosionHorizontalTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        g.fillStyle(0xff6600);
        g.fillEllipse(24, 24, 44, 20);
        g.fillStyle(0xffaa00);
        g.fillEllipse(24, 24, 30, 12);
        g.fillStyle(0xffff44);
        g.fillEllipse(24, 24, 14, 6);

        g.generateTexture('explosion_h', 48, 48);
        g.destroy();
    }

    createExplosionVerticalTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        g.fillStyle(0xff6600);
        g.fillEllipse(24, 24, 20, 44);
        g.fillStyle(0xffaa00);
        g.fillEllipse(24, 24, 12, 30);
        g.fillStyle(0xffff44);
        g.fillEllipse(24, 24, 6, 14);

        g.generateTexture('explosion_v', 48, 48);
        g.destroy();
    }

    createPowerupFireTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        g.fillStyle(0x222222);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0xcc2200);
        g.fillTriangle(16, 4, 8, 26, 24, 26);
        g.fillStyle(0xff4400);
        g.fillTriangle(16, 10, 11, 24, 21, 24);
        g.fillStyle(0xffaa00);
        g.fillTriangle(16, 14, 14, 22, 18, 22);

        g.generateTexture('powerup_fire', 32, 32);
        g.destroy();
    }

    createPowerupBombTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        g.fillStyle(0x222222);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x111111);
        g.fillCircle(16, 18, 9);
        g.fillStyle(0x333333);
        g.fillCircle(13, 15, 2);
        g.lineStyle(2, 0xcc6600);
        g.beginPath();
        g.moveTo(16, 9);
        g.lineTo(20, 3);
        g.strokePath();
        g.fillStyle(0xffaa00);
        g.fillCircle(20, 3, 2);

        g.generateTexture('powerup_bomb', 32, 32);
        g.destroy();
    }
}
