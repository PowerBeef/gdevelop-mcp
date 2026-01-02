import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ProjectManager } from '../core/project-manager.js';

/**
 * Register extension management tools.
 */
export function registerExtensionTools(
  server: McpServer,
  projectManager: ProjectManager
) {
  // gdevelop_extension_list
  server.tool(
    'gdevelop_extension_list',
    'List all extensions used in the project',
    {
      sessionId: z.string(),
      includeBuiltin: z.boolean().default(false).describe('Include built-in extensions'),
    },
    async ({ sessionId, includeBuiltin }) => {
      const session = projectManager.getSession(sessionId);
      const project = session.getProject();

      const extensions: object[] = [];

      // Get used extension names from the project
      const usedExtensions = project.getUsedExtensions();
      for (let i = 0; i < usedExtensions.size(); i++) {
        const extName = usedExtensions.at(i);
        extensions.push({
          name: extName,
          isBuiltin: extName.startsWith('Builtin'),
          inUse: true,
        });
      }

      // Filter out builtins if not requested
      const filteredExtensions = includeBuiltin
        ? extensions
        : extensions.filter((ext: any) => !ext.isBuiltin);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              extensions: filteredExtensions,
              totalCount: filteredExtensions.length,
            }),
          },
        ],
      };
    }
  );

  // gdevelop_extension_add
  server.tool(
    'gdevelop_extension_add',
    'Add an extension to the project',
    {
      sessionId: z.string(),
      extensionName: z.string().describe('Name of the extension to add'),
    },
    async ({ sessionId, extensionName }) => {
      const session = projectManager.getSession(sessionId);
      const project = session.getProject();

      // Check if extension is already added
      const usedExtensions = project.getUsedExtensions();
      for (let i = 0; i < usedExtensions.size(); i++) {
        if (usedExtensions.at(i) === extensionName) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  alreadyExists: true,
                  extensionName,
                }),
              },
            ],
          };
        }
      }

      // Add the extension
      // Note: In a full implementation, would load extension from registry
      // and validate it exists before adding
      project.addUsedExtension(extensionName);
      session.markDirty();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              alreadyExists: false,
              extensionName,
            }),
          },
        ],
      };
    }
  );

  // gdevelop_extension_remove
  server.tool(
    'gdevelop_extension_remove',
    'Remove an extension from the project',
    {
      sessionId: z.string(),
      extensionName: z.string().describe('Name of the extension to remove'),
      force: z.boolean().default(false).describe('Remove even if behaviors/objects from this extension are in use'),
    },
    async ({ sessionId, extensionName, force }) => {
      const session = projectManager.getSession(sessionId);
      const project = session.getProject();

      // Check if extension exists in project
      const usedExtensions = project.getUsedExtensions();
      let found = false;
      for (let i = 0; i < usedExtensions.size(); i++) {
        if (usedExtensions.at(i) === extensionName) {
          found = true;
          break;
        }
      }

      if (!found) {
        throw new Error(`Extension "${extensionName}" is not in the project`);
      }

      // Check if extension is in use (behaviors or objects)
      if (!force) {
        // Would need to scan all objects for behaviors from this extension
        // For now, provide warning in response
      }

      project.removeUsedExtension(extensionName);
      session.markDirty();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              extensionName,
              warning: !force ? 'Ensure no behaviors or objects from this extension are still in use' : undefined,
            }),
          },
        ],
      };
    }
  );

  // gdevelop_extension_info
  server.tool(
    'gdevelop_extension_info',
    'Get detailed information about an extension',
    {
      sessionId: z.string(),
      extensionName: z.string(),
    },
    async ({ sessionId, extensionName }) => {
      const session = projectManager.getSession(sessionId);
      const project = session.getProject();

      // Check if extension is used
      const usedExtensions = project.getUsedExtensions();
      let isUsed = false;
      for (let i = 0; i < usedExtensions.size(); i++) {
        if (usedExtensions.at(i) === extensionName) {
          isUsed = true;
          break;
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              name: extensionName,
              isUsed,
              isBuiltin: extensionName.startsWith('Builtin'),
              // Additional info would come from extension metadata/registry
            }),
          },
        ],
      };
    }
  );
}
