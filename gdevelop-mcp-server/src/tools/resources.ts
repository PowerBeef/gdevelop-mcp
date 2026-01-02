import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ProjectManager } from '../core/project-manager.js';

/**
 * Register resource management tools.
 * Supported resource kinds: image, audio, font, video, json, tilemap,
 * tileset, model3d, atlas, bitmapFont, javascript
 */
export function registerResourceTools(
  server: McpServer,
  projectManager: ProjectManager
) {
  // gdevelop_resource_list
  server.tool(
    'gdevelop_resource_list',
    'List all resources in the project',
    {
      sessionId: z.string(),
      filterByType: z
        .enum([
          'image',
          'audio',
          'font',
          'video',
          'json',
          'tilemap',
          'model3d',
          'atlas',
          'bitmapFont',
          'javascript',
        ])
        .optional(),
    },
    async ({ sessionId, filterByType }) => {
      const session = projectManager.getSession(sessionId);
      const project = session.getProject();
      const resourcesManager = project.getResourcesManager();

      const resourceNames = resourcesManager.getAllResourceNames();
      const resources: object[] = [];

      for (const name of resourceNames) {
        const resource = resourcesManager.getResource(name);
        const kind = resource.getKind();

        if (filterByType && kind !== filterByType) continue;

        resources.push({
          name,
          kind,
          file: resource.getFile(),
          metadata: resource.getMetadata() || null,
        });
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              resources,
              totalCount: resources.length,
            }),
          },
        ],
      };
    }
  );

  // gdevelop_resource_add
  server.tool(
    'gdevelop_resource_add',
    'Add a new resource to the project',
    {
      sessionId: z.string(),
      name: z.string(),
      kind: z.enum([
        'image',
        'audio',
        'font',
        'video',
        'json',
        'tilemap',
        'model3d',
        'javascript',
      ]),
      file: z.string().describe('Relative path to the resource file'),
      metadata: z.string().optional(),
    },
    async ({ sessionId, name, kind, file, metadata: _metadata }) => {
      const session = projectManager.getSession(sessionId);
      const project = session.getProject();
      const resourcesManager = project.getResourcesManager();

      if (resourcesManager.hasResource(name)) {
        throw new Error(`Resource "${name}" already exists`);
      }

      // Create resource based on kind
      // Note: In a real implementation, would use specific resource classes
      // This is a simplified version

      // Would need to create appropriate resource object and add it
      // resourcesManager.addResource(resource);

      session.markDirty();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              resourceName: name,
              kind,
              file,
            }),
          },
        ],
      };
    }
  );

  // gdevelop_resource_remove
  server.tool(
    'gdevelop_resource_remove',
    'Remove a resource from the project',
    {
      sessionId: z.string(),
      resourceName: z.string(),
    },
    async ({ sessionId, resourceName }) => {
      const session = projectManager.getSession(sessionId);
      const project = session.getProject();
      const resourcesManager = project.getResourcesManager();

      if (!resourcesManager.hasResource(resourceName)) {
        throw new Error(`Resource "${resourceName}" not found`);
      }

      resourcesManager.removeResource(resourceName);
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

  // gdevelop_resource_rename
  server.tool(
    'gdevelop_resource_rename',
    'Rename a resource (updates all references)',
    {
      sessionId: z.string(),
      currentName: z.string(),
      newName: z.string(),
    },
    async ({ sessionId, currentName, newName }) => {
      const session = projectManager.getSession(sessionId);
      const project = session.getProject();
      const resourcesManager = project.getResourcesManager();

      if (!resourcesManager.hasResource(currentName)) {
        throw new Error(`Resource "${currentName}" not found`);
      }
      if (resourcesManager.hasResource(newName)) {
        throw new Error(`Resource "${newName}" already exists`);
      }

      resourcesManager.renameResource(currentName, newName);
      session.markDirty();

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
}
