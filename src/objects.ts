import Phaser from 'phaser';
import { ExtendedSprite, CoinZone } from './types';
import { gameStore } from './store';

/**
 * Objects module - handles coins and obstacles (cones)
 */

let obstacles: Phaser.Physics.Arcade.Group | null = null;
let coins: Phaser.Physics.Arcade.Group | null = null;
let coinTimer: Phaser.Time.TimerEvent | null = null;

let gameOverRef: () => boolean;
let endGameRef: () => void;
let flashRedRef: (sprite: Phaser.Physics.Arcade.Sprite) => void;

/** Coin spawn zones configuration */
const COIN_ZONES: CoinZone[] = [
  { startX: 600, count: 5 },
  { startX: 1800, count: 5 },
  { startX: 3200, count: 5 },
  { startX: 4800, count: 5 }
];

/** Cone obstacle positions */
const CONE_POSITIONS = [2500, 4000];

/**
 * Initialize obstacles and coins physics groups
 * @param scene - Phaser scene
 * @returns object with obstacles and coins groups
 */
export function initObjects(scene: Phaser.Scene): {
  obstacles: Phaser.Physics.Arcade.Group;
  coins: Phaser.Physics.Arcade.Group;
} {
  obstacles = scene.physics.add.group();
  coins = scene.physics.add.group();
  return { obstacles, coins };
}

/**
 * Set reference functions for objects module
 * @param over - function returning if game over
 * @param endGame - function to end the game
 * @param flashRed - function to flash sprite red
 */
export function setObjectRefs(
  over: () => boolean,
  endGame: () => void,
  flashRed: (sprite: Phaser.Physics.Arcade.Sprite) => void
): void {
  gameOverRef = over;
  endGameRef = endGame;
  flashRedRef = flashRed;
}

/**
 * Get obstacles group
 */
export function getObstacles(): Phaser.Physics.Arcade.Group | null {
  return obstacles;
}

/**
 * Get coins group
 */
export function getCoins(): Phaser.Physics.Arcade.Group | null {
  return coins;
}

/**
 * Get coin timer
 */
export function getCoinTimer(): Phaser.Time.TimerEvent | null {
  return coinTimer;
}

/**
 * Spawn all coins and obstacles at game start
 * @param scene - Phaser scene
 */
export function startCoinSpawning(scene: Phaser.Scene): void {
  if (!coins || !obstacles) return;

  const yLevels = [340, 280, 200, 280, 340];

  // Spawn coins in zones
  COIN_ZONES.forEach((zone) => {
    for (let i = 0; i < zone.count; i++) {
      const x = zone.startX + i * 100;
      const y = yLevels[i % yLevels.length];

      const useAltTexture = Math.random() > 0.5;
      let moneyTexture = 'money';
      if (useAltTexture && scene.textures.exists('money2')) {
        moneyTexture = 'money2';
      }

      const coin = coins?.create(x, y, moneyTexture);
      const body = coin.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      coin.setVelocityX(0);
      coin.setVelocityY(0);

      if (scene.textures.exists(moneyTexture)) {
        coin.setScale(0.1);
        body.setSize(coin.width * 0.8, coin.height * 0.8);
      } else {
        body.setSize(35, 18);
      }

      coin.setDepth(2);
    }
  });

  // Spawn cone obstacles
  CONE_POSITIONS.forEach((x) => {
    const obstacle = obstacles?.create(x, 360, 'cone') as ExtendedSprite;
    const body = obstacle.body as Phaser.Physics.Arcade.Body;

    body.setAllowGravity(false);
    obstacle.setVelocityX(0);
    obstacle.setVelocityY(0);

    if (scene.textures.exists('cone')) {
      obstacle.setDisplaySize(70, 70);
      body.setSize(45, 55);
      body.setOffset(12, 8);
    } else {
      body.setSize(30, 45);
    }

    obstacle.setDepth(2);
    obstacle.hitProcessed = false;
  });
}

/**
 * Update objects (currently objects stay in place)
 */
export function updateObjects(): void {
  // Objects stay in place - camera follows player
}

/**
 * Handle player-obstacle collision
 * @param playerSprite - player sprite
 * @param obstacle - obstacle sprite
 */
export function hitObstacle(
  playerSprite: Phaser.Physics.Arcade.Sprite,
  obstacle: ExtendedSprite
): void {
  if (gameOverRef()) return;
  if (obstacle.hitProcessed) return;

  obstacle.hitProcessed = true;

  const isGameOver = gameStore.loseLife();
  const scene = playerSprite.scene;

  obstacle.setTint(0xff0000);

  if (playerSprite.anims && scene.anims.exists('player_hit')) {
    playerSprite.setTint(0xff0000);
    playerSprite.play('player_hit');
    playerSprite.once('animationcomplete', () => {
      playerSprite.clearTint();
      if (!gameOverRef()) {
        playerSprite.play('player_run');
      }
    });
  } else {
    flashRedRef(playerSprite);
  }

  setTimeout(() => {
    if (obstacle && obstacle.active) {
      obstacle.destroy();
    }
  }, 200);

  if (isGameOver) {
    setTimeout(() => endGameRef(), 500);
  }
}

/**
 * Handle player-coin collision (collect coin with animation)
 * @param playerSprite - player sprite
 * @param coin - coin sprite
 */
export function collectCoin(
  playerSprite: Phaser.Physics.Arcade.Sprite,
  coin: Phaser.Physics.Arcade.Sprite
): void {
  const body = coin.body as Phaser.Physics.Arcade.Body;
  body.enable = false;

  const scene = playerSprite.scene;
  const camera = scene.cameras.main;
  const targetX = camera.scrollX + 750;
  const targetY = 50;

  scene.tweens.add({
    targets: coin,
    x: targetX,
    y: targetY,
    angle: 720,
    scale: 0.05,
    duration: 600,
    ease: 'Power2',
    onComplete: () => {
      gameStore.addCoins(10);
      coin.destroy();
    }
  });
}
