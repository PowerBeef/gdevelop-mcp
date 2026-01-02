# GDevelop MCP Workspace

This repository combines a GDevelop game project with a TypeScript MCP server that automates the GDevelop editor.

## Repository Layout
- `Erect Rub.json`: GDevelop project file (edit in the GDevelop app).
- `gdevelop-mcp-server/`: MCP server source, tooling, and build output.
- `context_portal/`: local context database used by assistants (committed intentionally).

## Quick Start (MCP Server)
```bash
cd gdevelop-mcp-server
npm install
npm run build
npm start
```

## Game Development
Open `Erect Rub.json` in GDevelop to edit scenes, objects, and events. Export and run the game from the GDevelop UI.

## Requirements
- Node.js >= 18 for the MCP server.
- GDevelop 5.6.x for the game project.

## Notes
The MCP server supports environment variables like `GDCORE_VERSION` and `LOG_LEVEL` (see `gdevelop-mcp-server/README.md`).
