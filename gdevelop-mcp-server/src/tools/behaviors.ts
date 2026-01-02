import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ProjectManager } from '../core/project-manager.js';

// Common behavior types catalog
const BEHAVIOR_CATALOG = [
  {
    type: 'PlatformBehavior::PlatformerObjectBehavior',
    name: 'Platformer Character',
    description: 'Makes an object move like a platformer character',
  },
  {
    type: 'PlatformBehavior::PlatformBehavior',
    name: 'Platform',
    description: 'Makes an object act as a platform',
  },
  {
    type: 'TopDownMovementBehavior::TopDownMovementBehavior',
    name: 'Top-Down Movement',
    description: '4 or 8 direction movement',
  },
  {
    type: 'DraggableBehavior::Draggable',
    name: 'Draggable',
    description: 'Makes an object draggable with mouse/touch',
  },
  {
    type: 'DestroyOutsideBehavior::DestroyOutside',
    name: 'Destroy when outside screen',
    description: 'Destroys object when it leaves the screen',
  },
  {
    type: 'Physics2::Physics2Behavior',
    name: 'Physics 2.0',
    description: 'Realistic physics simulation',
  },
  {
    type: 'PathfindingBehavior::PathfindingBehavior',
    name: 'Pathfinding',
    description: 'Find paths around obstacles',
  },
  {
    type: 'TweenBehavior::TweenBehavior',
    name: 'Tween',
    description: 'Smoothly animate properties',
  },
];

/**
 * Register behavior management tools.
 */
export function registerBehaviorTools(
  server: McpServer,
  projectManager: ProjectManager
) {
  // gdevelop_behavior_list
  server.tool(
    'gdevelop_behavior_list',
    'List behaviors attached to an object or available behavior types',
    {
      sessionId: z.string(),
      objectName: z.string().optional().describe('Get behaviors for specific object'),
      sceneName: z.string().optional(),
      listAvailable: z.boolean().default(false).describe('List all available behavior types'),
    },
    async ({ sessionId, objectName, sceneName, listAvailable }) => {
      if (listAvailable) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                behaviors: BEHAVIOR_CATALOG,
              }),
            },
          ],
        };
      }

      if (!objectName) {
        throw new Error('objectName is required when not listing available behaviors');
      }

      const session = projectManager.getSession(sessionId);
      let obj;

      if (sceneName) {
        const layout = session.getLayout(sceneName);
        if (!layout.hasObjectNamed(objectName)) {
          throw new Error(`Object "${objectName}" not found in scene`);
        }
        obj = layout.getObject(objectName);
      } else {
        obj = session.getGlobalObject(objectName);
      }

      const behaviorNames = obj.getAllBehaviorNames();
      const behaviors: object[] = [];

      for (const name of behaviorNames) {
        const behavior = obj.getBehavior(name);
        behaviors.push({
          name,
          type: behavior.getTypeName(),
        });
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ behaviors }),
          },
        ],
      };
    }
  );

  // gdevelop_behavior_add
  server.tool(
    'gdevelop_behavior_add',
    'Add a behavior to an object',
    {
      sessionId: z.string(),
      objectName: z.string(),
      sceneName: z.string().optional(),
      behaviorType: z.string().describe('Behavior type (e.g., "PlatformBehavior::PlatformerObjectBehavior")'),
      behaviorName: z.string().describe('Name for this behavior instance'),
    },
    async ({ sessionId, objectName, sceneName, behaviorType, behaviorName }) => {
      const session = projectManager.getSession(sessionId);
      const project = session.getProject();
      let obj;

      if (sceneName) {
        const layout = session.getLayout(sceneName);
        if (!layout.hasObjectNamed(objectName)) {
          throw new Error(`Object "${objectName}" not found in scene`);
        }
        obj = layout.getObject(objectName);
      } else {
        obj = session.getGlobalObject(objectName);
      }

      if (obj.hasBehaviorNamed(behaviorName)) {
        throw new Error(`Behavior "${behaviorName}" already exists on object`);
      }

      obj.addNewBehavior(project, behaviorType, behaviorName);
      session.markDirty();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              behaviorName,
              behaviorType,
            }),
          },
        ],
      };
    }
  );

  // gdevelop_behavior_remove
  server.tool(
    'gdevelop_behavior_remove',
    'Remove a behavior from an object',
    {
      sessionId: z.string(),
      objectName: z.string(),
      sceneName: z.string().optional(),
      behaviorName: z.string(),
    },
    async ({ sessionId, objectName, sceneName, behaviorName }) => {
      const session = projectManager.getSession(sessionId);
      let obj;

      if (sceneName) {
        const layout = session.getLayout(sceneName);
        obj = layout.getObject(objectName);
      } else {
        obj = session.getGlobalObject(objectName);
      }

      if (!obj.hasBehaviorNamed(behaviorName)) {
        throw new Error(`Behavior "${behaviorName}" not found on object`);
      }

      obj.removeBehavior(behaviorName);
      session.markDirty();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: true }),
          },
        ],
      };
    }
  );

  // gdevelop_behavior_configure
  server.tool(
    'gdevelop_behavior_configure',
    'Configure properties of an object behavior',
    {
      sessionId: z.string(),
      objectName: z.string(),
      sceneName: z.string().optional(),
      behaviorName: z.string(),
      properties: z.record(z.string()),
    },
    async ({ sessionId, objectName, sceneName, behaviorName, properties }) => {
      const session = projectManager.getSession(sessionId);
      let obj;

      if (sceneName) {
        const layout = session.getLayout(sceneName);
        obj = layout.getObject(objectName);
      } else {
        obj = session.getGlobalObject(objectName);
      }

      if (!obj.hasBehaviorNamed(behaviorName)) {
        throw new Error(`Behavior "${behaviorName}" not found on object`);
      }

      const behavior = obj.getBehavior(behaviorName);
      const updated: string[] = [];

      for (const [key, value] of Object.entries(properties)) {
        if (behavior.updateProperty(key, value)) {
          updated.push(key);
        }
      }

      session.markDirty();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              updatedProperties: updated,
            }),
          },
        ],
      };
    }
  );
}
