import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ProjectManager } from '../core/project-manager.js';

// Object types catalog
const OBJECT_TYPES = [
  { type: 'Sprite', description: 'Animated sprite object', category: 'General' },
  { type: 'TextObject::Text', description: 'Text display object', category: 'General' },
  {
    type: 'TiledSpriteObject::TiledSprite',
    description: 'Repeated tile sprite',
    category: 'General',
  },
  {
    type: 'PanelSpriteObject::PanelSprite',
    description: '9-patch panel sprite',
    category: 'General',
  },
  {
    type: 'PrimitiveDrawing::Drawer',
    description: 'Shape drawing object',
    category: 'General',
  },
  {
    type: 'TextEntryObject::TextEntry',
    description: 'Text input field',
    category: 'User Interface',
  },
  {
    type: 'ParticleEmitter::ParticleEmitter',
    description: 'Particle effects',
    category: 'Visual Effects',
  },
  {
    type: 'Video::VideoObject',
    description: 'Video player object',
    category: 'Media',
  },
  {
    type: 'BBText::BBText',
    description: 'Rich text with BBCode formatting',
    category: 'User Interface',
  },
  {
    type: 'BitmapText::BitmapTextObject',
    description: 'Bitmap font text',
    category: 'General',
  },
  {
    type: 'TileMap::TileMap',
    description: 'Tilemap object',
    category: 'Level Design',
  },
  {
    type: 'Scene3D::Model3DObject',
    description: '3D model object',
    category: '3D',
  },
  {
    type: 'Scene3D::Cube3DObject',
    description: '3D cube object',
    category: '3D',
  },
];

// Behavior types catalog
const BEHAVIOR_TYPES = [
  {
    type: 'PlatformBehavior::PlatformerObjectBehavior',
    name: 'Platformer Character',
    description: 'Makes an object move like a platformer character',
    properties: [
      'Gravity',
      'MaxFallingSpeed',
      'Acceleration',
      'Deceleration',
      'MaxSpeed',
      'JumpSpeed',
    ],
  },
  {
    type: 'PlatformBehavior::PlatformBehavior',
    name: 'Platform',
    description: 'Makes an object act as a platform',
    properties: ['PlatformType', 'CanBeGrabbed'],
  },
  {
    type: 'TopDownMovementBehavior::TopDownMovementBehavior',
    name: 'Top-Down Movement',
    description: '4 or 8 direction movement',
    properties: [
      'Acceleration',
      'Deceleration',
      'MaxSpeed',
      'AngularMaxSpeed',
      'RotateObject',
      'AngleOffset',
    ],
  },
  {
    type: 'DraggableBehavior::Draggable',
    name: 'Draggable',
    description: 'Makes an object draggable with mouse/touch',
    properties: [],
  },
  {
    type: 'DestroyOutsideBehavior::DestroyOutside',
    name: 'Destroy when outside screen',
    description: 'Destroys object when it leaves the screen',
    properties: ['ExtraBorder'],
  },
  {
    type: 'Physics2::Physics2Behavior',
    name: 'Physics 2.0',
    description: 'Realistic physics simulation',
    properties: ['BodyType', 'Density', 'Friction', 'Restitution', 'LinearDamping'],
  },
  {
    type: 'PathfindingBehavior::PathfindingBehavior',
    name: 'Pathfinding',
    description: 'Find paths around obstacles',
    properties: ['CellSize', 'Acceleration', 'MaxSpeed', 'AllowDiagonals'],
  },
  {
    type: 'TweenBehavior::TweenBehavior',
    name: 'Tween',
    description: 'Smoothly animate properties',
    properties: [],
  },
  {
    type: 'AnchorBehavior::AnchorBehavior',
    name: 'Anchor',
    description: 'Keep object at relative position to window edges',
    properties: ['LeftEdgeAnchor', 'RightEdgeAnchor', 'TopEdgeAnchor', 'BottomEdgeAnchor'],
  },
];

/**
 * Register all MCP resources.
 */
export function registerAllResources(
  server: McpServer,
  projectManager: ProjectManager
) {
  // Server info resource
  server.resource('server-info', 'gdevelop://server/info', async () => ({
    contents: [
      {
        uri: 'gdevelop://server/info',
        mimeType: 'application/json',
        text: JSON.stringify({
          name: 'GDevelop MCP Server',
          version: '1.0.0',
          activeSessions: projectManager.getSessionCount(),
          capabilities: [
            'project-management',
            'scene-management',
            'object-management',
            'event-management',
            'behavior-management',
            'variable-management',
            'layer-management',
            'resource-management',
            'export',
          ],
        }),
      },
    ],
  }));

  // Object types catalog
  server.resource('object-catalog', 'gdevelop://catalog/objects', async () => ({
    contents: [
      {
        uri: 'gdevelop://catalog/objects',
        mimeType: 'application/json',
        text: JSON.stringify({
          types: OBJECT_TYPES,
          count: OBJECT_TYPES.length,
        }),
      },
    ],
  }));

  // Behavior types catalog
  server.resource('behavior-catalog', 'gdevelop://catalog/behaviors', async () => ({
    contents: [
      {
        uri: 'gdevelop://catalog/behaviors',
        mimeType: 'application/json',
        text: JSON.stringify({
          behaviors: BEHAVIOR_TYPES,
          count: BEHAVIOR_TYPES.length,
        }),
      },
    ],
  }));

  // Active sessions list
  server.resource('sessions-list', 'gdevelop://sessions', async () => ({
    contents: [
      {
        uri: 'gdevelop://sessions',
        mimeType: 'application/json',
        text: JSON.stringify({
          sessions: projectManager.listSessions(),
        }),
      },
    ],
  }));

  // Common event conditions reference
  server.resource('conditions-catalog', 'gdevelop://catalog/conditions', async () => ({
    contents: [
      {
        uri: 'gdevelop://catalog/conditions',
        mimeType: 'application/json',
        text: JSON.stringify({
          conditions: [
            {
              type: 'KeyPressed',
              description: 'Check if a key is pressed',
              parameters: ['key'],
              example: ['Left'],
            },
            {
              type: 'KeyReleased',
              description: 'Check if a key was just released',
              parameters: ['key'],
              example: ['Space'],
            },
            {
              type: 'MouseButtonPressed',
              description: 'Check if mouse button is pressed',
              parameters: ['button'],
              example: ['Left'],
            },
            {
              type: 'CollisionNP',
              description: 'Check collision between two objects',
              parameters: ['object1', 'object2'],
              example: ['Player', 'Enemy'],
            },
            {
              type: 'VarScene',
              description: 'Compare a scene variable',
              parameters: ['variable', 'operator', 'value'],
              example: ['Score', '>=', '100'],
            },
            {
              type: 'VarGlobal',
              description: 'Compare a global variable',
              parameters: ['variable', 'operator', 'value'],
              example: ['Lives', '>', '0'],
            },
            {
              type: 'Timer',
              description: 'Check if timer has elapsed',
              parameters: ['timer', 'seconds'],
              example: ['SpawnTimer', '2'],
            },
          ],
        }),
      },
    ],
  }));

  // Common event actions reference
  server.resource('actions-catalog', 'gdevelop://catalog/actions', async () => ({
    contents: [
      {
        uri: 'gdevelop://catalog/actions',
        mimeType: 'application/json',
        text: JSON.stringify({
          actions: [
            {
              type: 'Create',
              description: 'Create an object instance',
              parameters: ['object', 'layer', 'x', 'y'],
              example: ['Bullet', '', 'Player.X()', 'Player.Y()'],
            },
            {
              type: 'Delete',
              description: 'Delete object instances',
              parameters: ['object'],
              example: ['Enemy'],
            },
            {
              type: 'MettreX',
              description: 'Set object X position',
              parameters: ['object', 'operator', 'value'],
              example: ['Player', '=', '100'],
            },
            {
              type: 'MettreY',
              description: 'Set object Y position',
              parameters: ['object', 'operator', 'value'],
              example: ['Player', '=', '200'],
            },
            {
              type: 'AddForceAL',
              description: 'Add force with angle and length',
              parameters: ['object', 'angle', 'length', 'multiplier'],
              example: ['Bullet', '0', '500', '1'],
            },
            {
              type: 'ModVarScene',
              description: 'Modify scene variable',
              parameters: ['variable', 'operator', 'value'],
              example: ['Score', '+', '10'],
            },
            {
              type: 'ModVarGlobal',
              description: 'Modify global variable',
              parameters: ['variable', 'operator', 'value'],
              example: ['Lives', '-', '1'],
            },
            {
              type: 'ChangeScene',
              description: 'Change to another scene',
              parameters: ['sceneName'],
              example: ['Level2'],
            },
            {
              type: 'PlaySound',
              description: 'Play a sound',
              parameters: ['soundFile', 'repeat', 'volume', 'pitch'],
              example: ['coin.wav', 'no', '100', '1'],
            },
          ],
        }),
      },
    ],
  }));
}
