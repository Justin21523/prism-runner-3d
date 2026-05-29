import { PlayerController } from '../player/PlayerController';
import { AIPlayerBrain } from './AIPlayerBrain';

/**
 * AIActionController ties the AIPlayerBrain to the PlayerController.
 * Each frame it queries the brain for the desired action and feeds it
 * to the player controller via applyAIInput.
 */
export class AIActionController {
  private brain: AIPlayerBrain;
  private playerController: PlayerController;

  constructor(brain: AIPlayerBrain, playerController: PlayerController) {
    this.brain = brain;
    this.playerController = playerController;
  }

  /**
   * Update the AI logic and send commands to the player controller.
   * @param delta Frame delta time.
   * @param currentTime Elapsed time in seconds.
   */
  update(delta: number, currentTime: number) {
    const state = this.playerController.getState();
    const action = this.brain.getNextAction(
      state.position.clone(),
      state.grounded,
      state.jumpCount,
      state.velocity.clone(),
      delta
    );
    this.playerController.applyAIInput(action, delta, currentTime);
  }
}
