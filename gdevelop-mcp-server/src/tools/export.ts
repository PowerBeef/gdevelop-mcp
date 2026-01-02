import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ProjectManager } from '../core/project-manager.js';
import { createLogger } from '../logger.js';

const logger = createLogger('export');

// Track ongoing exports
const activeExports: Map<
  string,
  {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    message?: string;
    outputPath?: string;
    error?: string;
    startedAt: Date;
  }
> = new Map();

/**
 * Register export tools.
 */
export function registerExportTools(
  server: McpServer,
  projectManager: ProjectManager
) {
  // gdevelop_export_html5
  server.tool(
    'gdevelop_export_html5',
    'Export the project as HTML5 for web deployment',
    {
      sessionId: z.string(),
      outputPath: z.string(),
      options: z
        .object({
          includeSourceMaps: z.boolean().default(false),
          optimizeImages: z.boolean().default(true),
        })
        .optional(),
    },
    async ({ sessionId, outputPath, options: _options }) => {
      const session = projectManager.getSession(sessionId);

      logger.info({ sessionId, outputPath }, 'Starting HTML5 export');

      try {
        // Dynamic import of gdexporter
        const gdexporter = (await import('gdexporter')).default;

        const projectPath = session.getProjectPath();

        await gdexporter(projectPath, outputPath, {
          buildType: 'html5',
        });

        logger.info({ outputPath }, 'HTML5 export completed');

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                outputPath,
                buildType: 'html5',
              }),
            },
          ],
        };
      } catch (error) {
        logger.error({ error }, 'HTML5 export failed');
        throw error;
      }
    }
  );

  // gdevelop_export_electron
  server.tool(
    'gdevelop_export_electron',
    'Export the project for desktop using Electron',
    {
      sessionId: z.string(),
      outputPath: z.string(),
      platforms: z
        .array(z.enum(['windows', 'macos', 'linux']))
        .default(['windows', 'macos', 'linux']),
    },
    async ({ sessionId, outputPath, platforms }) => {
      const session = projectManager.getSession(sessionId);

      logger.info({ sessionId, outputPath, platforms }, 'Starting Electron export');

      try {
        const gdexporter = (await import('gdexporter')).default;
        const projectPath = session.getProjectPath();

        await gdexporter(projectPath, outputPath, {
          buildType: 'electron',
        });

        logger.info({ outputPath }, 'Electron export completed');

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                outputPath,
                buildType: 'electron',
                platforms,
              }),
            },
          ],
        };
      } catch (error) {
        logger.error({ error }, 'Electron export failed');
        throw error;
      }
    }
  );

  // gdevelop_export_cordova
  server.tool(
    'gdevelop_export_cordova',
    'Export the project for mobile using Cordova',
    {
      sessionId: z.string(),
      outputPath: z.string(),
      platforms: z.array(z.enum(['android', 'ios'])).default(['android']),
    },
    async ({ sessionId, outputPath, platforms }) => {
      const session = projectManager.getSession(sessionId);

      logger.info({ sessionId, outputPath, platforms }, 'Starting Cordova export');

      try {
        const gdexporter = (await import('gdexporter')).default;
        const projectPath = session.getProjectPath();

        await gdexporter(projectPath, outputPath, {
          buildType: 'cordova',
        });

        logger.info({ outputPath }, 'Cordova export completed');

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                outputPath,
                buildType: 'cordova',
                platforms,
              }),
            },
          ],
        };
      } catch (error) {
        logger.error({ error }, 'Cordova export failed');
        throw error;
      }
    }
  );

  // gdevelop_export_status
  server.tool(
    'gdevelop_export_status',
    'Check the status of an ongoing export',
    {
      exportId: z.string(),
    },
    async ({ exportId }) => {
      const exportStatus = activeExports.get(exportId);

      if (!exportStatus) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'not_found',
                error: 'Export not found',
              }),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: exportStatus.status,
              progress: exportStatus.progress,
              message: exportStatus.message,
              outputPath: exportStatus.outputPath,
              error: exportStatus.error,
            }),
          },
        ],
      };
    }
  );

  // gdevelop_export_preview
  server.tool(
    'gdevelop_export_preview',
    'Generate a preview build for testing',
    {
      sessionId: z.string(),
      outputPath: z.string(),
    },
    async ({ sessionId, outputPath }) => {
      const session = projectManager.getSession(sessionId);

      logger.info({ sessionId, outputPath }, 'Starting preview export');

      try {
        const gdexporter = (await import('gdexporter')).default;
        const projectPath = session.getProjectPath();

        await gdexporter(projectPath, outputPath, {
          buildType: 'html5',
        });

        logger.info({ outputPath }, 'Preview export completed');

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                outputPath,
                message: 'Preview ready. Open index.html in a browser to test.',
              }),
            },
          ],
        };
      } catch (error) {
        logger.error({ error }, 'Preview export failed');
        throw error;
      }
    }
  );
}
