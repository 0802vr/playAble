import Phaser from 'phaser';
import { ExtendedSprite } from './types';
import { gameStore } from './store';
import { initPlayer, setGameRefs, getPlayer, updatePlayerAnimation, jump } from './player';
import {
  initEnemies,
  setEnemyRefs,
  getEnemies,
  getSpawnTimer,
  startEnemySpawning,
  startEnemyTimer,
  updateEnemies,
  hitEnemy
} from './enemy';
import {
  initObjects,
  setObjectRefs,
  getObstacles,
  getCoins,
  getCoinTimer,
  startCoinSpawning,
  updateObjects,
  hitObstacle,
  collectCoin
} from './objects';

/**
 * Main game module - Phaser configuration and game loop
 */

/** X position of finish line */
const FINISH_X = 6000;

// Game state variables
let platforms: Phaser.Physics.Arcade.StaticGroup;
let gameStarted = false;
let gameOver = false;
let gameSpeed = 60;
let startText: Phaser.GameObjects.Text;
let tiledMap: Phaser.Tilemaps.Tilemap;
let grownLayer: Phaser.Tilemaps.TilemapLayer | null;
let forestLayer: Phaser.Tilemaps.TilemapLayer | null;
let finishLine: Phaser.GameObjects.Graphics;
let tutorialShown = false;
let tutorialActive = false;
let tutorialElements: Phaser.GameObjects.GameObject[] = [];
let bgMusic: Phaser.Sound.BaseSound | null = null;

// Extended scene type for custom properties
interface ExtendedScene extends Phaser.Scene {
  handIcon?: Phaser.GameObjects.GameObject;
  tutorialEnemy?: ExtendedSprite;
}

// Set refs for modules
setGameRefs(
  () => gameStarted,
  () => gameOver,
  () => tutorialShown
);

setEnemyRefs(
  () => gameSpeed,
  () => gameOver,
  endGame,
  flashRed
);

setObjectRefs(
  () => gameOver,
  endGame,
  flashRed
);
 
/** Phaser game configuration */
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  disableContextMenu: true,
  /* width: 800,
  height: 600, */
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 1000 },
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  },
  scale: {
    mode: Phaser.Scale.ENVELOP,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    expandParent: true,
    width: 800,
    height: 600,  
    fullscreenTarget: 'game-container',
    
  },
  backgroundColor: '#000000'
};

const game = new Phaser.Game(config);
 



/**
 * Preload game  */
function preload(this: Phaser.Scene): void {
  this.load.tilemapTiledJSON('map', 'map.json');
  this.load.image('background', 'background.png');
  this.load.image('tree', 'tree.png');
  this.load.image('lamp', 'lamp.png');
  this.load.image('tree2', 'tree2.png');

  this.load.spritesheet('player', 'player2_centered.png', {
    frameWidth: 256,
    frameHeight: 256
  });

  this.load.spritesheet('player_run_sheet', 'girl_run.png', {
    frameWidth: 256,
    frameHeight: 256
  });

  this.load.image('cone', 'cone.webp');
  this.load.image('money', 'money.webp');
  this.load.image('money2', 'money_2.png');
  this.load.image('winScreen', 'win.png');
  this.load.image('failScreen', 'fail.png');
  this.load.image('bottomBg', 'bottom-bg.webp');
  this.load.image('cursor', 'cursor.png');
  this.load.image('counter', 'counter.png');

  this.load.audio('bgMusic', 'game-music.mp3');

  this.load.spritesheet('enemy_run_sheet', 'enemy_run.png', {
    frameWidth: 2430 / 9,
    frameHeight: 339
  });
}

/**
 * Create game objects and setup scene
 */
function create(this: ExtendedScene): void {
  const scene = this;
  gameStore.init();

  // Load tilemap
  if (this.cache.tilemap.has('map')) {
    tiledMap = this.make.tilemap({ key: 'map' });

    const backgroundTileset = tiledMap.addTilesetImage('фон', 'background');
    const treeTileset = tiledMap.addTilesetImage('tree', 'tree');
    const lampTileset = tiledMap.addTilesetImage('фонарь', 'lamp');
    const tree2Tileset = tiledMap.addTilesetImage('tree2', 'tree2');

    if (backgroundTileset) {
      grownLayer = tiledMap.createLayer('grown', [backgroundTileset], 0, 0);
    }
    if (treeTileset && lampTileset && tree2Tileset) {
      forestLayer = tiledMap.createLayer('forest', [treeTileset, lampTileset, tree2Tileset], 0, 0);
    }

    if (grownLayer) grownLayer.setDepth(0);
    if (forestLayer) forestLayer.setDepth(1.5);
  }

  // Setup physics world
  this.physics.world.setBounds(-1000, 0, 1000000, 380);
  platforms = this.physics.add.staticGroup();

  // Create player animations
  this.anims.create({
    key: 'player_idle',
    frames: this.anims.generateFrameNumbers('player', { start: 35, end: 41 }),
    frameRate: 8,
    repeat: -1
  });

  this.anims.create({
    key: 'player_run',
    frames: this.anims.generateFrameNumbers('player_run_sheet', { start: 0, end: 8 }),
    frameRate: 12,
    repeat: -1
  });

  this.anims.create({
    key: 'player_jump',
    frames: this.anims.generateFrameNumbers('player', { start: 28, end: 32 }),
    frameRate: 10,
    repeat: 0
  });

  this.anims.create({
    key: 'player_hit',
    frames: this.anims.generateFrameNumbers('player', { start: 21, end: 22 }),
    frameRate: 8,
    repeat: 0
  });

  // Create enemy animation
  this.anims.create({
    key: 'enemy_run',
    frames: this.anims.generateFrameNumbers('enemy_run_sheet', { start: 0, end: 8 }),
    frameRate: 12,
    repeat: -1
  });

  // Initialize game objects
  const playerSprite = initPlayer(this);
  const enemiesGroup = initEnemies(this);
  const { obstacles: obstaclesGroup, coins: coinsGroup } = initObjects(this);

  // Setup collisions
  this.physics.add.collider(playerSprite, platforms);
  this.physics.add.collider(enemiesGroup, platforms);
  this.physics.add.collider(obstaclesGroup, platforms);
  this.physics.add.collider(coinsGroup, platforms);
  this.physics.add.overlap(playerSprite, enemiesGroup, hitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
  this.physics.add.overlap(playerSprite, obstaclesGroup, hitObstacle as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
  this.physics.add.overlap(playerSprite, coinsGroup, collectCoin as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);

  // Setup camera
  this.cameras.main.startFollow(playerSprite, true, 0.1, 0);
  this.cameras.main.setFollowOffset(-80, 0);
  this.cameras.main.setBounds(0, 0, 6400, 600);

  // Create finish line and start screen
  createFinishLine(this);
  createStartScreen(scene);

  // Setup input
  this.input.keyboard?.on('keydown-SPACE', jump, this);
  this.input.keyboard?.on('keydown-UP', jump, this);
  this.input.on('pointerdown', handleClick, this);

  // Set custom cursor
  this.input.setDefaultCursor('url(cursor.png) 16 0, auto');

  // Fade in effect
  this.cameras.main.fadeIn(800, 0, 0, 0);

  this.cameras.main.once('camerafadeincomplete', () => {
    const uiOverlay = document.querySelector('.ui-overlay');
    if (uiOverlay) {
      uiOverlay.classList.add('visible');
    }
  });
}

/**
 * Game update loop
 */
function update(this: ExtendedScene): void {
  if (!gameStarted || gameOver) return;

  const playerSprite = getPlayer();
  const enemiesGroup = getEnemies();

  if (!playerSprite || !enemiesGroup) return;

  // Check for tutorial trigger
  if (!tutorialShown && !tutorialActive) {
    const firstEnemy = enemiesGroup.children.entries.find(
      (e) => (e as ExtendedSprite).isFirstEnemy
    ) as ExtendedSprite | undefined;

    if (firstEnemy && playerSprite.x >= firstEnemy.x - 140) {
      showTutorial(this, firstEnemy);
      return;
    }
  }

  if (tutorialActive) return;

  // Update game
  updatePlayerAnimation();
  playerSprite.x += gameSpeed / 100;

  // Check for win condition
  if (playerSprite.x >= FINISH_X + 50) {
    winGame();
    return;
  }

  updateEnemies();
  updateObjects();

  // Speed increase based on coins
  if (gameStore.getCoins() > 0 && gameStore.getCoins() % 500 === 0 && gameSpeed < 300) {
    gameSpeed += 10;
  }
}

/**
 * Handle game win
 */
function winGame(): void {
  gameOver = true;
  gameStarted = false;
  gameStore.winGame();

  const timer = getSpawnTimer();
  const cTimer = getCoinTimer();
  if (timer) timer.remove();
  if (cTimer) cTimer.remove();

  if (bgMusic) bgMusic.stop();

  const playerSprite = getPlayer();
  const enemiesGroup = getEnemies();
  const obstaclesGroup = getObstacles();
  const coinsGroup = getCoins();

  if (!playerSprite || !enemiesGroup || !obstaclesGroup || !coinsGroup) return;

  enemiesGroup.children.entries.forEach((e) => (e as Phaser.Physics.Arcade.Sprite).setVelocityX(0));
  obstaclesGroup.children.entries.forEach((o) => (o as Phaser.Physics.Arcade.Sprite).setVelocityX(0));
  coinsGroup.children.entries.forEach((c) => (c as Phaser.Physics.Arcade.Sprite).setVelocityX(0));

  playerSprite.setVelocity(0, 0);

  const scene = game.scene.scenes[0];
  if (playerSprite.anims && scene.anims.exists('player_idle')) {
    playerSprite.play('player_idle');
  }

  showEndScreen();
}

/**
 * Create start screen with text and hand icon
 */
function createStartScreen(scene: ExtendedScene): void {
  startText = scene.add.text(400, 250, 'Tap to start!\n\nCollect coins and avoid enemies', {
    fontSize: '1.5em',
    fontFamily: 'Arial',
    color: '#ffffff',
    align: 'center',
    stroke: '#000000',
    strokeThickness: 6
  });
  startText.setOrigin(0.5);
  startText.setDepth(100);
  startText.setScrollFactor(0);

  let handIcon: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
  if (scene.textures.exists('cursor')) {
    handIcon = scene.add.image(400, 350, 'cursor');
    handIcon.setDisplaySize(100, 100);
  } else {
    handIcon = scene.add.text(400, 350, '👆', { fontSize: '64px' });
  }
  handIcon.setOrigin(0.5);
  handIcon.setDepth(100);
  handIcon.setScrollFactor(0);

  scene.tweens.add({
    targets: handIcon,
    y: 330,
    duration: 500,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });

  scene.handIcon = handIcon;
}

/**
 * Handle click/tap input
 */
function handleClick(this: ExtendedScene): void {
  if (!gameStarted && !gameOver) {
    startGame(this);
  } else if (gameStarted && !gameOver) {
    jump();
  }
}

/**
 * Start the game
 */
function startGame(scene: ExtendedScene): void {
  gameStarted = true;
  gameOver = false;
  gameSpeed = 100;

  gameStore.startGame();

  startText.destroy();
  if (scene.handIcon) (scene.handIcon as Phaser.GameObjects.GameObject).destroy();

  if (scene.cache.audio.exists('bgMusic')) {
    bgMusic = scene.sound.add('bgMusic', { loop: true, volume: 0.3 });
    bgMusic.play();
  }

  const playerSprite = getPlayer();
  if (playerSprite && scene.anims.exists('player_run')) {
    playerSprite.play('player_run');
  }

  startEnemySpawning(scene);
  startCoinSpawning(scene);
}

/**
 * End the game (player lost)
 */
function endGame(): void {
  gameOver = true;
  gameStarted = false;
  gameStore.loseGame();

  const timer = getSpawnTimer();
  const cTimer = getCoinTimer();
  if (timer) timer.remove();
  if (cTimer) cTimer.remove();

  if (bgMusic) bgMusic.stop();

  const playerSprite = getPlayer();
  const enemiesGroup = getEnemies();
  const obstaclesGroup = getObstacles();
  const coinsGroup = getCoins();

  if (!playerSprite || !enemiesGroup || !obstaclesGroup || !coinsGroup) return;

  enemiesGroup.children.entries.forEach((e) => (e as Phaser.Physics.Arcade.Sprite).setVelocityX(0));
  obstaclesGroup.children.entries.forEach((o) => (o as Phaser.Physics.Arcade.Sprite).setVelocityX(0));
  coinsGroup.children.entries.forEach((c) => (c as Phaser.Physics.Arcade.Sprite).setVelocityX(0));

  playerSprite.setVelocity(0, 0);

  const scene = game.scene.scenes[0];
  if (playerSprite.anims && scene.anims.exists('player_idle')) {
    playerSprite.play('player_idle');
  }

  showEndScreen();
}

/**
 * Show win or fail modal
 */
function showEndScreen(): void {
  const state = gameStore.getState();

  if (state.gameState === 'won') {
    const winModal = document.getElementById('win-modal');
    const winScore = document.getElementById('win-score');
    if (winScore) winScore.textContent = String(state.coins);
    if (winModal) winModal.classList.remove('hidden');
  } else { 
    
    const failModal = document.getElementById('fail-modal');
    const failScore = document.getElementById('fail-score');
    const failImage = failModal?.querySelector('.fail-image');
    const visibleBoxes = failModal?.querySelectorAll('.visible_box');

    if (failScore) failScore.textContent = String(state.coins);

    // Убираем hidden и показываем модал
    if (failModal) failModal.classList.remove('hidden');

    // Убеждаемся, что картинка видима, а visible_box скрыты
    if (failImage) {
        failImage.classList.remove('hidden');
        (failImage as HTMLImageElement).style.opacity = '1';
    }
    if (visibleBoxes) {
        visibleBoxes.forEach(box => box.classList.remove('visible'));
    }

    if (failModal) failModal.classList.add('animation');

    // Через 400ms скрываем картинку и показываем visible_box
    setTimeout(() => {
        if (failImage) {
            failImage.classList.add('hidden');
        }
        if (visibleBoxes) {
            visibleBoxes.forEach(box => box.classList.add('visible'));
        }
    }, 400);

     
  }
}

/**
 * Flash sprite red (damage effect)
 */
function flashRed(sprite: Phaser.Physics.Arcade.Sprite): void {
  sprite.setTint(0xff0000);
  setTimeout(() => sprite.clearTint(), 200);
}

/**
 * Show tutorial overlay
 */
function showTutorial(scene: ExtendedScene, firstEnemy: ExtendedSprite): void {
  tutorialActive = true;

  const playerSprite = getPlayer();
  if (!playerSprite) return;

  playerSprite.setVelocity(0, 0);
  if (playerSprite.anims && scene.anims.exists('player_idle')) {
    playerSprite.play('player_idle');
  }

  if (firstEnemy && firstEnemy.anims) {
    firstEnemy.anims.pause();
  }

  // Create overlay
  const overlay = scene.add.graphics();
  overlay.fillStyle(0x000000, 0.7);
  overlay.fillRect(0, 0, 800, 600);
  overlay.setDepth(100);
  overlay.setScrollFactor(0);
  tutorialElements.push(overlay);

  // Tutorial text
  const tutorialText = scene.add.text(400, 200, 'Jump over enemies\nand obstacles!', {
    fontSize: '1.5rem',
    fontFamily: 'Arial',
    color: '#ffffff',
    align: 'center',
    stroke: '#000000',
    strokeThickness: 6
  });
  tutorialText.setOrigin(0.5);
  tutorialText.setDepth(101);
  tutorialText.setScrollFactor(0);
  tutorialElements.push(tutorialText);

  // Tap instruction
  const tapText = scene.add.text(400, 300, 'Tap to jump!', {
    fontSize: '1.5rem',
    fontFamily: 'Arial',
    color: '#FFD700',
    align: 'center',
    stroke: '#000000',
    strokeThickness: 4
  });
  tapText.setOrigin(0.5);
  tapText.setDepth(101);
  tapText.setScrollFactor(0);
  tutorialElements.push(tapText);

  // Cursor icon
  let cursorIcon: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
  if (scene.textures.exists('cursor')) {
    cursorIcon = scene.add.image(400, 400, 'cursor');
    cursorIcon.setDisplaySize(100, 100);
  } else {
    cursorIcon = scene.add.text(400, 400, '👆', { fontSize: '64px' });
  }
  cursorIcon.setOrigin(0.5);
  cursorIcon.setDepth(101);
  cursorIcon.setScrollFactor(0);
  tutorialElements.push(cursorIcon);

  scene.tweens.add({
    targets: cursorIcon,
    y: 380,
    duration: 500,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });

  scene.tutorialEnemy = firstEnemy;

  // Dismiss handlers
  scene.input.once('pointerdown', () => {
    dismissTutorial(scene);
  });

  scene.input.keyboard?.once('keydown-SPACE', () => {
    dismissTutorial(scene);
  });
  scene.input.keyboard?.once('keydown-UP', () => {
    dismissTutorial(scene);
  });
}

/**
 * Dismiss tutorial and start gameplay
 */
function dismissTutorial(scene: ExtendedScene): void {
  tutorialElements.forEach((el) => {
    if (el && el.destroy) {
      el.destroy();
    }
  });
  tutorialElements = [];

  tutorialShown = true;
  tutorialActive = false;

  if (scene.tutorialEnemy && scene.tutorialEnemy.anims) {
    scene.tutorialEnemy.anims.resume();
  }

  startEnemyTimer(scene);

  const playerSprite = getPlayer();
  if (playerSprite && playerSprite.body) {
    const body = playerSprite.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;
    if (onGround) {
      playerSprite.setVelocityY(-550);
      if (playerSprite.anims) {
        playerSprite.play('player_jump');
      }
    }
  }
}

/**
 * Create checkered finish line
 */
function createFinishLine(scene: Phaser.Scene): void {
  finishLine = scene.add.graphics();

  const x = FINISH_X;
  const y = 340;
  const width = 40;
  const height = 100;
  const squareSize = 15;

  for (let row = 0; row < height / squareSize; row++) {
    for (let col = 0; col < width / squareSize; col++) {
      const isWhite = (row + col) % 2 === 0;
      finishLine.fillStyle(isWhite ? 0xffffff : 0x000000, 1);
      finishLine.fillRect(x + col * squareSize, y + row * squareSize, squareSize, squareSize);
    }
  }

  const finishText = scene.add.text(x + width / 2, y - 30, 'FINISH', {
    fontSize: '1.5rem',
    fontFamily: 'Arial',
    color: '#FFD700',
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 3
  });
  finishText.setOrigin(0.5);
  finishText.setDepth(1.8);

  finishLine.setDepth(1.8);
}
