import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ProjectManager } from '../core/project-manager.js';

/**
 * Register layer management tools.
 */
export function registerLayerTools(
  server: McpServer,
  projectManager: ProjectManager
) {
  // gdevelop_layer_list
  server.tool(
    'gdevelop_layer_list',
    'List all layers in a scene',
    {
      sessionId: z.string(),
      sceneName: z.string(),
    },
    async ({ sessionId, sceneName }) => {
      const session = projectManager.getSession(sessionId);
      const layout = session.getLayout(sceneName);

      const layers: object[] = [];
      const count = layout.getLayersCount();

      for (let i = 0; i < count; i++) {
        const layer = layout.getLayerAt(i);
        layers.push({
          name: layer.getName() || '(Base layer)',
          index: i,
          visible: layer.getVisibility(),
          locked: layer.isLocked(),
          isLightingLayer: layer.isLightingLayer(),
          cameraCount: layer.getCamerasCount(),
          effectCount: layer.getEffects().getEffectsCount(),
        });
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ layers }),
          },
        ],
      };
    }
  );

  // gdevelop_layer_create
  server.tool(
    'gdevelop_layer_create',
    'Create a new layer in a scene',
    {
      sessionId: z.string(),
      sceneName: z.string(),
      name: z.string(),
      position: z.number().optional(),
      visible: z.boolean().default(true),
      isLightingLayer: z.boolean().default(false),
      ambientLightColor: z
        .object({
          r: z.number().min(0).max(255),
          g: z.number().min(0).max(255),
          b: z.number().min(0).max(255),
        })
        .optional(),
    },
    async ({
      sessionId,
      sceneName,
      name,
      position,
      visible,
      isLightingLayer,
      ambientLightColor,
    }) => {
      const session = projectManager.getSession(sessionId);
      const layout = session.getLayout(sceneName);

      if (layout.hasLayerNamed(name)) {
        throw new Error(`Layer "${name}" already exists`);
      }

      const pos = position ?? layout.getLayersCount();
      const layer = layout.insertNewLayer(name, pos);

      layer.setVisibility(visible);
      layer.setLightingLayer(isLightingLayer);

      if (ambientLightColor && isLightingLayer) {
        layer.setAmbientLightColor(
          ambientLightColor.r,
          ambientLightColor.g,
          ambientLightColor.b
        );
      }

      session.markDirty();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              layerName: name,
              layerIndex: pos,
            }),
          },
        ],
      };
    }
  );

  // gdevelop_layer_delete
  server.tool(
    'gdevelop_layer_delete',
    'Delete a layer from a scene',
    {
      sessionId: z.string(),
      sceneName: z.string(),
      layerName: z.string(),
      moveInstancesToLayer: z
        .string()
        .optional()
        .describe('Move instances to another layer before deletion'),
    },
    async ({ sessionId, sceneName, layerName, moveInstancesToLayer }) => {
      const session = projectManager.getSession(sessionId);
      const layout = session.getLayout(sceneName);

      if (!layout.hasLayerNamed(layerName)) {
        throw new Error(`Layer "${layerName}" not found`);
      }

      let instancesMoved = 0;

      if (moveInstancesToLayer) {
        if (!layout.hasLayerNamed(moveInstancesToLayer)) {
          throw new Error(`Target layer "${moveInstancesToLayer}" not found`);
        }

        const instances = layout.getInitialInstances();
        instances.moveInstancesToLayer(layerName, moveInstancesToLayer);
        // Note: Would count instances moved
      }

      layout.removeLayer(layerName);
      session.markDirty();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              instancesMoved,
            }),
          },
        ],
      };
    }
  );

  // gdevelop_layer_update
  server.tool(
    'gdevelop_layer_update',
    'Update layer properties',
    {
      sessionId: z.string(),
      sceneName: z.string(),
      layerName: z.string(),
      properties: z.object({
        visible: z.boolean().optional(),
        locked: z.boolean().optional(),
        isLightingLayer: z.boolean().optional(),
        ambientLightColor: z
          .object({
            r: z.number().min(0).max(255),
            g: z.number().min(0).max(255),
            b: z.number().min(0).max(255),
          })
          .optional(),
      }),
    },
    async ({ sessionId, sceneName, layerName, properties }) => {
      const session = projectManager.getSession(sessionId);
      const layout = session.getLayout(sceneName);

      if (!layout.hasLayerNamed(layerName)) {
        throw new Error(`Layer "${layerName}" not found`);
      }

      const layer = layout.getLayer(layerName);
      const updated: string[] = [];

      if (properties.visible !== undefined) {
        layer.setVisibility(properties.visible);
        updated.push('visible');
      }

      if (properties.locked !== undefined) {
        layer.setLocked(properties.locked);
        updated.push('locked');
      }

      if (properties.isLightingLayer !== undefined) {
        layer.setLightingLayer(properties.isLightingLayer);
        updated.push('isLightingLayer');
      }

      if (properties.ambientLightColor) {
        layer.setAmbientLightColor(
          properties.ambientLightColor.r,
          properties.ambientLightColor.g,
          properties.ambientLightColor.b
        );
        updated.push('ambientLightColor');
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

  // gdevelop_layer_reorder
  server.tool(
    'gdevelop_layer_reorder',
    'Change layer order in a scene',
    {
      sessionId: z.string(),
      sceneName: z.string(),
      layerName: z.string(),
      newPosition: z.number(),
    },
    async ({ sessionId, sceneName, layerName, newPosition }) => {
      const session = projectManager.getSession(sessionId);
      const layout = session.getLayout(sceneName);

      if (!layout.hasLayerNamed(layerName)) {
        throw new Error(`Layer "${layerName}" not found`);
      }

      // Find current position
      let oldPosition = -1;
      for (let i = 0; i < layout.getLayersCount(); i++) {
        if (layout.getLayerAt(i).getName() === layerName) {
          oldPosition = i;
          break;
        }
      }

      layout.moveLayer(oldPosition, newPosition);
      session.markDirty();

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
