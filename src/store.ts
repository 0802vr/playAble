import { GameState, GameStoreState } from './types';

/**
 * GameStore - manages game state (lives, coins, game status)
 * Singleton pattern - one instance for the entire game
 */
class GameStore {
  private lives = 3;
  private coins = 0;
  private gameState: GameState = 'notStarted';

  /**
   * Initialize/reset game state to starting values
   */
  init(): void {
    this.lives = 3;
    this.coins = 0;
    this.gameState = 'notStarted';
    this.updateUI();
  }

  /**
   * Decrease player lives by 1
   * @returns true if game over (lives <= 0), false otherwise
   */
  loseLife(): boolean {
    if (this.lives > 0) {
      this.lives--;
      this.updateUI();

      if (this.lives <= 0) {
        this.gameState = 'lost';
        return true;
      }
    }
    return false;
  }

  /**
   * Add coins to player's score
   * @param amount - number of coins to add
   */
  addCoins(amount: number): void {
    this.coins += amount;
    this.updateUI();
  }

  /**
   * Start the game - reset lives and coins
   */
  startGame(): void {
    this.gameState = 'playing';
    this.lives = 3;
    this.coins = 0;
    this.updateUI();
  }

  /**
   * Set game state to won
   */
  winGame(): void {
    this.gameState = 'won';
  }

  /**
   * Set game state to lost
   */
  loseGame(): void {
    this.gameState = 'lost';
  }

  /**
   * Update UI elements (hearts and score display)
   */
  private updateUI(): void {
    // Update hearts
    for (let i = 1; i <= 3; i++) {
      const heart = document.getElementById('heart' + i);
      if (heart) {
        if (i > this.lives) {
          heart.classList.add('lost');
        } else {
          heart.classList.remove('lost');
        }
      }
    }

    // Update score
    const scoreElement = document.getElementById('scoreValue');
    if (scoreElement) {
      scoreElement.textContent = String(this.coins);
    }
  }

  /**
   * Get current game state
   */
  getState(): GameStoreState {
    return {
      lives: this.lives,
      coins: this.coins,
      gameState: this.gameState
    };
  }

  /**
   * Get current coins count
   */
  getCoins(): number {
    return this.coins;
  }
}

// Singleton instance
export const gameStore = new GameStore();
