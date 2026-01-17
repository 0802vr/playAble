import Phaser from 'phaser';

/**
 * Player module - handles player sprite, animations and movement
 */

let player: Phaser.Physics.Arcade.Sprite | null = null;
let gameStartedRef: () => boolean;
let gameOverRef: () => boolean;
let tutorialShownRef: () => boolean;

/**
 * Initialize player sprite with physics and animations
 * @param scene - Phaser scene
 * @returns player sprite
 */
export function initPlayer(scene: Phaser.Scene): Phaser.Physics.Arcade.Sprite {
  player = scene.physics.add.sprite(150, 320, 'player');
  player.setCollideWorldBounds(true);
  player.setDisplaySize(150, 150);

  const body = player.body as Phaser.Physics.Arcade.Body;
  body.setSize(80, 140);
  body.setOffset(88, 50);

  if (scene.anims.exists('player_idle')) {
    player.play('player_idle');
  }

  player.setDepth(2);
  return player;
}

/**
 * Set game state reference functions
 * @param started - function returning if game started
 * @param over - function returning if game over
 * @param tutorial - function returning if tutorial shown
 */
export function setGameRefs(
  started: () => boolean,
  over: () => boolean,
  tutorial: () => boolean
): void {
  gameStartedRef = started;
  gameOverRef = over;
  tutorialShownRef = tutorial;
}

/**
 * Get player sprite
 */
export function getPlayer(): Phaser.Physics.Arcade.Sprite | null {
  return player;
}

/**
 * Update player animation based on ground state
 */
export function updatePlayerAnimation(): void {
  if (!player || !gameStartedRef() || gameOverRef()) return;

  const currentAnim = player.anims.currentAnim;
  if (currentAnim && currentAnim.key === 'player_hit') {
    return;
  }

  const body = player.body as Phaser.Physics.Arcade.Body;
  const onGround = body.blocked.down || body.touching.down;

  if (onGround) {
    if (currentAnim && currentAnim.key !== 'player_run') {
      player.play('player_run', true);
    }
  } else {
    if (currentAnim && currentAnim.key !== 'player_jump') {
      player.play('player_jump', true);
    }
  }
}

/**
 * Make player jump if conditions are met
 */
export function jump(): void {
  if (!player || !player.body) return;

  const body = player.body as Phaser.Physics.Arcade.Body;
  const onGround = body.blocked.down || body.touching.down;

  if (gameStartedRef() && !gameOverRef() && tutorialShownRef() && onGround) {
    player.setVelocityY(-550);
    if (player.anims) {
      player.play('player_jump');
    }
  }
}
