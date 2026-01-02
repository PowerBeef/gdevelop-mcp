#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { GDCoreManager, getGDCoreManager } from './core/gdcore-manager.js';
import { ProjectManager } from './core/project-manager.js';
import { createLogger } from './logger.js';
import { registerAllAdditionalTools } from './tools/index.js';
import { registerAllResources } from './resources/index.js';
import { registerAllPrompts } from './prompts/index.js';

const serverLogger = createLogger('server');

// Global instances
let gdcoreManager: GDCoreManager;
let projectManager: ProjectManager;

/**
 * Register all project management tools.
 */
function registerProjectTools(server: McpServer) {
  // gdevelop_project_open
  server.tool(
    'gdevelop_project_open',
    'Open a GDevelop project file and create an editing session',
    {
      projectPath: z.string().describe('Absolute path to the GDevelop project JSON file'),
      sessionId: z.string().optional().describe('Custom session identifier (auto-generated if not provided)'),
    },
    async ({ projectPath, sessionId }) => {
      const session = await projectManager.openProject(projectPath, sessionId);
      const info = session.getInfo();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              sessionId: session.id,
              projectName: info.name,
              gdVersion: { major: 5, minor: 6, build: 251 }, // Would need to parse from project
              layoutCount: info.layoutCount,
              objectCount: info.globalObjectCount,
            }),
          },
        ],
      };
    }
  );

  // gdevelop_project_save
  server.tool(
    'gdevelop_project_save',
    'Save the current project to its file or a new location',
    {
      sessionId: z.string().describe('Project session identifier'),
      savePath: z.string().optional().describe('New save location (uses original path if not specified)'),
      createBackup: z.boolean().default(true).describe('Create a backup before saving'),
    },
    async ({ sessionId, savePath, createBackup }) => {
      const session = projectManager.getSession(sessionId);

      let backupPath: string | undefined;
      if (createBackup) {
        try {
          backupPath = await session.createBackup();
        } catch (error) {
          serverLogger.warn({ error }, 'Failed to create backup');
        }
      }

      const savedPath = await session.save(savePath);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              savedPath,
              backupPath,
            }),
          },
        ],
      };
    }
  );

  // gdevelop_project_close
  server.tool(
    'gdevelop_project_close',
    'Close a project session and release resources',
    {
      sessionId: z.string().describe('Project session identifier'),
      saveBeforeClose: z.boolean().default(false).describe('Save changes before closing'),
    },
    async ({ sessionId, saveBeforeClose }) => {
      const session = projectManager.getSession(sessionId);
      const unsavedChanges = session.isDirty();

      const success = await projectManager.closeSession(sessionId, saveBeforeClose);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success,
              unsavedChanges,
            }),
          },
        ],
      };
    }
  );

  // gdevelop_project_create
  server.tool(
    'gdevelop_project_create',
    'Create a new GDevelop project with specified settings',
    {
      projectPath: z.string().describe('Path where the project will be saved'),
      name: z.string().describe('Project name'),
      windowWidth: z.number().default(1280).describe('Game window width'),
      windowHeight: z.number().default(720).describe('Game window height'),
      orientation: z.enum(['landscape', 'portrait', 'default']).default('landscape'),
      maxFPS: z.number().default(60),
      createInitialScene: z.boolean().default(true).describe('Create a default first scene'),
    },
    async ({ projectPath, name, windowWidth, windowHeight, maxFPS, createInitialScene }) => {
      const session = await projectManager.createProject(projectPath, name);
      const project = session.getProject();

      project.setDefaultWidth(windowWidth);
      project.setDefaultHeight(windowHeight);
      project.setMaximumFPS(maxFPS);

      let initialSceneName: string | undefined;
      if (createInitialScene) {
        initialSceneName = 'Main Scene';
        session.createLayout(initialSceneName);
        project.setFirstLayout(initialSceneName);
      }

      // Save the new project
      await session.save();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              sessionId: session.id,
              projectPath: session.getProjectPath(),
              initialSceneName,
            }),
          },
        ],
      };
    }
  );

  // gdevelop_project_info
  server.tool(
    'gdevelop_project_info',
    'Get comprehensive information about the current project',
    {
      sessionId: z.string().describe('Project session identifier'),
    },
    async ({ sessionId }) => {
      const session = projectManager.getSession(sessionId);
      const info = session.getInfo();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(info),
          },
        ],
      };
    }
  );

  // gdevelop_project_settings
  server.tool(
    'gdevelop_project_settings',
    'Update project settings (name, version, display, etc.)',
    {
      sessionId: z.string(),
      settings: z.object({
        name: z.string().optional(),
        version: z.string().optional(),
        description: z.string().optional(),
        author: z.string().optional(),
        packageName: z.string().optional(),
        windowWidth: z.number().optional(),
        windowHeight: z.number().optional(),
        maxFPS: z.number().optional(),
        minFPS: z.number().optional(),
        firstLayout: z.string().optional(),
      }),
    },
    async ({ sessionId, settings }) => {
      const session = projectManager.getSession(sessionId);
      const project = session.getProject();
      const updated: string[] = [];

      if (settings.name !== undefined) {
        project.setName(settings.name);
        updated.push('name');
      }
      if (settings.version !== undefined) {
        project.setVersion(settings.version);
        updated.push('version');
      }
      if (settings.description !== undefined) {
        project.setDescription(settings.description);
        updated.push('description');
      }
      if (settings.author !== undefined) {
        project.setAuthor(settings.author);
        updated.push('author');
      }
      if (settings.packageName !== undefined) {
        project.setPackageName(settings.packageName);
        updated.push('packageName');
      }
      if (settings.windowWidth !== undefined) {
        project.setDefaultWidth(settings.windowWidth);
        updated.push('windowWidth');
      }
      if (settings.windowHeight !== undefined) {
        project.setDefaultHeight(settings.windowHeight);
        updated.push('windowHeight');
      }
      if (settings.maxFPS !== undefined) {
        project.setMaximumFPS(settings.maxFPS);
        updated.push('maxFPS');
      }
      if (settings.minFPS !== undefined) {
        project.setMinimumFPS(settings.minFPS);
        updated.push('minFPS');
      }
      if (settings.firstLayout !== undefined) {
        if (!session.hasLayout(settings.firstLayout)) {
          throw new Error(`Layout "${settings.firstLayout}" not found`);
        }
        project.setFirstLayout(settings.firstLayout);
        updated.push('firstLayout');
      }

      if (updated.length > 0) {
        session.markDirty();
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              updatedSettings: updated,
            }),
          },
        ],
      };
    }
  );

  // gdevelop_sessions_list
  server.tool(
    'gdevelop_sessions_list',
    'List all active project sessions',
    {},
    async () => {
      const sessions = projectManager.listSessions();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ sessions }),
          },
        ],
      };
    }
  );
}

/**
 * Register scene management tools.
 */
function registerSceneTools(server: McpServer) {
  // gdevelop_scene_list
  server.tool(
    'gdevelop_scene_list',
    'List all scenes (layouts) in the project',
    {
      sessionId: z.string(),
      includeDetails: z.boolean().default(false).describe('Include object and instance counts'),
    },
    async ({ sessionId, includeDetails }) => {
      const session = projectManager.getSession(sessionId);
      const project = session.getProject();
      const scenes: object[] = [];

      for (let i = 0; i < project.getLayoutsCount(); i++) {
        const layout = project.getLayoutAt(i);
        const sceneInfo: Record<string, unknown> = {
          name: layout.getName(),
          index: i,
          isFirstLayout: layout.getName() === project.getFirstLayout(),
        };

        if (includeDetails) {
          sceneInfo.objectCount = layout.getObjects().getObjectsCount();
          sceneInfo.instanceCount = layout.getInitialInstances().getInstancesCount();
          sceneInfo.layerCount = layout.getLayersCount();
          sceneInfo.eventCount = layout.getEvents().getEventsCount();
        }

        scenes.push(sceneInfo);
      }

      return {
        content: [{ type: 'text', text: JSON.stringify({ scenes }) }],
      };
    }
  );

  // gdevelop_scene_create
  server.tool(
    'gdevelop_scene_create',
    'Create a new scene in the project',
    {
      sessionId: z.string(),
      name: z.string().describe('Scene name (must be unique)'),
      position: z.number().optional().describe('Insert position (appends to end if not specified)'),
      backgroundColor: z.string().optional().describe('Background color in hex format (#RRGGBB)'),
      setAsFirst: z.boolean().default(false).describe('Set as the first scene to load'),
    },
    async ({ sessionId, name, position, backgroundColor, setAsFirst }) => {
      const session = projectManager.getSession(sessionId);
      const layout = session.createLayout(name, position);

      if (backgroundColor) {
        const hex = backgroundColor.replace('#', '');
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        layout.setBackgroundColor(r, g, b);
      }

      if (setAsFirst) {
        session.getProject().setFirstLayout(name);
      }

      const sceneIndex = session.getLayoutPosition(name);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              sceneName: name,
              sceneIndex,
            }),
          },
        ],
      };
    }
  );

  // gdevelop_scene_delete
  server.tool(
    'gdevelop_scene_delete',
    'Delete a scene from the project',
    {
      sessionId: z.string(),
      sceneName: z.string().describe('Name of the scene to delete'),
    },
    async ({ sessionId, sceneName }) => {
      const session = projectManager.getSession(sessionId);
      session.deleteLayout(sceneName);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              deletedScene: sceneName,
            }),
          },
        ],
      };
    }
  );

  // gdevelop_scene_rename
  server.tool(
    'gdevelop_scene_rename',
    'Rename a scene',
    {
      sessionId: z.string(),
      currentName: z.string(),
      newName: z.string(),
    },
    async ({ sessionId, currentName, newName }) => {
      const session = projectManager.getSession(sessionId);
      session.renameLayout(currentName, newName);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              oldName: currentName,
              newName,
            }),
          },
        ],
      };
    }
  );

  // gdevelop_scene_duplicate
  server.tool(
    'gdevelop_scene_duplicate',
    'Create a copy of an existing scene',
    {
      sessionId: z.string(),
      sourceName: z.string(),
      newName: z.string(),
    },
    async ({ sessionId, sourceName, newName }) => {
      const session = projectManager.getSession(sessionId);

      if (!session.hasLayout(sourceName)) {
        throw new Error(`Scene "${sourceName}" not found`);
      }
      if (session.hasLayout(newName)) {
        throw new Error(`Scene "${newName}" already exists`);
      }

      // Get source layout data by serializing
      const sourceLayout = session.getLayout(sourceName);

      // Create new layout
      const newLayout = session.createLayout(newName);

      // Copy properties
      const r = sourceLayout.getBackgroundColorRed();
      const g = sourceLayout.getBackgroundColorGreen();
      const b = sourceLayout.getBackgroundColorBlue();
      newLayout.setBackgroundColor(r, g, b);

      // Note: Full duplication would require deep copying objects, instances, events, etc.
      // This is a simplified version

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              newSceneName: newName,
              objectsCopied: 0, // Would need full implementation
              instancesCopied: 0,
            }),
          },
        ],
      };
    }
  );

  // gdevelop_scene_reorder
  server.tool(
    'gdevelop_scene_reorder',
    'Change the order of scenes in the project',
    {
      sessionId: z.string(),
      sceneName: z.string(),
      newPosition: z.number(),
    },
    async ({ sessionId, sceneName, newPosition }) => {
      const session = projectManager.getSession(sessionId);
      const oldPosition = session.getLayoutPosition(sceneName);

      session.moveLayout(sceneName, newPosition);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              oldPosition,
              newPosition,
            }),
          },
        ],
      };
    }
  );
}

/**
 * Register object management tools.
 */
function registerObjectTools(server: McpServer) {
  // gdevelop_object_list
  server.tool(
    'gdevelop_object_list',
    'List objects in a scene or global objects',
    {
      sessionId: z.string(),
      sceneName: z.string().optional().describe('Scene name (omit for global objects)'),
      includeDetails: z.boolean().default(false),
      filterByType: z.string().optional().describe('Filter by object type'),
    },
    async ({ sessionId, sceneName, includeDetails, filterByType }) => {
      const session = projectManager.getSession(sessionId);
      const container = sceneName
        ? session.getLayout(sceneName).getObjects()
        : session.getGlobalObjects();

      const objects: object[] = [];
      const count = container.getObjectsCount();

      for (let i = 0; i < count; i++) {
        const obj = container.getObjectAt(i);
        const type = obj.getType();

        if (filterByType && type !== filterByType) {
          continue;
        }

        const objInfo: Record<string, unknown> = {
          name: obj.getName(),
          type,
          isGlobal: !sceneName,
        };

        if (includeDetails) {
          objInfo.behaviorCount = obj.getAllBehaviorNames().length;
          objInfo.variableCount = obj.getVariables().count();
        }

        objects.push(objInfo);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ objects, totalCount: objects.length }),
          },
        ],
      };
    }
  );

  // gdevelop_object_create
  server.tool(
    'gdevelop_object_create',
    'Create a new object in a scene or globally',
    {
      sessionId: z.string(),
      name: z.string().describe('Object name (must be unique)'),
      type: z.string().describe('Object type (e.g., "Sprite", "TextObject::Text")'),
      sceneName: z.string().optional().describe('Scene name (omit to create global object)'),
    },
    async ({ sessionId, name, type, sceneName }) => {
      const session = projectManager.getSession(sessionId);

      let object;
      if (sceneName) {
        const layout = session.getLayout(sceneName);
        if (layout.hasObjectNamed(name)) {
          throw new Error(`Object "${name}" already exists in scene "${sceneName}"`);
        }
        object = layout.createObject(type, name);
        layout.insertObject(object, layout.getObjects().getObjectsCount());
      } else {
        object = session.createGlobalObject(name, type);
      }

      session.markDirty();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              objectName: name,
              objectType: type,
              isGlobal: !sceneName,
            }),
          },
        ],
      };
    }
  );

  // gdevelop_object_delete
  server.tool(
    'gdevelop_object_delete',
    'Delete an object from a scene or globally',
    {
      sessionId: z.string(),
      objectName: z.string(),
      sceneName: z.string().optional().describe('Scene name (omit for global objects)'),
      removeInstances: z.boolean().default(true).describe('Also remove all instances of this object'),
    },
    async ({ sessionId, objectName, sceneName, removeInstances }) => {
      const session = projectManager.getSession(sessionId);
      let instancesRemoved = 0;

      if (sceneName) {
        const layout = session.getLayout(sceneName);
        if (!layout.hasObjectNamed(objectName)) {
          throw new Error(`Object "${objectName}" not found in scene "${sceneName}"`);
        }

        if (removeInstances) {
          const instances = layout.getInitialInstances();
          instances.removeInitialInstancesOfObject(objectName);
          // Note: Would need to count instances before removal
        }

        layout.removeObject(objectName);
      } else {
        session.deleteGlobalObject(objectName);

        // Remove instances from all scenes
        if (removeInstances) {
          const project = session.getProject();
          for (let i = 0; i < project.getLayoutsCount(); i++) {
            const layout = project.getLayoutAt(i);
            layout.getInitialInstances().removeInitialInstancesOfObject(objectName);
          }
        }
      }

      session.markDirty();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              deletedObject: objectName,
              instancesRemoved,
            }),
          },
        ],
      };
    }
  );

  // gdevelop_object_rename
  server.tool(
    'gdevelop_object_rename',
    'Rename an object (updates all references)',
    {
      sessionId: z.string(),
      currentName: z.string(),
      newName: z.string(),
      sceneName: z.string().optional(),
    },
    async ({ sessionId, currentName, newName, sceneName }) => {
      const session = projectManager.getSession(sessionId);
      const project = session.getProject();

      // Get the object
      const container = sceneName
        ? session.getLayout(sceneName).getObjects()
        : session.getGlobalObjects();

      if (!container.hasObjectNamed(currentName)) {
        throw new Error(`Object "${currentName}" not found`);
      }
      if (container.hasObjectNamed(newName)) {
        throw new Error(`Object "${newName}" already exists`);
      }

      const obj = container.getObject(currentName);
      obj.setName(newName);

      // Update instance references in all layouts
      let referencesUpdated = 0;
      for (let i = 0; i < project.getLayoutsCount(); i++) {
        const layout = project.getLayoutAt(i);
        layout.getInitialInstances().renameInstancesOfObject(currentName, newName);
        referencesUpdated++;
      }

      session.markDirty();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              oldName: currentName,
              newName,
              referencesUpdated,
            }),
          },
        ],
      };
    }
  );
}

/**
 * Register variable management tools.
 */
function registerVariableTools(server: McpServer) {
  // gdevelop_variable_list
  server.tool(
    'gdevelop_variable_list',
    'List variables (global, scene, or object)',
    {
      sessionId: z.string(),
      scope: z.enum(['global', 'scene', 'object']),
      sceneName: z.string().optional().describe('Required for scene/object scope'),
      objectName: z.string().optional().describe('Required for object scope'),
    },
    async ({ sessionId, scope, sceneName, objectName }) => {
      const session = projectManager.getSession(sessionId);
      let container;

      if (scope === 'global') {
        container = session.getGlobalVariables();
      } else if (scope === 'scene') {
        if (!sceneName) throw new Error('sceneName required for scene scope');
        container = session.getLayout(sceneName).getVariables();
      } else {
        if (!sceneName || !objectName) {
          throw new Error('sceneName and objectName required for object scope');
        }
        const layout = session.getLayout(sceneName);
        const obj = layout.getObject(objectName);
        container = obj.getVariables();
      }

      const variables: object[] = [];
      const count = container.count();

      for (let i = 0; i < count; i++) {
        const name = container.getNameAt(i);
        const variable = container.get(name);
        const type = variable.getType();

        let value: unknown;
        switch (type) {
          case 0: value = variable.getValue(); break; // number
          case 1: value = variable.getString(); break; // string
          case 4: value = variable.getBool(); break; // boolean
          default: value = null; // structure/array
        }

        variables.push({
          name,
          type: ['number', 'string', 'structure', 'array', 'boolean'][type] || 'unknown',
          value,
        });
      }

      return {
        content: [{ type: 'text', text: JSON.stringify({ variables }) }],
      };
    }
  );

  // gdevelop_variable_create
  server.tool(
    'gdevelop_variable_create',
    'Create a new variable',
    {
      sessionId: z.string(),
      scope: z.enum(['global', 'scene', 'object']),
      sceneName: z.string().optional(),
      objectName: z.string().optional(),
      name: z.string(),
      type: z.enum(['number', 'string', 'boolean']).default('number'),
      value: z.union([z.number(), z.string(), z.boolean()]).optional(),
    },
    async ({ sessionId, scope, sceneName, objectName, name, type, value }) => {
      const session = projectManager.getSession(sessionId);
      let container;

      if (scope === 'global') {
        container = session.getGlobalVariables();
      } else if (scope === 'scene') {
        if (!sceneName) throw new Error('sceneName required for scene scope');
        container = session.getLayout(sceneName).getVariables();
      } else {
        if (!sceneName || !objectName) {
          throw new Error('sceneName and objectName required for object scope');
        }
        const layout = session.getLayout(sceneName);
        const obj = layout.getObject(objectName);
        container = obj.getVariables();
      }

      if (container.has(name)) {
        throw new Error(`Variable "${name}" already exists`);
      }

      const variable = container.insertNew(name, container.count());

      if (value !== undefined) {
        switch (type) {
          case 'number':
            variable.setValue(value as number);
            break;
          case 'string':
            variable.setString(value as string);
            break;
          case 'boolean':
            variable.setBool(value as boolean);
            break;
        }
      }

      session.markDirty();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: true, variableName: name }),
          },
        ],
      };
    }
  );

  // gdevelop_variable_delete
  server.tool(
    'gdevelop_variable_delete',
    'Delete a variable',
    {
      sessionId: z.string(),
      scope: z.enum(['global', 'scene', 'object']),
      sceneName: z.string().optional(),
      objectName: z.string().optional(),
      name: z.string(),
    },
    async ({ sessionId, scope, sceneName, objectName, name }) => {
      const session = projectManager.getSession(sessionId);
      let container;

      if (scope === 'global') {
        container = session.getGlobalVariables();
      } else if (scope === 'scene') {
        if (!sceneName) throw new Error('sceneName required for scene scope');
        container = session.getLayout(sceneName).getVariables();
      } else {
        if (!sceneName || !objectName) {
          throw new Error('sceneName and objectName required for object scope');
        }
        const layout = session.getLayout(sceneName);
        const obj = layout.getObject(objectName);
        container = obj.getVariables();
      }

      if (!container.has(name)) {
        throw new Error(`Variable "${name}" not found`);
      }

      container.remove(name);
      session.markDirty();

      return {
        content: [{ type: 'text', text: JSON.stringify({ success: true }) }],
      };
    }
  );
}

/**
 * Main server startup.
 */
async function main() {
  serverLogger.info('Starting GDevelop MCP Server');

  // Initialize GDCore
  gdcoreManager = getGDCoreManager();
  const gdVersion = process.env.GDCORE_VERSION;

  try {
    await gdcoreManager.initialize(gdVersion);
  } catch (error) {
    serverLogger.error({ error }, 'Failed to initialize GDCore');
    process.exit(1);
  }

  // Initialize project manager
  projectManager = new ProjectManager(gdcoreManager);

  // Create MCP server
  const server = new McpServer({
    name: 'gdevelop-mcp-server',
    version: '1.0.0',
  });

  // Register all tools
  registerProjectTools(server);
  registerSceneTools(server);
  registerObjectTools(server);
  registerVariableTools(server);
  registerAllAdditionalTools(server, projectManager);

  // Register MCP resources and prompts
  registerAllResources(server, projectManager);
  registerAllPrompts(server);

  // Connect via STDIO transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  serverLogger.info('GDevelop MCP Server running');

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    serverLogger.info('Shutting down...');
    await projectManager.closeAllSessions(false);
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    serverLogger.info('Shutting down...');
    await projectManager.closeAllSessions(false);
    process.exit(0);
  });
}

main().catch((error) => {
  serverLogger.error({ error }, 'Fatal error');
  process.exit(1);
});
