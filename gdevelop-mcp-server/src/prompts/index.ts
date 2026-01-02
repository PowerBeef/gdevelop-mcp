import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

/**
 * Register all MCP prompts for common game development workflows.
 */
export function registerAllPrompts(server: McpServer) {
  // Create Platformer Game
  server.prompt(
    'create-platformer',
    'Set up a basic platformer game with player, platforms, and controls',
    {
      sessionId: z.string().describe('Project session ID'),
      playerName: z.string().default('Player').describe('Name for the player object'),
      sceneName: z.string().default('Level1').describe('Name for the first level'),
    },
    ({ sessionId, playerName, sceneName }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Set up a platformer game in session ${sessionId}:

1. Create a scene named "${sceneName}" if it doesn't exist
2. Create a Sprite object named "${playerName}" for the player character
3. Add PlatformerObjectBehavior to ${playerName} with these settings:
   - Gravity: 1000
   - Max falling speed: 700
   - Acceleration: 1500
   - Deceleration: 1500
   - Max speed: 450
   - Jump speed: 600
4. Create a Sprite object named "Platform" for ground/platforms
5. Add PlatformBehavior to Platform
6. Create events for player controls:
   - Left arrow key pressed -> Move ${playerName} left (add force at angle 180)
   - Right arrow key pressed -> Move ${playerName} right (add force at angle 0)
   - Space or Up arrow pressed -> ${playerName} jump (simulate jump key press)
7. Place initial instances:
   - ${playerName} at (200, 300)
   - Platform instances to form a basic level floor at y=500

Please execute these steps using the available tools and report the results.`,
          },
        },
      ],
    })
  );

  // Create Top-Down Game
  server.prompt(
    'create-topdown',
    'Set up a top-down game with player movement',
    {
      sessionId: z.string(),
      playerName: z.string().default('Player'),
      sceneName: z.string().default('MainScene'),
      movementStyle: z.enum(['4-direction', '8-direction']).default('8-direction'),
    },
    ({ sessionId, playerName, sceneName, movementStyle }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Set up a top-down game in session ${sessionId}:

1. Create a scene named "${sceneName}" if it doesn't exist
2. Create a Sprite object named "${playerName}"
3. Add TopDownMovementBehavior with:
   - Acceleration: 800
   - Deceleration: 800
   - Max speed: 300
   - Allow diagonals: ${movementStyle === '8-direction'}
4. Create movement events using default arrow key controls
5. Place ${playerName} at center of scene (640, 360 for 1280x720)

Execute these steps and confirm the setup.`,
          },
        },
      ],
    })
  );

  // Add Player Character
  server.prompt(
    'add-player-character',
    'Create a player character with movement and basic behaviors',
    {
      sessionId: z.string(),
      sceneName: z.string(),
      playerName: z.string().default('Player'),
      gameType: z.enum(['platformer', 'topdown', 'shooter']),
      hasHealth: z.boolean().default(true),
      startingHealth: z.number().default(100),
    },
    ({ sessionId, sceneName, playerName, gameType, hasHealth, startingHealth }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Create a player character in scene "${sceneName}" (session: ${sessionId}):

Name: ${playerName}
Game Type: ${gameType}
${hasHealth ? `Health System: Yes, starting health: ${startingHealth}` : 'Health System: No'}

Steps:
1. Create a Sprite object named "${playerName}"
2. Add appropriate movement behavior for ${gameType}:
   ${gameType === 'platformer' ? '- PlatformerObjectBehavior' : ''}
   ${gameType === 'topdown' ? '- TopDownMovementBehavior' : ''}
   ${gameType === 'shooter' ? '- TopDownMovementBehavior with rotation enabled' : ''}
3. ${hasHealth ? `Create an object variable "Health" with value ${startingHealth}` : ''}
4. Set up control events for ${gameType} gameplay
5. Place ${playerName} at a sensible starting position

Execute and confirm.`,
          },
        },
      ],
    })
  );

  // Add Enemy
  server.prompt(
    'add-enemy',
    'Create an enemy with AI behavior',
    {
      sessionId: z.string(),
      sceneName: z.string(),
      enemyName: z.string().default('Enemy'),
      aiType: z.enum(['patrol', 'chase', 'stationary']),
      canDamagePlayer: z.boolean().default(true),
      damageAmount: z.number().default(10),
    },
    ({ sessionId, sceneName, enemyName, aiType, canDamagePlayer, damageAmount }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Create an enemy in scene "${sceneName}" (session: ${sessionId}):

Name: ${enemyName}
AI Type: ${aiType}
${canDamagePlayer ? `Damages player: ${damageAmount} on collision` : 'Does not damage player'}

Steps:
1. Create a Sprite object named "${enemyName}"
2. Set up AI behavior:
   ${aiType === 'patrol' ? '- Add object variables for patrol points and direction' : ''}
   ${aiType === 'chase' ? '- Add Pathfinding behavior or simple chase logic' : ''}
   ${aiType === 'stationary' ? '- No movement needed' : ''}
3. ${canDamagePlayer ? `Create collision event with Player that reduces Player.Health by ${damageAmount}` : ''}
4. Add defeat condition (e.g., when Player jumps on top or shoots)

Execute and provide the enemy setup details.`,
          },
        },
      ],
    })
  );

  // Add Collectible
  server.prompt(
    'add-collectible',
    'Create collectible items with score or power-up effects',
    {
      sessionId: z.string(),
      sceneName: z.string(),
      collectibleName: z.string().default('Coin'),
      collectibleType: z.enum(['score', 'health', 'powerup']),
      value: z.number().default(10),
    },
    ({ sessionId, sceneName, collectibleName, collectibleType, value }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Create a collectible item in scene "${sceneName}" (session: ${sessionId}):

Name: ${collectibleName}
Type: ${collectibleType}
Value: ${value}

Steps:
1. Create a Sprite object named "${collectibleName}"
2. Create collection event:
   - Condition: Collision between Player and ${collectibleName}
   - Action: ${
     collectibleType === 'score'
       ? `Add ${value} to Score variable`
       : collectibleType === 'health'
         ? `Add ${value} to Player.Health`
         : `Apply power-up effect`
   }
   - Action: Delete ${collectibleName} instance
   - Action: Play collection sound (optional)
3. Place some ${collectibleName} instances in the scene

Execute and confirm setup.`,
          },
        },
      ],
    })
  );

  // Setup Scoring System
  server.prompt(
    'setup-scoring',
    'Create a complete scoring system with display and persistence',
    {
      sessionId: z.string(),
      sceneName: z.string(),
      displayPosition: z.enum(['top-left', 'top-right', 'top-center']).default('top-right'),
      saveHighScore: z.boolean().default(true),
    },
    ({ sessionId, sceneName, displayPosition, saveHighScore }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Set up a scoring system in scene "${sceneName}" (session: ${sessionId}):

Display Position: ${displayPosition}
Save High Score: ${saveHighScore}

Steps:
1. Create global variable "Score" (number, default 0)
${saveHighScore ? '2. Create global variable "HighScore" (number, default 0)' : ''}
3. Create a Text object named "ScoreDisplay"
4. Position ScoreDisplay at ${displayPosition}:
   ${displayPosition === 'top-left' ? 'x: 20, y: 20' : ''}
   ${displayPosition === 'top-right' ? 'x: 1200, y: 20' : ''}
   ${displayPosition === 'top-center' ? 'x: 640, y: 20' : ''}
5. Create event to update ScoreDisplay text to show "Score: " + ToString(Score)
${saveHighScore ? '6. Create event at scene end to update HighScore if Score > HighScore' : ''}
${saveHighScore ? '7. Save HighScore to storage' : ''}

Implement the complete system.`,
          },
        },
      ],
    })
  );

  // Add Menu Scene
  server.prompt(
    'add-menu-scene',
    'Create a main menu scene with title and buttons',
    {
      sessionId: z.string(),
      gameTitle: z.string(),
      targetScene: z.string().describe('Scene to start when Play is clicked'),
      hasOptions: z.boolean().default(false),
    },
    ({ sessionId, gameTitle, targetScene, hasOptions }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Create a main menu scene (session: ${sessionId}):

Game Title: ${gameTitle}
Start Scene: ${targetScene}
Include Options: ${hasOptions}

Steps:
1. Create a new scene named "MainMenu"
2. Set MainMenu as the first layout
3. Create a Text object "TitleText" with "${gameTitle}"
4. Position TitleText at center-top (640, 150)
5. Create a Text object "PlayButton" with "PLAY"
6. Position PlayButton at (640, 350)
7. Create event: When mouse released on PlayButton -> Change scene to "${targetScene}"
${hasOptions ? '8. Create "OptionsButton" Text object at (640, 450)' : ''}
${hasOptions ? '9. Create Options scene or overlay' : ''}
10. Add hover effects for buttons (optional)

Create the complete menu scene.`,
          },
        },
      ],
    })
  );

  // Game Over Screen
  server.prompt(
    'add-game-over',
    'Create a game over screen with restart option',
    {
      sessionId: z.string(),
      sceneName: z.string(),
      showScore: z.boolean().default(true),
      restartScene: z.string(),
    },
    ({ sessionId, sceneName, showScore, restartScene }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Create a game over screen in scene "${sceneName}" (session: ${sessionId}):

Show Score: ${showScore}
Restart Scene: ${restartScene}

Steps:
1. Create a Text object "GameOverText" with "GAME OVER"
2. Position at center (640, 300)
${showScore ? '3. Create Text object "FinalScore" showing the Score variable' : ''}
${showScore ? '4. Position below GameOverText' : ''}
5. Create "RestartButton" Text object with "RESTART"
6. Create event: Click RestartButton -> Reset Score to 0, Change scene to "${restartScene}"
7. Create "MainMenuButton" if MainMenu scene exists
8. Add fade-in animation for game over elements

Implement the game over screen.`,
          },
        },
      ],
    })
  );
}
