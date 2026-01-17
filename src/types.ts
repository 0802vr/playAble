import Phaser from 'phaser';

/**
 * Extended Phaser sprite with custom properties
 */
export interface ExtendedSprite extends Phaser.Physics.Arcade.Sprite {
  isFirstEnemy?: boolean;
  hitProcessed?: boolean;
}

/**
 * Game state type
 */
export type GameState = 'notStarted' | 'playing' | 'won' | 'lost';

/**
 * Game store state interface
 */
export interface GameStoreState {
  lives: number;
  coins: number;
  gameState: GameState;
}

/**
 * Coin zone configuration
 */
export interface CoinZone {
  startX: number;
  count: number;
}
