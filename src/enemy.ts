import Phaser from 'phaser';
import { ExtendedSprite } from './types';
import { gameStore } from './store';
import { getPlayer } from './player';

/**
 * Enemy module - handles enemy spawning, movement and collision
 */

let enemies: Phaser.Physics.Arcade.Group | null = null;
let spawnTimer: Phaser.Time.TimerEvent | null = null;
let gameSpeedRef: () => number;
let gameOverRef: () => boolean;
let endGameRef: () => void;
let flashRedRef: (sprite: Phaser.Physics.Arcade.Sprite) => void;

/**
 * Initialize enemies physics group
 * @param scene - Phaser scene
 * @returns enemies group
 */
export function initEnemies(scene: Phaser.Scene): Phaser.Physics.Arcade.Group {
  enemies = scene.physics.add.group();
  return enemies;
}

/**
 * Set reference functions for enemy module
 * @param speed - function returning current game speed
 * @param over - function returning if game over
 * @param endGame - function to end the game
 * @param flashRed - function to flash sprite red
 */
export function setEnemyRefs(
  speed: () => number,
  over: () => boolean,
  endGame: () => void,
  flashRed: (sprite: Phaser.Physics.Arcade.Sprite) => void
): void {
  gameSpeedRef = speed;
  gameOverRef = over;
  endGameRef = endGame;
  flashRedRef = flashRed;
}

/**
 * Get enemies group
 */
export function getEnemies(): Phaser.Physics.Arcade.Group | null {
  return enemies;
}

/**
 * Get spawn timer
 */
export function getSpawnTimer(): Phaser.Time.TimerEvent | null {
  return spawnTimer;
}

/**
 * Start enemy spawning - spawn first enemy
 * @param scene - Phaser scene
 */
export function startEnemySpawning(scene: Phaser.Scene): void {
  spawnFirstEnemy(scene);
}

/**
 * Spawn the first enemy (stationary until tutorial)
 */
function spawnFirstEnemy(scene: Phaser.Scene): void {
  if (!enemies) return;

  const enemyTexture = scene.textures.exists('enemy_run_sheet') ? 'enemy_run_sheet' : 'enemy';
  const enemy = enemies.create(950, 355, enemyTexture) as ExtendedSprite;

  const body = enemy.body as Phaser.Physics.Arcade.Body;
  body.setAllowGravity(false);
  enemy.setVelocityX(0);
  enemy.setVelocityY(0);

  if (scene.textures.exists('enemy_run_sheet')) {
    enemy.setDisplaySize(120, 120);
    enemy.setFlipX(true);
    body.setSize(60, 90);
    body.setOffset(40, 35);

    if (scene.anims.exists('enemy_run')) {
      enemy.play('enemy_run');
    }
  } else {
    body.setSize(40, 75);
  }

  enemy.setDepth(2);
  enemy.isFirstEnemy = true;
}

/**
 * Start the enemy spawn timer (after tutorial)
 * @param scene - Phaser scene
 */
export function startEnemyTimer(scene: Phaser.Scene): void {
  spawnTimer = scene.time.addEvent({
    delay: 3000,
    callback: () => spawnEnemy(scene),
    loop: true
  });
}

/**
 * Spawn a new enemy
 */
function spawnEnemy(scene: Phaser.Scene): void {
  const playerSprite = getPlayer();
  if (!playerSprite || !enemies) return;
  if (playerSprite.x > 5500) return;

  const enemyTexture = scene.textures.exists('enemy_run_sheet') ? 'enemy_run_sheet' : 'enemy';
  const enemy = enemies.create(playerSprite.x + 800, 355, enemyTexture);

  const body = enemy.body as Phaser.Physics.Arcade.Body;
  body.setAllowGravity(false);
  enemy.setVelocityX(0);
  enemy.setVelocityY(0);

  if (scene.textures.exists('enemy_run_sheet')) {
    enemy.setDisplaySize(120, 120);
    enemy.setFlipX(true);
    body.setSize(60, 90);
    body.setOffset(40, 35);

    if (scene.anims.exists('enemy_run')) {
      enemy.play('enemy_run');
    }
  } else {
    body.setSize(40, 75);
  }

  enemy.setDepth(2);
}

/**
 * Update enemies position (move towards player)
 */
export function updateEnemies(): void {
  const playerSprite = getPlayer();
  if (!playerSprite || !enemies) return;

  const speed = gameSpeedRef();

  enemies.children.entries.forEach((enemy) => {
    const e = enemy as Phaser.Physics.Arcade.Sprite;
    e.x -= speed / 100;

    if (e.x < playerSprite.x - 400) {
      e.destroy();
    }
  });
}

/**
 * Handle player-enemy collision
 * @param playerSprite - player sprite
 * @param enemy - enemy sprite
 */
export function hitEnemy(
  playerSprite: Phaser.Physics.Arcade.Sprite,
  enemy: Phaser.Physics.Arcade.Sprite
): void {
  if (gameOverRef()) return;

  const isGameOver = gameStore.loseLife();
  const scene = playerSprite.scene;

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

  enemy.destroy();

  if (isGameOver) {
    setTimeout(() => endGameRef(), 500);
  }
}
