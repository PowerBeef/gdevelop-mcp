# GDevelop MCP Server

An MCP (Model Context Protocol) server that provides full programmatic control over GDevelop game editor projects. This server enables AI assistants like Claude to create, modify, and manage GDevelop games.

## Features

- **Project Management**: Open, create, save, and manage multiple project sessions
- **Scene Management**: Create, delete, rename, duplicate, and reorder scenes
- **Object Management**: Create and configure game objects (Sprites, Text, etc.)
- **Variable Management**: Manage global, scene, and object variables
- **Instance Management**: Place and configure object instances in scenes
- **Event Management**: Create game logic with conditions and actions
- **Behavior Management**: Add and configure object behaviors
- **Layer Management**: Manage scene layers
- **Resource Management**: Manage game assets (images, audio, etc.)
- **Export**: Export games to HTML5, Electron, and Cordova

## Installation

```bash
npm install
npm run build
```

## Usage

### With Claude Code

Add to your Claude Code MCP configuration (`~/.claude/mcp.json`):

```json
{
  "mcpServers": {
    "gdevelop": {
      "command": "node",
      "args": ["/path/to/gdevelop-mcp-server/build/index.js"],
      "env": {
        "GDCORE_VERSION": "latest",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### Environment Variables

- `GDCORE_VERSION`: GDevelop version to use (default: latest)
- `LOG_LEVEL`: Logging level - debug, info, warn, error (default: info)

## Available Tools

### Project Management

| Tool | Description |
|------|-------------|
| `gdevelop_project_open` | Open a GDevelop project file |
| `gdevelop_project_save` | Save the current project |
| `gdevelop_project_close` | Close a project session |
| `gdevelop_project_create` | Create a new project |
| `gdevelop_project_info` | Get project information |
| `gdevelop_project_settings` | Update project settings |
| `gdevelop_sessions_list` | List active sessions |

### Scene Management

| Tool | Description |
|------|-------------|
| `gdevelop_scene_list` | List all scenes |
| `gdevelop_scene_create` | Create a new scene |
| `gdevelop_scene_delete` | Delete a scene |
| `gdevelop_scene_rename` | Rename a scene |
| `gdevelop_scene_duplicate` | Duplicate a scene |
| `gdevelop_scene_reorder` | Change scene order |

### Object Management

| Tool | Description |
|------|-------------|
| `gdevelop_object_list` | List objects |
| `gdevelop_object_create` | Create a new object |
| `gdevelop_object_delete` | Delete an object |
| `gdevelop_object_rename` | Rename an object |

### Variable Management

| Tool | Description |
|------|-------------|
| `gdevelop_variable_list` | List variables |
| `gdevelop_variable_create` | Create a variable |
| `gdevelop_variable_delete` | Delete a variable |

## Example Usage

```typescript
// Open a project
const result = await mcp.callTool('gdevelop_project_open', {
  projectPath: '/path/to/game.json'
});
const { sessionId } = JSON.parse(result.content[0].text);

// Create a new scene
await mcp.callTool('gdevelop_scene_create', {
  sessionId,
  name: 'Level1',
  setAsFirst: true
});

// Create a player object
await mcp.callTool('gdevelop_object_create', {
  sessionId,
  name: 'Player',
  type: 'Sprite',
  sceneName: 'Level1'
});

// Save the project
await mcp.callTool('gdevelop_project_save', {
  sessionId,
  createBackup: true
});

// Close the session
await mcp.callTool('gdevelop_project_close', {
  sessionId
});
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Development mode (watch)
npm run dev

# Run tests
npm test

# Lint
npm run lint
```

## Architecture

```
src/
├── index.ts              # Server entry point
├── logger.ts             # Logging (stderr for STDIO)
├── core/
│   ├── gdcore-manager.ts # GDCore initialization
│   ├── project-manager.ts # Session management
│   └── project-session.ts # Project operations
└── types/
    └── gdcore.ts         # GDCore type definitions
```

## Dependencies

- **@modelcontextprotocol/sdk**: MCP server SDK
- **gdcore-tools**: GDevelop Core JavaScript bindings
- **gdexporter**: GDevelop game export tool
- **zod**: Schema validation
- **pino**: Logging

## License

MIT
