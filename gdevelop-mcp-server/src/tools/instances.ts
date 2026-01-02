import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ProjectManager } from '../core/project-manager.js';
import type { GDInitialInstance } from '../types/gdcore.js';

/**
 * Register instance management tools.
 */
export function registerInstanceTools(
  server: McpServer,
  projectManager: ProjectManager
) {
  // gdevelop_instance_list
  server.tool(
    'gdevelop_instance_list',
    'List all object instances placed in a scene',
    {
      sessionId: z.string(),
      sceneName: z.string(),
      filterByObject: z.string().optional(),
      filterByLayer: z.string().optional(),
    },
    async ({ sessionId, sceneName, filterByObject, filterByLayer }) => {
      const session = projectManager.getSession(sessionId);
      const layout = session.getLayout(sceneName);
      const instancesContainer = layout.getInitialInstances();

      const instances: object[] = [];

      instancesContainer.iterateOverInstances((instance: GDInitialInstance) => {
        const objectName = instance.getObjectName();
        const layer = instance.getLayer();

        if (filterByObject && objectName !== filterByObject) return;
        if (filterByLayer && layer !== filterByLayer) return;

        instances.push({
          objectName,
          layer: layer || '(Base layer)',
          x: instance.getX(),
          y: instance.getY(),
          z: instance.getZ(),
          angle: instance.getAngle(),
          zOrder: instance.getZOrder(),
          customSize: instance.hasCustomSize()
            ? {
                width: instance.getCustomWidth(),
                height: instance.getCustomHeight(),
              }
            : null,
          locked: instance.isLocked(),
          flipped: {
            x: instance.isFlippedX(),
            y: instance.isFlippedY(),
          },
        });
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              instances,
              totalCount: instances.length,
            }),
          },
        ],
      };
    }
  );

  // gdevelop_instance_create
  server.tool(
    'gdevelop_instance_create',
    'Place a new instance of an object in a scene',
    {
      sessionId: z.string(),
      sceneName: z.string(),
      objectName: z.string(),
      x: z.number().default(0),
      y: z.number().default(0),
      z: z.number().optional().describe('Z position for 3D'),
      layer: z.string().default(''),
      angle: z.number().default(0),
      zOrder: z.number().optional(),
      customWidth: z.number().optional(),
      customHeight: z.number().optional(),
      flippedX: z.boolean().default(false),
      flippedY: z.boolean().default(false),
    },
    async ({
      sessionId,
      sceneName,
      objectName,
      x,
      y,
      z,
      layer,
      angle,
      zOrder,
      customWidth,
      customHeight,
      flippedX,
      flippedY,
    }) => {
      const session = projectManager.getSession(sessionId);
      const layout = session.getLayout(sceneName);

      // Verify object exists
      if (
        !layout.hasObjectNamed(objectName) &&
        !session.hasGlobalObject(objectName)
      ) {
        throw new Error(
          `Object "${objectName}" not found in scene or globally`
        );
      }

      const instance = layout.getInitialInstances().insertNewInitialInstance();

      instance.setObjectName(objectName);
      instance.setX(x);
      instance.setY(y);
      if (z !== undefined) instance.setZ(z);
      instance.setLayer(layer);
      instance.setAngle(angle);
      if (zOrder !== undefined) instance.setZOrder(zOrder);

      if (customWidth !== undefined || customHeight !== undefined) {
        instance.setHasCustomSize(true);
        if (customWidth !== undefined) instance.setCustomWidth(customWidth);
        if (customHeight !== undefined) instance.setCustomHeight(customHeight);
      }

      instance.setFlippedX(flippedX);
      instance.setFlippedY(flippedY);

      session.markDirty();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              objectName,
              position: { x, y, z },
            }),
          },
        ],
      };
    }
  );

  // gdevelop_instance_delete
  server.tool(
    'gdevelop_instance_delete',
    'Delete object instances from a scene',
    {
      sessionId: z.string(),
      sceneName: z.string(),
      objectName: z.string().optional().describe('Delete all instances of this object'),
      layer: z.string().optional().describe('Delete all instances on this layer'),
    },
    async ({ sessionId, sceneName, objectName, layer }) => {
      const session = projectManager.getSession(sessionId);
      const layout = session.getLayout(sceneName);
      const instances = layout.getInitialInstances();

      let deletedCount = 0;

      if (objectName) {
        // Count instances before deletion
        instances.iterateOverInstances((inst: GDInitialInstance) => {
          if (inst.getObjectName() === objectName) deletedCount++;
        });
        instances.removeInitialInstancesOfObject(objectName);
      } else if (layer !== undefined) {
        // Count instances on layer before deletion
        instances.iterateOverInstances((inst: GDInitialInstance) => {
          if (inst.getLayer() === layer) deletedCount++;
        });
        instances.removeAllInstancesOnLayer(layer);
      } else {
        throw new Error('Must specify either objectName or layer');
      }

      session.markDirty();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              deletedCount,
            }),
          },
        ],
      };
    }
  );

  // gdevelop_instance_batch
  server.tool(
    'gdevelop_instance_batch',
    'Create multiple instances at once',
    {
      sessionId: z.string(),
      sceneName: z.string(),
      instances: z.array(
        z.object({
          objectName: z.string(),
          x: z.number(),
          y: z.number(),
          z: z.number().optional(),
          layer: z.string().optional(),
          angle: z.number().optional(),
          zOrder: z.number().optional(),
        })
      ),
    },
    async ({ sessionId, sceneName, instances: instancesData }) => {
      const session = projectManager.getSession(sessionId);
      const layout = session.getLayout(sceneName);
      const instancesContainer = layout.getInitialInstances();

      const results: object[] = [];

      for (const data of instancesData) {
        try {
          // Verify object exists
          if (
            !layout.hasObjectNamed(data.objectName) &&
            !session.hasGlobalObject(data.objectName)
          ) {
            results.push({
              success: false,
              objectName: data.objectName,
              error: 'Object not found',
            });
            continue;
          }

          const instance = instancesContainer.insertNewInitialInstance();
          instance.setObjectName(data.objectName);
          instance.setX(data.x);
          instance.setY(data.y);
          if (data.z !== undefined) instance.setZ(data.z);
          if (data.layer !== undefined) instance.setLayer(data.layer);
          if (data.angle !== undefined) instance.setAngle(data.angle);
          if (data.zOrder !== undefined) instance.setZOrder(data.zOrder);

          results.push({
            success: true,
            objectName: data.objectName,
            position: { x: data.x, y: data.y },
          });
        } catch (error) {
          results.push({
            success: false,
            objectName: data.objectName,
            error: String(error),
          });
        }
      }

      session.markDirty();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              results,
              createdCount: results.filter((r: any) => r.success).length,
            }),
          },
        ],
      };
    }
  );
}
