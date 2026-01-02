import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ProjectManager } from '../core/project-manager.js';
import { registerInstanceTools } from './instances.js';
import { registerEventTools } from './events.js';
import { registerBehaviorTools } from './behaviors.js';
import { registerLayerTools } from './layers.js';
import { registerResourceTools } from './resources.js';
import { registerExportTools } from './export.js';
import { registerExtensionTools } from './extensions.js';

export { registerInstanceTools } from './instances.js';
export { registerEventTools } from './events.js';
export { registerBehaviorTools } from './behaviors.js';
export { registerLayerTools } from './layers.js';
export { registerResourceTools } from './resources.js';
export { registerExportTools } from './export.js';
export { registerExtensionTools } from './extensions.js';

/**
 * Register all additional tools with the MCP server.
 * Note: Project, scene, object, and variable tools are registered in index.ts
 */
export function registerAllAdditionalTools(
  server: McpServer,
  projectManager: ProjectManager
) {
  registerInstanceTools(server, projectManager);
  registerEventTools(server, projectManager);
  registerBehaviorTools(server, projectManager);
  registerLayerTools(server, projectManager);
  registerResourceTools(server, projectManager);
  registerExportTools(server, projectManager);
  registerExtensionTools(server, projectManager);
}
