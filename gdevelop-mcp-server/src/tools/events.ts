import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ProjectManager } from '../core/project-manager.js';
import type { GDEventsList, GDBaseEvent, GDStandardEvent } from '../types/gdcore.js';

// Event type mappings
const EVENT_TYPES: Record<string, string> = {
  standard: 'BuiltinCommonInstructions::Standard',
  comment: 'BuiltinCommonInstructions::Comment',
  group: 'BuiltinCommonInstructions::Group',
  foreach: 'BuiltinCommonInstructions::ForEach',
  repeat: 'BuiltinCommonInstructions::Repeat',
  while: 'BuiltinCommonInstructions::While',
  link: 'BuiltinCommonInstructions::Link',
};

/**
 * Get event summary for display.
 */
function getEventSummary(event: GDBaseEvent): string {
  const type = event.getType();

  if (type === EVENT_TYPES.comment) {
    return '[Comment]';
  }
  if (type === EVENT_TYPES.group) {
    return '[Group]';
  }

  // For standard events, try to describe conditions/actions
  const std = event as GDStandardEvent;
  if (std.getConditions && std.getActions) {
    const condCount = std.getConditions().size();
    const actCount = std.getActions().size();
    return `${condCount} condition(s), ${actCount} action(s)`;
  }

  return type;
}

/**
 * Register events management tools.
 */
export function registerEventTools(
  server: McpServer,
  projectManager: ProjectManager
) {
  // gdevelop_event_list
  server.tool(
    'gdevelop_event_list',
    'List events in a scene or external events sheet',
    {
      sessionId: z.string(),
      sceneName: z.string().optional(),
      externalEventsName: z.string().optional(),
      depth: z.number().default(1).describe('How deep to traverse sub-events'),
      includeDisabled: z.boolean().default(true),
    },
    async ({ sessionId, sceneName, externalEventsName, depth, includeDisabled }) => {
      const session = projectManager.getSession(sessionId);
      const project = session.getProject();

      let eventsList: GDEventsList;

      if (sceneName) {
        eventsList = session.getLayout(sceneName).getEvents();
      } else if (externalEventsName) {
        if (!project.hasExternalEventsNamed(externalEventsName)) {
          throw new Error(`External events "${externalEventsName}" not found`);
        }
        eventsList = project.getExternalEvents(externalEventsName).getEvents();
      } else {
        throw new Error('Must specify either sceneName or externalEventsName');
      }

      const events: object[] = [];

      function collectEvents(list: GDEventsList, currentDepth: number, prefix: string = '') {
        const count = list.getEventsCount();

        for (let i = 0; i < count; i++) {
          const event = list.getEventAt(i);

          if (!includeDisabled && event.isDisabled()) continue;

          const std = event as GDStandardEvent;
          const eventInfo: Record<string, unknown> = {
            index: `${prefix}${i}`,
            type: event.getType(),
            disabled: event.isDisabled(),
            folded: event.isFolded(),
            summary: getEventSummary(event),
          };

          if (std.getConditions) {
            eventInfo.conditionCount = std.getConditions().size();
          }
          if (std.getActions) {
            eventInfo.actionCount = std.getActions().size();
          }

          if (event.canHaveSubEvents() && event.hasSubEvents()) {
            const subEvents = event.getSubEvents();
            eventInfo.subEventCount = subEvents.getEventsCount();

            if (currentDepth < depth) {
              collectEvents(subEvents, currentDepth + 1, `${prefix}${i}.`);
            }
          } else {
            eventInfo.subEventCount = 0;
          }

          events.push(eventInfo);
        }
      }

      collectEvents(eventsList, 0);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              events,
              totalCount: events.length,
            }),
          },
        ],
      };
    }
  );

  // gdevelop_event_create
  server.tool(
    'gdevelop_event_create',
    'Create a new event in a scene or external events',
    {
      sessionId: z.string(),
      sceneName: z.string().optional(),
      externalEventsName: z.string().optional(),
      eventType: z
        .enum(['standard', 'comment', 'group', 'foreach', 'repeat', 'while', 'link'])
        .default('standard'),
      position: z.number().optional().describe('Insert position'),
      conditions: z
        .array(
          z.object({
            type: z.string(),
            parameters: z.array(z.string()),
            inverted: z.boolean().optional(),
          })
        )
        .optional(),
      actions: z
        .array(
          z.object({
            type: z.string(),
            parameters: z.array(z.string()),
          })
        )
        .optional(),
    },
    async ({
      sessionId,
      sceneName,
      externalEventsName,
      eventType,
      position,
      conditions,
      actions,
    }) => {
      const session = projectManager.getSession(sessionId);
      const project = session.getProject();
      const gd = session.gd;

      let eventsList: GDEventsList;

      if (sceneName) {
        eventsList = session.getLayout(sceneName).getEvents();
      } else if (externalEventsName) {
        if (!project.hasExternalEventsNamed(externalEventsName)) {
          throw new Error(`External events "${externalEventsName}" not found`);
        }
        eventsList = project.getExternalEvents(externalEventsName).getEvents();
      } else {
        throw new Error('Must specify either sceneName or externalEventsName');
      }

      const gdEventType = EVENT_TYPES[eventType];
      if (!gdEventType) {
        throw new Error(`Unknown event type: ${eventType}`);
      }

      const pos = position ?? eventsList.getEventsCount();
      const event = eventsList.insertNewEvent(project, gdEventType, pos);

      // Add conditions if this is a standard event
      if (conditions && eventType === 'standard') {
        const std = event as GDStandardEvent;
        const conditionsList = std.getConditions();

        for (const cond of conditions) {
          const instruction = new gd.Instruction();
          instruction.setType(cond.type);
          instruction.setInverted(cond.inverted || false);

          for (let i = 0; i < cond.parameters.length; i++) {
            instruction.setParameter(i, cond.parameters[i]);
          }

          conditionsList.insert(instruction, conditionsList.size());
          instruction.delete();
        }
      }

      // Add actions if this is a standard event
      if (actions && eventType === 'standard') {
        const std = event as GDStandardEvent;
        const actionsList = std.getActions();

        for (const act of actions) {
          const instruction = new gd.Instruction();
          instruction.setType(act.type);

          for (let i = 0; i < act.parameters.length; i++) {
            instruction.setParameter(i, act.parameters[i]);
          }

          actionsList.insert(instruction, actionsList.size());
          instruction.delete();
        }
      }

      session.markDirty();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              eventIndex: pos,
              eventType,
            }),
          },
        ],
      };
    }
  );

  // gdevelop_event_delete
  server.tool(
    'gdevelop_event_delete',
    'Delete events from a scene',
    {
      sessionId: z.string(),
      sceneName: z.string().optional(),
      externalEventsName: z.string().optional(),
      eventIndex: z.number(),
    },
    async ({ sessionId, sceneName, externalEventsName, eventIndex }) => {
      const session = projectManager.getSession(sessionId);
      const project = session.getProject();

      let eventsList: GDEventsList;

      if (sceneName) {
        eventsList = session.getLayout(sceneName).getEvents();
      } else if (externalEventsName) {
        eventsList = project.getExternalEvents(externalEventsName).getEvents();
      } else {
        throw new Error('Must specify either sceneName or externalEventsName');
      }

      if (eventIndex < 0 || eventIndex >= eventsList.getEventsCount()) {
        throw new Error(`Event index ${eventIndex} out of bounds`);
      }

      eventsList.removeEventAt(eventIndex);
      session.markDirty();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              deletedIndex: eventIndex,
            }),
          },
        ],
      };
    }
  );

  // gdevelop_event_update
  server.tool(
    'gdevelop_event_update',
    'Update an existing event (enable/disable, fold/unfold)',
    {
      sessionId: z.string(),
      sceneName: z.string().optional(),
      externalEventsName: z.string().optional(),
      eventIndex: z.number(),
      disabled: z.boolean().optional(),
      folded: z.boolean().optional(),
    },
    async ({ sessionId, sceneName, externalEventsName, eventIndex, disabled, folded }) => {
      const session = projectManager.getSession(sessionId);
      const project = session.getProject();

      let eventsList: GDEventsList;

      if (sceneName) {
        eventsList = session.getLayout(sceneName).getEvents();
      } else if (externalEventsName) {
        eventsList = project.getExternalEvents(externalEventsName).getEvents();
      } else {
        throw new Error('Must specify either sceneName or externalEventsName');
      }

      if (eventIndex < 0 || eventIndex >= eventsList.getEventsCount()) {
        throw new Error(`Event index ${eventIndex} out of bounds`);
      }

      const event = eventsList.getEventAt(eventIndex);

      if (disabled !== undefined) {
        event.setDisabled(disabled);
      }
      if (folded !== undefined) {
        event.setFolded(folded);
      }

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

  // gdevelop_condition_add
  server.tool(
    'gdevelop_condition_add',
    'Add a condition to an existing event',
    {
      sessionId: z.string(),
      sceneName: z.string().optional(),
      externalEventsName: z.string().optional(),
      eventIndex: z.number(),
      condition: z.object({
        type: z.string().describe('Condition type identifier'),
        parameters: z.array(z.string()).describe('Condition parameters'),
        inverted: z.boolean().default(false).describe('Invert the condition'),
      }),
      position: z.number().optional(),
    },
    async ({
      sessionId,
      sceneName,
      externalEventsName,
      eventIndex,
      condition,
      position,
    }) => {
      const session = projectManager.getSession(sessionId);
      const project = session.getProject();
      const gd = session.gd;

      let eventsList: GDEventsList;

      if (sceneName) {
        eventsList = session.getLayout(sceneName).getEvents();
      } else if (externalEventsName) {
        eventsList = project.getExternalEvents(externalEventsName).getEvents();
      } else {
        throw new Error('Must specify either sceneName or externalEventsName');
      }

      const event = eventsList.getEventAt(eventIndex) as GDStandardEvent;

      if (!event.getConditions) {
        throw new Error('Event does not support conditions');
      }

      const conditionsList = event.getConditions();
      const instruction = new gd.Instruction();

      instruction.setType(condition.type);
      instruction.setInverted(condition.inverted);

      for (let i = 0; i < condition.parameters.length; i++) {
        instruction.setParameter(i, condition.parameters[i]);
      }

      const pos = position ?? conditionsList.size();
      conditionsList.insert(instruction, pos);
      instruction.delete();

      session.markDirty();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              conditionIndex: pos,
            }),
          },
        ],
      };
    }
  );

  // gdevelop_action_add
  server.tool(
    'gdevelop_action_add',
    'Add an action to an existing event',
    {
      sessionId: z.string(),
      sceneName: z.string().optional(),
      externalEventsName: z.string().optional(),
      eventIndex: z.number(),
      action: z.object({
        type: z.string().describe('Action type identifier'),
        parameters: z.array(z.string()).describe('Action parameters'),
      }),
      position: z.number().optional(),
    },
    async ({
      sessionId,
      sceneName,
      externalEventsName,
      eventIndex,
      action,
      position,
    }) => {
      const session = projectManager.getSession(sessionId);
      const project = session.getProject();
      const gd = session.gd;

      let eventsList: GDEventsList;

      if (sceneName) {
        eventsList = session.getLayout(sceneName).getEvents();
      } else if (externalEventsName) {
        eventsList = project.getExternalEvents(externalEventsName).getEvents();
      } else {
        throw new Error('Must specify either sceneName or externalEventsName');
      }

      const event = eventsList.getEventAt(eventIndex) as GDStandardEvent;

      if (!event.getActions) {
        throw new Error('Event does not support actions');
      }

      const actionsList = event.getActions();
      const instruction = new gd.Instruction();

      instruction.setType(action.type);

      for (let i = 0; i < action.parameters.length; i++) {
        instruction.setParameter(i, action.parameters[i]);
      }

      const pos = position ?? actionsList.size();
      actionsList.insert(instruction, pos);
      instruction.delete();

      session.markDirty();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              actionIndex: pos,
            }),
          },
        ],
      };
    }
  );

  // gdevelop_external_events
  server.tool(
    'gdevelop_external_events',
    'Manage external events sheets',
    {
      sessionId: z.string(),
      action: z.enum(['list', 'create', 'delete', 'rename']),
      name: z.string().optional(),
      newName: z.string().optional(),
      associatedLayout: z.string().optional(),
    },
    async ({ sessionId, action, name, newName, associatedLayout }) => {
      const session = projectManager.getSession(sessionId);
      const project = session.getProject();

      switch (action) {
        case 'list': {
          // Return count for now - full iteration requires name-based access
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  count: project.getExternalEventsCount(),
                }),
              },
            ],
          };
        }

        case 'create': {
          if (!name) throw new Error('name is required');
          if (project.hasExternalEventsNamed(name)) {
            throw new Error(`External events "${name}" already exists`);
          }

          const extEvents = project.insertNewExternalEvents(
            name,
            project.getExternalEventsCount()
          );

          if (associatedLayout) {
            extEvents.setAssociatedLayout(associatedLayout);
          }

          session.markDirty();

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  name,
                }),
              },
            ],
          };
        }

        case 'delete': {
          if (!name) throw new Error('name is required');
          if (!project.hasExternalEventsNamed(name)) {
            throw new Error(`External events "${name}" not found`);
          }

          project.removeExternalEvents(name);
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

        case 'rename': {
          if (!name || !newName) {
            throw new Error('name and newName are required');
          }
          if (!project.hasExternalEventsNamed(name)) {
            throw new Error(`External events "${name}" not found`);
          }
          if (project.hasExternalEventsNamed(newName)) {
            throw new Error(`External events "${newName}" already exists`);
          }

          const extEvents = project.getExternalEvents(name);
          extEvents.setName(newName);
          session.markDirty();

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  oldName: name,
                  newName,
                }),
              },
            ],
          };
        }
      }
    }
  );
}
